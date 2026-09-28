const { body, param } = require('express-validator');
const validate = require('./validate');
const {
  MATERIAL_CATEGORIES,
  MATERIAL_CONDITIONS,
  SOURCE_TYPES,
  WEIGHT_UNITS,
  LOT_STATUS
} = require('../utils/constants');

const createLotValidator = [
  body('category')
    .notEmpty()
    .withMessage('Material category is required')
    .isIn(Object.values(MATERIAL_CATEGORIES))
    .withMessage(`Category must be one of: ${Object.values(MATERIAL_CATEGORIES).join(', ')}`),
  body('approxWeight')
    .notEmpty()
    .withMessage('Approximate weight is required')
    .isFloat({ min: 0.01 })
    .withMessage('Approximate weight must be a positive number greater than 0'),
  body('weightUnit')
    .optional()
    .isIn(Object.values(WEIGHT_UNITS))
    .withMessage(`Weight unit must be one of: ${Object.values(WEIGHT_UNITS).join(', ')}`),
  body('condition')
    .optional()
    .isIn(Object.values(MATERIAL_CONDITIONS))
    .withMessage(`Condition must be one of: ${Object.values(MATERIAL_CONDITIONS).join(', ')}`),
  body('sourceType')
    .optional()
    .isIn(Object.values(SOURCE_TYPES))
    .withMessage(`Source type must be one of: ${Object.values(SOURCE_TYPES).join(', ')}`),
  body('subCategory')
    .optional()
    .trim(),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('city')
    .optional()
    .trim(),
  body('state')
    .optional()
    .trim(),
  body('address')
    .optional()
    .trim(),
  body('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  validate
];

const updateLotValidator = [
  param('lotId')
    .notEmpty()
    .withMessage('Lot ID is required'),
  body('approxWeight')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Approximate weight must be positive'),
  body('condition')
    .optional()
    .isIn(Object.values(MATERIAL_CONDITIONS))
    .withMessage(`Condition must be one of: ${Object.values(MATERIAL_CONDITIONS).join(', ')}`),
  body('status')
    .optional()
    .isIn(Object.values(LOT_STATUS))
    .withMessage(`Status must be one of: ${Object.values(LOT_STATUS).join(', ')}`),
  validate
];

module.exports = {
  createLotValidator,
  updateLotValidator
};
