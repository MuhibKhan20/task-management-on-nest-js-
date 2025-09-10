require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { authenticateToken } = require('./middleware/auth');
const { validateRegistration, validateLogin } = require('./middleware/validation');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const workspaceRoutes = require('./routes/workspaces');
const boardRoutes = require('./routes/boards');
const listRoutes = require('./routes/lists');
const cardRoutes = require('./routes/cards');

const app = express();
const PORT = process.env.PORT || 4003;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP',
  skip: (req) => req.method === 'OPTIONS' // Skip rate limiting for OPTIONS requests
});
app.use('/api', limiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Increased from 10 to 50 for production use
  message: 'Too many authentication attempts',
  skip: (req) => req.method === 'OPTIONS' // Skip rate limiting for OPTIONS requests
});

// CORS configuration - Allow ALL origins
app.use(cors({
  origin: '*', // Allow all origins
  credentials: false, // Set to false when using wildcard origin
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));

// Explicit OPTIONS handler for all routes
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, Accept, X-Requested-With');
  res.sendStatus(200);
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Task Manager Backend is running', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authLimiter);
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/user', authenticateToken, userRoutes);
app.use('/api/workspaces', authenticateToken, workspaceRoutes);
app.use('/api/boards', authenticateToken, boardRoutes);
app.use('/api/lists', authenticateToken, listRoutes);
app.use('/api/cards', authenticateToken, cardRoutes);

// 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.code === '23505') { // PostgreSQL unique violation
    return res.status(400).json({ message: 'Duplicate entry' });
  }
  
  if (err.code === '23503') { // PostgreSQL foreign key violation
    return res.status(400).json({ message: 'Referenced resource not found' });
  }
  
  res.status(500).json({ 
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Task Manager Backend running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API base URL: http://localhost:${PORT}/api`);
});

module.exports = app;