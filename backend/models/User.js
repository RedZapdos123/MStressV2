const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: function() {
      return this.authProvider === 'local';
    },
    minlength: 8
  },
  googleId: {
    type: String,
    sparse: true,
    unique: true
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  profilePicture: {
    type: String,
    default: null
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  userType: {
    type: String,
    enum: ['student', 'professional', 'admin'],
    default: 'student',
    required: true
  },
  profile: {
    institution: {
      type: String,
      trim: true,
      maxlength: 200
    },
    department: {
      type: String,
      trim: true,
      maxlength: 100
    },
    yearOfStudy: {
      type: String,
      trim: true
    },
    profession: {
      type: String,
      trim: true,
      maxlength: 100
    },
    experience: {
      type: String,
      trim: true
    },
    age: {
      type: Number,
      min: 16,
      max: 100
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say']
    }
  },
  preferences: {
    notifications: {
      type: Boolean,
      default: true
    },
    dataSharing: {
      type: Boolean,
      default: false
    },
    reminderFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'never'],
      default: 'weekly'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  lastLoginAt: {
    type: Date
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

// Create indexes for performance
userSchema.index({ email: 1 }, { unique: true })
userSchema.index({ googleId: 1 }, { unique: true, sparse: true })
userSchema.index({ authProvider: 1 })
userSchema.index({ userType: 1 })
userSchema.index({ isActive: 1 })
userSchema.index({ createdAt: -1 })

// Update the updatedAt field before saving
userSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

// Hash password before saving (only for local auth)
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || this.authProvider !== 'local') return next()

  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Compare password method
userSchema.methods.comparePassword = async function(password) {
  try {
    return await bcrypt.compare(password, this.password)
  } catch (error) {
    throw error
  }
}

// Method to update login info
userSchema.methods.updateLoginInfo = function() {
  this.lastLoginAt = new Date();
  return this.save();
};

// Remove sensitive data when converting to JSON
userSchema.methods.toJSON = function() {
  const user = this.toObject()
  delete user.password
  return user
}

module.exports = mongoose.model('User', userSchema)