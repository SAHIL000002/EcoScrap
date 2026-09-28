const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { ROLES } = require('../utils/constants');

router.use(authenticate);

// Profile
router.get('/profile', userController.getProfile);
router.patch('/profile', userController.updateProfile);

// Section 22: GET /api/v1/users/me/earnings
router.get('/me/earnings', authorize(ROLES.COLLECTOR, ROLES.ADMIN), userController.getEarnings);

module.exports = router;
