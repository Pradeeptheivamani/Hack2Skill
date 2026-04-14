/**
 * priorityEngine.js — Smart Priority Assignment Service
 * Calculates complaint priority based on category, keywords,
 * location type, description analysis, and SLA deadlines.
 */

// High-priority keywords that escalate any complaint
const CRITICAL_KEYWORDS = [
  'death', 'died', 'dead', 'accident', 'fire', 'explosion', 'emergency',
  'collapsed', 'flood', 'electrocution', 'suicide', 'violence', 'attack',
  'rape', 'murder', 'hospital', 'ambulance', 'danger', 'urgent',
  'மரணம்', 'விபத்து', 'அவசரம்', // Tamil critical keywords
];

const ESCALATION_KEYWORDS = [
  'children', 'school children', 'elderly', 'disabled', 'pregnant',
  'unsafe', 'hazard', 'contaminated', 'toxic', 'outbreak',
];

// Base priority per category
const CATEGORY_BASE_PRIORITY = {
  police: 'high',
  electricity: 'high',
  health: 'high',
  water: 'medium',
  road: 'medium',
  municipal: 'medium',
  education: 'low',
  revenue: 'low',
  other: 'low',
};

// SLA hours by priority
const SLA_HOURS = {
  high: 24,
  medium: 72,
  low: 168, // 7 days
};

/**
 * Calculate priority score (0–100) based on multiple factors
 */
const calculatePriorityScore = (category, title, description, location) => {
  const fullText = `${title} ${description}`.toLowerCase();
  let score = 0;

  // Base score per category
  const basePriority = CATEGORY_BASE_PRIORITY[category] || 'low';

  if (basePriority === 'high') score += 50;
  else if (basePriority === 'medium') score += 30;
  else score += 10;

  // Critical keyword bonus
  for (const kw of CRITICAL_KEYWORDS) {
    if (fullText.includes(kw.toLowerCase())) {
      score += 30;
      break; // Only add once
    }
  }

  // Escalation keyword bonus
  for (const kw of ESCALATION_KEYWORDS) {
    if (fullText.includes(kw.toLowerCase())) {
      score += 15;
      break;
    }
  }

  // Longer description = more details = slightly higher urgency
  if (description.length > 500) score += 5;

  // Location bonus (government areas, hospitals, schools)
  if (location) {
    const loc = `${location.address || ''} ${location.district || ''}`.toLowerCase();
    if (loc.includes('hospital') || loc.includes('school') || loc.includes('highway')) {
      score += 10;
    }
  }

  return Math.min(100, score);
};

/**
 * Assign a priority label from score
 */
const getPriorityFromScore = (score) => {
  if (score >= 60) return 'high';
  if (score >= 35) return 'medium';
  return 'low';
};

/**
 * Calculate SLA deadline from priority
 */
const calculateSLADeadline = (priority) => {
  const hours = SLA_HOURS[priority] || 168;
  const deadline = new Date();
  deadline.setHours(deadline.getHours() + hours);
  return deadline;
};

/**
 * Main method: assign priority + SLA to a complaint
 * @param {string} category - Classified category
 * @param {string} title - Complaint title
 * @param {string} description - Complaint description
 * @param {object} location - Location object
 * @returns {{ priority, priorityScore, slaDeadline, slaHours }}
 */
const assignPriority = (category, title, description, location) => {
  const priorityScore = calculatePriorityScore(category, title, description, location);
  const priority = getPriorityFromScore(priorityScore);
  const slaDeadline = calculateSLADeadline(priority);
  const slaHours = SLA_HOURS[priority];

  return {
    priority,
    priorityScore,
    slaDeadline,
    slaHours,
  };
};

module.exports = { assignPriority, SLA_HOURS, CATEGORY_BASE_PRIORITY };
