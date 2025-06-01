const express = require('express');
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

// Get all offers
router.get('/', async (req, res) => {
  const offers = await Offer.find({ available: true }).populate('user', 'name rating numRatings');
  res.json(offers);
});

// Get my offers
router.get('/my', authenticate, async (req, res) => {
  const offers = await Offer.find({ user: req.userId });
  res.json(offers);
});

// Create offer
router.post('/', authenticate, upload.array('images', 5), async (req, res) => {
  try {
    const { title, description, location } = req.body;
    const images = req.files ? req.files.map(f => '/uploads/' + f.filename) : [];
    const offer = new Offer({ user: req.userId, title, description, location, images });
    await offer.save();
    res.status(201).json(offer);
  } catch (err) {
    res.status(500).json({ message: 'Error creating offer', error: err.message });
  }
});

// Update offer
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const offer = await Offer.findOneAndUpdate({ _id: req.params.id, user: req.userId }, req.body, { new: true });
    if (!offer) return res.status(404).json({ message: 'Offer not found' });
    res.json(offer);
  } catch (err) {
    res.status(500).json({ message: 'Error updating offer', error: err.message });
  }
});

// Delete offer
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const offer = await Offer.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!offer) return res.status(404).json({ message: 'Offer not found' });
    res.json({ message: 'Offer deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting offer', error: err.message });
  }
});

module.exports = router; 