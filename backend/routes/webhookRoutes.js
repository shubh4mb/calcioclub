const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Order = require('../models/Order');

// @desc    Handle Razorpay Webhooks
// @route   POST /api/webhooks/razorpay
// @access  Public
router.post('/razorpay', async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'dummy_webhook_secret';
    
    // Razorpay sends the signature in this header
    const signature = req.headers['x-razorpay-signature'];
    
    if (!signature) {
      return res.status(400).json({ message: 'Missing Razorpay signature' });
    }

    // Verify the signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (expectedSignature !== signature) {
      console.error('Webhook signature mismatch!');
      return res.status(400).json({ message: 'Invalid signature' });
    }

    // Process the event
    const event = req.body.event;

    if (event === 'order.paid') {
      const orderData = req.body.payload.order.entity;
      const paymentData = req.body.payload.payment.entity;

      const razorpayOrderId = orderData.id;
      
      // Find the order in our database
      const order = await Order.findOne({ razorpayOrderId: razorpayOrderId });
      
      if (order) {
        // If it's not already paid (maybe frontend missed it), update it
        if (order.paymentStatus !== 'Paid') {
          order.paymentStatus = 'Paid';
          order.status = 'Processing';
          order.razorpayPaymentId = paymentData.id;
          await order.save();
          console.log(`Webhook updated order ${order._id} to Paid`);
        } else {
          console.log(`Webhook received for order ${order._id}, but it is already marked Paid.`);
        }
      } else {
        console.warn(`Webhook received for unknown Razorpay Order ID: ${razorpayOrderId}`);
      }
    }

    // Always return 200 OK to acknowledge receipt
    res.status(200).json({ status: 'ok' });

  } catch (error) {
    console.error('Webhook Error:', error);
    // Send 500 so Razorpay retries
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
