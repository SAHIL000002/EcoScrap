const { body } = require('express-validator');
const validate = require('./validate');
const { ROLES, LANGUAGES } = require('../utils/constants');

const registerValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^\+?[0-9]{10,14}$/)
    .withMessage('Phone must be a valid 10-14 digit number'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('email')
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('role')
    .optional()
    .isIn(Object.values(ROLES))
    .withMessage(`Role must be one of: ${Object.values(ROLES).join(', ')}`),
  body('preferredLanguage')
    .optional()
    .isIn(Object.values(LANGUAGES))
    .withMessage(`Language must be one of: ${Object.values(LANGUAGES).join(', ')}`),
  validate
];

const loginValidator = [
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  validate
];

module.exports = {
  registerValidator,
  loginValidator
};
