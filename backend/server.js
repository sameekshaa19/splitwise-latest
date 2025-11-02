require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');

// Import models to ensure they're registered with Mongoose
require('./models/User');
require('./models/Group');
require('./models/Expense');

const app = express();

// Connect to MongoDB
connectDB();

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

// Database connection is now handled by db.js

// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/expenses', require('./routes/expenses'));

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is running!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, 'localhost', () => {
  console.log(`Server is running on localhost:${PORT}`);
});
