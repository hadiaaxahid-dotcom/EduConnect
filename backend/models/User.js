const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'teacher', 'student'], required: true, lowercase: true },
    avatar: { type: String, default: '' },
    phone: { type: String, default: '' },
    bio: { type: String, default: '' }
  },
  { timestamps: true }
);

userSchema.pre('validate', function (next) {
  if (typeof this.role === 'string') this.role = this.role.toLowerCase();
  next();
});

module.exports = mongoose.model('User', userSchema);