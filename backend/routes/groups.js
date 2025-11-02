const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const User = require('../models/User');
const { protect, isGroupAdmin, isGroupMember } = require('../middleware/auth');

// Create a new group
router.post('/', protect, async (req, res) => {
  try {
    const { name, members } = req.body;

    // Create new group
    const newGroup = new Group({
      name,
      createdBy: req.user.id,
      members: [...members, req.user.id] // Include creator as member
    });

    const group = await newGroup.save();
    
    // Add group to each member's groups array
    await User.updateMany(
      { _id: { $in: group.members } },
      { $addToSet: { groups: group._id } }
    );

    res.json(group);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get all groups for logged in user
router.get('/', protect, async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user.id })
      .populate('members', ['name', 'email'])
      .populate('expenses');
    
    res.json(groups);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get group by ID
router.get('/:id', protect, isGroupMember, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('members', ['name', 'email'])
      .populate({
        path: 'expenses',
        populate: {
          path: 'paidBy',
          select: 'name'
        }
      });

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is a member of the group
    if (!group.members.some(member => member._id.toString() === req.user.id)) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    res.json(group);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Group not found' });
    }
    res.status(500).send('Server error');
  }
});

// Add members to group
router.put('/:id/members', protect, isGroupAdmin, async (req, res) => {
  try {
    const { members } = req.body;

    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is the creator of the group
    if (group.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Add new members
    group.members = [...new Set([...group.members, ...members])];
    await group.save();

    // Add group to new members' groups array
    await User.updateMany(
      { _id: { $in: members } },
      { $addToSet: { groups: group._id } }
    );

    res.json(group);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Remove member from group
router.delete('/:groupId/members/:memberId', protect, isGroupAdmin, async (req, res) => {
  try {
    const { groupId, memberId } = req.params;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is the creator of the group
    if (group.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Remove member from group
    group.members = group.members.filter(
      memberId => memberId.toString() !== req.params.memberId
    );
    await group.save();

    // Remove group from member's groups array
    await User.findByIdAndUpdate(
      memberId,
      { $pull: { groups: group._id } }
    );

    res.json({ message: 'Member removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
