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

module.exports = router;