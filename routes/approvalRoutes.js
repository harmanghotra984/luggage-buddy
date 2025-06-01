const express = require('express');
const Request = require('../models/Request');
const Offer = require('../models/offer');
const authenticate = require('../middlewares/authenticate');
const router = express.Router();

// Accept a request
router.patch('/:requestId/accept', authenticate, async (req, res) => {
  const request = await Request.findById(req.params.requestId).populate('offer');
  if (!request) return res.status(404).json({ message: 'Request not found' });
  if (request.offer.user.toString() !== req.userId) return res.status(403).json({ message: 'Not authorized' });
  request.status = 'accepted';
  await request.save();
  res.json(request);
});

// Reject a request
router.patch('/:requestId/reject', authenticate, async (req, res) => {
  const request = await Request.findById(req.params.requestId).populate('offer');
  if (!request) return res.status(404).json({ message: 'Request not found' });
  if (request.offer.user.toString() !== req.userId) return res.status(403).json({ message: 'Not authorized' });
  request.status = 'rejected';
  await request.save();
  res.json(request);
});

// Mark as completed
router.patch('/:requestId/complete', authenticate, async (req, res) => {
  const request = await Request.findById(req.params.requestId).populate('offer');
  if (!request) return res.status(404).json({ message: 'Request not found' });
  if (request.offer.user.toString() !== req.userId) return res.status(403).json({ message: 'Not authorized' });
  request.status = 'completed';
  await request.save();
  res.json(request);
});

module.exports = router; 