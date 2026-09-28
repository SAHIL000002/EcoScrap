const mongoose = require('mongoose');
const { AUTHORIZATION_STATUS, MATERIAL_CATEGORIES, WEIGHT_UNITS } = require('../utils/constants');
const { generateRecyclerId } = require('../utils/generateId');

const offeredRateSchema = new mongoose.Schema(
  {
    materialCategory: {
      type: String,
      enum: Object.values(MATERIAL_CATEGORIES),
      required: true
    },
    ratePerUnit: {
      type: Number,
      required: true,
      min: [0, 'Rate cannot be negative']
    },
    unit: {
      type: String,
      enum: Object.values(WEIGHT_UNITS),
      default: WEIGHT_UNITS.KG
    }
  },
  { _id: false }
);

const recyclerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
      index: true
    },
    recyclerId: {
      type: String,
      unique: true,
      index: true,
      default: generateRecyclerId
    },
    facilityName: {
      type: String,
      required: [true, 'Facility name is required'],
      trim: true
    },
    facilityLocation: {
      type: String,
      trim: true,
      default: ''
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      index: true
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true
    },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
        default: [0, 0]
      }
    },
    materialsAccepted: [
      {
        type: String,
        enum: Object.values(MATERIAL_CATEGORIES)
      }
    ],
    authorizationNumber: {
      type: String,
      required: [true, 'Authorization number is required'],
      trim: true,
      unique: true
    },
    authorizationType: {
      type: String,
      trim: true,
      default: 'CPCB Authorized E-Waste Dismantler & Recycler'
    },
    authorizationStatus: {
      type: String,
      enum: Object.values(AUTHORIZATION_STATUS),
      default: AUTHORIZATION_STATUS.PENDING,
      index: true
    },
    contactPhone: {
      type: String,
      required: [true, 'Contact phone is required'],
      trim: true
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true
    },
    offeredRates: [offeredRateSchema],
    pickupAvailable: {
      type: Boolean,
      default: false
    },
    serviceArea: [
      {
        type: String,
        trim: true
      }
    ],
    isVerified: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// 2dsphere index for GeoJSON spatial queries
recyclerSchema.index({ coordinates: '2dsphere' });
recyclerSchema.index({ authorizationStatus: 1, materialsAccepted: 1, isVerified: 1 });

module.exports = mongoose.model('Recycler', recyclerSchema);
