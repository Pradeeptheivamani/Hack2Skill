/**
 * adminController.js — Admin analytics and management
 */

const Complaint = require('../models/Complaint');
const User = require('../models/User');
const Department = require('../models/Department');

// @route  GET /api/admin/analytics
// @access Private (admin)
const getAnalytics = async (req, res, next) => {
  try {
    const [
      totalComplaints,
      resolvedComplaints,
      pendingComplaints,
      escalatedComplaints,
      highPriority,
      slaBreached,
      totalUsers,
    ] = await Promise.all([
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: 'resolved' }),
      Complaint.countDocuments({ status: { $in: ['submitted', 'under_review', 'in_progress'] } }),
      Complaint.countDocuments({ status: 'escalated' }),
      Complaint.countDocuments({ priority: 'high' }),
      Complaint.countDocuments({ slaBreached: true }),
      User.countDocuments({ role: 'citizen' }),
    ]);

    // Complaints by category
    const byCategory = await Complaint.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Complaints by status
    const byStatus = await Complaint.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Complaints by priority
    const byPriority = await Complaint.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    // Complaints trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const trend = await Complaint.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Department performance
    const deptPerformance = await Department.find({}, 'name stats icon color').lean();

    res.json({
      success: true,
      analytics: {
        overview: {
          totalComplaints,
          resolvedComplaints,
          pendingComplaints,
          escalatedComplaints,
          highPriority,
          slaBreached,
          totalUsers,
          resolutionRate: totalComplaints
            ? Math.round((resolvedComplaints / totalComplaints) * 100)
            : 0,
        },
        byCategory,
        byStatus,
        byPriority,
        trend,
        deptPerformance,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route  GET /api/admin/complaints
// @access Private (admin)
const getAllComplaints = async (req, res, next) => {
  try {
    const { status, priority, category, department, page = 1, limit = 20, search } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;
    if (department) filter.department = department;
    if (search) {
      filter.$or = [
        { trackingId: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
      ];
    }

    const complaints = await Complaint.find(filter)
      .populate('user', 'name email phone')
      .populate('department', 'name code icon color')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Complaint.countDocuments(filter);

    res.json({
      success: true,
      complaints,
      pagination: { page: Number(page), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// @route  PUT /api/admin/complaints/:id/assign
// @access Private (admin)
const assignComplaint = async (req, res, next) => {
  try {
    const { departmentId } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: 'Not found.' });

    const oldDept = complaint.department;
    complaint.department = departmentId;
    complaint.status = 'under_review';
    complaint.timeline.push({
      status: 'under_review',
      note: `Manually assigned to department by admin.`,
      updatedByName: req.user.name,
      timestamp: new Date(),
    });
    await complaint.save();

    // Update stats
    if (oldDept) {
      await Department.findByIdAndUpdate(oldDept, { $inc: { 'stats.totalPending': -1 } });
    }
    await Department.findByIdAndUpdate(departmentId, { $inc: { 'stats.totalAssigned': 1, 'stats.totalPending': 1 } });

    if (req.io) {
      req.io.to(`dept_${departmentId}`).emit('new_assignment', {
        trackingId: complaint.trackingId,
        priority: complaint.priority,
        timestamp: new Date(),
      });
    }

    res.json({ success: true, message: 'Complaint assigned successfully.', complaint });
  } catch (error) {
    next(error);
  }
};

// @route  GET /api/admin/users
// @access Private (admin)
const getUsers = async (req, res, next) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (role) filter.role = role;

    const users = await User.find(filter)
      .populate('department', 'name code')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await User.countDocuments(filter);
    res.json({ success: true, users, pagination: { page: Number(page), total } });
  } catch (error) {
    next(error);
  }
};

// @route  PUT /api/admin/users/:id/role
// @access Private (admin)
const updateUserRole = async (req, res, next) => {
  try {
    const { role, department } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role, department: department || null },
      { new: true }
    );
    res.json({ success: true, message: 'User role updated.', user });
  } catch (error) {
    next(error);
  }
};

// @route  GET /api/admin/map-data
// @access Private (admin)
const getMapData = async (req, res, next) => {
  try {
    const complaints = await Complaint.find({
      'location.lat': { $ne: null },
      'location.lng': { $ne: null },
    })
      .select('trackingId title category priority status location createdAt')
      .sort({ createdAt: -1 })
      .limit(500);

    res.json({ success: true, complaints });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAnalytics, getAllComplaints, assignComplaint, getUsers, updateUserRole, getMapData };
