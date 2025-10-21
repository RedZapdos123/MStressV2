const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { authenticateToken, requireReviewer } = require('../middleware/auth');
const Review = require('../models/Review');
const Assessment = require('../models/Assessment');
const User = require('../models/User');

const router = express.Router();

// Validation error handler middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array()
    });
  }
  next();
};

/**
 * @route   GET /api/reviews/pending
 * @desc    Get all pending assessments for review
 * @access  Protected (human_reviewer, admin)
 */
router.get('/pending', authenticateToken, async (req, res) => {
  try {
    // Check if user is reviewer or admin
    if (req.user.role !== 'human_reviewer' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Reviewer role required.'
      });
    }

    // Find assessments with moderate/high/severe stress that need review
    const pendingAssessments = await Assessment.find({
      status: 'completed',
      $or: [
        { 'results.stressLevel': 'moderate' },
        { 'results.stressLevel': 'high' },
        { 'results.stressLevel': 'severe' }
      ]
    })
    .populate('user', 'name email')
    .sort({ completedAt: -1 })
    .limit(50);

    // Check which ones have reviews
    const assessmentsWithReviewStatus = await Promise.all(
      pendingAssessments.map(async (assessment) => {
        const review = await Review.findOne({ assessment: assessment._id });
        return {
          ...assessment.toObject(),
          reviewStatus: review ? review.status : 'pending',
          hasReview: !!review
        };
      })
    );

    res.json({
      success: true,
      assessments: assessmentsWithReviewStatus
    });
  } catch (error) {
    console.error('Error fetching pending assessments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending assessments'
    });
  }
});

/**
 * @route   POST /api/reviews/:assessmentId
 * @desc    Create or update a review for an assessment
 * @access  Protected (human_reviewer, admin)
 */
router.post('/:assessmentId', 
  authenticateToken,
  param('assessmentId').notEmpty().withMessage('Assessment ID is required'),
  body('reviewScore').optional().isNumeric().withMessage('Review score must be numeric'),
  body('comments').optional().isString().withMessage('Comments must be a string'),
  body('status').optional().isIn(['pending', 'reviewed', 'approved', 'rejected']).withMessage('Invalid status'),
  body('riskAssessment').optional().isIn(['low', 'moderate', 'high', 'critical']).withMessage('Invalid risk assessment'),
  handleValidationErrors,
  async (req, res) => {
    try {
      // Check if user is reviewer or admin
      if (req.user.role !== 'human_reviewer' && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Reviewer role required.'
        });
      }

      const { assessmentId } = req.params;
      const { reviewScore, comments, status, riskAssessment, recommendations, flaggedForFollowUp, followUpNotes } = req.body;

      // Verify assessment exists
      const assessment = await Assessment.findById(assessmentId);
      if (!assessment) {
        return res.status(404).json({
          success: false,
          message: 'Assessment not found'
        });
      }

      // Find or create review
      let review = await Review.findOne({ assessment: assessmentId });
      
      if (!review) {
        review = new Review({
          assessment: assessmentId,
          reviewer: req.user.userId
        });
      }

      // Update review fields
      if (reviewScore !== undefined) review.reviewScore = reviewScore;
      if (comments !== undefined) review.comments = comments;
      if (status !== undefined) {
        review.status = status;
        if (status !== 'pending') {
          review.reviewedAt = new Date();
        }
      }
      if (riskAssessment !== undefined) review.riskAssessment = riskAssessment;
      if (recommendations !== undefined) review.recommendations = recommendations;
      if (flaggedForFollowUp !== undefined) review.flaggedForFollowUp = flaggedForFollowUp;
      if (followUpNotes !== undefined) review.followUpNotes = followUpNotes;

      await review.save();

      res.json({
        success: true,
        message: 'Review saved successfully',
        review
      });
    } catch (error) {
      console.error('Error saving review:', error);
      res.status(500).json({
        success: false,
        message: 'Error saving review'
      });
    }
  }
);

/**
 * @route   GET /api/reviews/:assessmentId
 * @desc    Get review for a specific assessment
 * @access  Protected
 */
router.get('/:assessmentId', 
  authenticateToken,
  param('assessmentId').notEmpty().withMessage('Assessment ID is required'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { assessmentId } = req.params;

      // Verify assessment exists
      const assessment = await Assessment.findById(assessmentId).populate('user');
      if (!assessment) {
        return res.status(404).json({
          success: false,
          message: 'Assessment not found'
        });
      }

      // Check authorization - user can see their own reviews, reviewers can see all
      if (assessment.user._id.toString() !== req.user.userId && 
          req.user.role !== 'human_reviewer' && 
          req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const review = await Review.findOne({ assessment: assessmentId })
        .populate('reviewer', 'name email role');

      res.json({
        success: true,
        review: review || null
      });
    } catch (error) {
      console.error('Error fetching review:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching review'
      });
    }
  }
);

/**
 * @route   GET /api/reviews/user/:userId
 * @desc    Get all reviews for a user's assessments
 * @access  Protected
 */
router.get('/user/:userId', 
  authenticateToken,
  param('userId').notEmpty().withMessage('User ID is required'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { userId } = req.params;

      // Check authorization
      if (userId !== req.user.userId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Get all assessments for the user
      const assessments = await Assessment.find({ user: userId, status: 'completed' });
      const assessmentIds = assessments.map(a => a._id);

      // Get all reviews for these assessments
      const reviews = await Review.find({ assessment: { $in: assessmentIds } })
        .populate('reviewer', 'name email role')
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        reviews
      });
    } catch (error) {
      console.error('Error fetching user reviews:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching user reviews'
      });
    }
  }
);

module.exports = router;

