const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { getAllDepartments, getDepartmentComplaints, updateDeptComplaintStatus, getDepartmentStats } = require('../controllers/departmentController');

router.get('/', getAllDepartments);
router.get('/my-complaints', protect, authorize('department_officer'), getDepartmentComplaints);
router.put('/complaints/:id/status', protect, authorize('department_officer', 'admin'), updateDeptComplaintStatus);
router.get('/:id/stats', protect, authorize('admin'), getDepartmentStats);

module.exports = router;
