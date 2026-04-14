/**
 * seedAdmin.js — One-time admin user seeding script
 * Run: node seedAdmin.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

const seedAdmin = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB...');

  const existing = await User.findOne({ email: 'admin@grievance.gov.in' });
  if (existing) {
    console.log('✅ Admin user already exists. Email: admin@grievance.gov.in / Password: admin123');
    process.exit(0);
  }

  await User.create({
    name: 'System Administrator',
    email: 'admin@grievance.gov.in',
    phone: '9000000000',
    password: 'admin123',
    role: 'admin',
  });

  console.log('✅ Admin user created!');
  console.log('   Email: admin@grievance.gov.in');
  console.log('   Password: admin123');
  process.exit(0);
};

seedAdmin().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
