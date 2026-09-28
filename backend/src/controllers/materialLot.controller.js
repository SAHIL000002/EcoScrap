const MaterialLot = require('../models/MaterialLot');
const ValuationService = require('../services/valuation.service');
const ImageService = require('../services/image.service');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { generateLotId } = require('../utils/generateId');
const { LOT_STATUS, ROLES } = require('../utils/constants');

const createLot = asyncHandler(async (req, res) => {
  const {
    category,
    subCategory,
    description,
    approxWeight,
    weightUnit,
    condition,
    sourceType,
    city,
    state,
    address,
    latitude,
    longitude,
    idempotencyKey
  } = req.body;

  if (idempotencyKey) {
    const existing = await MaterialLot.findOne({ idempotencyKey, collectorId: req.user._id });
    if (existing) {
      return ApiResponse.success(res, 'Lot retrieved (idempotent)', existing, 200);
    }
  }

  let imageUrls = [];
  if (req.files && req.files.length > 0) {
    imageUrls = await ImageService.uploadMultipleImages(req.files, 'lots');
  } else if (req.file) {
    const singleUrl = await ImageService.uploadImage(req.file, 'lots');
    if (singleUrl) imageUrls.push(singleUrl);
  }

  const valuation = await ValuationService.calculateValuation({
    category,
    approxWeight,
    city: city || req.user.location?.city,
    state: state || req.user.location?.state,
    condition
  });

  const lotId = generateLotId();

  const collectionCoordinates = {
    type: 'Point',
    coordinates: [
      longitude ? parseFloat(longitude) : req.user.location?.longitude || 0,
      latitude ? parseFloat(latitude) : req.user.location?.latitude || 0
    ]
  };

  const lot = new MaterialLot({
    lotId,
    collectorId: req.user._id,
    category,
    subCategory: subCategory || '',
    description: description || '',
    images: imageUrls,
    approxWeight: parseFloat(approxWeight),
    weightUnit: weightUnit || 'KG',
    condition: condition || 'USED',
    sourceType: sourceType || 'HOUSEHOLD',
    estimatedValue: valuation.estimatedValue,
    estimatedMinValue: valuation.estimatedMinValue,
    estimatedMaxValue: valuation.estimatedMaxValue,
    pricePerUnit: valuation.pricePerUnit,
    collectionLocation: {
      city: city || req.user.location?.city || '',
      state: state || req.user.location?.state || '',
      address: address || ''
    },
    collectionCoordinates,
    status: LOT_STATUS.PUBLISHED,
    idempotencyKey: idempotencyKey || undefined
  });

  await lot.save();

  return ApiResponse.success(res, 'Material lot created successfully', lot, 201);
});

const getMyLots = asyncHandler(async (req, res) => {
  const { status, category } = req.query;
  const query = { collectorId: req.user._id };

  if (status) query.status = status;
  if (category) query.category = category;

  const lots = await MaterialLot.find(query).sort({ createdAt: -1 });
  return ApiResponse.success(res, 'Collector lots retrieved', lots);
});

const getLotById = asyncHandler(async (req, res) => {
  const { lotId } = req.params;
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(lotId);
  const query = isObjectId ? { _id: lotId } : { lotId };

  const lot = await MaterialLot.findOne(query).populate('collectorId', 'name phone preferredLanguage location');

  if (!lot) {
    return ApiResponse.error(res, 'Material lot not found', [], 404);
  }

  if (req.user.role === ROLES.COLLECTOR && lot.collectorId._id.toString() !== req.user._id.toString()) {
    return ApiResponse.error(res, 'Unauthorized to view this lot', [], 403);
  }

  return ApiResponse.success(res, 'Lot details retrieved', lot);
});

const updateLot = asyncHandler(async (req, res) => {
  const { lotId } = req.params;
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(lotId);
  const query = isObjectId ? { _id: lotId } : { lotId };

  const lot = await MaterialLot.findOne(query);

  if (!lot) {
    return ApiResponse.error(res, 'Material lot not found', [], 404);
  }

  if (req.user.role !== ROLES.ADMIN && lot.collectorId.toString() !== req.user._id.toString()) {
    return ApiResponse.error(res, 'Unauthorized to update this lot', [], 403);
  }

  if (lot.status === LOT_STATUS.COMPLETED) {
    return ApiResponse.error(res, 'Completed lots cannot be modified', [], 400);
  }

  const { approxWeight, condition, description, status } = req.body;

  if (approxWeight) {
    lot.approxWeight = parseFloat(approxWeight);
    const valuation = await ValuationService.calculateValuation({
      category: lot.category,
      approxWeight: lot.approxWeight,
      city: lot.collectionLocation?.city,
      state: lot.collectionLocation?.state,
      condition: condition || lot.condition
    });
    lot.estimatedValue = valuation.estimatedValue;
    lot.estimatedMinValue = valuation.estimatedMinValue;
    lot.estimatedMaxValue = valuation.estimatedMaxValue;
    lot.pricePerUnit = valuation.pricePerUnit;
  }

  if (condition) lot.condition = condition;
  if (description !== undefined) lot.description = description;
  if (status) lot.status = status;

  await lot.save();

  return ApiResponse.success(res, 'Lot updated successfully', lot);
});

const deleteLot = asyncHandler(async (req, res) => {
  const { lotId } = req.params;
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(lotId);
  const query = isObjectId ? { _id: lotId } : { lotId };

  const lot = await MaterialLot.findOne(query);

  if (!lot) {
    return ApiResponse.error(res, 'Material lot not found', [], 404);
  }

  if (req.user.role !== ROLES.ADMIN && lot.collectorId.toString() !== req.user._id.toString()) {
    return ApiResponse.error(res, 'Unauthorized to delete this lot', [], 403);
  }

  if (lot.status === LOT_STATUS.COMPLETED) {
    return ApiResponse.error(res, 'Completed lots cannot be deleted', [], 400);
  }

  lot.status = LOT_STATUS.CANCELLED;
  await lot.save();

  return ApiResponse.success(res, 'Lot cancelled successfully', lot);
});

const getOpenLots = asyncHandler(async (req, res) => {
  const { category, city } = req.query;
  const query = {
    status: { $in: [LOT_STATUS.PUBLISHED, LOT_STATUS.QUOTE_PENDING, LOT_STATUS.QUOTE_RECEIVED] }
  };

  if (category) query.category = category;
  if (city) query['collectionLocation.city'] = new RegExp(city, 'i');

  const lots = await MaterialLot.find(query).populate('collectorId', 'name city state preferredLanguage').sort({ createdAt: -1 });
  return ApiResponse.success(res, 'Open lots retrieved', lots);
});

module.exports = {
  createLot,
  getMyLots,
  getLotById,
  updateLot,
  deleteLot,
  getOpenLots
};

