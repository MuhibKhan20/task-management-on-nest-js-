const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const generateToken = (payload, secret = process.env.JWT_SECRET, expiresIn = process.env.JWT_ACCESS_TOKEN_TTL + 's') => {
  return jwt.sign(payload, secret, { expiresIn });
};

const verifyToken = (token, secret = process.env.JWT_SECRET) => {
  return jwt.verify(token, secret);
};

const hashPassword = async (password) => {
  return await bcrypt.hash(password, 12);
};

const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

const generateRefreshToken = (payload) => {
  return generateToken(payload, process.env.REFRESH_JWT_SECRET, process.env.JWT_REFRESH_TOKEN_TTL + 's');
};

const verifyRefreshToken = (token) => {
  return verifyToken(token, process.env.REFRESH_JWT_SECRET);
};

module.exports = {
  generateToken,
  verifyToken,
  hashPassword,
  comparePassword,
  generateRefreshToken,
  verifyRefreshToken
};