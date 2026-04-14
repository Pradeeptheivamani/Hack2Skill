/**
 * socketHandler.js — Real-time Socket.IO event management
 * Manages user rooms, admin broadcasts, and department updates
 */

const initSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // ── User joins their personal room for targeted notifications
    socket.on('join_user_room', (userId) => {
      socket.join(`user_${userId}`);
      console.log(`👤 User ${userId} joined room: user_${userId}`);
    });

    // ── Admin joins admin broadcast room
    socket.on('join_admin_room', () => {
      socket.join('admin_room');
      console.log(`🛡️ Admin joined admin_room`);
    });

    // ── Department officer joins their department room
    socket.on('join_department_room', (departmentId) => {
      socket.join(`dept_${departmentId}`);
      console.log(`🏢 Officer joined dept_${departmentId}`);
    });

    // ── Complaint submission acknowledgement
    socket.on('complaint_submitted', (data) => {
      // Broadcast to admin room for real-time admin dashboard updates
      socket.to('admin_room').emit('new_complaint', {
        ...data,
        timestamp: new Date(),
      });
    });

    // ── Department room notification for new assignment
    socket.on('assignment_update', ({ departmentId, complaint }) => {
      socket.to(`dept_${departmentId}`).emit('new_assignment', {
        complaint,
        timestamp: new Date(),
      });
    });

    // ── Ping/pong for connection health check
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date() });
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  // Helper: emit new complaint to admin dashboard
  io.emitNewComplaint = (complaintData) => {
    io.to('admin_room').emit('new_complaint', { ...complaintData, timestamp: new Date() });
  };

  // Helper: emit status update to department
  io.emitStatusUpdate = (departmentId, data) => {
    io.to(`dept_${departmentId}`).emit('status_update', { ...data, timestamp: new Date() });
  };
};

module.exports = { initSocket };
