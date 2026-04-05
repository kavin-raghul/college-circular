const express = require('express');
const router = express.Router();
const {
  createCircular,
  getCirculars,
  getCircularById,
  markAsRead,
  deleteCircular
} = require('../controllers/circularController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/')
  .post(protect, authorize('Principal', 'HOD', 'Faculty'), upload.array('attachments', 5), createCircular)
  .get(protect, getCirculars);

router.route('/:id')
  .get(protect, getCircularById)
  .delete(protect, authorize('Principal', 'HOD', 'Faculty'), deleteCircular);

router.route('/:id/read')
  .post(protect, markAsRead);

module.exports = router;
