const Transaction = require('../models/Transaction');
const Recycler = require('../models/Recycler');
const MaterialLot = require('../models/MaterialLot');
const TransactionService = require('../services/transaction.service');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { ROLES, TRANSACTION_STATUS } = require('../utils/constants');

const submitQuote = asyncHandler(async (req, res) => {
  const { lotId } = req.params;
  const { quotedPrice, pickupAvailable, message, validDays } = req.body;

  const transaction = await TransactionService.submitQuote({
    lotId,
    recyclerUserId: req.user._id,
    quotedPrice: parseFloat(quotedPrice),
    pickupAvailable,
    message,
    validDays: validDays ? parseInt(validDays, 10) : 7
  });

  return ApiResponse.success(res, 'Quote submitted successfully', transaction, 201);
});

const getQuotesForLot = asyncHandler(async (req, res) => {
  const { lotId } = req.params;
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(lotId);
  const lotQuery = isObjectId ? { _id: lotId } : { lotId };

  const lot = await MaterialLot.findOne(lotQuery);
  if (!lot) {
    return ApiResponse.error(res, 'Lot not found', [], 404);
  }

  if (req.user.role === ROLES.COLLECTOR && lot.collectorId.toString() !== req.user._id.toString()) {
    return ApiResponse.error(res, 'Unauthorized to view quotes for this lot', [], 403);
  }

  const transactions = await Transaction.find({ lotId: lot._id })
    .populate('recyclerId', 'facilityName authorizationNumber contactPhone city state')
    .sort({ createdAt: -1 });

  return ApiResponse.success(res, 'Quotes retrieved for lot', transactions);
});

const respondToQuote = asyncHandler(async (req, res) => {
  const { quoteId } = req.params;
  const { action } = req.body;

  const transaction = await TransactionService.respondToQuote({
    quoteId,
    collectorUserId: req.user._id,
    action
  });

  return ApiResponse.success(res, `Quote ${action.toLowerCase()}ed successfully`, transaction);
});

const getMyTransactions = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const query = {};

  if (req.user.role === ROLES.COLLECTOR) {
    query.collectorId = req.user._id;
  } else if (req.user.role === ROLES.RECYCLER) {
    const recycler = await Recycler.findOne({ userId: req.user._id });
    if (!recycler) {
      return ApiResponse.success(res, 'No transactions found', []);
    }
    query.recyclerId = recycler._id;
  }

  if (status) query.transactionStatus = status;

  const transactions = await Transaction.find(query)
    .populate('lotId')
    .populate('collectorId', 'name phone preferredLanguage location')
    .populate('recyclerId', 'facilityName authorizationNumber contactPhone city state')
    .sort({ createdAt: -1 });

  return ApiResponse.success(res, 'Transactions retrieved successfully', transactions);
});

const getTransactionById = asyncHandler(async (req, res) => {
  const { transactionId } = req.params;
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(transactionId);
  const query = isObjectId ? { _id: transactionId } : { transactionId };

  const transaction = await Transaction.findOne(query)
    .populate('lotId')
    .populate('collectorId', 'name phone email preferredLanguage location')
    .populate('recyclerId', 'facilityName authorizationNumber contactPhone contactEmail city state');

  if (!transaction) {
    return ApiResponse.error(res, 'Transaction not found', [], 404);
  }

  if (req.user.role === ROLES.COLLECTOR && transaction.collectorId._id.toString() !== req.user._id.toString()) {
    return ApiResponse.error(res, 'Unauthorized to view this transaction', [], 403);
  }
  if (req.user.role === ROLES.RECYCLER) {
    const recycler = await Recycler.findOne({ userId: req.user._id });
    if (!recycler || transaction.recyclerId._id.toString() !== recycler._id.toString()) {
      return ApiResponse.error(res, 'Unauthorized to view this transaction', [], 403);
    }
  }

  return ApiResponse.success(res, 'Transaction details retrieved', transaction);
});

const createFromQuote = asyncHandler(async (req, res) => {
  const { quoteId } = req.body;
  const transaction = await TransactionService.respondToQuote({
    quoteId,
    collectorUserId: req.user._id,
    action: 'ACCEPT'
  });
  return ApiResponse.success(res, 'Transaction initialized from accepted quote', transaction, 201);
});

const updateTransactionStatus = asyncHandler(async (req, res) => {
  const { transactionId } = req.params;
  const { status } = req.body;

  const isObjectId = /^[0-9a-fA-F]{24}$/.test(transactionId);
  const query = isObjectId ? { _id: transactionId } : { transactionId };

  const transaction = await Transaction.findOne(query);
  if (!transaction) {
    return ApiResponse.error(res, 'Transaction not found', [], 404);
  }

  if (transaction.transactionStatus === TRANSACTION_STATUS.COMPLETED) {
    return ApiResponse.error(res, 'Completed transactions cannot be modified', [], 400);
  }

  const validTransitions = {
    [TRANSACTION_STATUS.QUOTE_REQUESTED]: [TRANSACTION_STATUS.QUOTED, TRANSACTION_STATUS.CANCELLED],
    [TRANSACTION_STATUS.QUOTED]: [TRANSACTION_STATUS.ACCEPTED, TRANSACTION_STATUS.CANCELLED],
    [TRANSACTION_STATUS.ACCEPTED]: [TRANSACTION_STATUS.HANDOVER_PENDING, TRANSACTION_STATUS.CANCELLED],
    [TRANSACTION_STATUS.HANDOVER_PENDING]: [TRANSACTION_STATUS.COMPLETED, TRANSACTION_STATUS.CANCELLED],
    [TRANSACTION_STATUS.COMPLETED]: [],
    [TRANSACTION_STATUS.CANCELLED]: []
  };

  const allowed = validTransitions[transaction.transactionStatus] || [];
  if (!allowed.includes(status) && req.user.role !== ROLES.ADMIN) {
    return ApiResponse.error(
      res,
      `Invalid status transition from ${transaction.transactionStatus} to ${status}`,
      [],
      400
    );
  }

  transaction.transactionStatus = status;
  if (status === TRANSACTION_STATUS.ACCEPTED) transaction.acceptedAt = new Date();
  if (status === TRANSACTION_STATUS.COMPLETED) transaction.completedAt = new Date();

  await transaction.save();

  return ApiResponse.success(res, `Transaction status updated to ${status}`, transaction);
});

const updatePayment = asyncHandler(async (req, res) => {
  const { transactionId } = req.params;
  const { paymentStatus, paymentMethod, finalPrice } = req.body;

  const isObjectId = /^[0-9a-fA-F]{24}$/.test(transactionId);
  const query = isObjectId ? { _id: transactionId } : { transactionId };

  const transaction = await Transaction.findOne(query);
  if (!transaction) {
    return ApiResponse.error(res, 'Transaction not found', [], 404);
  }

  if (paymentStatus) transaction.paymentStatus = paymentStatus;
  if (paymentMethod) transaction.paymentMethod = paymentMethod;
  if (finalPrice !== undefined) transaction.finalPrice = parseFloat(finalPrice);

  await transaction.save();

  return ApiResponse.success(res, 'Payment details updated successfully', transaction);
});

const completeHandover = asyncHandler(async (req, res) => {
  const { transactionId } = req.params;
  const { finalWeight, finalPrice, paymentMethod, paymentStatus, latitude, longitude, handoverAddress, notes } =
    req.body;

  let photos = [];
  if (req.files && req.files.length > 0) {
    const ImageService = require('../services/image.service');
    photos = await ImageService.uploadMultipleImages(req.files, 'handovers');
  } else if (req.file) {
    const ImageService = require('../services/image.service');
    const url = await ImageService.uploadImage(req.file, 'handovers');
    if (url) photos.push(url);
  }

  const result = await TransactionService.completeHandover({
    transactionId,
    requestUser: req.user,
    finalWeight,
    finalPrice,
    paymentMethod,
    paymentStatus,
    latitude,
    longitude,
    handoverAddress,
    photos,
    notes
  });

  return ApiResponse.success(res, 'Material handover completed and traceability record generated', result, 200);
});

module.exports = {
  submitQuote,
  getQuotesForLot,
  respondToQuote,
  getMyTransactions,
  getTransactionById,
  createFromQuote,
  updateTransactionStatus,
  updatePayment,
  completeHandover
};

