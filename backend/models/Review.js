const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  assessment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assessment',
    required: true
  },
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'approved', 'rejected'],
    default: 'pending'
  },
  reviewScore: {
    type: Number,
    min: 0,
    max: 100
  },
  comments: {
    type: String,
    trim: true
  },
  recommendations: [String],
  riskAssessment: {
    type: String,
    enum: ['low', 'moderate', 'high', 'critical'],
    default: 'low'
  },
  flaggedForFollowUp: {
    type: Boolean,
    default: false
  },
  followUpNotes: {
    type: String,
    trim: true
  },
  reviewedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
reviewSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index for performance
reviewSchema.index({ assessment: 1 });
reviewSchema.index({ reviewer: 1 });
reviewSchema.index({ status: 1 });
reviewSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);

