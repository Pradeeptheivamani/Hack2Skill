const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  submitComplaint, getMyComplaints, trackComplaint, getComplaintById,
  updateComplaintStatus, getAISuggestions, rateComplaint,
} = require('../controllers/complaintController');

// Multer config for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../../uploads');
    require('fs').mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname.replace(/\s/g, '_')}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|pdf/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.test(ext)) cb(null, true);
    else cb(new Error('Only images and PDFs are allowed.'));
  },
});

router.post('/suggest', getAISuggestions);
router.get('/track/:trackingId', trackComplaint);
router.post('/', protect, authorize('citizen'), upload.array('attachments', 5), submitComplaint);
router.get('/my', protect, authorize('citizen'), getMyComplaints);
router.get('/:id', protect, getComplaintById);
router.put('/:id/status', protect, authorize('admin', 'department_officer'), updateComplaintStatus);
router.post('/:id/rate', protect, authorize('citizen'), rateComplaint);

module.exports = router;
