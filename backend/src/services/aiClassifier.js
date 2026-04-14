/**
 * aiClassifier.js — NLP-based Grievance Classification Service
 * Uses keyword matching with weighted scoring to classify complaints
 * into government departments. Production-quality simulated NLP.
 */

// ────────────────────────────────────────────────────────────────
// Keyword → Category mapping with weighted keywords
// Higher weight = stronger signal for that category
// ────────────────────────────────────────────────────────────────
const CATEGORY_KEYWORDS = {
  road: {
    keywords: [
      { word: 'pothole', weight: 10 },
      { word: 'road', weight: 8 },
      { word: 'highway', weight: 8 },
      { word: 'street', weight: 6 },
      { word: 'footpath', weight: 7 },
      { word: 'pavement', weight: 7 },
      { word: 'bridge', weight: 9 },
      { word: 'traffic', weight: 6 },
      { word: 'signal', weight: 5 },
      { word: 'divider', weight: 7 },
      { word: 'crater', weight: 9 },
      { word: 'damaged road', weight: 10 },
      { word: 'சாலை', weight: 10 }, // Tamil: road
      { word: 'குழி', weight: 10 }, // Tamil: pothole
    ],
    department: 'ROAD',
    label: 'road',
  },
  water: {
    keywords: [
      { word: 'water', weight: 8 },
      { word: 'drinking water', weight: 10 },
      { word: 'pipeline', weight: 9 },
      { word: 'drainage', weight: 9 },
      { word: 'sewage', weight: 10 },
      { word: 'flood', weight: 9 },
      { word: 'leakage', weight: 8 },
      { word: 'tap', weight: 7 },
      { word: 'supply', weight: 5 },
      { word: 'contaminated', weight: 10 },
      { word: 'நீர்', weight: 10 }, // Tamil: water
      { word: 'வடிகால்', weight: 10 }, // Tamil: drainage
    ],
    department: 'WATER',
    label: 'water',
  },
  electricity: {
    keywords: [
      { word: 'electricity', weight: 10 },
      { word: 'power', weight: 7 },
      { word: 'outage', weight: 10 },
      { word: 'blackout', weight: 10 },
      { word: 'transformer', weight: 10 },
      { word: 'voltage', weight: 9 },
      { word: 'electric', weight: 8 },
      { word: 'wire', weight: 7 },
      { word: 'light', weight: 5 },
      { word: 'street light', weight: 8 },
      { word: 'மின்சாரம்', weight: 10 }, // Tamil: electricity
      { word: 'மின் தடை', weight: 10 }, // Tamil: power cut
    ],
    department: 'ELECT',
    label: 'electricity',
  },
  health: {
    keywords: [
      { word: 'hospital', weight: 9 },
      { word: 'health', weight: 8 },
      { word: 'doctor', weight: 8 },
      { word: 'medicine', weight: 9 },
      { word: 'disease', weight: 10 },
      { word: 'dengue', weight: 10 },
      { word: 'mosquito', weight: 8 },
      { word: 'malaria', weight: 10 },
      { word: 'ambulance', weight: 9 },
      { word: 'medical', weight: 8 },
      { word: 'sanitation', weight: 7 },
      { word: 'waste', weight: 5 },
      { word: 'சுகாதாரம்', weight: 10 }, // Tamil: health
    ],
    department: 'HLTH',
    label: 'health',
  },
  education: {
    keywords: [
      { word: 'school', weight: 9 },
      { word: 'college', weight: 9 },
      { word: 'teacher', weight: 8 },
      { word: 'education', weight: 10 },
      { word: 'scholarship', weight: 10 },
      { word: 'midday meal', weight: 10 },
      { word: 'student', weight: 7 },
      { word: 'tuition', weight: 6 },
      { word: 'textbook', weight: 8 },
      { word: 'கல்வி', weight: 10 }, // Tamil: education
      { word: 'பள்ளி', weight: 10 }, // Tamil: school
    ],
    department: 'EDUC',
    label: 'education',
  },
  police: {
    keywords: [
      { word: 'police', weight: 10 },
      { word: 'crime', weight: 10 },
      { word: 'theft', weight: 10 },
      { word: 'robbery', weight: 10 },
      { word: 'harassment', weight: 9 },
      { word: 'assault', weight: 10 },
      { word: 'safety', weight: 7 },
      { word: 'noise', weight: 6 },
      { word: 'violence', weight: 10 },
      { word: 'illegal', weight: 8 },
      { word: 'காவல்', weight: 10 }, // Tamil: police
    ],
    department: 'PLCE',
    label: 'police',
  },
  municipal: {
    keywords: [
      { word: 'garbage', weight: 10 },
      { word: 'trash', weight: 9 },
      { word: 'waste', weight: 8 },
      { word: 'dumping', weight: 10 },
      { word: 'park', weight: 7 },
      { word: 'tree', weight: 7 },
      { word: 'stray', weight: 8 },
      { word: 'animal', weight: 6 },
      { word: 'municipal', weight: 9 },
      { word: 'corporation', weight: 8 },
      { word: 'கழிவு', weight: 10 }, // Tamil: waste/garbage
    ],
    department: 'MUNC',
    label: 'municipal',
  },
  revenue: {
    keywords: [
      { word: 'land', weight: 9 },
      { word: 'property', weight: 8 },
      { word: 'encroachment', weight: 10 },
      { word: 'patta', weight: 10 },
      { word: 'chitta', weight: 10 },
      { word: 'survey', weight: 8 },
      { word: 'revenue', weight: 9 },
      { word: 'document', weight: 6 },
      { word: 'certificate', weight: 6 },
      { word: 'நிலம்', weight: 10 }, // Tamil: land
    ],
    department: 'RVNU',
    label: 'revenue',
  },
};

/**
 * Classify a complaint based on title + description
 * @param {string} title - Complaint title
 * @param {string} description - Complaint description
 * @returns {{ category, department, confidence, keywords, suggestions }}
 */
const classifyComplaint = (title, description) => {
  const text = `${title} ${description}`.toLowerCase();
  const scores = {};
  const matchedKeywords = {};

  // Score each category
  for (const [catKey, catData] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    const matched = [];

    for (const { word, weight } of catData.keywords) {
      const regex = new RegExp(word.toLowerCase(), 'gi');
      const matches = (text.match(regex) || []).length;
      if (matches > 0) {
        score += matches * weight;
        matched.push(word);
      }
    }

    scores[catKey] = score;
    matchedKeywords[catKey] = matched;
  }

  // Find the best matching category
  const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);
  const [bestCategory, bestScore] = sorted[0];
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);

  // Calculate confidence percentage
  const confidence = totalScore > 0
    ? Math.min(95, Math.round((bestScore / totalScore) * 100 * 1.5))
    : 0;

  // If score is too low, classify as 'other'
  if (bestScore < 5) {
    return {
      category: 'other',
      department: null,
      confidence: 0,
      keywords: [],
      suggestions: [],
    };
  }

  const catData = CATEGORY_KEYWORDS[bestCategory];

  // Suggest related categories (score > 10% of best)
  const suggestions = sorted
    .filter(([cat, score]) => cat !== bestCategory && score > bestScore * 0.1)
    .slice(0, 2)
    .map(([cat]) => cat);

  return {
    category: catData.label,
    departmentCode: catData.department,
    confidence,
    keywords: matchedKeywords[bestCategory],
    suggestions,
  };
};

/**
 * Get real-time category suggestion (for frontend live suggestions)
 * @param {string} text - Partial complaint text
 * @returns {Array} - Top 3 category suggestions
 */
const getSuggestions = (text) => {
  if (!text || text.length < 5) return [];
  const result = classifyComplaint(text, '');
  return result.category !== 'other'
    ? [result.category, ...result.suggestions]
    : [];
};

module.exports = { classifyComplaint, getSuggestions };
