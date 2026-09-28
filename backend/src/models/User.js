const mongoose = require('mongoose');
const { ROLES, LANGUAGES } = require('../utils/constants');
const { generateUserId } = require('../utils/generateId');

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      unique: true,
      index: true,
      default: generateUserId
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
      index: true,
      match: [/^\+?[0-9]{10,14}$/, 'Please enter a valid phone number']
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false // Do not include password in queries by default
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.COLLECTOR,
      index: true
    },
    preferredLanguage: {
      type: String,
      enum: Object.values(LANGUAGES),
      default: LANGUAGES.HI
    },
    operatingLocation: {
      type: String,
      trim: true,
      default: ''
    },
    location: {
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
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// GeoJSON index for location coordinates
userSchema.index({ 'location.coordinates': '2dsphere' });

// Ensure coordinates are synchronized if lat/lng are provided
userSchema.pre('save', function (next) {
  if (this.location && this.location.latitude != null && this.location.longitude != null) {
    this.location.coordinates = {
      type: 'Point',
      coordinates: [this.location.longitude, this.location.latitude]
    };
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
