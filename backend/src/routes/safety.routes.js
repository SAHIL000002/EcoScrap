const express = require('express');
const router = express.Router();
const safetyController = require('../controllers/safety.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { ROLES } = require('../utils/constants');

// Safety guides are publicly accessible or accessible with language preferences
router.get('/', safetyController.getSafetyGuides);
router.get('/:category', safetyController.getSafetyGuidesByCategory);

// Admin can create safety records
router.post('/', authenticate, authorize(ROLES.ADMIN), safetyController.createSafetyGuide);

module.exports = router;
