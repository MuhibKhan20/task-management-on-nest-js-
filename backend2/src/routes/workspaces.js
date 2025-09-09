const express = require('express');
const { query } = require('../config/database');
const router = express.Router();

// Get all workspaces for user
router.get('/', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM "Workspace" WHERE "userId" = $1 ORDER BY "createdAt" DESC',
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get workspaces error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create workspace
router.post('/', async (req, res) => {
  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const result = await query(
      'INSERT INTO "Workspace" (id, title, "userId", "createdAt", "updatedAt") VALUES (gen_random_uuid(), $1, $2, NOW(), NOW()) RETURNING *',
      [title, req.user.userId]
    );

    // Log activity
    await query(
      'INSERT INTO "Activity" (id, title, "workspaceId", "createdAt") VALUES (gen_random_uuid(), $1, $2, NOW())',
      [`Created workspace "${title}"`, result.rows[0].id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create workspace error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get workspace by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM "Workspace" WHERE id = $1 AND "userId" = $2',
      [req.params.id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get workspace error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update workspace
router.patch('/:id', async (req, res) => {
  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const result = await query(
      'UPDATE "Workspace" SET title = $1, "updatedAt" = NOW() WHERE id = $2 AND "userId" = $3 RETURNING *',
      [title, req.params.id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // Log activity
    await query(
      'INSERT INTO "Activity" (id, title, "workspaceId", "createdAt") VALUES (gen_random_uuid(), $1, $2, NOW())',
      [`Updated workspace to "${title}"`, req.params.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update workspace error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete workspace
router.delete('/:id', async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM "Workspace" WHERE id = $1 AND "userId" = $2 RETURNING title',
      [req.params.id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    res.json({ message: 'Workspace deleted successfully' });
  } catch (error) {
    console.error('Delete workspace error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get boards for workspace
router.get('/:id/boards', async (req, res) => {
  try {
    // First check if workspace belongs to user
    const workspaceResult = await query(
      'SELECT id FROM "Workspace" WHERE id = $1 AND "userId" = $2',
      [req.params.id, req.user.userId]
    );

    if (workspaceResult.rows.length === 0) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    const result = await query(
      'SELECT * FROM "Board" WHERE "workspaceId" = $1 ORDER BY "createdAt" DESC',
      [req.params.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get boards error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create board in workspace
router.post('/:id/boards', async (req, res) => {
  try {
    const { title, color } = req.body;

    if (!title || !color) {
      return res.status(400).json({ message: 'Title and color are required' });
    }

    // Check if workspace belongs to user
    const workspaceResult = await query(
      'SELECT id FROM "Workspace" WHERE id = $1 AND "userId" = $2',
      [req.params.id, req.user.userId]
    );

    if (workspaceResult.rows.length === 0) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    const result = await query(
      'INSERT INTO "Board" (id, title, color, "workspaceId", "createdAt", "updatedAt") VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW()) RETURNING *',
      [title, color, req.params.id]
    );

    // Log activity
    await query(
      'INSERT INTO "Activity" (id, title, "workspaceId", "createdAt") VALUES (gen_random_uuid(), $1, $2, NOW())',
      [`Created board "${title}"`, req.params.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create board error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;