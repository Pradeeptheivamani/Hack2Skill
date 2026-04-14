/**
 * complaintController.js — Core complaint CRUD with AI classification
 */

const Complaint = require('../models/Complaint');
const Department = require('../models/Department');
const { classifyComplaint, getSuggestions } = require('../services/aiClassifier');
const { assignPriority } = require('../services/priorityEngine');
const { notifyStatusChange } = require('../services/notificationService');

// @route  POST /api/complaints
// @access Private (citizen)
const submitComplaint = async (req, res, next) => {
  try {
    const { title, description, location, language, isAnonymous, voiceTranscript } = req.body;

    // ── Step 1: AI Classification
    const aiResult = classifyComplaint(title, description);

    // ── Step 2: Find matching department
    let department = null;
    if (aiResult.departmentCode) {
      department = await Department.findOne({ code: aiResult.departmentCode });
    }

    // ── Step 3: Priority assignment
    const priorityResult = assignPriority(
      aiResult.category,
      title,
      description,
      location
    );

    // ── Step 4: Handle attachments
    const attachments = req.files
      ? req.files.map((f) => ({
          filename: f.filename,
          originalName: f.originalname,
          mimetype: f.mimetype,
          size: f.size,
          url: `/uploads/${f.filename}`,
        }))
      : [];

    // ── Step 5: Create complaint
    const complaint = await Complaint.create({
      user: req.user._id,
      title,
      description,
      category: aiResult.category,
      aiConfidence: aiResult.confidence,
      aiKeywords: aiResult.keywords,
      department: department?._id || null,
      priority: priorityResult.priority,
      priorityScore: priorityResult.priorityScore,
      slaDeadline: priorityResult.slaDeadline,
      location: location || {},
      attachments,
      voiceTranscript,
      language: language || 'en',
      isAnonymous: isAnonymous || false,
      status: 'submitted',
      timeline: [
        {
          status: 'submitted',
          note: 'Complaint submitted successfully.',
          updatedByName: 'System',
          timestamp: new Date(),
        },
      ],
    });

    // ── Step 6: Update department stats
    if (department) {
      await Department.findByIdAndUpdate(department._id, {
        $inc: { 'stats.totalAssigned': 1, 'stats.totalPending': 1 },
      });
    }

    // ── Step 7: Real-time broadcast to admin
    if (req.io) {
      req.io.to('admin_room').emit('new_complaint', {
        trackingId: complaint.trackingId,
        category: complaint.category,
        priority: complaint.priority,
        department: department?.name || 'Unassigned',
        timestamp: new Date(),
      });

      if (department) {
        req.io.to(`dept_${department._id}`).emit('new_assignment', {
          trackingId: complaint.trackingId,
          priority: complaint.priority,
          timestamp: new Date(),
        });
      }
    }

    await complaint.populate('department', 'name code icon color');

    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully!',
      complaint,
      aiInfo: {
        category: aiResult.category,
        confidence: aiResult.confidence,
        department: department?.name || 'Under Review',
        priority: priorityResult.priority,
        slaHours: priorityResult.slaHours,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route  GET /api/complaints/my
// @access Private (citizen)
const getMyComplaints = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = { user: req.user._id };
    if (status) filter.status = status;

    const complaints = await Complaint.find(filter)
      .populate('department', 'name code icon color')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Complaint.countDocuments(filter);

    res.json({
      success: true,
      complaints,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// @route  GET /api/complaints/track/:trackingId
// @access Public
const trackComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.findOne({ trackingId: req.params.trackingId })
      .populate('department', 'name code icon phone email')
      .select('-user');

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found. Check your tracking ID.' });
    }

    res.json({ success: true, complaint });
  } catch (error) {
    next(error);
  }
};

// @route  GET /api/complaints/:id
// @access Private
const getComplaintById = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('department', 'name code icon color phone email')
      .populate('user', 'name email phone');

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    // Only owner, admin, or department officer can view
    const isOwner = complaint.user._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    const isDeptOfficer =
      req.user.role === 'department_officer' &&
      complaint.department?._id.toString() === req.user.department?.toString();

    if (!isOwner && !isAdmin && !isDeptOfficer) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, complaint });
  } catch (error) {
    next(error);
  }
};

// @route  PUT /api/complaints/:id/status
// @access Private (admin / department_officer)
const updateComplaintStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const complaint = await Complaint.findById(req.params.id).populate('user', '_id');

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    complaint.status = status;

    if (status === 'resolved') {
      complaint.resolvedAt = new Date();
      complaint.resolutionNote = note || 'Resolved by department.';
    }

    // Add timeline event
    complaint.timeline.push({
      status,
      note: note || `Status updated to ${status}`,
      updatedBy: req.user._id,
      updatedByName: req.user.name,
      timestamp: new Date(),
    });

    // Check SLA breach
    complaint.checkSlaBreach();
    await complaint.save();

    // Notify user via socket + DB
    await notifyStatusChange(complaint.user._id, complaint.trackingId, status, req.io);

    res.json({
      success: true,
      message: `Complaint status updated to "${status}".`,
      complaint,
    });
  } catch (error) {
    next(error);
  }
};

// @route  POST /api/complaints/suggest
// @access Public
const getAISuggestions = async (req, res, next) => {
  try {
    const { text } = req.body;
    const suggestions = getSuggestions(text);
    res.json({ success: true, suggestions });
  } catch (error) {
    next(error);
  }
};

// @route  POST /api/complaints/:id/rate
// @access Private (complaint owner)
const rateComplaint = async (req, res, next) => {
  try {
    const { score, comment } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) return res.status(404).json({ success: false, message: 'Not found.' });
    if (complaint.user.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Access denied.' });
    if (complaint.status !== 'resolved')
      return res.status(400).json({ success: false, message: 'Can only rate resolved complaints.' });

    complaint.rating = { score, comment };
    await complaint.save();

    res.json({ success: true, message: 'Rating submitted. Thank you!', complaint });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitComplaint,
  getMyComplaints,
  trackComplaint,
  getComplaintById,
  updateComplaintStatus,
  getAISuggestions,
  rateComplaint,
};
