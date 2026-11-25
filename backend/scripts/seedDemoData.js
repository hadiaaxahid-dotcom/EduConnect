const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const demoCourses = [
  { code: 'DEMO-101', title: 'Foundations of Science', description: 'An introduction to scientific thinking and lab skills.' },
  { code: 'DEMO-201', title: 'Mathematics in Practice', description: 'Build confidence with practical problem solving.' },
  { code: 'DEMO-301', title: 'Writing and Communication', description: 'Practice clear writing, research, and presentation.' }
];

async function seedDemoData() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is missing from backend/.env');
  }

  await mongoose.connect(process.env.MONGO_URI);
  try {
    const teacher = await User.findOne({
      email: 'teacher@gmail.com',
      role: { $in: ['teacher', 'Teacher', 'TEACHER'] }
    }).select('_id') || await User.findOne({
      role: { $in: ['teacher', 'Teacher', 'TEACHER'] }
    }).sort({ createdAt: 1 }).select('_id');

    if (!teacher) {
      throw new Error('Create a teacher account before seeding demo courses');
    }

    const students = await User.aggregate([
      { $match: { $expr: { $eq: [{ $toLower: { $ifNull: ['$role', ''] } }, 'student'] } } },
      { $project: { _id: 1 } }
    ]);

    for (const demoCourse of demoCourses) {
      const course = await Course.findOneAndUpdate(
        { code: demoCourse.code },
        { $setOnInsert: { ...demoCourse, teacher: teacher._id } },
        { new: true, upsert: true, runValidators: true }
      );

      for (const student of students) {
        await Enrollment.updateOne(
          { student: student._id, course: course._id },
          { $setOnInsert: { student: student._id, course: course._id } },
          { upsert: true }
        );
      }

      console.log(`Ready: ${course.code} — enrolled ${students.length} student account(s).`);
    }
  } finally {
    await mongoose.disconnect();
  }
}

seedDemoData().catch((error) => {
  console.error(`Demo data seeding failed: ${error.message}`);
  process.exitCode = 1;
});
