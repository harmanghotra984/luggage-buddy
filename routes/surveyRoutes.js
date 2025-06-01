const express = require('express');
const Survey = require('../models/Survey');
const authenticate = require('../middlewares/authenticate');
const router = express.Router();

// Submit survey
router.post('/', authenticate, async (req, res) => {
  try {
    const { request, rating, feedback } = req.body;
    const survey = new Survey({ user: req.userId, request, rating, feedback });
    await survey.save();
    res.status(201).json(survey);
  } catch (err) {
    res.status(500).json({ message: 'Error submitting survey', error: err.message });
  }
});

// Get all surveys for a user
router.get('/user/:userId', async (req, res) => {
  const surveys = await Survey.find({ user: req.params.userId });
  res.json(surveys);
});

// Get survey for a request
router.get('/request/:requestId', authenticate, async (req, res) => {
  const survey = await Survey.findOne({ request: req.params.requestId });
  if (!survey) return res.status(404).json({ message: 'Survey not found' });
  res.json(survey);
});

module.exports = router; 