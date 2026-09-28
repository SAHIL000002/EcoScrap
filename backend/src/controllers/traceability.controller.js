const TraceabilityService = require('../services/traceability.service');
const MaterialLot = require('../models/MaterialLot');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { ROLES } = require('../utils/constants');

/**
 * Get Traceability by Lot ID or handoverReference (Section 21)
 * Demonstrates: WHO, WHAT, HOW MUCH, WHEN, WHERE, TO WHOM, FOR HOW MUCH
 */
const getTraceabilityByLot = asyncHandler(async (req, res) => {
  const { lotId } = req.params;

  // Find lot first if lotId
  let targetLotId = lotId;
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(lotId);
  if (!isObjectId && lotId.startsWith('KC-')) {
    const lot = await MaterialLot.findOne({ lotId });
    if (lot) targetLotId = lot._id;
  }

  const record = await TraceabilityService.getByLotId(targetLotId);

  if (!record) {
    return ApiResponse.error(res, 'Traceability record not found for this lot', [], 404);
  }

  // Rule 1: Collector can only access own traceability
  if (req.user.role === ROLES.COLLECTOR && record.collectorId._id.toString() !== req.user._id.toString()) {
    return ApiResponse.error(res, 'Unauthorized to view this traceability record', [], 403);
  }

  // Rule 2: Recycler can only access their related traceability
  if (
    req.user.role === ROLES.RECYCLER &&
    record.recyclerId.userId &&
    record.recyclerId.userId.toString() !== req.user._id.toString()
  ) {
    return ApiResponse.error(res, 'Unauthorized to view this traceability record', [], 403);
  }

  return ApiResponse.success(res, 'Traceability record retrieved', record);
});

/**
 * Public or authorized verification of a handover certificate by reference
 */
const verifyHandoverCertificate = asyncHandler(async (req, res) => {
  const { reference } = req.params;
  const record = await TraceabilityService.getByHandoverReference(reference);

  if (!record) {
    return ApiResponse.error(res, 'Invalid handover reference code', [], 404);
  }

  return ApiResponse.success(res, 'Handover certificate verified', record);
});

module.exports = {
  getTraceabilityByLot,
  verifyHandoverCertificate
};
