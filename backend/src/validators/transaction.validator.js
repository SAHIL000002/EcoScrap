const { body, param } = require('express-validator');
const validate = require('./validate');
const { TRANSACTION_STATUS, PAYMENT_METHODS, PAYMENT_STATUS } = require('../utils/constants');

const submitQuoteValidator = [
  param('lotId')
    .notEmpty()
    .withMessage('Lot ID is required'),
  body('quotedPrice')
    .notEmpty()
    .withMessage('Quoted price is required')
    .isFloat({ min: 0.01 })
    .withMessage('Quoted price must be greater than zero'),
  body('pickupAvailable')
    .optional()
    .isBoolean()
    .withMessage('pickupAvailable must be boolean'),
  body('message')
    .optional()
    .trim(),
  body('validDays')
    .optional()
    .isInt({ min: 1, max: 60 })
    .withMessage('Valid days must be between 1 and 60'),
  validate
];

const updateQuoteStatusValidator = [
  param('quoteId')
    .notEmpty()
    .withMessage('Quote ID is required'),
  body('action')
    .notEmpty()
    .withMessage('Action is required (ACCEPT or REJECT)')
    .isIn(['ACCEPT', 'REJECT'])
    .withMessage('Action must be ACCEPT or REJECT'),
  validate
];

const updateTransactionStatusValidator = [
  param('transactionId')
    .notEmpty()
    .withMessage('Transaction ID is required'),
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(Object.values(TRANSACTION_STATUS))
    .withMessage(`Status must be one of: ${Object.values(TRANSACTION_STATUS).join(', ')}`),
  validate
];

const updatePaymentValidator = [
  param('transactionId')
    .notEmpty()
    .withMessage('Transaction ID is required'),
  body('paymentStatus')
    .notEmpty()
    .withMessage('Payment status is required')
    .isIn(Object.values(PAYMENT_STATUS))
    .withMessage(`Payment status must be one of: ${Object.values(PAYMENT_STATUS).join(', ')}`),
  body('paymentMethod')
    .optional()
    .isIn(Object.values(PAYMENT_METHODS))
    .withMessage(`Payment method must be one of: ${Object.values(PAYMENT_METHODS).join(', ')}`),
  body('finalPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Final price cannot be negative'),
  validate
];

const handoverValidator = [
  param('transactionId')
    .notEmpty()
    .withMessage('Transaction ID is required'),
  body('finalWeight')
    .notEmpty()
    .withMessage('Final weight is required')
    .isFloat({ min: 0.01 })
    .withMessage('Final weight must be greater than zero'),
  body('finalPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Final price cannot be negative'),
  body('paymentMethod')
    .optional()
    .isIn(Object.values(PAYMENT_METHODS)),
  body('paymentStatus')
    .optional()
    .isIn(Object.values(PAYMENT_STATUS)),
  body('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 }),
  body('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 }),
  body('handoverAddress')
    .optional()
    .trim(),
  body('notes')
    .optional()
    .trim(),
  validate
];

module.exports = {
  submitQuoteValidator,
  updateQuoteStatusValidator,
  updateTransactionStatusValidator,
  updatePaymentValidator,
  handoverValidator
};
