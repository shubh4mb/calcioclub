const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Jersey = require('../models/Jersey');
const Settings = require('../models/Settings');
const protect = require('../middleware/auth');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'dummy_id',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
});

// Helper to get settings
const getSettings = async () => {
  if (mongoose.connection.readyState !== 1) {
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
    settings = await Settings.create({});
  }
  return settings;
};

// @desc    Create Razorpay Order
// @route   POST /api/orders/create-razorpay-order
// @access  Public
router.post('/create-razorpay-order', async (req, res) => {
  try {
    const { customerDetails, items } = req.body;

    if (!customerDetails || !items || items.length === 0) {
      return res.status(400).json({ message: 'Missing customer details or items' });
    }

    const { city, state } = customerDetails;

    let itemsTotal = 0;
    
    // Check if database is connected, else use mock fallback
    if (mongoose.connection.readyState !== 1) {
      itemsTotal = items.reduce((total, item) => total + ((Number(item.price) || 0) * (Number(item.quantity) || 1)), 0);
    } else {
      for (const item of items) {
        const dbJersey = await Jersey.findById(item.jersey);
        if (!dbJersey) {
          return res.status(404).json({ message: `Jersey ${item.jerseyName || item.jersey} not found` });
        }
        itemsTotal += dbJersey.price * (Number(item.quantity) || 1);
      }
    }

    // Dynamic Delivery Calculation
    const settings = await getSettings();
    let deliveryCharge = settings.otherCharge; // default

    const userCity = (city || '').trim().toLowerCase();
    const userState = (state || '').trim().toLowerCase();
    const baseCity = (settings.baseCity || '').trim().toLowerCase();
    const baseState = (settings.baseState || '').trim().toLowerCase();

    if (userCity === baseCity && userState === baseState) {
      deliveryCharge = settings.cityCharge;
    } else if (userState === baseState) {
      deliveryCharge = settings.stateCharge;
    }

    const totalAmount = itemsTotal + deliveryCharge;

    const options = {
      amount: Math.round(totalAmount * 100), // amount in smallest currency unit (paise)
      currency: "INR",
      receipt: "order_rcptid_" + Date.now()
    };

    const order = await razorpay.orders.create(options);
    
    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      totalAmount,
      deliveryCharge,
      key: process.env.RAZORPAY_KEY_ID || 'dummy_id'
    });

  } catch (error) {
    console.error('Error creating razorpay order:', error);
    res.status(500).json({ message: 'Could not create order with Razorpay', error: error.message });
  }
});

// @desc    Verify Razorpay Payment and Save Order
// @route   POST /api/orders/verify-payment
// @access  Public
router.post('/verify-payment', async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature, 
      customerDetails, 
      items, 
      totalAmount,
      deliveryCharge
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'dummy_secret')
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    // Payment is successful, save the order
    const { name, email, phone, street, city, state, pincode } = customerDetails;

    // Check if database is connected, else mock saving
    if (mongoose.connection.readyState !== 1) {
      const processedItems = items.map(item => ({
        jersey: item.jersey || 'mock_ref',
        jerseyName: item.jerseyName || 'Unknown Jersey',
        size: item.size || 'M',
        quantity: Number(item.quantity) || 1,
        price: Number(item.price) || 0
      }));

      const newOrder = {
        _id: 'mock_order_' + Date.now(),
        customerDetails: { name, email, phone, street, city, state, pincode },
        items: processedItems,
        totalAmount,
        deliveryCharge,
        status: 'Processing',
        paymentStatus: 'Paid',
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        createdAt: new Date().toISOString()
      };
      
      return res.status(201).json(newOrder);
    }

    const processedItems = [];
    for (const item of items) {
      const dbJersey = await Jersey.findById(item.jersey);
      if (dbJersey) {
        processedItems.push({
          jersey: dbJersey._id,
          jerseyName: dbJersey.name,
          size: item.size,
          quantity: Number(item.quantity) || 1,
          price: dbJersey.price
        });
      }
    }

    const newOrder = new Order({
      customerDetails: { name, email, phone, street, city, state, pincode },
      items: processedItems,
      totalAmount,
      deliveryCharge,
      status: 'Processing',
      paymentStatus: 'Paid',
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
    });

    const savedOrder = await newOrder.save();
    res.status(201).json(savedOrder);

  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ message: 'Error confirming order', error: error.message });
  }
});

// @desc    Track Order
// @route   GET /api/orders/track
// @access  Public
router.get('/track', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ message: 'Please provide a phone number, email, or order ID to track' });
    }

    if (mongoose.connection.readyState !== 1) {
       return res.status(503).json({ message: 'Database not connected, tracking unavailable.' });
    }

    const searchQuery = q.trim();
    
    // Check if query is a valid MongoDB ObjectId (for order ID search)
    let orderIdCondition = null;
    if (mongoose.Types.ObjectId.isValid(searchQuery)) {
      orderIdCondition = { _id: searchQuery };
    } else {
      // Also try matching by Razorpay Order ID as fallback for "Order ID"
      orderIdCondition = { razorpayOrderId: searchQuery };
    }

    // Search by ObjectId/Razorpay ID OR email OR phone
    const orders = await Order.find({
      $or: [
        ...(orderIdCondition ? [orderIdCondition] : []),
        { 'customerDetails.email': new RegExp(`^${searchQuery}$`, 'i') },
        { 'customerDetails.phone': searchQuery }
      ]
    }).sort({ createdAt: -1 });

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: 'No orders found for the provided details' });
    }

    res.json(orders);
  } catch (error) {
    console.error('Error tracking order:', error);
    res.status(500).json({ message: 'Server error while tracking order', error: error.message });
  }
});

// @desc    Get all orders (admin only)
// @route   GET /api/orders
// @access  Admin Private
router.get('/', protect, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json([]);
    }
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update order status (admin only)
// @route   PATCH /api/orders/:id/status
// @access  Admin Private
router.patch('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid or missing status value' });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = status;
    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
