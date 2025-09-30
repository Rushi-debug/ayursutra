const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Can be User or Practitioner, but we'll use User for both and distinguish by role
    required: true,
  },
  senderRole: {
    type: String,
    enum: ['user', 'practitioner'],
    required: true,
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  receiverRole: {
    type: String,
    enum: ['user', 'practitioner'],
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  read: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model('Message', messageSchema);
