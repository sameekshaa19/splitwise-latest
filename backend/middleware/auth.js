const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Group = require('../models/Group');
const Expense = require('../models/Expense');

// Middleware to authenticate user
const protect = async (req, res, next) => {
  let token;

  // Get token from header or query parameter
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query.token) {
    token = req.query.token;
  }

  // Check if no token
  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'No token, authorization denied' 
    });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists
    const user = await User.findById(decoded.user?.id || decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'User no longer exists' 
      });
    }
    
    req.user = user;
    next();
  } catch (err) {
    console.error('Token verification error:', err.message);
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: 'Token has expired' 
      });
    }
    
    return res.status(401).json({ 
      success: false,
      message: 'Token is not valid' 
    });
  }
};

// Middleware to check if user is group admin
const isGroupAdmin = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id || req.params.groupId);
    
    if (!group) {
      return res.status(404).json({ 
        success: false,
        message: 'Group not found' 
      });
    }

    // Check if user is the creator of the group
    if (group.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized as group admin' 
      });
    }

    req.group = group;
    next();
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// Middleware to check if user is group member
const isGroupMember = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id || req.params.groupId);
    
    if (!group) {
      return res.status(404).json({ 
        success: false,
        message: 'Group not found' 
      });
    }

    // Check if user is a member of the group
    if (!group.members.some(member => member.toString() === req.user.id)) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized as group member' 
      });
    }

    req.group = group;
    next();
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// Middleware to check if user is the expense owner
const isExpenseOwner = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);
    
    if (!expense) {
      return res.status(404).json({ 
        success: false,
        message: 'Expense not found' 
      });
    }

    // Check if user is the one who paid the expense
    if (expense.paidBy.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to modify this expense' 
      });
    }

    req.expense = expense;
    next();
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

module.exports = { 
  protect, 
  isGroupAdmin, 
  isGroupMember, 
  isExpenseOwner 
};
