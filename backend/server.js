const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');
const adminRoutes = require('./routes/adminRoutes');
const jerseyRoutes = require('./routes/jerseyRoutes');
const orderRoutes = require('./routes/orderRoutes');

// Initialize app
const app = express();

// Connect to Database
connectDB();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic health check route
app.get('/', (req, res) => {
  res.send('CalcioClub Jersey Shop API is running...');
});

// API Routes
app.use('/api/admin', adminRoutes);
app.use('/api/jerseys', jerseyRoutes);
app.use('/api/orders', orderRoutes);

// Error Handling Middleware (fallback)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: err.message || 'An internal server error occurred',
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
