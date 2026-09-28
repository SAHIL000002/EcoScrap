const { body, query } = require('express-validator');
const validate = require('./validate');
const { MATERIAL_CATEGORIES, AUTHORIZATION_STATUS } = require('../utils/constants');

const updateProfileValidator = [
  body('facilityName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Facility name cannot be empty'),
  body('city')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('City cannot be empty'),
  body('state')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('State cannot be empty'),
  body('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('materialsAccepted')
    .optional()
    .isArray()
    .withMessage('Materials accepted must be an array'),
  body('pickupAvailable')
    .optional()
    .isBoolean()
    .withMessage('pickupAvailable must be boolean'),
  body('authorizationStatus')
    .optional()
    .isIn(Object.values(AUTHORIZATION_STATUS))
    .withMessage('Invalid authorization status'),
  validate
];

const nearbyRecyclerValidator = [
  query('lat')
    .notEmpty()
    .withMessage('lat query parameter is required')
    .isFloat({ min: -90, max: 90 })
    .withMessage('lat must be between -90 and 90'),
  query('lng')
    .notEmpty()
    .withMessage('lng query parameter is required')
    .isFloat({ min: -180, max: 180 })
    .withMessage('lng must be between -180 and 180'),
  query('radius')
    .optional()
    .isFloat({ min: 0.1, max: 500 })
    .withMessage('radius must be between 0.1 and 500 km'),
  query('category')
    .optional()
    .isIn(Object.values(MATERIAL_CATEGORIES))
    .withMessage('Invalid material category filter'),
  validate
];

module.exports = {
  updateProfileValidator,
  nearbyRecyclerValidator
};
