/**
 * departmentController.js — Department officer complaint management
 */

const Complaint = require('../models/Complaint');
const Department = require('../models/Department');
const { notifyStatusChange } = require('../services/notificationService');

// @route  GET /api/departments
// @access Public
const getAllDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, departments });
  } catch (error) {
    next(error);
  }
};

// @route  GET /api/departments/my-complaints
// @access Private (department_officer)
const getDepartmentComplaints = async (req, res, next) => {
  try {
    const { status, priority, page = 1, limit = 20 } = req.query;
    const filter = { department: req.user.department };

    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const complaints = await Complaint.find(filter)
      .populate('user', 'name email phone')
      .populate('department', 'name code icon color')
      .sort({ priority: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Complaint.countDocuments(filter);

    // Stats for department officer's dashboard
    const [pending, inProgress, resolved, highPriority] = await Promise.all([
      Complaint.countDocuments({ department: req.user.department, status: { $in: ['submitted', 'under_review'] } }),
      Complaint.countDocuments({ department: req.user.department, status: 'in_progress' }),
      Complaint.countDocuments({ department: req.user.department, status: 'resolved' }),
      Complaint.countDocuments({ department: req.user.department, priority: 'high', status: { $ne: 'resolved' } }),
    ]);

    res.json({
      success: true,
      complaints,
      stats: { pending, inProgress, resolved, highPriority, total },
      pagination: { page: Number(page), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// @route  PUT /api/departments/complaints/:id/status
// @access Private (department_officer)
const updateDeptComplaintStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const complaint = await Complaint.findOne({
      _id: req.params.id,
      department: req.user.department,
    }).populate('user', '_id');

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found or not assigned to your department.' });
    }

    complaint.status = status;
    complaint.timeline.push({
      status,
      note: note || `Status updated by department officer.`,
      updatedBy: req.user._id,
      updatedByName: req.user.name,
      timestamp: new Date(),
    });

    if (status === 'resolved') {
      complaint.resolvedAt = new Date();
      complaint.resolutionNote = note;

      // Update department stats
      await Department.findByIdAndUpdate(req.user.department, {
        $inc: { 'stats.totalResolved': 1, 'stats.totalPending': -1 },
      });
    }

    complaint.checkSlaBreach();
    await complaint.save();

    await notifyStatusChange(complaint.user._id, complaint.trackingId, status, req.io);

    res.json({ success: true, message: `Status updated to "${status}".`, complaint });
  } catch (error) {
    next(error);
  }
};

// @route  GET /api/departments/:id/stats
// @access Private (admin)
const getDepartmentStats = async (req, res, next) => {
  try {
    const dept = await Department.findById(req.params.id);
    if (!dept) return res.status(404).json({ success: false, message: 'Department not found.' });

    const stats = await Complaint.aggregate([
      { $match: { department: dept._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({ success: true, department: dept, stats });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllDepartments, getDepartmentComplaints, updateDeptComplaintStatus, getDepartmentStats };
