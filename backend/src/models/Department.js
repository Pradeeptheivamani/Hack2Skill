/**
 * Department.js — Mongoose schema for government departments
 * Includes auto-seeding of default Tamil Nadu departments
 */

const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Department name is required'],
      unique: true,
      trim: true,
    },
    nameInTamil: {
      type: String,
      default: '',
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    description: {
      type: String,
      default: '',
    },
    head: {
      type: String,
      default: 'Not Assigned',
    },
    email: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      default: '',
    },
    // Categories that auto-route to this department
    assignedCategories: [
      {
        type: String,
      },
    ],
    // SLA (Service Level Agreement) in hours by priority
    slaConfig: {
      high: { type: Number, default: 24 },
      medium: { type: Number, default: 72 },
      low: { type: Number, default: 168 },
    },
    // Performance metrics
    stats: {
      totalAssigned: { type: Number, default: 0 },
      totalResolved: { type: Number, default: 0 },
      totalPending: { type: Number, default: 0 },
      avgResolutionHours: { type: Number, default: 0 },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    icon: {
      type: String,
      default: '🏛️',
    },
    color: {
      type: String,
      default: '#1e3a5f',
    },
  },
  {
    timestamps: true,
  }
);

const Department = mongoose.model('Department', departmentSchema);

// Seed default departments for Tamil Nadu government
const seedDepartments = async () => {
  const count = await Department.countDocuments();
  if (count > 0) return;

  const departments = [
    {
      name: 'Roads & Infrastructure',
      nameInTamil: 'சாலைகள் & உள்கட்டமைப்பு',
      code: 'ROAD',
      description: 'Handles road repairs, potholes, bridges, and infrastructure complaints',
      assignedCategories: ['road', 'pothole', 'bridge', 'footpath', 'traffic', 'street light'],
      icon: '🛣️',
      color: '#e67e22',
      slaConfig: { high: 24, medium: 48, low: 120 },
    },
    {
      name: 'Water Supply & Sanitation',
      nameInTamil: 'நீர் வழங்கல் & சுகாதாரம்',
      code: 'WATER',
      description: 'Handles water supply, drainage, sewage, and sanitation complaints',
      assignedCategories: ['water', 'drainage', 'sewage', 'sanitation', 'pipeline', 'flood'],
      icon: '💧',
      color: '#2980b9',
      slaConfig: { high: 12, medium: 48, low: 96 },
    },
    {
      name: 'Electricity & Power',
      nameInTamil: 'மின்சாரம் & சக்தி',
      code: 'ELECT',
      description: 'Handles power outages, transformer issues, and electrical complaints',
      assignedCategories: ['electricity', 'power', 'transformer', 'electrical', 'outage', 'voltage'],
      icon: '⚡',
      color: '#f39c12',
      slaConfig: { high: 6, medium: 24, low: 72 },
    },
    {
      name: 'Health & Medical Services',
      nameInTamil: 'சுகாதாரம் & மருத்துவ சேவைகள்',
      code: 'HLTH',
      description: 'Handles public health, hospital, sanitation, and medical service complaints',
      assignedCategories: ['health', 'hospital', 'medical', 'disease', 'garbage', 'waste'],
      icon: '🏥',
      color: '#27ae60',
      slaConfig: { high: 6, medium: 24, low: 72 },
    },
    {
      name: 'Revenue & Land Records',
      nameInTamil: 'வருவாய் & நில பதிவுகள்',
      code: 'RVNU',
      description: 'Handles land records, property disputes, and revenue-related issues',
      assignedCategories: ['land', 'property', 'revenue', 'encroachment', 'patta', 'chitta'],
      icon: '📋',
      color: '#8e44ad',
      slaConfig: { high: 48, medium: 120, low: 240 },
    },
    {
      name: 'Education Department',
      nameInTamil: 'கல்வித் துறை',
      code: 'EDUC',
      description: 'Handles schools, colleges, scholarships, and education-related complaints',
      assignedCategories: ['school', 'education', 'teacher', 'scholarship', 'college', 'midday meal'],
      icon: '📚',
      color: '#16a085',
      slaConfig: { high: 48, medium: 96, low: 168 },
    },
    {
      name: 'Police & Law Enforcement',
      nameInTamil: 'காவல்துறை & சட்ட அமலாக்கம்',
      code: 'PLCE',
      description: 'Handles law enforcement, crime, safety, and public order complaints',
      assignedCategories: ['police', 'crime', 'theft', 'harassment', 'safety', 'noise'],
      icon: '👮',
      color: '#2c3e50',
      slaConfig: { high: 1, medium: 12, low: 48 },
    },
    {
      name: 'Municipal Corporation',
      nameInTamil: 'நகர மன்றம்',
      code: 'MUNC',
      description: 'Handles civic amenities, solid waste, parks, and municipal services',
      assignedCategories: ['garbage', 'municipal', 'park', 'tree', 'building', 'licence'],
      icon: '🏙️',
      color: '#1abc9c',
      slaConfig: { high: 24, medium: 72, low: 120 },
    },
  ];

  await Department.insertMany(departments);
  console.log('✅ Default departments seeded successfully');
};

module.exports = Department;
module.exports.seedDepartments = seedDepartments;
