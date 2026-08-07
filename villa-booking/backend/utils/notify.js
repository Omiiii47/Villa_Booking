const Notification = require('../models/Notification');

const notify = async ({ recipientType, recipient, type, title, message = '', reference }) => {
  try {
    await Notification.create({
      recipientType,
      recipient,
      recipientModel: recipientType === 'user' ? 'User' : 'Admin',
      type,
      title,
      message,
      reference: reference || undefined,
    });
  } catch (error) {
    console.error('Failed to create notification:', error.message);
  }
};

module.exports = { notify };