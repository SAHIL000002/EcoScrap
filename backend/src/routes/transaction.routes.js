const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transaction.controller');
const {
  updateTransactionStatusValidator,
  updatePaymentValidator,
  handoverValidator,
  updateQuoteStatusValidator
} = require('../validators/transaction.validator');
const { authenticate } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

router.use(authenticate);

// Transactions listing and lookup (Section 20)
router.get('/my', transactionController.getMyTransactions);
router.get('/:transactionId', transactionController.getTransactionById);
router.post('/from-quote', transactionController.createFromQuote);
router.patch('/:transactionId/status', updateTransactionStatusValidator, transactionController.updateTransactionStatus);
router.patch('/:transactionId/payment', updatePaymentValidator, transactionController.updatePayment);

// Handover endpoint (Section 21)
router.post(
  '/:transactionId/handover',
  upload.array('photos', 5),
  handoverValidator,
  transactionController.completeHandover
);

module.exports = router;
