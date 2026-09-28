const { body, query } = require('express-validator');
const validate = require('./validate');
const { MATERIAL_CATEGORIES, WEIGHT_UNITS } = require('../utils/constants');

const createPriceValidator = [
  body('materialCategory')
    .notEmpty()
    .withMessage('Material category is required')
    .isIn(Object.values(MATERIAL_CATEGORIES))
    .withMessage(`Material category must be one of: ${Object.values(MATERIAL_CATEGORIES).join(', ')}`),
  body('buyingPrice')
    .notEmpty()
    .withMessage('Buying price is required')
    .isFloat({ min: 0 })
    .withMessage('Buying price cannot be negative'),
  body('sellingPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Selling price cannot be negative'),
  body('unit')
    .optional()
    .isIn(Object.values(WEIGHT_UNITS))
    .withMessage(`Unit must be one of: ${Object.values(WEIGHT_UNITS).join(', ')}`),
  body('city')
    .optional()
    .trim(),
  body('state')
    .optional()
    .trim(),
  body('source')
    .optional()
    .trim(),
  validate
];

const priceQueryValidator = [
  query('materialCategory')
    .optional()
    .isIn(Object.values(MATERIAL_CATEGORIES))
    .withMessage(`Invalid material category`),
  validate
];

module.exports = {
  createPriceValidator,
  priceQueryValidator
};
