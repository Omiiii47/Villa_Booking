const express = require('express');
const Notification = require('../models/Notification');
const { userProtect } = require('../middleware/userAuth');

const router = express.Router();

router.use(userProtect);

router.get('/', async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipientType: 'user',
      recipient: req.user._id,
    })
      .populate('reference', 'customerName villa checkIn checkOut')
      .populate({ path: 'reference', populate: { path: 'villa', select: 'name' } })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/read', async (req, res) => {
  try {
    const { ids, all } = req.body;
    if (all && all === true) {
      await Notification.updateMany(
        { recipientType: 'user', recipient: req.user._id, read: false },
        { $set: { read: true, readAt: new Date() } }
      );
    } else if (Array.isArray(ids) && ids.length) {
      await Notification.updateMany(
        { _id: { $in: ids }, recipientType: 'user', recipient: req.user._id },
        { $set: { read: true, readAt: new Date() } }
      );
    }
    res.json({ message: 'Notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;