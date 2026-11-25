const express = require('express');
const router = express.Router();
const { markAttendance, getAttendance } = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.post('/', authorize('admin', 'teacher'), markAttendance);
router.get('/', getAttendance);

module.exports = router;