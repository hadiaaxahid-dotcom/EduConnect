const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    examName: { type: String, required: true, trim: true },
    marksObtained: { type: Number, required: true },
    totalMarks: { type: Number, required: true },
    grade: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Result', resultSchema);