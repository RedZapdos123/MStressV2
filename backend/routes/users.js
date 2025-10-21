const express = require('express')
const User = require('../models/User')
const Assessment = require('../models/Assessment')
const { authenticateToken } = require('../middleware/auth')

const router = express.Router()

// Get user profile
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
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    })
  }
})

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    const { name, profile, preferences, currentPassword, newPassword } = req.body

    // If changing password, verify current password first
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required to change password'
        })
      }

      // Verify current password
      const isMatch = await user.comparePassword(currentPassword)
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        })
      }

      // Validate new password strength
      if (newPassword.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 8 characters long'
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

      // Update password
      user.password = newPassword
    }

    // Update user fields
    if (name) {
      if (name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Name must be at least 2 characters long'
        })
      }
      user.name = name.trim()
    }

    if (profile) {
      user.profile = {
        ...user.profile,
        ...profile,
        age: profile.age ? parseInt(profile.age) : user.profile.age
      }
    }

    if (preferences) {
      user.preferences = {
        ...user.preferences,
        ...preferences
      }
    }

    await user.save()

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        profile: user.profile,
        preferences: user.preferences
      }
    })
  } catch (error) {
    console.error('Profile update error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error during profile update'
    })
  }
})

// Get user statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId

    // Get assessment count
    const totalAssessments = await Assessment.countDocuments({ 
      user: userId, 
      status: 'completed' 
    })

    // Get latest assessment
    const latestAssessment = await Assessment.findOne({ 
      user: userId, 
      status: 'completed' 
    }).sort({ completedAt: -1 })

    // Get stress level trend (last 5 assessments)
    const recentAssessments = await Assessment.find({ 
      user: userId, 
      status: 'completed' 
    })
    .sort({ completedAt: -1 })
    .limit(5)
    .select('results.stressLevel results.overallScore completedAt')

    // Calculate average score
    const avgScore = recentAssessments.length > 0 
      ? recentAssessments.reduce((sum, assessment) => sum + (assessment.results.overallScore || 0), 0) / recentAssessments.length
      : 0

    res.json({
      success: true,
      stats: {
        totalAssessments,
        currentStressLevel: latestAssessment?.results?.stressLevel || 'unknown',
        averageScore: Math.round(avgScore),
        lastAssessmentDate: latestAssessment?.completedAt || null,
        recentTrend: recentAssessments.map(assessment => ({
          date: assessment.completedAt,
          stressLevel: assessment.results.stressLevel,
          score: assessment.results.overallScore
        }))
      }
    })
  } catch (error) {
    console.error('Stats fetch error:', error)
    res.status(500).json({ 
      success: false,
      message: 'Server error fetching statistics' 
    })
  }
})

// Delete user account
router.delete('/account', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId

    // Delete all user assessments
    await Assessment.deleteMany({ user: userId })

    // Delete user account
    await User.findByIdAndDelete(userId)

    res.json({
      success: true,
      message: 'Account and all associated data deleted successfully'
    })
  } catch (error) {
    console.error('Account deletion error:', error)
    res.status(500).json({ 
      success: false,
      message: 'Server error during account deletion' 
    })
  }
})

// Change password
router.put('/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false,
        message: 'Current password and new password are required' 
      })
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ 
        success: false,
        message: 'New password must be at least 8 characters long' 
      })
    }

    const user = await User.findById(req.user.userId)
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      })
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword)
    if (!isMatch) {
      return res.status(400).json({ 
        success: false,
        message: 'Current password is incorrect' 
      })
    }

    // Update password
    user.password = newPassword
    await user.save()

    res.json({
      success: true,
      message: 'Password updated successfully'
    })
  } catch (error) {
    console.error('Password change error:', error)
    res.status(500).json({ 
      success: false,
      message: 'Server error during password change' 
    })
  }
})

// Get user preferences
router.get('/preferences', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('preferences')
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      })
    }

    res.json({
      success: true,
      preferences: user.preferences
    })
  } catch (error) {
    console.error('Preferences fetch error:', error)
    res.status(500).json({ 
      success: false,
      message: 'Server error fetching preferences' 
    })
  }
})

// Update user preferences
router.put('/preferences', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      })
    }

    const { preferences } = req.body

    if (preferences) {
      user.preferences = {
        ...user.preferences,
        ...preferences
      }
      await user.save()
    }

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: user.preferences
    })
  } catch (error) {
    console.error('Preferences update error:', error)
    res.status(500).json({ 
      success: false,
      message: 'Server error updating preferences' 
    })
  }
})

module.exports = router
