const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Enrollment = require('../models/Enrollment');
const Notification = require('../models/Notification');
const Course = require('../models/Course');

exports.getAssignments = async (req, res, next) => {
  try {
    const role = String(req.user.role || '').toLowerCase();
    const filter = req.query.courseId ? { course: req.query.courseId } : {};
    if (role === 'student') {
      const enrollments = await Enrollment.find({ student: req.user.id }).select('course');
      filter.course = { $in: enrollments.map((enrollment) => enrollment.course) };
      if (req.query.courseId && !filter.course.$in.some((courseId) => String(courseId) === String(req.query.courseId))) {
        return res.json([]);
      }
    } else if (role === 'teacher') {
      const courses = await Course.find({ teacher: req.user.id }).select('_id');
      const courseIds = courses.map((course) => course._id);
      if (req.query.courseId && !courseIds.some((courseId) => String(courseId) === String(req.query.courseId))) {
        return res.json([]);
      }
      filter.course = { $in: courseIds };
    }

    const assignments = await Assignment.find(filter)
      .populate('course', 'code title')
      .sort({ dueDate: 1 });
    return res.json(assignments);
  } catch (err) {
    return next(err);
  }
};

exports.createAssignment = async (req, res, next) => {
  try {
    const { title, description, dueDate, courseId } = req.body;
    if (!title || !courseId || !dueDate) {
      return res.status(400).json({ message: 'Title, course, and due date are required' });
    }
    const role = String(req.user.role || '').toLowerCase();
    const courseFilter = { _id: courseId };
    if (role === 'teacher') courseFilter.teacher = req.user.id;
    const course = await Course.findOne(courseFilter);
    if (!course) return res.status(404).json({ message: 'Course not found in your teaching workspace' });

    const assignment = await Assignment.create({
      title,
      description: description || '',
      dueDate,
      course: courseId,
      createdBy: req.user.id
    });
    const enrollments = await Enrollment.find({ course: courseId }).select('student');
    if (enrollments.length) {
      await Notification.insertMany(enrollments.map((enrollment) => ({
        user: enrollment.student,
        message: `New assignment: ${title}`
      })));
    }
    return res.status(201).json(assignment);
  } catch (err) {
    return next(err);
  }
};

exports.submitAssignment = async (req, res, next) => {
  try {
    const { assignmentId, fileUrl } = req.body;
    const existing = await Submission.findOne({ assignment: assignmentId, student: req.user.id });
    if (existing) {
      existing.fileUrl = fileUrl;
      existing.submittedAt = new Date();
      await existing.save();
      return res.json(existing);
    }

    const submission = await Submission.create({
      assignment: assignmentId,
      student: req.user.id,
      fileUrl
    });
    return res.status(201).json(submission);
  } catch (err) {
    return next(err);
  }
};

exports.getSubmissions = async (req, res, next) => {
  try {
    const submissions = await Submission.find({ assignment: req.params.assignmentId })
      .populate('student', 'name email');
    return res.json(submissions);
  } catch (err) {
    return next(err);
  }
};

exports.gradeSubmission = async (req, res, next) => {
  try {
    const { grade, feedback } = req.body;
    const submission = await Submission.findById(req.params.submissionId);
    if (!submission) return res.status(404).json({ message: 'Submission not found' });

    submission.grade = grade;
    submission.feedback = feedback || '';
    await submission.save();
    return res.json(submission);
  } catch (err) {
    return next(err);
  }
};