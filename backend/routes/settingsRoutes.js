const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const protect = require('../middleware/auth');
const mongoose = require('mongoose');

// Helper to get or create settings
const getSettings = async () => {
  if (mongoose.connection.readyState !== 1) {
    // Mock settings
    return {
      baseCity: 'Mumbai',
      baseState: 'Maharashtra',
      cityCharge: 0,
      stateCharge: 40,
      otherCharge: 60
    };
  }

  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({}); // create defaults
  }
  return settings;
};

// @desc    Get store settings
// @route   GET /api/settings
// @access  Public
router.get('/', async (req, res) => {
  try {
    const settings = await getSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update store settings
// @route   PUT /api/settings
// @access  Admin Private
router.put('/', protect, async (req, res) => {
  try {
    const { baseCity, baseState, cityCharge, stateCharge, otherCharge } = req.body;
    
    if (mongoose.connection.readyState !== 1) {
      return res.status(400).json({ message: 'Database disconnected' });
    }

    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }

    if (baseCity) settings.baseCity = baseCity;
    if (baseState) settings.baseState = baseState;
    if (cityCharge !== undefined) settings.cityCharge = cityCharge;
    if (stateCharge !== undefined) settings.stateCharge = stateCharge;
    if (otherCharge !== undefined) settings.otherCharge = otherCharge;

    const updatedSettings = await settings.save();
    res.json(updatedSettings);

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
