const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const User = require('../models/User')
const { authenticateToken, JWT_SECRET } = require('../middleware/auth')

const router = express.Router()

// Register route
router.post('/register', async (req, res) => {
  try {
    const {
      email,
      password,
      name,
      role = 'user',
      profile = {},
      preferences = {}
    } = req.body

    // Validate required fields
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and name are required'
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

    // Validate role
    if (!['user', 'human_reviewer', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
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
      role,
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
        role: user.role,
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
        role: user.role
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
        role: user.role,
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
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password')

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
        role: user.role,
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
router.get('/verify', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password')

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
        role: user.role,
        userType: user.userType,
        profile: user.profile,
        preferences: user.preferences,
        lastLoginAt: user.lastLoginAt
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

// Forgot password route
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body

    // Validate email
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      })
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'No account found with this email address'
      })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour expiry

    // Save token to user
    user.resetToken = resetToken
    user.resetTokenExpiry = resetTokenExpiry
    await user.save()

    res.json({
      success: true,
      message: 'Password reset token generated successfully',
      resetToken: resetToken, // In production, this would be sent via email
      resetTokenExpiry: resetTokenExpiry
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error during password reset request'
    })
  }
})

// Reset password route
router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body

    // Validate inputs
    if (!resetToken || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Reset token and new password are required'
      })
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      })
    }

    // Check for uppercase, lowercase, number, and special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain uppercase, lowercase, number, and special character'
      })
    }

    // Find user with valid reset token
    const user = await User.findOne({
      resetToken: resetToken,
      resetTokenExpiry: { $gt: new Date() }
    })

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      })
    }

    // Update password
    user.password = newPassword
    user.resetToken = null
    user.resetTokenExpiry = null
    await user.save()

    res.json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.'
    })
  } catch (error) {
    console.error('Reset password error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error during password reset'
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
