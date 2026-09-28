const Recycler = require('../models/Recycler');
const RecyclerService = require('../services/recycler.service');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { AUTHORIZATION_STATUS, ROLES } = require('../utils/constants');

/**
 * Get all recyclers (for collectors, only verified recyclers)
 */
const getRecyclers = asyncHandler(async (req, res) => {
  const query = {};
  // Rule 3: Only VERIFIED recyclers can appear in collector queries
  if (req.user?.role !== ROLES.ADMIN) {
    query.authorizationStatus = AUTHORIZATION_STATUS.VERIFIED;
  }

  const { city, state, category } = req.query;
  if (city) query.city = new RegExp(city, 'i');
  if (state) query.state = new RegExp(state, 'i');
  if (category) query.materialsAccepted = category;

  const recyclers = await Recycler.find(query)
    .populate('userId', 'name phone email preferredLanguage')
    .sort({ createdAt: -1 });

  return ApiResponse.success(res, 'Recyclers retrieved successfully', recyclers);
});

/**
 * Get nearby recyclers with distance and matching score (Section 10 & 26)
 */
const getNearbyRecyclers = asyncHandler(async (req, res) => {
  const { lat, lng, radius, category } = req.query;

  const recyclers = await RecyclerService.getNearbyRecyclers({
    lat,
    lng,
    radiusKm: radius || 50,
    category
  });

  return ApiResponse.success(res, 'Nearby matching recyclers found', recyclers);
});

/**
 * Get recycler by ID or recyclerId
 */
const getRecyclerById = asyncHandler(async (req, res) => {
  const { recyclerId } = req.params;
  const recycler = await RecyclerService.getRecyclerById(recyclerId);

  if (!recycler) {
    return ApiResponse.error(res, 'Recycler not found', [], 404);
  }

  return ApiResponse.success(res, 'Recycler details retrieved', recycler);
});

/**
 * Update recycler profile
 * Rule 2: Recycler can only access/modify their own profile
 */
const updateProfile = asyncHandler(async (req, res) => {
  const updated = await RecyclerService.updateProfile(req.user._id, req.body);
  return ApiResponse.success(res, 'Recycler profile updated successfully', updated);
});

/**
 * Admin verify recycler
 */
const verifyRecycler = asyncHandler(async (req, res) => {
  const { recyclerId } = req.params;
  const { authorizationStatus } = req.body;

  const recycler = await Recycler.findOne({
    $or: [{ _id: /^[0-9a-fA-F]{24}$/.test(recyclerId) ? recyclerId : null }, { recyclerId }]
  });

  if (!recycler) {
    return ApiResponse.error(res, 'Recycler not found', [], 404);
  }

  recycler.authorizationStatus = authorizationStatus || AUTHORIZATION_STATUS.VERIFIED;
  recycler.isVerified = recycler.authorizationStatus === AUTHORIZATION_STATUS.VERIFIED;
  await recycler.save();

  return ApiResponse.success(res, `Recycler status updated to ${recycler.authorizationStatus}`, recycler);
});

module.exports = {
  getRecyclers,
  getNearbyRecyclers,
  getRecyclerById,
  updateProfile,
  verifyRecycler
};
