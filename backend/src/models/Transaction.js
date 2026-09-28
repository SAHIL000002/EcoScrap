const mongoose = require('mongoose');
const {
  TRANSACTION_STATUS,
  PAYMENT_METHODS,
  PAYMENT_STATUS,
  MATERIAL_CATEGORIES,
  WEIGHT_UNITS
} = require('../utils/constants');
const { generateTransactionId } = require('../utils/generateId');

const quoteSchema = new mongoose.Schema(
  {
    recyclerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recycler',
      required: true
    },
    quotedPrice: {
      type: Number,
      required: [true, 'Quoted price is required'],
      min: [0, 'Quoted price cannot be negative']
    },
    pickupAvailable: {
      type: Boolean,
      default: false
    },
    message: {
      type: String,
      trim: true,
      default: ''
    },
    validUntil: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Default 7 days
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED'],
      default: 'PENDING'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

const transactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      unique: true,
      index: true,
      default: generateTransactionId
    },
    lotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MaterialLot',
      required: [true, 'Lot ID is required'],
      index: true
    },
    collectorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Collector ID is required'],
      index: true
    },
    recyclerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recycler',
      required: [true, 'Recycler ID is required'],
      index: true
    },
    materialCategory: {
      type: String,
      enum: Object.values(MATERIAL_CATEGORIES),
      required: true
    },
    weight: {
      type: Number,
      required: [true, 'Weight is required'],
      min: [0, 'Weight cannot be negative']
    },
    weightUnit: {
      type: String,
      enum: Object.values(WEIGHT_UNITS),
      default: WEIGHT_UNITS.KG
    },
    quotedPrice: {
      type: Number,
      required: [true, 'Quoted price is required'],
      min: [0, 'Quoted price cannot be negative']
    },
    finalPrice: {
      type: Number,
      min: [0, 'Final price cannot be negative'],
      default: null
    },
    collectionLocation: {
      city: String,
      state: String,
      address: String
    },
    handoverLocation: {
      city: String,
      state: String,
      address: String,
      coordinates: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point'
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
          default: [0, 0]
        }
      }
    },
    paymentMethod: {
      type: String,
      enum: Object.values(PAYMENT_METHODS),
      default: PAYMENT_METHODS.CASH
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
      index: true
    },
    transactionStatus: {
      type: String,
      enum: Object.values(TRANSACTION_STATUS),
      default: TRANSACTION_STATUS.QUOTE_REQUESTED,
      index: true
    },
    quotes: [quoteSchema],
    acceptedQuoteId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    quotedAt: {
      type: Date,
      default: null
    },
    acceptedAt: {
      type: Date,
      default: null
    },
    completedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

transactionSchema.index({ collectorId: 1, recyclerId: 1, transactionStatus: 1, createdAt: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
