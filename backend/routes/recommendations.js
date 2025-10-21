const express = require('express');
const axios = require('axios');
const { authenticateToken } = require('../middleware/auth');
const Assessment = require('../models/Assessment');
const { generateRecommendations } = require('../services/geminiService');
const { getNearbyMentalHealthResources } = require('../services/googleMapsService');

const router = express.Router();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

/**
 * @route   GET /api/recommendations/user/:userId
 * @desc    Get recommendations for a user based on their latest assessment
 * @access  Protected
 */
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    // Check authorization
    if (req.user.userId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Fetch user's latest assessment
    const latestAssessment = await Assessment.findOne({ user: userId })
      .sort({ createdAt: -1 })
      .lean();

    if (!latestAssessment) {
      return res.status(404).json({
        success: false,
        message: 'No assessments found'
      });
    }

    // Fetch last three assessments for trend analysis
    const lastThreeAssessments = await Assessment.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();

    const stressScores = lastThreeAssessments.map(a => a.results?.stressScore || a.results?.overallScore || 50);
    const stressLevel = latestAssessment.results?.stressLevel || 'moderate';
    const stressScore = latestAssessment.results?.stressScore || latestAssessment.results?.overallScore || 50;

    // Prepare assessment data for recommendations
    const assessmentData = {
      stressScore,
      stressLevel,
      assessmentType: latestAssessment.type || 'standard',
      lastThreeScores: stressScores,
      dass21Scores: latestAssessment.results?.dass21Scores || {}
    };

    // Generate recommendations using Gemini
    const recommendationsResult = await generateRecommendations(assessmentData);

    // Get nearby resources if geolocation is provided
    let nearbyResources = null;
    if (req.query.latitude && req.query.longitude) {
      const resourcesResult = await getNearbyMentalHealthResources(
        parseFloat(req.query.latitude),
        parseFloat(req.query.longitude)
      );
      nearbyResources = resourcesResult;
    }

    res.json({
      success: true,
      recommendations: recommendationsResult.recommendations,
      resources: nearbyResources,
      stressLevel,
      stressScore,
      assessmentType: latestAssessment.type,
      lastAssessmentDate: latestAssessment.createdAt
    });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recommendations'
    });
  }
});

/**
 * @route   POST /api/recommendations/nearby-resources
 * @desc    Get nearby mental health resources
 * @access  Protected
 */
router.post('/nearby-resources', authenticateToken, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const resources = await getNearbyMentalHealthResources(
      parseFloat(latitude),
      parseFloat(longitude)
    );

    res.json({
      success: true,
      ...resources
    });
  } catch (error) {
    console.error('Error fetching nearby resources:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching nearby resources'
    });
  }
});

module.exports = router;

