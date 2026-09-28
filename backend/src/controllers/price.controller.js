const PriceService = require('../services/price.service');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const getPrices = asyncHandler(async (req, res) => {
  const prices = await PriceService.getPrices(req.query);
  return ApiResponse.success(res, 'Prices retrieved successfully', prices);
});

const getCurrentPrices = asyncHandler(async (req, res) => {
  const { materialCategory, city, state } = req.query;
  if (materialCategory) {
    const price = await PriceService.getCurrentPrice(materialCategory, city, state);
    return ApiResponse.success(res, `Current price for ${materialCategory}`, price);
  }
  const prices = await PriceService.getPrices({ isActive: true, city, state });
  return ApiResponse.success(res, 'Current active prices retrieved', prices);
});

const getPriceHistory = asyncHandler(async (req, res) => {
  const { materialCategory, limit } = req.query;
  const history = await PriceService.getPriceHistory(materialCategory, limit || 50);
  return ApiResponse.success(res, 'Historical prices retrieved', history);
});

const getPriceByCategory = asyncHandler(async (req, res) => {
  const { materialCategory } = req.params;
  const { city, state } = req.query;
  const price = await PriceService.getCurrentPrice(materialCategory, city, state);
  if (!price) {
    return ApiResponse.error(res, `No active price found for category ${materialCategory}`, [], 404);
  }
  return ApiResponse.success(res, `Active price for ${materialCategory}`, price);
});

const createPrice = asyncHandler(async (req, res) => {
  const price = await PriceService.createPrice(req.body);
  return ApiResponse.success(res, 'Price record created successfully', price, 201);
});

module.exports = {
  getPrices,
  getCurrentPrices,
  getPriceHistory,
  getPriceByCategory,
  createPrice
};
