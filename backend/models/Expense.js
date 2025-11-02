const mongoose = require('mongoose');

const splitItemSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  percentage: {
    type: Number,
  },
  settled: {
    type: Boolean,
    default: false,
  },
});

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    enum: ['vegetarian', 'non-vegetarian', 'other'],
    default: 'other',
  },
  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
});

const expenseSchema = new mongoose.Schema({
  description: {
    type: String,
    required: [true, 'Please provide a description'],
    trim: true,
  },
  amount: {
    type: Number,
    required: [true, 'Please provide an amount'],
    min: 0,
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  paidByName: {
    type: String,
    required: true,
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
  },
  splitType: {
    type: String,
    enum: ['EQUAL', 'PERCENTAGE', 'EXACT', 'ITEM_WISE'],
    default: 'EQUAL',
  },
  split: [splitItemSchema],
  items: [itemSchema],
  type: {
    type: String,
    enum: ['manual', 'scan'],
    default: 'manual',
  },
  imageUrl: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update timestamp on save
expenseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Expense', expenseSchema);
