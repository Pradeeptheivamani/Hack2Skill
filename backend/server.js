/**
 * server.js — Main entry point for the Grievance Redressal Backend
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Load environment variables
dotenv.config();

// Database connection
const connectDB = require('./src/config/db');

// Route imports
const authRoutes = require('./src/routes/authRoutes');
const complaintRoutes = require('./src/routes/complaintRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const departmentRoutes = require('./src/routes/departmentRoutes');

// Error handler middleware
const errorHandler = require('./src/middleware/errorHandler');

// Socket handler
const { initSocket } = require('./src/socket/socketHandler');

// Initialize Express app
const app = express();
const httpServer = http.createServer(app);

// ✅ CORS configuration (Production ready)
const allowedOrigin = process.env.FRONTEND_URL || "*";

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Make io accessible in routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Connect to MongoDB
connectDB();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

// Global middleware
app.use(cors({
  origin: allowedOrigin,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));
app.use('/api', limiter);

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ ROOT ROUTE (Fix for Bad Gateway)
app.get('/', (req, res) => {
  res.send('🚀 Grievance Backend is running successfully');
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/departments', departmentRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Grievance Redressal API is running',
    timestamp: new Date(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

// Initialize Socket.IO
initSocket(io);

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.IO enabled`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 API Base: /api\n`);
});

module.exports = { app, io };