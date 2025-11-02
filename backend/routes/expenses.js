const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const Group = require('../models/Group');
const User = require('../models/User');
const { protect, isGroupMember, isExpenseOwner } = require('../middleware/auth');

// Add an expense
router.post('/', protect, async (req, res) => {
  try {
    const { description, amount, groupId, splitType, splitDetails } = req.body;

    // Create new expense
    const newExpense = new Expense({
      description,
      amount,
      paidBy: req.user.id,
      group: groupId,
      splitType,
      splitDetails
    });

    const expense = await newExpense.save();

    // Add expense to group
    await Group.findByIdAndUpdate(groupId, {
      $push: { expenses: expense._id }
    });

    // Update balances between users
    await updateBalances(expense);

    res.json(expense);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get expenses for a group
router.get('/group/:groupId', protect, isGroupMember, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is a member of the group
    if (!group.members.some(member => member.toString() === req.user.id)) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const expenses = await Expense.find({ group: req.params.groupId })
      .populate('paidBy', ['name'])
      .sort({ date: -1 });

    res.json(expenses);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get user's expenses
router.get('/user', protect, async (req, res) => {
  try {
    const expenses = await Expense.find({
      $or: [
        { paidBy: req.user.id },
        { 'splitDetails.user': req.user.id }
      ]
    })
      .populate('paidBy', ['name'])
      .populate('group', ['name'])
      .sort({ date: -1 });

    res.json(expenses);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Delete an expense
router.delete('/:id', protect, isExpenseOwner, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Check if user is the one who paid or a group admin
    if (expense.paidBy.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Remove expense from group
    await Group.findByIdAndUpdate(expense.group, {
      $pull: { expenses: expense._id }
    });

    // Revert balances
    await revertBalances(expense);

    // Delete expense
    await expense.remove();

    res.json({ message: 'Expense removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Expense not found' });
    }
    res.status(500).send('Server error');
  }
});

// Helper function to update balances when an expense is added
async function updateBalances(expense) {
  const { amount, paidBy, splitDetails } = expense;
  
  for (const detail of splitDetails) {
    const { user, amount: userAmount } = detail;
    
    if (user.toString() !== paidBy.toString()) {
      // Update balance between paidBy and user
      await User.updateOne(
        { _id: paidBy, 'balances.user': user },
        { $inc: { 'balances.$.amount': userAmount } }
      );

      // If no balance exists, create one
      await User.updateOne(
        { _id: paidBy, 'balances.user': { $ne: user } },
        { $push: { balances: { user, amount: userAmount } } },
        { upsert: true }
      );

      // Update balance for the other user
      await User.updateOne(
        { _id: user, 'balances.user': paidBy },
        { $inc: { 'balances.$.amount': -userAmount } }
      );

      // If no balance exists, create one
      await User.updateOne(
        { _id: user, 'balances.user': { $ne: paidBy } },
        { $push: { balances: { user: paidBy, amount: -userAmount } } },
        { upsert: true }
      );
    }
  }
}

// Helper function to revert balances when an expense is deleted
async function revertBalances(expense) {
  const { amount, paidBy, splitDetails } = expense;
  
  for (const detail of splitDetails) {
    const { user, amount: userAmount } = detail;
    
    if (user.toString() !== paidBy.toString()) {
      // Revert balance between paidBy and user
      await User.updateOne(
        { _id: paidBy, 'balances.user': user },
        { $inc: { 'balances.$.amount': -userAmount } }
      );

      // Update balance for the other user
      await User.updateOne(
        { _id: user, 'balances.user': paidBy },
        { $inc: { 'balances.$.amount': userAmount } }
      );
    }
  }
}

module.exports = router;
