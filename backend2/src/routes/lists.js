const express = require('express');
const { query } = require('../config/database');
const router = express.Router();

// Get list by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await query(`
      SELECT l.* FROM "List" l
      JOIN "Board" b ON l."boardId" = b.id
      JOIN "Workspace" w ON b."workspaceId" = w.id
      WHERE l.id = $1 AND w."userId" = $2
    `, [req.params.id, req.user.userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'List not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get list error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update list
router.patch('/:id', async (req, res) => {
  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const result = await query(`
      UPDATE "List" 
      SET title = $1, "updatedAt" = NOW() 
      WHERE id = $2 
      AND "boardId" IN (
        SELECT b.id FROM "Board" b 
        JOIN "Workspace" w ON b."workspaceId" = w.id 
        WHERE w."userId" = $3
      )
      RETURNING *
    `, [title, req.params.id, req.user.userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'List not found' });
    }

    // Log activity
    const workspaceResult = await query(`
      SELECT w.id FROM "Workspace" w
      JOIN "Board" b ON w.id = b."workspaceId"
      JOIN "List" l ON b.id = l."boardId"
      WHERE l.id = $1
    `, [req.params.id]);

    if (workspaceResult.rows.length > 0) {
      await query(
        'INSERT INTO "Activity" (id, title, "workspaceId", "createdAt") VALUES (gen_random_uuid(), $1, $2, NOW())',
        [`Updated list "${title}"`, workspaceResult.rows[0].id]
      );
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update list error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete list
router.delete('/:id', async (req, res) => {
  try {
    // Get list info for activity log
    const listResult = await query(`
      SELECT l.title, w.id as workspaceId 
      FROM "List" l
      JOIN "Board" b ON l."boardId" = b.id
      JOIN "Workspace" w ON b."workspaceId" = w.id
      WHERE l.id = $1 AND w."userId" = $2
    `, [req.params.id, req.user.userId]);

    if (listResult.rows.length === 0) {
      return res.status(404).json({ message: 'List not found' });
    }

    const list = listResult.rows[0];

    // Delete list (cascade will handle cards)
    await query('DELETE FROM "List" WHERE id = $1', [req.params.id]);

    // Log activity
    await query(
      'INSERT INTO "Activity" (id, title, "workspaceId", "createdAt") VALUES (gen_random_uuid(), $1, $2, NOW())',
      [`Deleted list "${list.title}"`, list.workspaceid]
    );

    res.json({ message: 'List deleted successfully' });
  } catch (error) {
    console.error('Delete list error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get cards for list
router.get('/:id/cards', async (req, res) => {
  try {
    // Check if user has access to this list
    const listCheck = await query(`
      SELECT 1 FROM "List" l
      JOIN "Board" b ON l."boardId" = b.id
      JOIN "Workspace" w ON b."workspaceId" = w.id
      WHERE l.id = $1 AND w."userId" = $2
    `, [req.params.id, req.user.userId]);

    if (listCheck.rows.length === 0) {
      return res.status(404).json({ message: 'List not found' });
    }

    const result = await query(
      'SELECT * FROM "Card" WHERE "listId" = $1 ORDER BY "createdAt" ASC',
      [req.params.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get cards error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create card in list
router.post('/:id/cards', async (req, res) => {
  try {
    const { title, description, priority, deadline } = req.body;

    if (!title || !description || !priority) {
      return res.status(400).json({ message: 'Title, description, and priority are required' });
    }

    // Check if user has access to this list
    const listCheck = await query(`
      SELECT w.id as workspaceId FROM "List" l
      JOIN "Board" b ON l."boardId" = b.id
      JOIN "Workspace" w ON b."workspaceId" = w.id
      WHERE l.id = $1 AND w."userId" = $2
    `, [req.params.id, req.user.userId]);

    if (listCheck.rows.length === 0) {
      return res.status(404).json({ message: 'List not found' });
    }

    const result = await query(
      'INSERT INTO "Card" (id, title, description, priority, status, deadline, "listId", "createdAt", "updatedAt") VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING *',
      [title, description, priority, 'TODO', deadline || null, req.params.id]
    );

    // Log activity
    await query(
      'INSERT INTO "Activity" (id, title, "workspaceId", "createdAt") VALUES (gen_random_uuid(), $1, $2, NOW())',
      [`Created card "${title}"`, listCheck.rows[0].workspaceid]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create card error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;