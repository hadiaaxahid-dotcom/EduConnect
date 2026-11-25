const express = require('express');
const router = express.Router();
const {
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollStudent,
  getEnrolledCourses
} = require('../controllers/courseController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/', getCourses);
router.get('/enrolled', getEnrolledCourses);
router.post('/', authorize('admin'), createCourse);
router.put('/:id', authorize('admin'), updateCourse);
router.delete('/:id', authorize('admin'), deleteCourse);
router.post('/enroll', authorize('admin', 'teacher'), enrollStudent);

module.exports = router;