/**
 * authController.js — Authentication logic
 * Register, Login, Get profile, Update profile
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// @route  POST /api/auth/register
// @access Public
const register = async (req, res, next) => {
  try {
    const { name, email, phone, password, preferredLanguage } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    const user = await User.create({
      name,
      email,
      phone,
      password,
      preferredLanguage: preferredLanguage || 'en',
    });

    const token = generateToken(user._id);
    res.status(201).json({
      success: true,
      message: 'Registration successful!',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        preferredLanguage: user.preferredLanguage,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route  POST /api/auth/login
// @access Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email }).select('+password').populate('department', 'name code');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account deactivated. Contact admin.' });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);
    res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        department: user.department,
        preferredLanguage: user.preferredLanguage,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route  GET /api/auth/me
// @access Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('department', 'name code icon color');
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @route  PUT /api/auth/profile
// @access Private
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, preferredLanguage } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, preferredLanguage },
      { new: true, runValidators: true }
    );
    res.json({ success: true, message: 'Profile updated successfully.', user });
  } catch (error) {
    next(error);
  }
};

// @route  GET /api/auth/notifications
// @access Private
const getNotifications = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('notifications');
    res.json({ success: true, notifications: user.notifications });
  } catch (error) {
    next(error);
  }
};

// @route  PUT /api/auth/notifications/read
// @access Private
const markNotificationsRead = async (req, res, next) => {
  try {
    const { markAllRead } = require('../services/notificationService');
    await markAllRead(req.user._id);
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe, updateProfile, getNotifications, markNotificationsRead };
