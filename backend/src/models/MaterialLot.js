const mongoose = require('mongoose');
const {
  MATERIAL_CATEGORIES,
  MATERIAL_CONDITIONS,
  SOURCE_TYPES,
  LOT_STATUS,
  WEIGHT_UNITS
} = require('../utils/constants');
const { generateLotId } = require('../utils/generateId');

const materialLotSchema = new mongoose.Schema(
  {
    lotId: {
      type: String,
      unique: true,
      index: true,
      default: generateLotId
    },
    collectorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Collector ID is required'],
      index: true
    },
    category: {
      type: String,
      enum: Object.values(MATERIAL_CATEGORIES),
      required: [true, 'Material category is required'],
      index: true
    },
    subCategory: {
      type: String,
      trim: true,
      default: ''
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: ''
    },
    images: [
      {
        type: String,
        trim: true
      }
    ],
    approxWeight: {
      type: Number,
      required: [true, 'Approximate weight is required'],
      min: [0.01, 'Weight must be greater than zero']
    },
    weightUnit: {
      type: String,
      enum: Object.values(WEIGHT_UNITS),
      default: WEIGHT_UNITS.KG
    },
    condition: {
      type: String,
      enum: Object.values(MATERIAL_CONDITIONS),
      default: MATERIAL_CONDITIONS.USED
    },
    sourceType: {
      type: String,
      enum: Object.values(SOURCE_TYPES),
      default: SOURCE_TYPES.HOUSEHOLD
    },
    estimatedValue: {
      type: Number,
      min: [0, 'Estimated value cannot be negative'],
      default: 0
    },
    estimatedMinValue: {
      type: Number,
      min: [0, 'Estimated min value cannot be negative'],
      default: 0
    },
    estimatedMaxValue: {
      type: Number,
      min: [0, 'Estimated max value cannot be negative'],
      default: 0
    },
    pricePerUnit: {
      type: Number,
      min: [0, 'Price per unit cannot be negative'],
      default: 0
    },
    collectionLocation: {
      city: {
        type: String,
        trim: true,
        default: ''
      },
      state: {
        type: String,
        trim: true,
        default: ''
      },
      address: {
        type: String,
        trim: true,
        default: ''
      }
    },
    collectionCoordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0]
      }
    },
    status: {
      type: String,
      enum: Object.values(LOT_STATUS),
      default: LOT_STATUS.PUBLISHED,
      index: true
    },
    idempotencyKey: {
      type: String,
      sparse: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes for fast lookup
materialLotSchema.index({ collectorId: 1, status: 1, category: 1, createdAt: -1 });
materialLotSchema.index({ collectionCoordinates: '2dsphere' });

module.exports = mongoose.model('MaterialLot', materialLotSchema);
