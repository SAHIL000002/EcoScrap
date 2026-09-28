const SafetyGuide = require('../models/SafetyGuide');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Get all safety guides with optional language and category filters
 */
const getSafetyGuides = asyncHandler(async (req, res) => {
  const { language, category } = req.query;
  const query = { isActive: true };

  if (language) {
    query.language = language.toUpperCase();
  } else if (req.user && req.user.preferredLanguage) {
    query.language = req.user.preferredLanguage;
  }

  if (category) {
    query.category = category.toUpperCase();
  }

  let guides = await SafetyGuide.find(query).sort({ priority: 1, createdAt: -1 });

  // If none found for selected regional language, fallback to English
  if (guides.length === 0 && language && language.toUpperCase() !== 'EN') {
    const fallbackQuery = { isActive: true, language: 'EN' };
    if (category) fallbackQuery.category = category.toUpperCase();
    guides = await SafetyGuide.find(fallbackQuery).sort({ priority: 1, createdAt: -1 });
  }

  return ApiResponse.success(res, 'Safety guides retrieved', guides);
});

/**
 * Get safety guides by category
 */
const getSafetyGuidesByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;
  const { language } = req.query;

  const query = {
    category: category.toUpperCase(),
    isActive: true
  };

  if (language) {
    query.language = language.toUpperCase();
  } else if (req.user && req.user.preferredLanguage) {
    query.language = req.user.preferredLanguage;
  }

  let guides = await SafetyGuide.find(query).sort({ priority: 1 });

  if (guides.length === 0 && language && language.toUpperCase() !== 'EN') {
    guides = await SafetyGuide.find({
      category: category.toUpperCase(),
      language: 'EN',
      isActive: true
    }).sort({ priority: 1 });
  }

  return ApiResponse.success(res, `Safety guides for category ${category}`, guides);
});

/**
 * Admin create safety guide
 */
const createSafetyGuide = asyncHandler(async (req, res) => {
  const guide = new SafetyGuide(req.body);
  await guide.save();
  return ApiResponse.success(res, 'Safety guide created successfully', guide, 201);
});

module.exports = {
  getSafetyGuides,
  getSafetyGuidesByCategory,
  createSafetyGuide
};
