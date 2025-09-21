const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/User')

const router = express.Router()

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'mstress-secret-key-2024'

// Register route
router.post('/register', async (req, res) => {
  try {
    const { 
      email, 
      password, 
      name, 
      userType, 
      profile = {},
      preferences = {}
    } = req.body

    // Validate required fields
    if (!email || !password || !name || !userType) {
      return res.status(400).json({ 
        success: false,
        message: 'Email, password, name, and user type are required' 
      })
    }

    // Validate email format
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false,
        message: 'Please enter a valid email address' 
      })
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({ 
        success: false,
        message: 'Password must be at least 8 characters long' 
      })
    }

    // Validate user type
    if (!['student', 'professional', 'admin'].includes(userType)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid user type' 
      })
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'An account with this email already exists' 
      })
    }

    // Create new user
    const user = new User({
      email: email.toLowerCase(),
      password,
      name: name.trim(),
      userType,
      profile: {
        ...profile,
        age: profile.age ? parseInt(profile.age) : undefined
      },
      preferences: {
        notifications: preferences.notifications !== false,
        dataSharing: preferences.dataSharing === true,
        reminderFrequency: preferences.reminderFrequency || 'weekly'
      }
    })

    await user.save()

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        userType: user.userType 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        userType: user.userType,
        profile: user.profile,
        preferences: user.preferences,
        createdAt: user.createdAt
      }
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ 
      success: false,
      message: 'Server error during registration. Please try again.' 
    })
  }
})

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Email and password are required' 
      })
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid email or password' 
      })
    }

    // Check password
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid email or password' 
      })
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(400).json({ 
        success: false,
        message: 'Your account has been deactivated. Please contact support.' 
      })
    }

    // Update last login
    user.lastLoginAt = new Date()
    await user.save()

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        userType: user.userType 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        userType: user.userType,
        profile: user.profile,
        preferences: user.preferences,
        lastLoginAt: user.lastLoginAt
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ 
      success: false,
      message: 'Server error during login. Please try again.' 
    })
  }
})

// Get current user profile
router.get('/profile', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Access denied. No token provided.' 
      })
    }

    const decoded = jwt.verify(token, JWT_SECRET)
    const user = await User.findById(decoded.userId).select('-password')
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      })
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        userType: user.userType,
        profile: user.profile,
        preferences: user.preferences,
        isEmailVerified: user.isEmailVerified,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt
      }
    })
  } catch (error) {
    console.error('Profile fetch error:', error)
    res.status(401).json({ 
      success: false,
      message: 'Invalid token' 
    })
  }
})

// Verify token route
router.get('/verify', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'No token provided' 
      })
    }

    const decoded = jwt.verify(token, JWT_SECRET)
    const user = await User.findById(decoded.userId).select('-password')
    
    if (!user || !user.isActive) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token or inactive user' 
      })
    }

    res.json({
      success: true,
      valid: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        userType: user.userType
      }
    })
  } catch (error) {
    res.status(401).json({ 
      success: false,
      valid: false,
      message: 'Invalid token' 
    })
  }
})

// Logout route (client-side token removal)
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  })
})

module.exports = router
