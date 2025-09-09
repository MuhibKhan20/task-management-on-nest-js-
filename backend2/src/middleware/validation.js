const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  return password && password.length >= 6;
};

const validateRegistration = (req, res, next) => {
  const { username, email, password } = req.body;

  if (!username || username.trim().length === 0) {
    return res.status(400).json({ message: 'Username is required' });
  }

  if (!email || !validateEmail(email)) {
    return res.status(400).json({ message: 'Valid email is required' });
  }

  if (!password || !validatePassword(password)) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !validateEmail(email)) {
    return res.status(400).json({ message: 'Valid email is required' });
  }

  if (!password) {
    return res.status(400).json({ message: 'Password is required' });
  }

  next();
};

module.exports = {
  validateRegistration,
  validateLogin,
  validateEmail,
  validatePassword
};