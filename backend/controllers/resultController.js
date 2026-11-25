const Result = require('../models/Result');
const Notification = require('../models/Notification');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

const getGrade = (pct) => {
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B';
  if (pct >= 60) return 'C';
  if (pct >= 50) return 'D';
  return 'F';
};

exports.uploadResult = async (req, res, next) => {
  try {
    const { courseId, studentId, examName, marksObtained, totalMarks } = req.body;
    const marks = Number(marksObtained);
    const total = Number(totalMarks);
    if (!courseId || !studentId || !examName || !Number.isFinite(marks) || !Number.isFinite(total) || total <= 0 || marks < 0 || marks > total) {
      return res.status(400).json({ message: 'Choose a course and student, enter an assessment name, and provide valid marks' });
    }

    const courseFilter = { _id: courseId };
    if (String(req.user.role).toLowerCase() === 'teacher') courseFilter.teacher = req.user.id;
    const course = await Course.findOne(courseFilter);
    if (!course) return res.status(404).json({ message: 'Course not found in your teaching workspace' });

    const enrollment = await Enrollment.findOne({ course: courseId, student: studentId });
    if (!enrollment) return res.status(400).json({ message: 'Student is not enrolled in this course' });

    const pct = (marks / total) * 100;
    const result = await Result.create({
      course: courseId,
      student: studentId,
      examName,
      marksObtained: marks,
      totalMarks: total,
      grade: getGrade(pct)
    });
    await Notification.create({
      user: studentId,
      message: `New result published: ${examName}`
    });
    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
};

exports.getResults = async (req, res, next) => {
  try {
    const filter = {};
    const role = String(req.user.role).toLowerCase();
    if (role === 'student') {
      filter.student = req.user.id;
    } else if (req.query.studentId) {
      filter.student = req.query.studentId;
    }
    if (role === 'teacher') {
      const courses = await Course.find({ teacher: req.user.id }).select('_id');
      const courseIds = courses.map((course) => course._id);
      if (req.query.courseId && !courseIds.some((courseId) => String(courseId) === String(req.query.courseId))) {
        return res.json([]);
      }
      filter.course = req.query.courseId || { $in: courseIds };
    } else if (req.query.courseId) {
      filter.course = req.query.courseId;
    }

    const results = await Result.find(filter)
      .populate('student', 'name email')
      .populate('course', 'code title')
      .sort({ createdAt: -1 });

    return res.json(results);
  } catch (err) {
    return next(err);
  }
};