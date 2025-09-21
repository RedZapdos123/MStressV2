const mongoose = require('mongoose')

const assessmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['standard', 'comprehensive'],
    required: true
  },
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'cancelled'],
    default: 'in_progress'
  },
  responses: {
    questionnaire: [{
      questionId: {
        type: String,
        required: true
      },
      question: {
        type: String,
        required: true
      },
      response: {
        type: mongoose.Schema.Types.Mixed,
        required: true
      },
      category: {
        type: String,
        enum: ['work_stress', 'personal_life', 'physical_health', 'sleep_quality', 'social_relationships', 'academic_stress']
      }
    }],
    facialAnalysis: {
      dominantEmotion: String,
      confidence: Number,
      emotions: {
        happy: Number,
        sad: Number,
        angry: Number,
        fear: Number,
        surprise: Number,
        disgust: Number,
        neutral: Number
      },
      stressIndicators: [String],
      processingTime: Number
    },
    voiceAnalysis: {
      transcription: String,
      speakingRate: Number,
      pauseFrequency: String,
      confidenceMarkers: String,
      stressMarkers: [String],
      processingTime: Number
    }
  },
  results: {
    overallScore: {
      type: Number,
      min: 0,
      max: 100
    },
    stressLevel: {
      type: String,
      enum: ['low', 'moderate', 'high', 'severe']
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1
    },
    categoryScores: {
      workStress: Number,
      personalLife: Number,
      physicalHealth: Number,
      sleepQuality: Number,
      socialRelationships: Number,
      academicStress: Number
    },
    insights: {
      strengths: [String],
      concerns: [String],
      riskFactors: [String]
    },
    recommendations: [{
      category: {
        type: String,
        enum: ['immediate', 'weekly', 'long_term']
      },
      priority: {
        type: String,
        enum: ['high', 'medium', 'low']
      },
      items: [String]
    }]
  },
  metadata: {
    duration: Number, // in seconds
    deviceInfo: {
      userAgent: String,
      platform: String,
      screenResolution: String
    },
    aiModelsUsed: [String],
    processingTime: Number,
    version: {
      type: String,
      default: '1.0.0'
    }
  },
  privacy: {
    dataRetentionDays: {
      type: Number,
      default: 365
    },
    allowDataSharing: {
      type: Boolean,
      default: false
    },
    anonymizeData: {
      type: Boolean,
      default: true
    }
  },
  completedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
})

// Indexes for performance
assessmentSchema.index({ user: 1, createdAt: -1 })
assessmentSchema.index({ type: 1 })
assessmentSchema.index({ status: 1 })
assessmentSchema.index({ 'results.stressLevel': 1 })
assessmentSchema.index({ completedAt: -1 })

// Update the updatedAt field before saving
assessmentSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

// Virtual for assessment duration in minutes
assessmentSchema.virtual('durationMinutes').get(function() {
  return this.metadata.duration ? Math.round(this.metadata.duration / 60) : null
})

// Method to calculate stress level from score
assessmentSchema.methods.calculateStressLevel = function() {
  const score = this.results.overallScore
  if (score < 25) return 'low'
  if (score < 50) return 'moderate'
  if (score < 75) return 'high'
  return 'severe'
}

// Method to check if assessment is expired
assessmentSchema.methods.isExpired = function() {
  if (!this.privacy.dataRetentionDays) return false
  const expiryDate = new Date(this.createdAt)
  expiryDate.setDate(expiryDate.getDate() + this.privacy.dataRetentionDays)
  return new Date() > expiryDate
}

// Static method to get user's latest assessment
assessmentSchema.statics.getLatestByUser = function(userId) {
  return this.findOne({ user: userId, status: 'completed' })
    .sort({ completedAt: -1 })
    .populate('user', 'name email userType')
}

// Static method to get stress level statistics
assessmentSchema.statics.getStressLevelStats = function(userType = null) {
  const match = { status: 'completed' }
  if (userType) {
    match['user.userType'] = userType
  }
  
  return this.aggregate([
    { $match: match },
    { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
    { $group: {
      _id: '$results.stressLevel',
      count: { $sum: 1 },
      avgScore: { $avg: '$results.overallScore' }
    }},
    { $sort: { _id: 1 } }
  ])
}

module.exports = mongoose.model('Assessment', assessmentSchema)
