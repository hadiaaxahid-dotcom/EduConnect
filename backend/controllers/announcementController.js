const Announcement = require('../models/Announcement');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');

exports.createAnnouncement = async (req, res, next) => {
  try {
    const { title, content, courseId, type } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and message are required' });
    }
    if (courseId) {
      const courseFilter = { _id: courseId };
      if (String(req.user.role).toLowerCase() === 'teacher') courseFilter.teacher = req.user.id;
      const course = await Course.findOne(courseFilter);
      if (!course) return res.status(404).json({ message: 'Course not found in your teaching workspace' });
    }
    const announcement = await Announcement.create({
      title,
      content,
      author: req.user.id,
      course: courseId || null,
      type: type || (courseId ? 'Course' : 'General')
    });
    const recipientIds = courseId
      ? (await Enrollment.find({ course: courseId }).distinct('student')).filter((id) => String(id) !== String(req.user.id))
      : (await User.find({ _id: { $ne: req.user.id } }).distinct('_id'));
    if (recipientIds.length) {
      await Notification.insertMany(recipientIds.map((userId) => ({
        user: userId,
        message: `New announcement: ${title}`
      })));
    }
    return res.status(201).json(announcement);
  } catch (err) {
    return next(err);
  }
};

exports.getAnnouncements = async (req, res, next) => {
  try {
    const filter = {};
    if (String(req.user.role || '').toLowerCase() === 'student') {
      const courseIds = await Enrollment.find({ student: req.user.id }).distinct('course');
      filter.$or = [{ course: null }, { course: { $in: courseIds } }];
    }
    const list = await Announcement.find(filter)
      .populate('author', 'name role')
      .populate('course', 'code title')
      .sort({ createdAt: -1 });
    return res.json(list);
  } catch (err) {
    return next(err);
  }
};