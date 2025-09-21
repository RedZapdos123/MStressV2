const mongoose = require('mongoose')

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true,
    trim: true
  },
  questionType: {
    type: String,
    enum: ['multiple-choice', 'scale', 'text', 'yes-no', 'likert'],
    required: true
  },
  options: [{
    text: String,
    value: Number,
    description: String
  }],
  category: {
    type: String,
    enum: ['work_stress', 'academic_stress', 'personal_life', 'physical_health', 'sleep_quality', 'social_relationships', 'general_wellbeing'],
    required: true
  },
  subcategory: {
    type: String,
    trim: true
  },
  targetUserTypes: [{
    type: String,
    enum: ['student', 'professional', 'all'],
    default: 'all'
  }],
  weight: {
    type: Number,
    default: 1,
    min: 0.1,
    max: 5
  },
  isRequired: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    required: true
  },
  validationRules: {
    minLength: Number,
    maxLength: Number,
    pattern: String,
    customMessage: String
  },
  helpText: {
    type: String,
    trim: true
  },
  version: {
    type: String,
    default: '1.0.0'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
})

// Update the updatedAt field before saving
questionSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

// Indexes for performance
questionSchema.index({ category: 1, order: 1 })
questionSchema.index({ targetUserTypes: 1 })
questionSchema.index({ isActive: 1 })

// Static method to get questions by user type
questionSchema.statics.getByUserType = function(userType) {
  return this.find({
    isActive: true,
    $or: [
      { targetUserTypes: userType },
      { targetUserTypes: 'all' }
    ]
  }).sort({ order: 1 })
}

// Static method to get questions by category
questionSchema.statics.getByCategory = function(category, userType = null) {
  const query = { isActive: true, category: category }
  if (userType) {
    query.$or = [
      { targetUserTypes: userType },
      { targetUserTypes: 'all' }
    ]
  }
  return this.find(query).sort({ order: 1 })
}

module.exports = mongoose.model('Question', questionSchema)