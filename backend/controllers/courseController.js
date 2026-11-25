const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

exports.getCourses = async (req, res, next) => {
  try {
    const filter = String(req.user.role).toLowerCase() === 'teacher' ? { teacher: req.user.id } : {};
    const courses = await Course.find(filter).populate('teacher', 'name email').sort({ createdAt: -1 });
    return res.json(courses);
  } catch (err) {
    return next(err);
  }
};

exports.createCourse = async (req, res, next) => {
  try {
    const { code, title, description, teacherId } = req.body;
    const course = await Course.create({
      code,
      title,
      description: description || '',
      teacher: teacherId || null
    });
    return res.status(201).json(course);
  } catch (err) {
    return next(err);
  }
};

exports.updateCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    if (req.body.code) course.code = req.body.code;
    if (req.body.title) course.title = req.body.title;
    if (req.body.description !== undefined) course.description = req.body.description;
    if (req.body.teacherId !== undefined) course.teacher = req.body.teacherId || null;

    const updated = await course.save();
    return res.json(updated);
  } catch (err) {
    return next(err);
  }
};

exports.deleteCourse = async (req, res, next) => {
  try {
    await Course.findByIdAndDelete(req.params.id);
    await Enrollment.deleteMany({ course: req.params.id });
    return res.json({ message: 'Course deleted' });
  } catch (err) {
    return next(err);
  }
};

exports.enrollStudent = async (req, res, next) => {
  try {
    const { studentId, courseId } = req.body;
    const exists = await Enrollment.findOne({ student: studentId, course: courseId });
    if (exists) return res.status(400).json({ message: 'Student already enrolled in course' });

    const enrollment = await Enrollment.create({ student: studentId, course: courseId });
    return res.status(201).json(enrollment);
  } catch (err) {
    return next(err);
  }
};

exports.getEnrolledCourses = async (req, res, next) => {
  try {
    const enrollments = await Enrollment.find({ student: req.user.id }).populate({
      path: 'course',
      populate: { path: 'teacher', select: 'name email' }
    });
    return res.json(enrollments.map((e) => e.course).filter(Boolean));
  } catch (err) {
    return next(err);
  }
};