const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Jersey = require('../models/Jersey');
const protect = require('../middleware/auth');

// Mock In-Memory Orders Database for offline/unconnected mode
let mockOrders = [
  {
    _id: "mock_order_1001",
    customerDetails: {
      name: "Alex Ferguson",
      email: "alex.f@calcioclub.com",
      phone: "+44 7911 123456",
      address: "Old Trafford, Sir Matt Busby Way, Manchester"
    },
    items: [
      {
        jersey: "mock1",
        jerseyName: "Real Madrid 2023/24 Home Jersey",
        size: "L",
        quantity: 1,
        price: 89.99
      },
      {
        jersey: "mock3",
        jerseyName: "AC Milan 1996 Retro Jersey",
        size: "XL",
        quantity: 1,
        price: 119.99
      }
    ],
    totalAmount: 209.98,
    status: "Pending",
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString()
  }
];

// @desc    Place a new order
// @route   POST /api/orders
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { customerDetails, items } = req.body;

    if (!customerDetails || !items || items.length === 0) {
      return res.status(400).json({ message: 'Missing customer details or items' });
    }

    const { name, email, phone, address } = customerDetails;
    if (!name || !email || !phone || !address) {
      return res.status(400).json({ message: 'Please provide all customer details' });
    }

    // Check if database is connected, else use mock fallback
    if (mongoose.connection.readyState !== 1) {
      let calculatedTotal = 0;
      const processedItems = items.map(item => {
        const qty = Number(item.quantity) || 1;
        const price = Number(item.price) || 0;
        calculatedTotal += price * qty;
        
        return {
          jersey: item.jersey || 'mock_ref',
          jerseyName: item.jerseyName || 'Unknown Jersey',
          size: item.size || 'M',
          quantity: qty,
          price: price
        };
      });

      const newOrder = {
        _id: 'mock_order_' + Date.now(),
        customerDetails: { name, email, phone, address },
        items: processedItems,
        totalAmount: calculatedTotal,
        status: 'Pending',
        createdAt: new Date().toISOString()
      };
      
      mockOrders.unshift(newOrder);
      return res.status(201).json(newOrder);
    }

    let calculatedTotal = 0;
    const processedItems = [];

    // Verify each item against DB records
    for (const item of items) {
      const dbJersey = await Jersey.findById(item.jersey);
      if (!dbJersey) {
        return res.status(404).json({ message: `Jersey ${item.jerseyName || item.jersey} not found` });
      }

      const price = dbJersey.price;
      const quantity = Number(item.quantity) || 1;
      calculatedTotal += price * quantity;

      processedItems.push({
        jersey: dbJersey._id,
        jerseyName: dbJersey.name,
        size: item.size,
        quantity,
        price
      });
    }

    const newOrder = new Order({
      customerDetails: { name, email, phone, address },
      items: processedItems,
      totalAmount: calculatedTotal,
      status: 'Pending'
    });

    const savedOrder = await newOrder.save();
    res.status(201).json(savedOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc    Get all orders (admin only)
// @route   GET /api/orders
// @access  Admin Private
router.get('/', protect, async (req, res) => {
  try {
    // Check if database is connected, else use mock fallback
    if (mongoose.connection.readyState !== 1) {
      return res.json(mockOrders);
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

    // Check if database is connected, else use mock fallback
    if (mongoose.connection.readyState !== 1) {
      const order = mockOrders.find(o => o._id === req.params.id);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      order.status = status;
      return res.json(order);
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
