const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    baseCity: {
      type: String,
      required: true,
      default: 'Mumbai',
      trim: true
    },
    baseState: {
      type: String,
      required: true,
      default: 'Maharashtra',
      trim: true
    },
    cityCharge: {
      type: Number,
      required: true,
      default: 0
    },
    stateCharge: {
      type: Number,
      required: true,
      default: 40
    },
    otherCharge: {
      type: Number,
      required: true,
      default: 60
    }
  },
  {
    timestamps: true
  }
);

// We only need one document for settings, but we use a model for standard querying
module.exports = mongoose.model('Settings', settingsSchema);
