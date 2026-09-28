const mongoose = require('mongoose');
const { SAFETY_CATEGORIES, LANGUAGES } = require('../utils/constants');

const safetyGuideSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Safety guide title is required'],
      trim: true
    },
    language: {
      type: String,
      enum: Object.values(LANGUAGES),
      default: LANGUAGES.EN,
      index: true
    },
    category: {
      type: String,
      enum: Object.values(SAFETY_CATEGORIES),
      required: [true, 'Safety category is required'],
      index: true
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true
    },
    dos: [
      {
        type: String,
        trim: true
      }
    ],
    donts: [
      {
        type: String,
        trim: true
      }
    ],
    image: {
      type: String,
      trim: true,
      default: ''
    },
    audioUrl: {
      type: String,
      trim: true,
      default: ''
    },
    priority: {
      type: Number,
      default: 1
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

safetyGuideSchema.index({ category: 1, language: 1, isActive: 1 });

module.exports = mongoose.model('SafetyGuide', safetyGuideSchema);
