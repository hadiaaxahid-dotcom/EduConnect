const Attendance = require('../models/Attendance');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

exports.markAttendance = async (req, res, next) => {
  try {
    const { courseId, date, records } = req.body;
    const targetDate = new Date(date);
    if (!courseId || Number.isNaN(targetDate.getTime()) || !Array.isArray(records) || !records.length) {
      return res.status(400).json({ message: 'Course, valid date, and at least one student record are required' });
    }

    const courseFilter = { _id: courseId };
    if (String(req.user.role).toLowerCase() === 'teacher') courseFilter.teacher = req.user.id;
    const course = await Course.findOne(courseFilter);
    if (!course) return res.status(404).json({ message: 'Course not found in your teaching workspace' });

    for (const item of records) {
      if (!item.studentId || !['Present', 'Absent', 'Late'].includes(item.status)) {
        return res.status(400).json({ message: 'Each attendance record needs a student and a valid status' });
      }
      const enrollment = await Enrollment.findOne({ course: courseId, student: item.studentId });
      if (!enrollment) return res.status(400).json({ message: 'Student is not enrolled in this course' });

      const existing = await Attendance.findOne({
        course: courseId,
        student: item.studentId,
        date: targetDate
      });
      if (existing) {
        existing.status = item.status;
        await existing.save();
      } else {
        await Attendance.create({
          course: courseId,
          student: item.studentId,
          date: targetDate,
          status: item.status
        });
      }
    }

    return res.json({ message: 'Attendance saved' });
  } catch (err) {
    return next(err);
  }
};

exports.getAttendance = async (req, res, next) => {
  try {
    const filter = {};
    const role = String(req.user.role).toLowerCase();
    if (role === 'teacher') {
      const courses = await Course.find({ teacher: req.user.id }).select('_id');
      const courseIds = courses.map((course) => course._id);
      if (req.query.courseId && !courseIds.some((courseId) => String(courseId) === String(req.query.courseId))) {
        return res.json({ records: [], total: 0, presentCount: 0, percentage: 0 });
      }
      filter.course = req.query.courseId || { $in: courseIds };
    } else if (req.query.courseId) {
      filter.course = req.query.courseId;
    }
    if (role === 'student') filter.student = req.user.id;
    else if (req.query.studentId) filter.student = req.query.studentId;

    const records = await Attendance.find(filter)
      .populate('student', 'name email')
      .populate('course', 'code title')
      .sort({ date: -1 });

    const total = records.length;
    const presentCount = records.filter((r) => r.status === 'Present').length;
    const percentage = total > 0 ? Number(((presentCount / total) * 100).toFixed(2)) : 0;

    return res.json({ records, total, presentCount, percentage });
  } catch (err) {
    return next(err);
  }
};