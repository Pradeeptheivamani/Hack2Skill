/**
 * notificationService.js — In-app notification management
 * Pushes notifications to users after complaint status changes
 */

const User = require('../models/User');

/**
 * Add a notification to a specific user
 */
const notifyUser = async (userId, message, type = 'info') => {
  try {
    await User.findByIdAndUpdate(userId, {
      $push: {
        notifications: {
          $each: [{ message, type, read: false, createdAt: new Date() }],
          $position: 0,
          $slice: 50, // Keep max 50 notifications
        },
      },
    });
  } catch (error) {
    console.error(`Notification error for user ${userId}:`, error.message);
  }
};

/**
 * Status-change message templates
 */
const STATUS_MESSAGES = {
  under_review: (trackingId) =>
    `Your complaint ${trackingId} is now under review by the concerned department.`,
  in_progress: (trackingId) =>
    `Your complaint ${trackingId} is being actively worked on. Expected resolution soon.`,
  resolved: (trackingId) =>
    `Great news! Your complaint ${trackingId} has been resolved. Please rate our service.`,
  rejected: (trackingId) =>
    `Your complaint ${trackingId} has been rejected. Contact support for more information.`,
  escalated: (trackingId) =>
    `Your complaint ${trackingId} has been escalated to higher authorities for faster resolution.`,
};

/**
 * Send status update notification
 */
const notifyStatusChange = async (userId, trackingId, newStatus, io) => {
  const message =
    STATUS_MESSAGES[newStatus]?.(trackingId) ||
    `Your complaint ${trackingId} status updated to: ${newStatus}`;

  const type =
    newStatus === 'resolved' ? 'success'
      : newStatus === 'rejected' ? 'error'
        : newStatus === 'escalated' ? 'warning'
          : 'info';

  // Save to database
  await notifyUser(userId, message, type);

  // Emit real-time via socket if io is available
  if (io) {
    io.to(`user_${userId}`).emit('notification', {
      message,
      type,
      trackingId,
      status: newStatus,
      timestamp: new Date(),
    });
    io.to(`user_${userId}`).emit('status_update', {
      trackingId,
      newStatus,
      timestamp: new Date(),
    });
  }
};

/**
 * Mark all notifications as read for a user
 */
const markAllRead = async (userId) => {
  await User.updateOne(
    { _id: userId },
    { $set: { 'notifications.$[].read': true } }
  );
};

module.exports = { notifyUser, notifyStatusChange, markAllRead };
