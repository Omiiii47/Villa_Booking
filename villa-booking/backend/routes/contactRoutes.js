const express = require('express');

const router = express.Router();

router.post('/', (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ message: 'Please fill in all required fields' });
  }
  res.json({ message: 'Thank you for your message. We will get back to you soon.' });
});

module.exports = router;
