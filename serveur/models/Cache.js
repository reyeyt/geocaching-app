const mongoose = require('mongoose');

const cacheSchema = new mongoose.Schema({
  coordinates: {
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    }
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  difficulty: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  description: {
    type: String,
    default: ''
  },
  findings: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    found: {
      type: Boolean,
      default: false
    },
    comment: {
      type: String,
      default: ''
    },
    date: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  photo: {
    data: Buffer,
    contentType: String,
    url: String 
  }
});

module.exports = mongoose.model('Cache', cacheSchema);