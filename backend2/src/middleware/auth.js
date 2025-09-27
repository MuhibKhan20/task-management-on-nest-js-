const { verifyToken } = require('../utils/auth');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  // Debug logging
  console.log('Raw auth header:', authHeader);
  console.log('Extracted token:', token);
  console.log('Token length:', token ? token.length : 'null');

  try {
    const decoded = verifyToken(token);
    req.user = {
      userId: decoded.sub,
      email: decoded.email,
      role: decoded.role
    };
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

module.exports = { authenticateToken };