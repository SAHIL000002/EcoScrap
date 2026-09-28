const express = require('express');
const router = express.Router();
const materialLotController = require('../controllers/materialLot.controller');
const transactionController = require('../controllers/transaction.controller');
const { createLotValidator, updateLotValidator } = require('../validators/materialLot.validator');
const { submitQuoteValidator } = require('../validators/transaction.validator');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const upload = require('../middleware/upload.middleware');
const { ROLES } = require('../utils/constants');

router.use(authenticate);

// Open lots for recyclers to browse
router.get('/open', authorize(ROLES.RECYCLER, ROLES.ADMIN), materialLotController.getOpenLots);

// Collector lot endpoints
router.post(
  '/',
  authorize(ROLES.COLLECTOR, ROLES.ADMIN),
  upload.array('images', 5),
  createLotValidator,
  materialLotController.createLot
);

router.get('/my', authorize(ROLES.COLLECTOR, ROLES.ADMIN), materialLotController.getMyLots);

router.get('/:lotId', materialLotController.getLotById);
router.patch('/:lotId', updateLotValidator, materialLotController.updateLot);
router.delete('/:lotId', materialLotController.deleteLot);

// Quote endpoints mounted under /lots as per prompt Section 19:
// POST /api/v1/lots/:lotId/quote
router.post(
  '/:lotId/quote',
  authorize(ROLES.RECYCLER, ROLES.ADMIN),
  submitQuoteValidator,
  transactionController.submitQuote
);

// GET /api/v1/lots/:lotId/quotes
router.get('/:lotId/quotes', transactionController.getQuotesForLot);

module.exports = router;
