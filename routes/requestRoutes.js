const express = require('express');
const Request = require('../models/Request');
const Offer = require('../models/offer');
const authenticate = require('../middlewares/authenticate');
const multer = require('multer');
const path = require('path');
const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../public/uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Create request for an offer
router.post('/', authenticate, upload.array('luggageImages', 5), async (req, res) => {
  try {
    const { offer, name, phone, aadhaar, email } = req.body;
    const luggageImages = req.files ? req.files.map(f => '/uploads/' + f.filename) : [];
    const request = new Request({ offer, requester: req.userId, name, phone, aadhaar, email, luggageImages });
    await request.save();
    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ message: 'Error creating request', error: err.message });
  }
});

// Get my requests
router.get('/my', authenticate, async (req, res) => {
  const requests = await Request.find({ requester: req.userId }).populate('offer');
  res.json(requests);
});

// Get requests received for my offers
router.get('/received', authenticate, async (req, res) => {
  const myOffers = await Offer.find({ user: req.userId }).select('_id');
  const offerIds = myOffers.map(o => o._id);
  const requests = await Request.find({ offer: { $in: offerIds } }).populate('requester');
  res.json(requests);
});

// Get request details
router.get('/:id', authenticate, async (req, res) => {
  const request = await Request.findById(req.params.id).populate('offer requester');
  if (!request) return res.status(404).json({ message: 'Request not found' });
  res.json(request);
});

// Update request status (accept/reject/complete)
router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const request = await Request.findById(req.params.id).populate('offer');
    if (!request) return res.status(404).json({ message: 'Request not found' });
    // Only offer owner can update status
    if (request.offer.user.toString() !== req.userId) return res.status(403).json({ message: 'Not authorized' });
    request.status = status;
    await request.save();
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: 'Error updating status', error: err.message });
  }
});

module.exports = router; 