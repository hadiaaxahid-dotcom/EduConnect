const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized, token missing' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ message: 'User not found' });
    }
    const role = String(req.user.role || '').trim().toLowerCase();
    if (!['admin', 'teacher', 'student'].includes(role)) {
      return res.status(403).json({ message: 'Account role is missing or invalid. Set role to admin, teacher, or student.' });
    }
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized, invalid token' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(String(req.user.role || '').toLowerCase())) {
    return res.status(403).json({ message: 'Forbidden for your role' });
  }
  return next();
};

module.exports = { protect, authorize };