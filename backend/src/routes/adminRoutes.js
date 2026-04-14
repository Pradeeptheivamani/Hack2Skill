const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { getAnalytics, getAllComplaints, assignComplaint, getUsers, updateUserRole, getMapData } = require('../controllers/adminController');

router.use(protect, authorize('admin'));

router.get('/analytics', getAnalytics);
router.get('/complaints', getAllComplaints);
router.put('/complaints/:id/assign', assignComplaint);
router.get('/users', getUsers);
router.put('/users/:id/role', updateUserRole);
router.get('/map-data', getMapData);

module.exports = router;
