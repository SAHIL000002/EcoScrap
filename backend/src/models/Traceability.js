const mongoose = require('mongoose');
const { TRACEABILITY_STATUS } = require('../utils/constants');
const { generateHandoverReference } = require('../utils/generateId');

const traceabilitySchema = new mongoose.Schema(
  {
    traceabilityId: {
      type: String,
      unique: true,
      index: true,
      default: generateHandoverReference
    },
    lotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MaterialLot',
      required: [true, 'Lot ID is required'],
      index: true
    },
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      required: [true, 'Transaction ID is required'],
      index: true
    },
    collectorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    recyclerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recycler',
      required: true
    },
    photos: [
      {
        type: String,
        trim: true
      }
    ],
    weight: {
      type: Number,
      required: [true, 'Final weight is required'],
      min: [0, 'Weight cannot be negative']
    },
    weightUnit: {
      type: String,
      default: 'KG'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    gpsLocation: {
      latitude: {
        type: Number,
        default: null
      },
      longitude: {
        type: Number,
        default: null
      },
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
    collectionLocation: {
      city: String,
      state: String,
      address: String
    },
    handoverLocation: {
      city: String,
      state: String,
      address: String
    },
    handoverReference: {
      type: String,
      required: [true, 'Handover reference is required'],
      unique: true,
      index: true
    },
    collectorConfirmation: {
      confirmed: {
        type: Boolean,
        default: false
      },
      confirmedAt: {
        type: Date,
        default: null
      },
      notes: String
    },
    recyclerConfirmation: {
      confirmed: {
        type: Boolean,
        default: false
      },
      confirmedAt: {
        type: Date,
        default: null
      },
      notes: String
    },
    status: {
      type: String,
      enum: Object.values(TRACEABILITY_STATUS),
      default: TRACEABILITY_STATUS.RECORDED
    }
  },
  {
    timestamps: true
  }
);

traceabilitySchema.index({ lotId: 1, transactionId: 1, handoverReference: 1 });
traceabilitySchema.index({ 'gpsLocation.coordinates': '2dsphere' });

module.exports = mongoose.model('Traceability', traceabilitySchema);
