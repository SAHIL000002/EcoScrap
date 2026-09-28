const express = require('express');
const router = express.Router();
const priceController = require('../controllers/price.controller');
const { createPriceValidator, priceQueryValidator } = require('../validators/price.validator');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { ROLES } = require('../utils/constants');

// Public or authenticated price lookups
router.get('/', priceQueryValidator, priceController.getPrices);
router.get('/current', priceController.getCurrentPrices);
router.get('/history', priceController.getPriceHistory);
router.get('/:materialCategory', priceController.getPriceByCategory);

// Admin manage prices
router.post(
  '/',
  authenticate,
  authorize(ROLES.ADMIN),
  createPriceValidator,
  priceController.createPrice
);

module.exports = router;
