const express = require('express');
const { query } = require('../config/database');
const router = express.Router();

// Get board by ID
router.get('/:id', async (req, res) => {
  try {
    // Get board (allow all users to access)
    const result = await query(`
      SELECT b.* FROM "Board" b
      JOIN "Workspace" w ON b."workspaceId" = w.id
      WHERE b.id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Board not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get board error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update board
router.patch('/:id', async (req, res) => {
  try {
    const { title, color } = req.body;

    let updateFields = [];
    let values = [];
    let paramCounter = 1;

    if (title) {
      updateFields.push(`title = $${paramCounter++}`);
      values.push(title);
    }

    if (color) {
      updateFields.push(`color = $${paramCounter++}`);
      values.push(color);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    updateFields.push(`"updatedAt" = NOW()`);
    values.push(req.params.id);

    const updateQuery = `
      UPDATE "Board" 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramCounter++} 
      RETURNING *
    `;

    const result = await query(updateQuery, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Log activity
    const workspace = await query('SELECT id FROM "Workspace" WHERE id = (SELECT "workspaceId" FROM "Board" WHERE id = $1)', [req.params.id]);
    if (workspace.rows.length > 0) {
      await query(
        'INSERT INTO "Activity" (id, title, "workspaceId", "createdAt") VALUES (gen_random_uuid(), $1, $2, NOW())',
        [`Updated board "${result.rows[0].title}"`, workspace.rows[0].id]
      );
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update board error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete board
router.delete('/:id', async (req, res) => {
  try {
    // Get workspace for activity log before deletion
    const boardResult = await query(`
      SELECT b.title, w.id as workspaceId FROM "Board" b
      JOIN "Workspace" w ON b."workspaceId" = w.id
      WHERE b.id = $1
    `, [req.params.id]);

    if (boardResult.rows.length === 0) {
      return res.status(404).json({ message: 'Board not found' });
    }

    const board = boardResult.rows[0];

    // Delete board (cascade will handle lists and cards)
    await query('DELETE FROM "Board" WHERE id = $1', [req.params.id]);

    // Log activity
    await query(
      'INSERT INTO "Activity" (id, title, "workspaceId", "createdAt") VALUES (gen_random_uuid(), $1, $2, NOW())',
      [`Deleted board "${board.title}"`, board.workspaceid]
    );

    res.json({ message: 'Board deleted successfully' });
  } catch (error) {
    console.error('Delete board error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get lists for board
router.get('/:id/lists', async (req, res) => {
  try {
    // Check if board exists
    const boardCheck = await query(`
      SELECT 1 FROM "Board" b
      JOIN "Workspace" w ON b."workspaceId" = w.id
      WHERE b.id = $1
    `, [req.params.id]);

    if (boardCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Board not found' });
    }

    const result = await query(
      'SELECT * FROM "List" WHERE "boardId" = $1 ORDER BY "createdAt" ASC',
      [req.params.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get lists error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create list in board
router.post('/:id/lists', async (req, res) => {
  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    // Check if board exists and get workspace
    const boardCheck = await query(`
      SELECT w.id as workspaceId FROM "Board" b
      JOIN "Workspace" w ON b."workspaceId" = w.id
      WHERE b.id = $1
    `, [req.params.id]);

    if (boardCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Board not found' });
    }

    const result = await query(
      'INSERT INTO "List" (id, title, "boardId", "createdAt", "updatedAt") VALUES (gen_random_uuid(), $1, $2, NOW(), NOW()) RETURNING *',
      [title, req.params.id]
    );

    // Log activity
    await query(
      'INSERT INTO "Activity" (id, title, "workspaceId", "createdAt") VALUES (gen_random_uuid(), $1, $2, NOW())',
      [`Created list "${title}"`, boardCheck.rows[0].workspaceid]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create list error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get board statistics
router.get('/:id/statistics', async (req, res) => {
  try {
    // Check if board exists
    const boardCheck = await query(`
      SELECT 1 FROM "Board" b
      JOIN "Workspace" w ON b."workspaceId" = w.id
      WHERE b.id = $1
    `, [req.params.id]);

    if (boardCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Get statistics
    const statsResult = await query(`
      SELECT 
        COUNT(DISTINCT l.id) as lists_count,
        COUNT(c.id) as total_cards,
        COUNT(CASE WHEN c.status = 'TODO' THEN 1 END) as todo_cards,
        COUNT(CASE WHEN c.status = 'DONE' THEN 1 END) as done_cards,
        COUNT(CASE WHEN c.priority = 'HIGH' THEN 1 END) as high_priority,
        COUNT(CASE WHEN c.priority = 'MEDIUM' THEN 1 END) as medium_priority,
        COUNT(CASE WHEN c.priority = 'LOW' THEN 1 END) as low_priority,
        COUNT(CASE WHEN c.status = 'TODO' AND c.deadline < NOW() THEN 1 END) as overdue_cards
      FROM "List" l
      LEFT JOIN "Card" c ON l.id = c."listId"
      WHERE l."boardId" = $1
    `, [req.params.id]);

    const stats = statsResult.rows[0];
    const totalTasks = parseInt(stats.total_cards) || 0;
    const completedTasks = parseInt(stats.done_cards) || 0;
    const pendingTasks = parseInt(stats.todo_cards) || 0;
    const overdueTasks = parseInt(stats.overdue_cards) || 0;
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Get board info for response
    const boardResult = await query(`
      SELECT id, title, color FROM "Board" WHERE id = $1
    `, [req.params.id]);

    const boardInfo = boardResult.rows[0];

    res.json({
      boardId: boardInfo.id,
      boardTitle: boardInfo.title,
      boardColor: boardInfo.color,
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      completionPercentage,
      priorityBreakdown: {
        high: parseInt(stats.high_priority) || 0,
        medium: parseInt(stats.medium_priority) || 0,
        low: parseInt(stats.low_priority) || 0
      },
      listsCount: parseInt(stats.lists_count) || 0
    });
  } catch (error) {
    console.error('Get board statistics error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;