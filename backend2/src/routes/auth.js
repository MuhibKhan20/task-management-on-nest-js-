const express = require('express');
const { query } = require('../config/database');
const { hashPassword, comparePassword, generateToken, generateRefreshToken, verifyRefreshToken } = require('../utils/auth');
const { validateRegistration, validateLogin } = require('../middleware/validation');
const router = express.Router();

// Register
router.post('/register', validateRegistration, async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await query('SELECT id FROM "User" WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Use provided role or default to USER
    const userRole = role || 'USER';

    // Create user
    const result = await query(
      'INSERT INTO "User" (id, username, email, password, role, "createdAt", "updatedAt") VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW()) RETURNING id, username, email, role',
      [username, email, hashedPassword, userRole]
    );

    const user = result.rows[0];
    const token = generateToken({ sub: user.id, email: user.email, role: user.role });
    const refreshToken = generateRefreshToken({ sub: user.id, email: user.email, role: user.role });

    // Store refresh token
    await query('UPDATE "User" SET "refreshToken" = $1 WHERE id = $2', [refreshToken, user.id]);

    res.status(201).json({
      user: { id: user.id, username: user.username, email: user.email, role: user.role },
      access_token: token,
      refresh_token: refreshToken
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Login
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const result = await query('SELECT * FROM "User" WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Check password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate tokens
    const token = generateToken({ sub: user.id, email: user.email, role: user.role });
    const refreshToken = generateRefreshToken({ sub: user.id, email: user.email, role: user.role });

    // Store refresh token
    await query('UPDATE "User" SET "refreshToken" = $1 WHERE id = $2', [refreshToken, user.id]);

    res.json({
      user: { id: user.id, username: user.username, email: user.email, role: user.role },
      access_token: token,
      refresh_token: refreshToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    // Verify refresh token
    const payload = verifyRefreshToken(refresh_token);
    
    // Check if refresh token exists in database
    const result = await query('SELECT * FROM "User" WHERE id = $1 AND "refreshToken" = $2', [payload.sub, refresh_token]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const user = result.rows[0];
    
    // Generate new tokens
    const newToken = generateToken({ sub: user.id, email: user.email, role: user.role });
    const newRefreshToken = generateRefreshToken({ sub: user.id, email: user.email, role: user.role });

    // Update refresh token
    await query('UPDATE "User" SET "refreshToken" = $1 WHERE id = $2', [newRefreshToken, user.id]);

    res.json({
      access_token: newToken,
      refresh_token: newRefreshToken
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({ message: 'Invalid refresh token' });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const payload = require('../utils/auth').verifyToken(token);
    
    // Clear refresh token
    await query('UPDATE "User" SET "refreshToken" = NULL WHERE id = $1', [payload.sub]);

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;