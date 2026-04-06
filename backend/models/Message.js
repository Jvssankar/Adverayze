const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  deletedFor: {
    type: [String],  // array of usernames who deleted it for themselves
    default: []
  },
  deletedForEveryone: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);