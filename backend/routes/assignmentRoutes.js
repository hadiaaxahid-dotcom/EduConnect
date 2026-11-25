const express = require('express');
const router = express.Router();
const {
  getAssignments,
  createAssignment,
  submitAssignment,
  getSubmissions,
  gradeSubmission
} = require('../controllers/assignmentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/', getAssignments);
router.post('/', authorize('admin', 'teacher'), createAssignment);
router.post('/submit', authorize('student'), submitAssignment);
router.get('/:assignmentId/submissions', authorize('admin', 'teacher'), getSubmissions);
router.put('/submissions/:submissionId/grade', authorize('admin', 'teacher'), gradeSubmission);

module.exports = router;