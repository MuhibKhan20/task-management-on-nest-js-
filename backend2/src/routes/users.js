const express = require('express');
const { query } = require('../config/database');
const { hashPassword } = require('../utils/auth');
const router = express.Router();

// Get current user profile
router.get('/', async (req, res) => {
  try {
    const result = await query(
      'SELECT id, username, email, role, "createdAt", "updatedAt" FROM "User" WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update user profile
router.patch('/', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const userId = req.user.userId;

    let updateFields = [];
    let values = [];
    let paramCounter = 1;

    if (username) {
      updateFields.push(`username = $${paramCounter++}`);
      values.push(username);
    }

    if (email) {
      // Check if email already exists
      const existingUser = await query('SELECT id FROM "User" WHERE email = $1 AND id != $2', [email, userId]);
      if (existingUser.rows.length > 0) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      updateFields.push(`email = $${paramCounter++}`);
      values.push(email);
    }

    if (password) {
      const hashedPassword = await hashPassword(password);
      updateFields.push(`password = $${paramCounter++}`);
      values.push(hashedPassword);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    updateFields.push(`"updatedAt" = NOW()`);
    values.push(userId);

    const updateQuery = `
      UPDATE "User" 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramCounter}
      RETURNING id, username, email, role, "createdAt", "updatedAt"
    `;

    const result = await query(updateQuery, values);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all users with 'USER' role (for task assignment)
router.get('/assignable', async (req, res) => {
  try {
    const result = await query(
      'SELECT id, username, email FROM "User" WHERE role != $1 ORDER BY username ASC',
      ['ADMIN']
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get assignable users error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DEBUG: Get all cards with their assignments (remove in production)
router.get('/debug/all-cards', async (req, res) => {
  try {
    const result = await query(`
      SELECT
        c.id,
        c.title,
        c."assignedUserId",
        u.username as assignedToUsername,
        u.email as assignedToEmail,
        l.title as listTitle,
        b.title as boardTitle,
        w.title as workspaceTitle
      FROM "Card" c
      JOIN "List" l ON c."listId" = l.id
      JOIN "Board" b ON l."boardId" = b.id
      JOIN "Workspace" w ON b."workspaceId" = w.id
      LEFT JOIN "User" u ON c."assignedUserId" = u.id
      ORDER BY c."createdAt" DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Get all cards error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all assigned tasks (NO AUTH RESTRICTIONS)
router.get('/assigned-tasks', async (req, res) => {
  try {
    const result = await query(`
      SELECT
        c.*,
        l.title as listTitle,
        b.title as boardTitle,
        w.title as workspaceTitle,
        u.username as assignedToUsername
      FROM "Card" c
      JOIN "List" l ON c."listId" = l.id
      JOIN "Board" b ON l."boardId" = b.id
      JOIN "Workspace" w ON b."workspaceId" = w.id
      LEFT JOIN "User" u ON c."assignedUserId" = u.id
      WHERE c."assignedUserId" IS NOT NULL
      ORDER BY
        CASE
          WHEN c.deadline IS NOT NULL THEN c.deadline
          ELSE '9999-12-31'::timestamp
        END ASC,
        c."createdAt" DESC
    `);

    console.log(`DEBUG: Found ${result.rows.length} total assigned tasks`);

    res.json(result.rows);
  } catch (error) {
    console.error('Get assigned tasks error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get assigned tasks for a specific user (NO AUTH RESTRICTIONS)
router.get('/assigned-tasks/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    console.log(`DEBUG: Looking for tasks assigned to userId: ${userId}`);

    const result = await query(`
      SELECT
        c.*,
        l.title as listTitle,
        b.title as boardTitle,
        w.title as workspaceTitle,
        u.username as assignedToUsername
      FROM "Card" c
      JOIN "List" l ON c."listId" = l.id
      JOIN "Board" b ON l."boardId" = b.id
      JOIN "Workspace" w ON b."workspaceId" = w.id
      LEFT JOIN "User" u ON c."assignedUserId" = u.id
      WHERE c."assignedUserId" = $1
      ORDER BY
        CASE
          WHEN c.deadline IS NOT NULL THEN c.deadline
          ELSE '9999-12-31'::timestamp
        END ASC,
        c."createdAt" DESC
    `, [userId]);

    console.log(`DEBUG: Found ${result.rows.length} assigned tasks for user ${userId}`);
    console.log('DEBUG: Assigned tasks:', result.rows);

    res.json(result.rows);
  } catch (error) {
    console.error('Get assigned tasks error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;