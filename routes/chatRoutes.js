const express = require('express');
const Message = require('../models/message');
const Request = require('../models/Request');
const authenticate = require('../middlewares/authenticate');
const router = express.Router();

// Get all messages for a request
router.get('/:requestId', authenticate, async (req, res) => {
  const messages = await Message.find({ 
    referenceId: req.params.requestId,
    referenceType: 'Request',
    messageType: 'chat'
  }).populate('senderId', 'name');
  res.json(messages);
});

// Send a message for a request
router.post('/:requestId', authenticate, async (req, res) => {
  try {
    const { content } = req.body;
    // Only participants can send messages
    const request = await Request.findById(req.params.requestId);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    
    // Determine receiver based on who is sending the message
    const receiverId = request.requester.toString() === req.userId 
      ? request.offer 
      : request.requester;

    if (request.requester.toString() !== req.userId && request.offer.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const message = new Message({
      referenceId: req.params.requestId,
      referenceType: 'Request',
      messageType: 'chat',
      senderId: req.userId,
      receiverId,
      content
    });
    
    await message.save();
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: 'Error sending message', error: err.message });
  }
});

module.exports = router; 