const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  cachesTrouvees: [{
    cache: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cache'
    },
    foundAt: {
      type: Date,
      default: Date.now
    },
    comment: {
      type: String,
      default: ''
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  avatar: {
    data: Buffer,
    contentType: String,
    url: String 
  }
});

module.exports = mongoose.model('User', userSchema);