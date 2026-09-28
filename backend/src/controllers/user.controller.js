const User = require('../models/User');
const TransactionService = require('../services/transaction.service');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Get current user profile
 */
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-passwordHash');
  return ApiResponse.success(res, 'User profile retrieved', user);
});

/**
 * Update current user profile
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { name, preferredLanguage, location, operatingLocation } = req.body;
  const updates = {};

  if (name) updates.name = name;
  if (preferredLanguage) updates.preferredLanguage = preferredLanguage;
  if (operatingLocation) updates.operatingLocation = operatingLocation;
  if (location) {
    updates.location = {
      city: location.city || req.user.location?.city || '',
      state: location.state || req.user.location?.state || '',
      latitude: location.latitude != null ? location.latitude : req.user.location?.latitude,
      longitude: location.longitude != null ? location.longitude : req.user.location?.longitude
    };
  }

  const updatedUser = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true }).select(
    '-passwordHash'
  );

  return ApiResponse.success(res, 'Profile updated successfully', updatedUser);
});

/**
 * Get collector earnings ledger (Section 22)
 * Rule 1: Collector can only access their own earnings
 */
const getEarnings = asyncHandler(async (req, res) => {
  const earnings = await TransactionService.getEarnings(req.user._id);
  return ApiResponse.success(res, 'Earnings ledger retrieved', earnings);
});

module.exports = {
  getProfile,
  updateProfile,
  getEarnings
};
