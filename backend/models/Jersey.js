const mongoose = require('mongoose');

const jerseySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a jersey name'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Please add a price'],
      min: [0, 'Price cannot be negative'],
    },
    image: {
      type: String,
      required: [true, 'Please add a jersey image URL'],
    },
    images: {
      type: [String],
      default: [],
    },
    category: {
      type: String,
      required: [true, 'Please specify a category'],
      trim: true,
    },
    sizes: {
      type: [String],
      required: [true, 'Please provide at least one size'],
      default: ['S', 'M', 'L', 'XL'],
    },
    inStock: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Jersey', jerseySchema);
