const mongoose = require('mongoose');
require('dotenv').config();

console.log('Testing connection to MONGO_URI:', process.env.MONGO_URI);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('SUCCESS: Successfully connected to MongoDB!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('ERROR: Connection failed:', err.message);
    process.exit(1);
  });
