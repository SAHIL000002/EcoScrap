const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transaction.controller');
const { updateQuoteStatusValidator } = require('../validators/transaction.validator');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

// PATCH /api/v1/quotes/:quoteId
router.patch('/:quoteId', updateQuoteStatusValidator, transactionController.respondToQuote);

module.exports = router;
