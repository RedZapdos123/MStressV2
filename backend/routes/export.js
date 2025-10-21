const express = require('express')
const jwt = require('jsonwebtoken')
const Assessment = require('../models/Assessment')
const User = require('../models/User')

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'mstress-secret-key-2024'

// Middleware to verify JWT token.
const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '')
  
  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'Access denied. No token provided.' 
    })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    res.status(401).json({ 
      success: false,
      message: 'Invalid token' 
    })
  }
}

// Export assessments as CSV.
router.get('/csv', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId
    const { startDate, endDate, type } = req.query

    // Build query.
    const query = { user: userId, status: 'completed' }
    
    if (startDate && endDate) {
      query.completedAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }
    
    if (type && ['standard', 'comprehensive'].includes(type)) {
      query.type = type
    }

    // Get assessments.
    const assessments = await Assessment.find(query)
      .sort({ completedAt: -1 })
      .populate('user', 'name email userType')

    if (assessments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No assessments found for the specified criteria'
      })
    }

    // Generate CSV content.
    const csvHeaders = [
      'Date',
      'Assessment Type',
      'Overall Score',
      'Stress Level',
      'Confidence',
      'Duration (minutes)',
      'Work Stress',
      'Personal Life',
      'Physical Health',
      'Sleep Quality',
      'Dominant Emotion',
      'Emotion Confidence',
      'Voice Analysis Score',
      'Recommendations Count'
    ]

    const csvRows = assessments.map(assessment => [
      assessment.completedAt ? new Date(assessment.completedAt).toLocaleDateString() : '',
      assessment.type || '',
      assessment.results?.overallScore || '',
      assessment.results?.stressLevel || '',
      assessment.results?.confidence || '',
      assessment.metadata?.duration ? Math.round(assessment.metadata.duration / 60) : '',
      assessment.results?.categoryScores?.workStress || '',
      assessment.results?.categoryScores?.personalLife || '',
      assessment.results?.categoryScores?.physicalHealth || '',
      assessment.results?.categoryScores?.sleepQuality || '',
      assessment.responses?.facialAnalysis?.dominantEmotion || '',
      assessment.responses?.facialAnalysis?.confidence || '',
      assessment.responses?.voiceAnalysis?.score || '',
      assessment.results?.recommendations?.length || 0
    ])

    // Convert to CSV format.
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(field => 
        typeof field === 'string' && field.includes(',') 
          ? `"${field}"` 
          : field
      ).join(','))
    ].join('\n')

    // Set response headers for file download.
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="mstress-assessments-${new Date().toISOString().split('T')[0]}.csv"`)
    
    res.send(csvContent)

  } catch (error) {
    console.error('CSV export error:', error)
    res.status(500).json({ 
      success: false,
      message: 'Server error during CSV export' 
    })
  }
})

// Export assessment summary as JSON.
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId
    const { assessmentId } = req.query

    if (assessmentId) {
      // Export specific assessment.
      const assessment = await Assessment.findOne({ 
        _id: assessmentId, 
        user: userId 
      }).populate('user', 'name email userType')

      if (!assessment) {
        return res.status(404).json({
          success: false,
          message: 'Assessment not found'
        })
      }

      const summary = {
        assessmentInfo: {
          id: assessment._id,
          type: assessment.type,
          completedAt: assessment.completedAt,
          duration: assessment.metadata?.duration
        },
        userInfo: {
          name: assessment.user.name,
          userType: assessment.user.userType
        },
        results: {
          overallScore: assessment.results?.overallScore,
          stressLevel: assessment.results?.stressLevel,
          confidence: assessment.results?.confidence,
          categoryScores: assessment.results?.categoryScores
        },
        insights: assessment.results?.insights,
        recommendations: assessment.results?.recommendations,
        aiAnalysis: {
          facialEmotion: assessment.responses?.facialAnalysis,
          voiceAnalysis: assessment.responses?.voiceAnalysis
        }
      }

      res.json({
        success: true,
        summary
      })

    } else {
      // Export all assessments summary.
      const assessments = await Assessment.find({ 
        user: userId, 
        status: 'completed' 
      })
      .sort({ completedAt: -1 })
      .limit(10)
      .populate('user', 'name email userType')

      const summary = {
        userInfo: assessments.length > 0 ? {
          name: assessments[0].user.name,
          userType: assessments[0].user.userType
        } : null,
        totalAssessments: assessments.length,
        assessments: assessments.map(assessment => ({
          id: assessment._id,
          type: assessment.type,
          completedAt: assessment.completedAt,
          overallScore: assessment.results?.overallScore,
          stressLevel: assessment.results?.stressLevel,
          confidence: assessment.results?.confidence
        })),
        trends: {
          averageScore: assessments.length > 0 
            ? Math.round(assessments.reduce((sum, a) => sum + (a.results?.overallScore || 0), 0) / assessments.length)
            : 0,
          stressLevelDistribution: assessments.reduce((acc, assessment) => {
            const level = assessment.results?.stressLevel || 'unknown'
            acc[level] = (acc[level] || 0) + 1
            return acc
          }, {})
        }
      }

      res.json({
        success: true,
        summary
      })
    }

  } catch (error) {
    console.error('Summary export error:', error)
    res.status(500).json({ 
      success: false,
      message: 'Server error during summary export' 
    })
  }
})

// Export user data (GDPR compliance).
router.get('/user-data', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId

    // Get user data.
    const user = await User.findById(userId).select('-password')
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    // Get all assessments.
    const assessments = await Assessment.find({ user: userId })

    const userData = {
      exportInfo: {
        exportDate: new Date().toISOString(),
        dataType: 'Complete User Data Export',
        purpose: 'GDPR Data Portability Request'
      },
      userProfile: {
        id: user._id,
        email: user.email,
        name: user.name,
        userType: user.userType,
        profile: user.profile,
        preferences: user.preferences,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
      },
      assessments: assessments.map(assessment => ({
        id: assessment._id,
        type: assessment.type,
        status: assessment.status,
        responses: assessment.responses,
        results: assessment.results,
        metadata: assessment.metadata,
        privacy: assessment.privacy,
        completedAt: assessment.completedAt,
        createdAt: assessment.createdAt
      })),
      statistics: {
        totalAssessments: assessments.length,
        completedAssessments: assessments.filter(a => a.status === 'completed').length,
        accountAge: user.createdAt ? Math.floor((new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24)) : 0
      }
    }

    // Set response headers for file download.
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', `attachment; filename="mstress-user-data-${new Date().toISOString().split('T')[0]}.json"`)
    
    res.json(userData)

  } catch (error) {
    console.error('User data export error:', error)
    res.status(500).json({ 
      success: false,
      message: 'Server error during user data export' 
    })
  }
})

module.exports = router
