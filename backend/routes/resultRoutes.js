const express = require('express');
const router = express.Router();
const { uploadResult, getResults } = require('../controllers/resultController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.post('/', authorize('admin', 'teacher'), uploadResult);
router.get('/', getResults);

module.exports = router;