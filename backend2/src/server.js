// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { authenticateToken } = require('./middleware/auth');
const { validateRegistration, validateLogin } = require('./middleware/validation'); // (kept in case routes use these)

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const workspaceRoutes = require('./routes/workspaces');
const boardRoutes = require('./routes/boards');
const listRoutes = require('./routes/lists');
const cardRoutes = require('./routes/cards');

const app = express();
const PORT = process.env.PORT || 4003;

/* =========================
   1) CORS MUST BE FIRST
   ========================= */
// If you do NOT use cookies/sessions across origins, keep '*' and credentials: false
app.use(
  cors({
    origin: '*',
    credentials: false, // must be false with '*'
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept', 'X-Requested-With'],
    optionsSuccessStatus: 204, // ok for legacy browsers
  })
);

// Let Express handle preflight for any route using the same CORS config
app.options('*', cors());

/* ------------------------------------------------------------------
   If you DO use cookies across origins, replace the CORS block above
   with this stricter config (and enable credentials on client):
   app.use(cors({
     origin: ['https://starlit-starship-51a1a6.netlify.app'],
     credentials: true,
     methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
     allowedHeaders: ['Content-Type','Authorization','Origin','Accept','X-Requested-With'],
     optionsSuccessStatus: 204,
   }));
   app.options('*', cors());
------------------------------------------------------------------- */

/* =========================
   2) Security & Parsers
   ========================= */
app.use(helmet());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/* =========================
   3) Rate Limiting (after CORS)
   ========================= */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Too many requests from this IP',
  skip: (req) => req.method === 'OPTIONS',
});
app.use('/api', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: 'Too many authentication attempts',
  skip: (req) => req.method === 'OPTIONS',
});

/* =========================
   4) Health Check
   ========================= */
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Task Manager Backend is running',
    timestamp: new Date().toISOString(),
  });
});

/* =========================
   5) API Routes
   ========================= */
// Auth (rate-limited)
app.use('/api/auth', authLimiter, authRoutes);

// Protected routes
app.use('/api/user', authenticateToken, userRoutes);
app.use('/api/workspaces', authenticateToken, workspaceRoutes);
app.use('/api/boards', authenticateToken, boardRoutes);
app.use('/api/lists', authenticateToken, listRoutes);
app.use('/api/cards', authenticateToken, cardRoutes);

/* =========================
   6) 404 for API
   ========================= */
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

/* =========================
   7) Error Handler
   ========================= */
app.use((err, req, res, next) => {
  console.error('Error:', err);

  if (err && err.code === '23505') {
    return res.status(400).json({ message: 'Duplicate entry' });
  }
  if (err && err.code === '23503') {
    return res.status(400).json({ message: 'Referenced resource not found' });
  }

  res.status(500).json({
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: err.message }),
  });
});

/* =========================
   8) Start Server
   ========================= */
app.listen(PORT, () => {
  console.log(`🚀 Task Manager Backend running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API base URL: http://localhost:${PORT}/api`);
});

module.exports = app;
