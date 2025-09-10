const express = require('express');
const { query } = require('../config/database');
const router = express.Router();

// Get card by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await query(`
      SELECT c.* FROM "Card" c
      JOIN "List" l ON c."listId" = l.id
      JOIN "Board" b ON l."boardId" = b.id
      JOIN "Workspace" w ON b."workspaceId" = w.id
      WHERE c.id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Card not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get card error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update card
router.patch('/:id', async (req, res) => {
  try {
    const { title, description, priority, status, deadline } = req.body;

    let updateFields = [];
    let values = [];
    let paramCounter = 1;

    if (title) {
      updateFields.push(`title = $${paramCounter++}`);
      values.push(title);
    }

    if (description) {
      updateFields.push(`description = $${paramCounter++}`);
      values.push(description);
    }

    if (priority) {
      updateFields.push(`priority = $${paramCounter++}`);
      values.push(priority);
    }

    if (status) {
      updateFields.push(`status = $${paramCounter++}`);
      values.push(status);
    }

    if (deadline !== undefined) {
      updateFields.push(`deadline = $${paramCounter++}`);
      values.push(deadline);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    updateFields.push(`"updatedAt" = NOW()`);
    values.push(req.params.id);

    const updateQuery = `
      UPDATE "Card" 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramCounter} 
      RETURNING *
    `;

    const result = await query(updateQuery, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Card not found' });
    }

    // Log activity
    const workspaceResult = await query(`
      SELECT w.id FROM "Workspace" w
      JOIN "Board" b ON w.id = b."workspaceId"
      JOIN "List" l ON b.id = l."boardId"
      JOIN "Card" c ON l.id = c."listId"
      WHERE c.id = $1
    `, [req.params.id]);

    if (workspaceResult.rows.length > 0) {
      let activityTitle = `Updated card "${result.rows[0].title}"`;
      if (status) {
        activityTitle += ` (${status})`;
      }
      
      await query(
        'INSERT INTO "Activity" (id, title, "workspaceId", "createdAt") VALUES (gen_random_uuid(), $1, $2, NOW())',
        [activityTitle, workspaceResult.rows[0].id]
      );
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update card error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete card
router.delete('/:id', async (req, res) => {
  try {
    // Get card info for activity log
    const cardResult = await query(`
      SELECT c.title, w.id as workspaceId 
      FROM "Card" c
      JOIN "List" l ON c."listId" = l.id
      JOIN "Board" b ON l."boardId" = b.id
      JOIN "Workspace" w ON b."workspaceId" = w.id
      WHERE c.id = $1
    `, [req.params.id]);

    if (cardResult.rows.length === 0) {
      return res.status(404).json({ message: 'Card not found' });
    }

    const card = cardResult.rows[0];

    // Delete card
    await query('DELETE FROM "Card" WHERE id = $1', [req.params.id]);

    // Log activity
    await query(
      'INSERT INTO "Activity" (id, title, "workspaceId", "createdAt") VALUES (gen_random_uuid(), $1, $2, NOW())',
      [`Deleted card "${card.title}"`, card.workspaceid]
    );

    res.json({ message: 'Card deleted successfully' });
  } catch (error) {
    console.error('Delete card error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;