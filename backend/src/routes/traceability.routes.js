const express = require('express');
const router = express.Router();
const traceabilityController = require('../controllers/traceability.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Public certificate check
router.get('/verify/:reference', traceabilityController.verifyHandoverCertificate);

// Authenticated lot traceability lookup (Section 21)
router.get('/:lotId', authenticate, traceabilityController.getTraceabilityByLot);

module.exports = router;
