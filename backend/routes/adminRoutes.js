const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  const configUsername = process.env.ADMIN_USERNAME || 'admin';
  const configPassword = process.env.ADMIN_PASSWORD || 'admin123';

  if (username === configUsername && password === configPassword) {
    // Generate JWT
    const token = jwt.sign(
      { username },
      process.env.JWT_SECRET || 'calcioclub_super_secret_jwt_key',
      { expiresIn: '7d' } // Valid for 7 days
    );
    
    return res.json({
      success: true,
      token,
      message: 'Login successful'
    });
  } else {
    return res.status(401).json({
      success: false,
      message: 'Invalid admin username or password'
    });
  }
});

module.exports = router;
