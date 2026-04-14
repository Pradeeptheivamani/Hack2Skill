/**
 * Complaint.js — Core complaint schema with full lifecycle tracking
 * Includes AI classification, priority, SLA, timeline, and geolocation
 */

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Timeline event sub-schema for status audit trail
const timelineEventSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
    },
    note: {
      type: String,
      default: '',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedByName: {
      type: String,
      default: 'System',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const complaintSchema = new mongoose.Schema(
  {
    // Unique tracking ID visible to the citizen
    trackingId: {
      type: String,
      unique: true,
      default: () => `GRV-${Date.now().toString().slice(-6)}-${uuidv4().slice(0, 4).toUpperCase()}`,
    },
    // Complainant reference
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Basic complaint info
    title: {
      type: String,
      required: [true, 'Complaint title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Complaint description is required'],
      trim: true,
      minlength: [20, 'Description must be at least 20 characters'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    // AI Classification
    category: {
      type: String,
      required: true,
      enum: [
        'road', 'water', 'electricity', 'health', 'education',
        'police', 'municipal', 'revenue', 'other',
      ],
      default: 'other',
    },
    aiConfidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    aiKeywords: [String],
    // Department assignment (auto-routed by AI)
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    // Priority (set by priority engine)
    priority: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium',
    },
    priorityScore: {
      type: Number,
      default: 0,
    },
    // Current status
    status: {
      type: String,
      enum: ['submitted', 'under_review', 'in_progress', 'resolved', 'rejected', 'escalated'],
      default: 'submitted',
    },
    // Location data
    location: {
      address: { type: String, default: '' },
      district: { type: String, default: '' },
      pincode: { type: String, default: '' },
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    // File attachments (images, PDFs)
    attachments: [
      {
        filename: String,
        originalName: String,
        mimetype: String,
        size: Number,
        url: String,
      },
    ],
    // Voice input transcript
    voiceTranscript: {
      type: String,
      default: null,
    },
    // SLA management
    slaDeadline: {
      type: Date,
      default: null,
    },
    slaBreached: {
      type: Boolean,
      default: false,
    },
    // Resolution details
    resolutionNote: {
      type: String,
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    // Audit timeline
    timeline: [timelineEventSchema],
    // Rating by citizen after resolution
    rating: {
      score: { type: Number, min: 1, max: 5, default: null },
      comment: { type: String, default: null },
    },
    // Language of submission
    language: {
      type: String,
      enum: ['en', 'ta'],
      default: 'en',
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
complaintSchema.index({ user: 1, status: 1 });
complaintSchema.index({ department: 1, status: 1 });
complaintSchema.index({ trackingId: 1 });
complaintSchema.index({ priority: 1, slaDeadline: 1 });
complaintSchema.index({ 'location.district': 1 });
complaintSchema.index({ createdAt: -1 });

// Virtual: days since submission
complaintSchema.virtual('daysSinceSubmission').get(function () {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Method to check and update SLA breach
complaintSchema.methods.checkSlaBreach = function () {
  if (this.slaDeadline && Date.now() > this.slaDeadline && this.status !== 'resolved') {
    this.slaBreached = true;
  }
  return this.slaBreached;
};

module.exports = mongoose.model('Complaint', complaintSchema);
