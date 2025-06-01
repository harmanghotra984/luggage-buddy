const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Reference can be either Ad or Request
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'referenceType',
    required: true
  },
  referenceType: {
    type: String,
    enum: ['Ad', 'Request'],
    required: true
  },
  content: {
    type: String,
    trim: true,
    required: true
  },
  messageType: {
    type: String,
    enum: ['chat', 'agreement'],
    default: 'chat'
  },
  // Fields for agreement messages
  agreementText: {
    type: String
  },
  agreementStatus: {
    type: String,
    enum: ['pending', 'accepted', 'declined'],
    default: 'pending'
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined'],
    default: 'pending'
  }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema); 