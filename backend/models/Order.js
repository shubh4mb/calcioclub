const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  jersey: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Jersey',
    required: true,
  },
  jerseyName: {
    type: String,
    required: true,
  },
  size: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
  },
  price: {
    type: Number,
    required: true,
  },
});

const orderSchema = new mongoose.Schema(
  {
    customerDetails: {
      name: {
        type: String,
        required: [true, 'Please provide customer name'],
        trim: true,
      },
      email: {
        type: String,
        required: [true, 'Please provide customer email'],
        trim: true,
      },
      phone: {
        type: String,
        required: [true, 'Please provide customer phone number'],
        trim: true,
      },
      street: {
        type: String,
        required: [true, 'Please provide street address'],
        trim: true,
      },
      city: {
        type: String,
        required: [true, 'Please provide city'],
        trim: true,
      },
      state: {
        type: String,
        required: [true, 'Please provide state'],
        trim: true,
      },
      pincode: {
        type: String,
        required: [true, 'Please provide pincode'],
        trim: true,
      },
    },
    items: [orderItemSchema],
    totalAmount: {
      type: Number,
      required: true,
    },
    deliveryCharge: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
      default: 'Pending',
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid', 'Failed'],
      default: 'Pending',
    },
    razorpayOrderId: {
      type: String,
    },
    razorpayPaymentId: {
      type: String,
    },
    razorpaySignature: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Order', orderSchema);
