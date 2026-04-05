const mongoose = require('mongoose');

const circularSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  priority: {
    type: String,
    enum: ['Normal', 'Urgent'],
    default: 'Normal',
  },
  category: {
    type: String,
    enum: ['Exam', 'Event', 'Notice', 'Other'],
    default: 'Notice',
  },
  attachments: [{
    type: String // We will store paths/URLs here
  }],
  targetAudience: {
    role: {
      type: String,
      enum: ['All', 'Student', 'HOD', 'Faculty'],
      default: 'All'
    },
    department: {
      type: String
    },
    year: {
      type: Number
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scheduledFor: {
    type: Date
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Circular', circularSchema);
