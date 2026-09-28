const Transaction = require('../models/Transaction');
const MaterialLot = require('../models/MaterialLot');
const Recycler = require('../models/Recycler');
const TraceabilityService = require('./traceability.service');
const {
  TRANSACTION_STATUS,
  LOT_STATUS,
  PAYMENT_STATUS,
  ROLES
} = require('../utils/constants');

class TransactionService {
  static async submitQuote({ lotId, recyclerUserId, quotedPrice, pickupAvailable = false, message = '', validDays = 7 }) {
    const lot = await MaterialLot.findOne({
      $or: [{ _id: /^[0-9a-fA-F]{24}$/.test(lotId) ? lotId : null }, { lotId }]
    });

    if (!lot) {
      const error = new Error('Lot not found');
      error.statusCode = 404;
      throw error;
    }

    const recycler = await Recycler.findOne({ userId: recyclerUserId });
    if (!recycler) {
      const error = new Error('Recycler profile not found');
      error.statusCode = 404;
      throw error;
    }

    if (recycler.authorizationStatus !== 'VERIFIED') {
      const error = new Error('Only verified recyclers can submit quotes');
      error.statusCode = 403;
      throw error;
    }

    if (lot.collectorId.toString() === recyclerUserId.toString()) {
      const error = new Error('Cannot quote on your own material lot');
      error.statusCode = 400;
      throw error;
    }

    if ([LOT_STATUS.COMPLETED, LOT_STATUS.CANCELLED].includes(lot.status)) {
      const error = new Error(`Cannot quote on lot with status: ${lot.status}`);
      error.statusCode = 400;
      throw error;
    }

    let transaction = await Transaction.findOne({
      lotId: lot._id,
      recyclerId: recycler._id
    });

    const validUntilDate = new Date();
    validUntilDate.setDate(validUntilDate.getDate() + (validDays || 7));

    if (!transaction) {
      transaction = new Transaction({
        lotId: lot._id,
        collectorId: lot.collectorId,
        recyclerId: recycler._id,
        materialCategory: lot.category,
        weight: lot.approxWeight,
        weightUnit: lot.weightUnit,
        quotedPrice,
        collectionLocation: lot.collectionLocation,
        transactionStatus: TRANSACTION_STATUS.QUOTED,
        quotedAt: new Date(),
        quotes: [
          {
            recyclerId: recycler._id,
            quotedPrice,
            pickupAvailable,
            message,
            validUntil: validUntilDate,
            status: 'PENDING'
          }
        ]
      });
    } else {
      transaction.quotedPrice = quotedPrice;
      transaction.transactionStatus = TRANSACTION_STATUS.QUOTED;
      transaction.quotedAt = new Date();
      transaction.quotes.push({
        recyclerId: recycler._id,
        quotedPrice,
        pickupAvailable,
        message,
        validUntil: validUntilDate,
        status: 'PENDING'
      });
    }

    await transaction.save();

    lot.status = LOT_STATUS.QUOTE_RECEIVED;
    await lot.save();

    return transaction;
  }

  static async respondToQuote({ quoteId, collectorUserId, action }) {
    const transaction = await Transaction.findOne({
      'quotes._id': quoteId
    });

    if (!transaction) {
      const error = new Error('Quote not found');
      error.statusCode = 404;
      throw error;
    }

    if (transaction.collectorId.toString() !== collectorUserId.toString()) {
      const error = new Error('Unauthorized: You can only respond to quotes on your own lots');
      error.statusCode = 403;
      throw error;
    }

    const targetQuote = transaction.quotes.id(quoteId);
    if (!targetQuote) {
      const error = new Error('Quote details not found');
      error.statusCode = 404;
      throw error;
    }

    if (action === 'ACCEPT') {
      targetQuote.status = 'ACCEPTED';
      transaction.acceptedQuoteId = targetQuote._id;
      transaction.quotedPrice = targetQuote.quotedPrice;
      transaction.transactionStatus = TRANSACTION_STATUS.ACCEPTED;
      transaction.acceptedAt = new Date();

      transaction.quotes.forEach((q) => {
        if (q._id.toString() !== quoteId.toString()) {
          q.status = 'REJECTED';
        }
      });

      await transaction.save();

      await MaterialLot.findByIdAndUpdate(transaction.lotId, {
        status: LOT_STATUS.ACCEPTED
      });

      await Transaction.updateMany(
        {
          lotId: transaction.lotId,
          _id: { $ne: transaction._id }
        },
        {
          $set: { transactionStatus: TRANSACTION_STATUS.CANCELLED }
        }
      );
    } else if (action === 'REJECT') {
      targetQuote.status = 'REJECTED';
      transaction.transactionStatus = TRANSACTION_STATUS.CANCELLED;
      await transaction.save();
    }

    return transaction;
  }

  static async completeHandover({
    transactionId,
    requestUser,
    finalWeight,
    finalPrice,
    paymentMethod = 'CASH',
    paymentStatus = 'PAID',
    latitude = null,
    longitude = null,
    handoverAddress = '',
    photos = [],
    notes = ''
  }) {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(transactionId);
    const query = isObjectId ? { _id: transactionId } : { transactionId };

    const transaction = await Transaction.findOne(query)
      .populate('lotId')
      .populate('recyclerId');

    if (!transaction) {
      const error = new Error('Transaction not found');
      error.statusCode = 404;
      throw error;
    }

    const isCollector = transaction.collectorId.toString() === requestUser._id.toString();
    const isRecycler =
      transaction.recyclerId &&
      transaction.recyclerId.userId &&
      transaction.recyclerId.userId.toString() === requestUser._id.toString();
    const isAdmin = requestUser.role === ROLES.ADMIN;

    if (!isCollector && !isRecycler && !isAdmin) {
      const error = new Error('Unauthorized to complete handover for this transaction');
      error.statusCode = 403;
      throw error;
    }

    if (transaction.transactionStatus === TRANSACTION_STATUS.COMPLETED) {
      const error = new Error('Transaction is already marked COMPLETED');
      error.statusCode = 400;
      throw error;
    }

    const parsedWeight = parseFloat(finalWeight);
    const calculatedFinalPrice = finalPrice !== undefined ? parseFloat(finalPrice) : transaction.quotedPrice;

    transaction.weight = parsedWeight;
    transaction.finalPrice = calculatedFinalPrice;
    transaction.paymentMethod = paymentMethod;
    transaction.paymentStatus = paymentStatus;
    transaction.transactionStatus = TRANSACTION_STATUS.COMPLETED;
    transaction.completedAt = new Date();

    if (handoverAddress || (latitude && longitude)) {
      transaction.handoverLocation = {
        address: handoverAddress,
        coordinates: {
          type: 'Point',
          coordinates: [longitude ? parseFloat(longitude) : 0, latitude ? parseFloat(latitude) : 0]
        }
      };
    }

    await transaction.save();

    await MaterialLot.findByIdAndUpdate(transaction.lotId._id, {
      status: LOT_STATUS.COMPLETED
    });

    const traceability = await TraceabilityService.createHandoverRecord({
      lotId: transaction.lotId._id,
      transactionId: transaction._id,
      collectorId: transaction.collectorId,
      recyclerId: transaction.recyclerId._id,
      photos,
      weight: parsedWeight,
      weightUnit: transaction.weightUnit,
      gpsLocation: { latitude, longitude },
      collectionLocation: transaction.collectionLocation,
      handoverLocation: transaction.handoverLocation,
      collectorNotes: isCollector ? notes : 'Collector confirmed handover.',
      recyclerNotes: isRecycler ? notes : 'Recycler verified weight and material receipt.'
    });

    return {
      transaction,
      traceability
    };
  }

  static async getEarnings(collectorId) {
    const transactions = await Transaction.find({ collectorId });

    let totalEarned = 0;
    let totalPending = 0;
    let completedTransactions = 0;
    let pendingTransactions = 0;

    transactions.forEach((tx) => {
      const amount = tx.finalPrice != null ? tx.finalPrice : tx.quotedPrice;

      if (tx.transactionStatus === TRANSACTION_STATUS.COMPLETED) {
        completedTransactions += 1;
        if (tx.paymentStatus === PAYMENT_STATUS.PAID) {
          totalEarned += amount;
        } else {
          totalPending += amount;
        }
      } else if (tx.transactionStatus !== TRANSACTION_STATUS.CANCELLED) {
        pendingTransactions += 1;
        totalPending += amount;
      }
    });

    return {
      totalEarned,
      totalPending,
      completedTransactions,
      pendingTransactions,
      currency: 'INR'
    };
  }
}

module.exports = TransactionService;

