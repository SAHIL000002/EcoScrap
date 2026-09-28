const mongoose = require('mongoose');
const { MATERIAL_CATEGORIES, WEIGHT_UNITS } = require('../utils/constants');

const priceSchema = new mongoose.Schema(
  {
    materialCategory: {
      type: String,
      enum: Object.values(MATERIAL_CATEGORIES),
      required: [true, 'Material category is required'],
      index: true
    },
    materialSubCategory: {
      type: String,
      trim: true,
      default: ''
    },
    location: {
      type: String,
      trim: true,
      default: ''
    },
    city: {
      type: String,
      trim: true,
      default: 'General'
    },
    state: {
      type: String,
      trim: true,
      default: 'General'
    },
    buyingPrice: {
      type: Number,
      required: [true, 'Buying price is required'],
      min: [0, 'Buying price cannot be negative']
    },
    sellingPrice: {
      type: Number,
      min: [0, 'Selling price cannot be negative'],
      default: 0
    },
    unit: {
      type: String,
      enum: Object.values(WEIGHT_UNITS),
      default: WEIGHT_UNITS.KG
    },
    recyclerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recycler',
      default: null
    },
    validFrom: {
      type: Date,
      default: Date.now
    },
    validUntil: {
      type: Date,
      default: null // null indicates currently active price indefinitely until superseded
    },
    source: {
      type: String,
      trim: true,
      default: 'Market Benchmark'
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes
priceSchema.index({ materialCategory: 1, city: 1, state: 1, isActive: 1, createdAt: -1 });

module.exports = mongoose.model('Price', priceSchema);
