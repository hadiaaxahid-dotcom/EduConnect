const User = require('../models/User');
const bcrypt = require('bcryptjs');

exports.getUsers = async (req, res, next) => {
  try {
    const role = req.query.role ? String(req.query.role).toLowerCase() : '';
    const filter = role ? { role: new RegExp(`^${role.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } : {};
    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    return res.json(users);
  } catch (err) {
    return next(err);
  }
};

exports.createUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'User already exists' });

    const normalizedRole = String(role || 'student').toLowerCase();
    if (!['admin', 'teacher', 'student'].includes(normalizedRole)) {
      return res.status(400).json({ message: 'Role must be admin, teacher, or student' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword, role: normalizedRole });
    return res.status(201).json({ _id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    return next(err);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (req.body.name) user.name = req.body.name;
    if (req.body.email) user.email = req.body.email;
    if (req.body.role) {
      const role = String(req.body.role).toLowerCase();
      if (!['admin', 'teacher', 'student'].includes(role)) {
        return res.status(400).json({ message: 'Role must be admin, teacher, or student' });
      }
      user.role = role;
    }
    if (req.body.password) user.password = await bcrypt.hash(req.body.password, 10);

    const updated = await user.save();
    return res.json({ _id: updated._id, name: updated.name, email: updated.email, role: updated.role });
  } catch (err) {
    return next(err);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'User not found' });
    return res.json({ message: 'User removed' });
  } catch (err) {
    return next(err);
  }
};