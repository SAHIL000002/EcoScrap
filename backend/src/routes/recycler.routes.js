const express = require('express');
const router = express.Router();
const recyclerController = require('../controllers/recycler.controller');
const { updateProfileValidator, nearbyRecyclerValidator } = require('../validators/recycler.validator');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { ROLES } = require('../utils/constants');

// Recycler list & nearby search (Section 18 & 26)
router.get('/', recyclerController.getRecyclers);
router.get('/nearby', nearbyRecyclerValidator, recyclerController.getNearbyRecyclers);

// Recycler profile management (Recycler role)
router.patch(
  '/profile',
  authenticate,
  authorize(ROLES.RECYCLER, ROLES.ADMIN),
  updateProfileValidator,
  recyclerController.updateProfile
);

// Admin verify recycler status
router.patch(
  '/:recyclerId/verify',
  authenticate,
  authorize(ROLES.ADMIN),
  recyclerController.verifyRecycler
);

router.get('/:recyclerId', recyclerController.getRecyclerById);

module.exports = router;
