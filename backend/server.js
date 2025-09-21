#!/usr/bin/env node
/**
 * MStress Backend Server
 * Mental Health Assessment Platform Backend API
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Client } = require('@googlemaps/google-maps-services-js');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Assessment = require('./models/Assessment');
const Question = require('./models/Question');
const AdminLog = require('./models/AdminLog');

// Import services
const facialEmotionService = require('./services/facialEmotionService');

const app = express();
const PORT = process.env.PORT || 5000;

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/MStress';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('📊 Connected to MongoDB database');
  console.log(`🔗 Database: ${MONGODB_URI}`);
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  console.log('⚠️  Continuing with limited functionality...');
});

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:8000'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Basic logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      database: 'operational',
      authentication: 'operational',
      api: 'operational'
    }
  });
});

// Authentication setup
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'mstress-secret-key-2024';

// Initialize Gemini AI
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDw1lCX08SDNr6pbfcpD3cu7dAqdZjg6qo';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Initialize Google Maps client
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const googleMapsClient = new Client({});

// Authentication routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, userType = 'student' } = req.body;

    // Validate required fields
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and name are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create user (password will be hashed by pre-save middleware)
    const user = new User({
      email: email.toLowerCase(),
      password,
      name,
      userType
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user data (password excluded by toJSON transform)
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: user.toJSON(),
      token
    });

  } catch (error) {
    console.error('Registration error:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors)[0].message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error during registration'
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password using the model method
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update login info
    await user.updateLoginInfo();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user data (password excluded by toJSON transform)
    res.json({
      success: true,
      message: 'Login successful',
      user: user.toJSON(),
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login'
    });
  }
});

app.get('/api/auth/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token or inactive account'
      });
    }

    res.json({
      success: true,
      user: user.toJSON()
    });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

// User assessments endpoint
app.get('/api/user/assessments', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token or inactive account'
      });
    }

    // Get user's assessments from database
    const assessments = await Assessment.find({
      user: user._id,
      status: 'completed'
    })
    .sort({ completedAt: -1 })
    .limit(20)
    .select('_id type results.overallScore results.stressLevel completedAt metadata.duration responses.facialAnalysis');

    // Transform data for frontend
    const transformedAssessments = assessments.map(assessment => ({
      id: assessment._id,
      type: assessment.type === 'standard' ? 'Stress Assessment' : 'Comprehensive Stress Assessment',
      createdAt: assessment.completedAt?.toISOString() || new Date().toISOString(),
      date: assessment.completedAt?.toISOString() || new Date().toISOString(),
      stressLevel: assessment.results?.stressLevel || 'Unknown',
      stressScore: assessment.results?.overallScore || 0,
      score: assessment.results?.overallScore || 0,
      status: 'completed',
      duration: assessment.metadata?.duration || 0,
      methods: assessment.type === 'comprehensive' && assessment.responses?.facialAnalysis
        ? ['questionnaire', 'facial_emotion']
        : ['questionnaire']
    }));

    res.json({
      success: true,
      assessments: transformedAssessments,
      total: transformedAssessments.length
    });

  } catch (error) {
    console.error('Get user assessments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user assessments'
    });
  }
});

// Assessment endpoints

// Assessment endpoints
app.post('/api/assessments/facial-emotion', async (req, res) => {
  try {
    const { imageData, userId } = req.body;

    // Validate required fields
    if (!imageData) {
      return res.status(400).json({
        success: false,
        message: 'Image data is required for facial emotion analysis'
      });
    }

    // Simulate facial emotion analysis (replace with actual AI service call)
    const emotions = {
      happy: Math.random() * 0.3 + 0.1,
      sad: Math.random() * 0.2 + 0.05,
      angry: Math.random() * 0.15 + 0.02,
      fear: Math.random() * 0.1 + 0.01,
      surprise: Math.random() * 0.1 + 0.01,
      disgust: Math.random() * 0.05 + 0.01,
      neutral: Math.random() * 0.4 + 0.2
    };

    // Normalize emotions to sum to 1
    const total = Object.values(emotions).reduce((sum, val) => sum + val, 0);
    Object.keys(emotions).forEach(key => {
      emotions[key] = emotions[key] / total;
    });

    // Determine dominant emotion
    const dominantEmotion = Object.entries(emotions)
      .reduce((max, [emotion, value]) => value > max.value ? { emotion, value } : max,
              { emotion: 'neutral', value: 0 });

    // Calculate stress indicators based on emotions
    const stressLevel = (emotions.angry + emotions.fear + emotions.sad) * 100;
    const positivityLevel = (emotions.happy + emotions.surprise) * 100;

    const analysisResult = {
      emotions,
      dominantEmotion: dominantEmotion.emotion,
      confidence: dominantEmotion.value,
      stressLevel: Math.round(stressLevel),
      positivityLevel: Math.round(positivityLevel),
      timestamp: new Date().toISOString(),
      userId
    };

    res.json({
      success: true,
      message: 'Facial emotion analysis completed',
      analysis: analysisResult
    });

  } catch (error) {
    console.error('Facial emotion analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during facial emotion analysis'
    });
  }
});

// Enhanced facial analysis endpoint using the facial emotion service
app.post('/api/assessments/facial-analysis', async (req, res) => {
  try {
    const { imageData, userId } = req.body;

    // Validate required fields
    if (!imageData) {
      return res.status(400).json({
        success: false,
        message: 'Image data is required for facial analysis'
      });
    }

    // Validate image data format
    if (!facialEmotionService.validateImageData(imageData)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image data format. Expected base64 encoded image.'
      });
    }

    // Perform facial emotion analysis
    const analysisResult = await facialEmotionService.analyzeFacialEmotion(imageData, userId);

    // Log the analysis for debugging (remove in production)
    console.log(`Facial analysis completed for user ${userId || 'anonymous'}:`, {
      dominantEmotion: analysisResult.dominantEmotion,
      stressLevel: analysisResult.stressLevel,
      confidence: analysisResult.confidence
    });

    res.json({
      success: true,
      message: 'Facial emotion analysis completed successfully',
      data: analysisResult,
      serviceStatus: facialEmotionService.getServiceStatus()
    });

  } catch (error) {
    console.error('Facial analysis endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze facial emotions',
      error: error.message
    });
  }
});

app.post('/api/assessments/comprehensive', async (req, res) => {
  try {
    const {
      userId,
      questionnaire,
      facialAnalysis,
      voiceAnalysis,
      assessmentType = 'comprehensive'
    } = req.body;

    // Validate required fields
    if (!userId || !questionnaire) {
      return res.status(400).json({
        success: false,
        message: 'User ID and questionnaire data are required'
      });
    }

    // Calculate comprehensive assessment score
    let overallScore = 0;
    let stressLevel = 'low';
    const recommendations = [];

    // Process questionnaire data
    if (questionnaire.responses) {
      const responses = Object.values(questionnaire.responses);
      const numericResponses = responses.filter(r => !isNaN(r)).map(r => parseInt(r));

      if (numericResponses.length > 0) {
        const avgScore = numericResponses.reduce((sum, val) => sum + val, 0) / numericResponses.length;
        overallScore = Math.round((avgScore / 5) * 100); // Convert to percentage
      }
    }

    // Incorporate facial analysis if available
    if (facialAnalysis && facialAnalysis.stressLevel) {
      overallScore = Math.round((overallScore + facialAnalysis.stressLevel) / 2);
    }

    // Determine stress level
    if (overallScore >= 70) {
      stressLevel = 'high';
      recommendations.push(
        'Consider speaking with a mental health professional',
        'Practice daily stress reduction techniques',
        'Ensure adequate sleep (7-9 hours per night)',
        'Contact emergency helpline if needed: 1800-599-0019'
      );
    } else if (overallScore >= 50) {
      stressLevel = 'moderate';
      recommendations.push(
        'Implement regular stress management practices',
        'Consider mindfulness or meditation',
        'Maintain regular exercise routine',
        'Ensure work-life balance'
      );
    } else {
      stressLevel = 'low';
      recommendations.push(
        'Continue current positive practices',
        'Maintain healthy lifestyle habits',
        'Stay connected with support network',
        'Regular self-check-ins recommended'
      );
    }

    // Create assessment record using existing Assessment model structure
    const assessment = new Assessment({
      user: userId,
      type: assessmentType,
      status: 'completed',
      responses: {
        questionnaire: Object.entries(questionnaire.responses || {}).map(([key, value]) => ({
          questionId: key,
          question: key.replace(/_/g, ' '),
          response: value,
          category: 'work_stress' // Use valid enum value
        })),
        facialAnalysis: facialAnalysis || null,
        voiceAnalysis: voiceAnalysis || null
      },
      results: {
        overallScore,
        stressLevel,
        confidence: 0.8,
        categoryScores: {
          workStress: Math.round(overallScore * 0.8),
          personalLife: Math.round(overallScore * 0.9),
          physicalHealth: Math.round(overallScore * 0.7),
          sleepQuality: Math.round(overallScore * 0.6),
          socialRelationships: Math.round(overallScore * 0.8),
          academicStress: Math.round(overallScore * 0.7)
        },
        insights: {
          strengths: ['Self-awareness', 'Seeking help'],
          concerns: stressLevel === 'high' ? ['High stress levels', 'Work-life balance'] : ['Moderate stress'],
          riskFactors: stressLevel === 'high' ? ['Burnout risk', 'Sleep issues'] : []
        },
        recommendations: [{
          category: 'immediate',
          priority: 'high',
          items: recommendations.slice(0, 2)
        }, {
          category: 'weekly',
          priority: 'medium',
          items: recommendations.slice(2)
        }]
      }
    });

    // Save assessment to database
    await assessment.save();

    res.status(201).json({
      success: true,
      message: 'Assessment completed successfully',
      assessment: {
        id: assessment._id,
        results: assessment.results,
        type: assessment.type
      }
    });

  } catch (error) {
    console.error('Comprehensive assessment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during assessment submission'
    });
  }
});

// Get assessment results
app.get('/api/assessments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const assessment = await Assessment.findById(id).populate('user', 'name email userType');

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    res.json({
      success: true,
      assessment
    });

  } catch (error) {
    console.error('Get assessment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error retrieving assessment'
    });
  }
});

// Get user assessments
app.get('/api/assessments/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userAssessments = await Assessment.find({ user: userId })
      .sort({ createdAt: -1 })
      .select('type results createdAt status');

    res.json({
      success: true,
      assessments: userAssessments
    });

  } catch (error) {
    console.error('Get user assessments error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error retrieving user assessments'
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'MStress Backend API',
    version: '1.0.0',
    status: 'operational',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      assessments: '/api/assessments',
      users: '/api/users'
    }
  });
});

// Google OAuth endpoints
app.post('/api/auth/google/verify', async (req, res) => {
  try {
    const { credential, clientId } = req.body;

    console.log('Google OAuth verification request received');
    console.log('Client ID:', clientId);
    console.log('Credential present:', !!credential);

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Google credential is required'
      });
    }

    // Decode the JWT token from Google (in production, verify with Google's public keys)
    let googleUser;
    try {
      const base64Url = credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      googleUser = JSON.parse(jsonPayload);
      console.log('Google user decoded:', { email: googleUser.email, name: googleUser.name });
    } catch (decodeError) {
      console.error('Error decoding Google credential:', decodeError);
      return res.status(400).json({
        success: false,
        message: 'Invalid Google credential format'
      });
    }

    // Check if user exists with Google ID
    let user = await User.findOne({ googleId: googleUser.sub });

    if (!user) {
      // Check if user exists with same email (for account linking)
      user = await User.findOne({ email: googleUser.email });

      if (user) {
        // Link Google account to existing user
        user.googleId = googleUser.sub;
        user.authProvider = 'google';
        user.profilePicture = googleUser.picture;
        await user.save();
      } else {
        // Create new user with Google account
        user = new User({
          email: googleUser.email,
          name: googleUser.name,
          googleId: googleUser.sub,
          authProvider: 'google',
          profilePicture: googleUser.picture,
          userType: 'student' // default user type
        });
        await user.save();
      }
    } else {
      // Update login info for existing Google user
      await user.updateLoginInfo();
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Google authentication successful',
      user: user.toJSON(),
      token
    });

  } catch (error) {
    console.error('Google OAuth error:', error);
    res.status(500).json({
      success: false,
      message: 'Google authentication failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Multi-modal assessment endpoint
app.post('/api/assessments/multi-modal', async (req, res) => {
  try {
    const {
      userId,
      responses,
      facialImage,
      voiceData,
      openEndedResponses
    } = req.body;

    // Validate required fields
    if (!userId || !responses) {
      return res.status(400).json({
        success: false,
        message: 'User ID and questionnaire responses are required'
      });
    }

    // Call the assessment controller
    const AssessmentController = require('./controllers/assessmentController');
    await AssessmentController.submitMultiModalAssessment(req, res);

  } catch (error) {
    console.error('Multi-modal assessment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during multi-modal assessment'
    });
  }
});

// Health check endpoint for OAuth debugging
app.get('/api/auth/google/health', (req, res) => {
  res.json({
    success: true,
    message: 'Google OAuth endpoint is available',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// User assessment endpoints
app.get('/api/user/assessments', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token or inactive account'
      });
    }

    // Fetch user's assessments (mock data for now - replace with real Assessment model later)
    const assessments = [
      {
        id: 1,
        type: 'Comprehensive Stress Assessment',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        stressLevel: 'Moderate',
        stressScore: 65,
        status: 'completed'
      },
      {
        id: 2,
        type: 'Standard Stress Assessment',
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
        stressLevel: 'Low',
        stressScore: 35,
        status: 'completed'
      },
      {
        id: 3,
        type: 'Comprehensive Stress Assessment',
        createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), // 21 days ago
        stressLevel: 'High',
        stressScore: 85,
        status: 'completed'
      }
    ];

    res.json({
      success: true,
      assessments,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Get user assessments error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

// AI Services endpoints
app.post('/api/ai/sentiment-analysis', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Text is required for sentiment analysis'
      });
    }

    // For now, return mock sentiment analysis data
    // In production, this would call the Python AI service
    const mockSentimentResult = {
      success: true,
      dominant_sentiment: text.toLowerCase().includes('stress') || text.toLowerCase().includes('anxious') ? 'negative' :
                         text.toLowerCase().includes('happy') || text.toLowerCase().includes('good') ? 'positive' : 'neutral',
      confidence: 0.85,
      sentiment_scores: {
        negative: text.toLowerCase().includes('stress') ? 0.7 : 0.2,
        neutral: 0.2,
        positive: text.toLowerCase().includes('happy') ? 0.8 : 0.1
      },
      mental_health_indicators: {
        stress_indicators_found: text.toLowerCase().includes('stress') ? ['stress'] : [],
        positive_indicators_found: text.toLowerCase().includes('happy') ? ['happy'] : [],
        stress_indicator_score: text.toLowerCase().includes('stress') ? 0.3 : 0.1,
        positive_indicator_score: text.toLowerCase().includes('happy') ? 0.4 : 0.1
      },
      stress_assessment: {
        stress_level: text.toLowerCase().includes('stress') ? 0.7 : 0.3,
        risk_factors: text.toLowerCase().includes('stress') ? ['stress'] : [],
        positive_indicators: text.toLowerCase().includes('happy') ? ['happy'] : []
      },
      analysis_metadata: {
        timestamp: new Date().toISOString(),
        model_version: 'roberta-sentiment-v1.0',
        text_length: text.length,
        processing_device: 'cpu'
      }
    };

    res.json(mockSentimentResult);

  } catch (error) {
    console.error('Sentiment analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Error performing sentiment analysis'
    });
  }
});

// Gemini AI insights endpoint
app.post('/api/ai/gemini-insights', async (req, res) => {
  try {
    const { assessmentData, userProfile } = req.body;

    if (!assessmentData) {
      return res.status(400).json({
        success: false,
        message: 'Assessment data is required'
      });
    }

    try {
      // Get the generative model
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      // Prepare the prompt with assessment data
      const prompt = `
You are a mental health AI assistant. Analyze the following assessment data and provide personalized insights and recommendations.

Assessment Data:
- Overall Score: ${assessmentData.overall_score || 'Not provided'}
- Stress Level: ${assessmentData.stress_level || 'Not provided'}
- Category Scores: ${JSON.stringify(assessmentData.category_scores || {})}
- User Type: ${userProfile?.userType || 'Not specified'}

Please provide:
1. A brief overall assessment (2-3 sentences)
2. 3-4 key findings based on the data
3. 3-4 specific, actionable recommendations with categories and priorities
4. Risk level assessment (low/moderate/high)
5. Whether professional consultation is recommended

Format your response as a JSON object with the following structure:
{
  "overall_assessment": "string",
  "key_findings": ["string1", "string2", "string3"],
  "recommendations": [
    {"category": "string", "suggestion": "string", "priority": "high/medium/low"}
  ],
  "risk_level": "low/moderate/high",
  "follow_up_recommended": boolean,
  "professional_consultation": boolean
}

Ensure recommendations are specific, actionable, and appropriate for the stress level indicated.
`;

      // Generate content
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Try to parse the JSON response
      let insights;
      try {
        // Extract JSON from the response (in case there's extra text)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          insights = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        console.warn('Failed to parse Gemini response as JSON, using fallback:', parseError.message);
        // Fallback structured response
        insights = {
          overall_assessment: "Based on your assessment results, I can provide personalized recommendations to help manage your stress levels effectively.",
          key_findings: [
            "Assessment data indicates areas that may benefit from targeted intervention",
            "Stress patterns suggest opportunities for improvement",
            "Your responses show both challenges and strengths to build upon"
          ],
          recommendations: [
            {
              category: "Stress Management",
              suggestion: "Practice deep breathing exercises for 10-15 minutes daily",
              priority: "high"
            },
            {
              category: "Lifestyle",
              suggestion: "Establish a consistent sleep schedule and routine",
              priority: "medium"
            },
            {
              category: "Self-Care",
              suggestion: "Engage in regular physical activity or movement",
              priority: "medium"
            }
          ],
          risk_level: assessmentData.stress_level || "moderate",
          follow_up_recommended: true,
          professional_consultation: (assessmentData.overall_score || 50) > 70
        };
      }

      res.json({
        success: true,
        insights: insights,
        metadata: {
          timestamp: new Date().toISOString(),
          ai_model: 'gemini-pro',
          confidence_score: 0.85
        }
      });

    } catch (aiError) {
      console.error('Gemini AI API error:', aiError);

      // Fallback response if Gemini API fails
      const fallbackInsights = {
        success: true,
        insights: {
          overall_assessment: "Based on your responses, I can provide general recommendations to help manage stress levels. For personalized insights, please ensure a stable internet connection.",
          key_findings: [
            "Assessment completed successfully",
            "General stress management strategies can be beneficial",
            "Regular self-assessment helps track progress over time"
          ],
          recommendations: [
            {
              category: "Stress Management",
              suggestion: "Practice deep breathing exercises for 10 minutes daily",
              priority: "high"
            },
            {
              category: "Sleep Hygiene",
              suggestion: "Maintain a consistent bedtime routine",
              priority: "medium"
            },
            {
              category: "Physical Wellness",
              suggestion: "Engage in regular physical activity",
              priority: "medium"
            }
          ],
          risk_level: assessmentData.stress_level || "moderate",
          follow_up_recommended: true,
          professional_consultation: (assessmentData.overall_score || 50) > 70
        },
        metadata: {
          timestamp: new Date().toISOString(),
          ai_model: 'fallback-system',
          confidence_score: 0.75
        }
      };

      res.json(fallbackInsights);
    }

  } catch (error) {
    console.error('Gemini insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating AI insights'
    });
  }
});

// Mindfulness techniques endpoint
app.post('/api/ai/mindfulness-techniques', async (req, res) => {
  try {
    const { assessmentData, userProfile } = req.body;

    if (!assessmentData) {
      return res.status(400).json({
        success: false,
        message: 'Assessment data is required'
      });
    }

    try {
      // Get the generative model
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      // Prepare the prompt for mindfulness techniques
      const prompt = `
You are a mindfulness and meditation expert. Based on the following user assessment data, generate 2-3 personalized mindfulness techniques.

Assessment Data:
- Stress Level: ${assessmentData.stress_level}
- Overall Score: ${assessmentData.overall_score}
- Assessment Count: ${assessmentData.assessment_count}
- Recent Trend: ${assessmentData.recent_trend}

Please provide mindfulness techniques that are:
1. Appropriate for the user's current stress level
2. Practical and easy to follow
3. Varied in type (breathing, body awareness, movement, etc.)

Format your response as a JSON array with the following structure:
[
  {
    "title": "Technique Name",
    "description": "Brief description of the technique",
    "duration": "X-Y minutes",
    "type": "breathing/movement/reflection/grounding/body-awareness/relaxation",
    "instructions": ["step 1", "step 2", "step 3", "step 4", "step 5"]
  }
]

Ensure techniques are evidence-based and suitable for the indicated stress level.
`;

      // Generate content
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Try to parse the JSON response
      let techniques;
      try {
        // Extract JSON from the response
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          techniques = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON array found in response');
        }
      } catch (parseError) {
        console.warn('Failed to parse Gemini mindfulness response, using fallback:', parseError.message);
        // Fallback techniques based on stress level
        techniques = getFallbackMindfulnessTechniques(assessmentData.stress_level);
      }

      res.json({
        success: true,
        techniques: techniques,
        metadata: {
          timestamp: new Date().toISOString(),
          ai_model: 'gemini-pro',
          stress_level: assessmentData.stress_level
        }
      });

    } catch (aiError) {
      console.error('Gemini AI API error for mindfulness:', aiError);

      // Fallback response
      const fallbackTechniques = getFallbackMindfulnessTechniques(assessmentData.stress_level);

      res.json({
        success: true,
        techniques: fallbackTechniques,
        metadata: {
          timestamp: new Date().toISOString(),
          ai_model: 'fallback-system',
          stress_level: assessmentData.stress_level
        }
      });
    }

  } catch (error) {
    console.error('Mindfulness techniques error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating mindfulness techniques'
    });
  }
});

// Helper function for fallback mindfulness techniques
function getFallbackMindfulnessTechniques(stressLevel) {
  const techniques = {
    low: [
      {
        title: "Gratitude Reflection",
        description: "Take a moment to appreciate three positive things from your day.",
        duration: "3-5 minutes",
        type: "reflection",
        instructions: [
          "Find a comfortable, quiet space",
          "Think of three things you're grateful for today",
          "Reflect on why each one is meaningful to you",
          "Notice how this makes you feel"
        ]
      },
      {
        title: "Mindful Walking",
        description: "A gentle walking meditation to maintain your positive state.",
        duration: "10-15 minutes",
        type: "movement",
        instructions: [
          "Walk at a slower pace than usual",
          "Focus on the sensation of your feet touching the ground",
          "Notice your surroundings without judgment",
          "Breathe naturally and stay present"
        ]
      }
    ],
    moderate: [
      {
        title: "5-Minute Breathing Space",
        description: "A quick reset technique to center yourself during busy moments.",
        duration: "5 minutes",
        type: "breathing",
        instructions: [
          "Sit comfortably and close your eyes",
          "Take three deep breaths to settle in",
          "Focus on your breath for 2 minutes",
          "Expand awareness to your whole body",
          "Set an intention for the rest of your day"
        ]
      },
      {
        title: "Body Scan Check-in",
        description: "Release tension and reconnect with your body.",
        duration: "8-10 minutes",
        type: "body-awareness",
        instructions: [
          "Lie down or sit comfortably",
          "Start at the top of your head",
          "Slowly scan down through your body",
          "Notice areas of tension without trying to change them",
          "Send breath to any tense areas"
        ]
      }
    ],
    high: [
      {
        title: "Emergency Calm Technique",
        description: "Quick grounding exercise for immediate stress relief.",
        duration: "2-3 minutes",
        type: "grounding",
        instructions: [
          "Name 5 things you can see",
          "Name 4 things you can touch",
          "Name 3 things you can hear",
          "Name 2 things you can smell",
          "Name 1 thing you can taste"
        ]
      },
      {
        title: "Progressive Muscle Release",
        description: "Systematic tension release for high stress moments.",
        duration: "10-15 minutes",
        type: "relaxation",
        instructions: [
          "Tense your fists for 5 seconds, then release",
          "Tense your arms, hold, then release",
          "Continue with shoulders, face, and body",
          "Notice the contrast between tension and relaxation",
          "End with three deep, calming breaths"
        ]
      }
    ]
  };

  return techniques[stressLevel] || techniques.moderate;
}

// Google Maps nearby clinics endpoint
app.get('/api/maps/nearby-clinics', async (req, res) => {
  try {
    const { latitude, longitude, radius = 5000 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'your_google_maps_api_key') {
      console.warn('Google Maps API key not configured, using fallback data');
      return res.json(getFallbackClinicsData(latitude, longitude, radius));
    }

    try {
      // Search for mental health facilities using Google Places API
      const searchQueries = [
        'mental health clinic',
        'psychiatrist',
        'psychologist',
        'counseling center',
        'therapy center',
        'hospital psychiatry department'
      ];

      let allPlaces = [];

      // Search for each type of mental health facility
      let apiErrors = 0;
      for (const query of searchQueries) {
        try {
          const response = await googleMapsClient.textSearch({
            params: {
              query: `${query} near ${latitude},${longitude}`,
              location: { lat: parseFloat(latitude), lng: parseFloat(longitude) },
              radius: parseInt(radius),
              key: GOOGLE_MAPS_API_KEY,
              type: 'health'
            }
          });

          if (response.data.results) {
            allPlaces = allPlaces.concat(response.data.results);
          }
        } catch (searchError) {
          console.warn(`Search failed for query "${query}":`, searchError.message);
          apiErrors++;
        }
      }

      // If all searches failed, use fallback data
      if (apiErrors === searchQueries.length) {
        console.log('All Google Places API searches failed, using fallback data');
        return res.json(getFallbackClinicsData(latitude, longitude, radius));
      }

      // Remove duplicates based on place_id
      const uniquePlaces = allPlaces.filter((place, index, self) =>
        index === self.findIndex(p => p.place_id === place.place_id)
      );

      // Sort by rating and distance
      const sortedPlaces = uniquePlaces
        .filter(place => place.rating && place.rating > 3.0) // Filter out low-rated places
        .sort((a, b) => {
          // Prioritize by rating first, then by distance
          if (Math.abs(a.rating - b.rating) > 0.5) {
            return b.rating - a.rating;
          }
          return (a.geometry?.location ? calculateDistance(
            parseFloat(latitude), parseFloat(longitude),
            a.geometry.location.lat, a.geometry.location.lng
          ) : 999) - (b.geometry?.location ? calculateDistance(
            parseFloat(latitude), parseFloat(longitude),
            b.geometry.location.lat, b.geometry.location.lng
          ) : 999);
        })
        .slice(0, 10); // Limit to top 10 results

      // If no results found, use fallback data
      if (sortedPlaces.length === 0) {
        console.log('No Google Places results found, using fallback data');
        return res.json(getFallbackClinicsData(latitude, longitude, radius));
      }

      // Format results for frontend
      const formattedClinics = await Promise.all(sortedPlaces.map(async (place, index) => {
        let phoneNumber = null;
        let website = null;

        // Get additional details for each place
        try {
          const detailsResponse = await googleMapsClient.placeDetails({
            params: {
              place_id: place.place_id,
              fields: 'formatted_phone_number,website,opening_hours,types',
              key: GOOGLE_MAPS_API_KEY
            }
          });

          if (detailsResponse.data.result) {
            phoneNumber = detailsResponse.data.result.formatted_phone_number;
            website = detailsResponse.data.result.website;
          }
        } catch (detailsError) {
          console.warn(`Failed to get details for place ${place.place_id}:`, detailsError.message);
        }

        const distance = place.geometry?.location ? calculateDistance(
          parseFloat(latitude), parseFloat(longitude),
          place.geometry.location.lat, place.geometry.location.lng
        ) : null;

        return {
          id: place.place_id,
          name: place.name,
          address: place.formatted_address || place.vicinity,
          phone: phoneNumber,
          website: website,
          rating: place.rating || 0,
          distance: distance ? `${distance.toFixed(1)} km` : 'Unknown',
          distanceValue: distance || 999,
          specialties: getSpecialtiesFromTypes(place.types || []),
          coordinates: place.geometry?.location ? {
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng
          } : null,
          isOpen: place.opening_hours?.open_now,
          priceLevel: place.price_level,
          userRatingsTotal: place.user_ratings_total || 0
        };
      }));

      res.json({
        success: true,
        clinics: formattedClinics,
        search_metadata: {
          center: { lat: parseFloat(latitude), lng: parseFloat(longitude) },
          radius: parseInt(radius),
          total_results: formattedClinics.length,
          timestamp: new Date().toISOString(),
          source: 'google_places_api'
        }
      });

    } catch (apiError) {
      console.warn('Google Places API error:', apiError.response?.status || apiError.message);

      // Fallback to enhanced clinic data if API fails
      console.log('Using enhanced fallback clinic data due to API limitations');
      return res.json(getFallbackClinicsData(latitude, longitude, radius));
    }

  } catch (error) {
    console.error('Maps API error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching nearby clinics'
    });
  }
});

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Helper function to map Google Places types to specialties
function getSpecialtiesFromTypes(types) {
  const specialtyMap = {
    'hospital': ['General Medicine', 'Emergency Care'],
    'doctor': ['Medical Consultation'],
    'health': ['Healthcare Services'],
    'establishment': ['Professional Services']
  };

  const specialties = [];
  types.forEach(type => {
    if (specialtyMap[type]) {
      specialties.push(...specialtyMap[type]);
    }
  });

  // Add default mental health specialties
  if (specialties.length === 0) {
    specialties.push('Mental Health Services', 'Counseling');
  }

  return [...new Set(specialties)]; // Remove duplicates
}

// Enhanced fallback clinic data when Google Maps API is unavailable
function getFallbackClinicsData(latitude, longitude, radius) {
  const baseRadius = parseInt(radius) / 1000; // Convert to km for distance calculation

  const allClinics = [
    {
      id: 'fallback-1',
      name: "Apollo Hospital Mental Health Center",
      address: "Sarita Vihar, New Delhi, Delhi 110076",
      phone: "+91-11-2692-5858",
      website: "https://www.apollohospitals.com",
      rating: 4.5,
      distanceValue: 2.3,
      specialties: ["Psychiatry", "Psychology", "Counseling", "Addiction Treatment"],
      coordinates: {
        lat: parseFloat(latitude) + 0.01,
        lng: parseFloat(longitude) + 0.01
      },
      isOpen: true,
      userRatingsTotal: 1250,
      priceLevel: 3
    },
    {
      id: 'fallback-2',
      name: "AIIMS Psychiatry Department",
      address: "Ansari Nagar, New Delhi, Delhi 110029",
      phone: "+91-11-2659-3333",
      website: "https://www.aiims.edu",
      rating: 4.7,
      distanceValue: 3.8,
      specialties: ["Psychiatry", "Clinical Psychology", "Neuropsychiatry"],
      coordinates: {
        lat: parseFloat(latitude) + 0.02,
        lng: parseFloat(longitude) - 0.01
      },
      isOpen: true,
      userRatingsTotal: 2100,
      priceLevel: 1
    },
    {
      id: 'fallback-3',
      name: "Fortis Mental Health Clinic",
      address: "Sector 62, Noida, Uttar Pradesh 201301",
      phone: "+91-120-500-4444",
      website: "https://www.fortishealthcare.com",
      rating: 4.3,
      distanceValue: 4.5,
      specialties: ["Psychiatry", "Addiction Medicine", "Family Therapy"],
      coordinates: {
        lat: parseFloat(latitude) - 0.01,
        lng: parseFloat(longitude) + 0.02
      },
      isOpen: false,
      userRatingsTotal: 890,
      priceLevel: 3
    },
    {
      id: 'fallback-4',
      name: "Max Hospital Psychology Department",
      address: "Patparganj, New Delhi, Delhi 110092",
      phone: "+91-11-2651-5050",
      website: "https://www.maxhealthcare.in",
      rating: 4.4,
      distanceValue: 5.2,
      specialties: ["Clinical Psychology", "Behavioral Therapy", "Child Psychology"],
      coordinates: {
        lat: parseFloat(latitude) + 0.015,
        lng: parseFloat(longitude) + 0.015
      },
      isOpen: true,
      userRatingsTotal: 756,
      priceLevel: 3
    },
    {
      id: 'fallback-5',
      name: "Manas Foundation Counseling Center",
      address: "Lajpat Nagar, New Delhi, Delhi 110024",
      phone: "+91-11-2984-7474",
      website: "https://www.manasfoundation.com",
      rating: 4.6,
      distanceValue: 6.1,
      specialties: ["Counseling", "Therapy", "Support Groups"],
      coordinates: {
        lat: parseFloat(latitude) - 0.02,
        lng: parseFloat(longitude) + 0.01
      },
      isOpen: true,
      userRatingsTotal: 432,
      priceLevel: 2
    },
    {
      id: 'fallback-6',
      name: "Vandrevala Foundation Crisis Center",
      address: "Connaught Place, New Delhi, Delhi 110001",
      phone: "+91-9999-666-555",
      website: "https://www.vandrevalafoundation.com",
      rating: 4.8,
      distanceValue: 7.3,
      specialties: ["Crisis Intervention", "24/7 Support", "Suicide Prevention"],
      coordinates: {
        lat: parseFloat(latitude) + 0.025,
        lng: parseFloat(longitude) - 0.02
      },
      isOpen: true,
      userRatingsTotal: 1890,
      priceLevel: 1
    },
    {
      id: 'fallback-7',
      name: "Medanta Mental Health Institute",
      address: "Sector 38, Gurugram, Haryana 122001",
      phone: "+91-124-414-4444",
      website: "https://www.medanta.org",
      rating: 4.2,
      distanceValue: 8.7,
      specialties: ["Psychiatry", "Neurology", "Rehabilitation"],
      coordinates: {
        lat: parseFloat(latitude) - 0.03,
        lng: parseFloat(longitude) - 0.025
      },
      isOpen: true,
      userRatingsTotal: 1120,
      priceLevel: 4
    },
    {
      id: 'fallback-8',
      name: "Tulsi Healthcare Mental Wellness",
      address: "Dwarka, New Delhi, Delhi 110075",
      phone: "+91-11-4567-8900",
      rating: 4.1,
      distanceValue: 9.5,
      specialties: ["Mental Wellness", "Stress Management", "Meditation Therapy"],
      coordinates: {
        lat: parseFloat(latitude) - 0.025,
        lng: parseFloat(longitude) - 0.03
      },
      isOpen: false,
      userRatingsTotal: 567,
      priceLevel: 2
    }
  ];

  // Filter clinics based on radius and add distance
  const filteredClinics = allClinics
    .filter(clinic => clinic.distanceValue <= baseRadius)
    .map(clinic => ({
      ...clinic,
      distance: `${clinic.distanceValue.toFixed(1)} km`
    }))
    .sort((a, b) => a.distanceValue - b.distanceValue); // Sort by distance

  return {
    success: true,
    clinics: filteredClinics,
    search_metadata: {
      center: { lat: parseFloat(latitude), lng: parseFloat(longitude) },
      radius: parseInt(radius),
      total_results: filteredClinics.length,
      timestamp: new Date().toISOString(),
      source: 'enhanced_fallback_data',
      note: 'Real-time data from Google Places API temporarily unavailable. Showing curated mental health facilities.'
    }
  };
}

// Admin middleware for authorization
const requireAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive || user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// Admin user management endpoints
app.get('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    console.log('Admin users endpoint called by:', req.user.email);

    const { page = 1, limit = 10, search = '', userType = '' } = req.query;
    const skip = (page - 1) * limit;

    // Build search query
    const searchQuery = {};
    if (search) {
      searchQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (userType) {
      searchQuery.userType = userType;
    }

    console.log('Search query:', searchQuery);

    const users = await User.find(searchQuery)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(searchQuery);

    console.log(`Found ${users.length} users, total: ${total}`);

    // Log admin action (simplified for debugging)
    try {
      await AdminLog.createLog({
        adminId: req.user._id,
        action: 'user_list_viewed',
        targetType: 'user',
        details: {
          description: `Admin viewed user list (page ${page}, ${users.length} users)`
        },
        metadata: {
          ipAddress: req.ip || 'unknown',
          userAgent: req.get('User-Agent') || 'unknown'
        },
        category: 'user_management',
        severity: 'low'
      });
    } catch (logError) {
      console.error('Admin log error (non-critical):', logError);
    }

    res.json({
      success: true,
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Create new user (admin only)
app.post('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    const { email, password, name, userType = 'student' } = req.body;

    // Validate required fields
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and name are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create user
    const user = new User({
      email: email.toLowerCase(),
      password,
      name,
      userType
    });

    await user.save();

    // Log admin action
    await AdminLog.createLog({
      adminId: req.user._id,
      action: 'user_created',
      targetType: 'user',
      targetId: user._id,
      targetIdentifier: user.email,
      details: {
        description: `Admin created new user: ${user.name} (${user.email})`,
        newValues: new Map([
          ['email', user.email],
          ['name', user.name],
          ['userType', user.userType]
        ])
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      category: 'user_management',
      severity: 'medium'
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: user.toJSON()
    });

  } catch (error) {
    console.error('Create user error:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors)[0].message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating user'
    });
  }
});

// Update user (admin only)
app.put('/api/admin/users/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, userType, isActive } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Store previous values for logging
    const previousValues = new Map([
      ['name', user.name],
      ['email', user.email],
      ['userType', user.userType],
      ['isActive', user.isActive]
    ]);

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email.toLowerCase();
    if (userType) user.userType = userType;
    if (typeof isActive === 'boolean') user.isActive = isActive;

    await user.save();

    // Log admin action
    await AdminLog.createLog({
      adminId: req.user._id,
      action: 'user_updated',
      targetType: 'user',
      targetId: user._id,
      targetIdentifier: user.email,
      details: {
        description: `Admin updated user: ${user.name} (${user.email})`,
        previousValues,
        newValues: new Map([
          ['name', user.name],
          ['email', user.email],
          ['userType', user.userType],
          ['isActive', user.isActive]
        ])
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      category: 'user_management',
      severity: 'medium'
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      user: user.toJSON()
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user'
    });
  }
});

// Delete user (admin only)
app.delete('/api/admin/users/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    // Store user info for logging before deletion
    const deletedUserInfo = {
      name: user.name,
      email: user.email,
      userType: user.userType
    };

    await User.findByIdAndDelete(id);

    // Log admin action
    await AdminLog.createLog({
      adminId: req.user._id,
      action: 'user_deleted',
      targetType: 'user',
      targetId: id,
      targetIdentifier: deletedUserInfo.email,
      details: {
        description: `Admin deleted user: ${deletedUserInfo.name} (${deletedUserInfo.email})`,
        previousValues: new Map([
          ['name', deletedUserInfo.name],
          ['email', deletedUserInfo.email],
          ['userType', deletedUserInfo.userType]
        ])
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      category: 'user_management',
      severity: 'high'
    });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user'
    });
  }
});

// Create new admin user (admin only)
app.post('/api/admin/admins', requireAdmin, async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validate required fields
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and name are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create admin user
    const adminUser = new User({
      email: email.toLowerCase(),
      password,
      name,
      userType: 'admin'
    });

    await adminUser.save();

    // Log admin action
    await AdminLog.createLog({
      adminId: req.user._id,
      action: 'user_created',
      targetType: 'user',
      targetId: adminUser._id,
      targetIdentifier: adminUser.email,
      details: {
        description: `Admin created new admin user: ${adminUser.name} (${adminUser.email})`,
        newValues: new Map([
          ['email', adminUser.email],
          ['name', adminUser.name],
          ['userType', 'admin']
        ])
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      category: 'user_management',
      severity: 'high'
    });

    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      user: adminUser.toJSON()
    });

  } catch (error) {
    console.error('Create admin error:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors)[0].message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating admin user'
    });
  }
});

// Admin user creation endpoint (for initial setup)
app.post('/api/admin/create', async (req, res) => {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'iib2024017@iiita.ac.in' });

    if (existingAdmin) {
      return res.json({
        success: true,
        message: 'Admin user already exists',
        user: existingAdmin.toJSON()
      });
    }

    // Create admin user
    const adminUser = new User({
      email: 'iib2024017@iiita.ac.in',
      password: 'Pokemon@123',
      name: 'Mridankan Mandal',
      userType: 'admin'
    });

    await adminUser.save();

    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      user: adminUser.toJSON()
    });

  } catch (error) {
    console.error('Admin creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating admin user'
    });
  }
});

// Analytics endpoints for admin dashboard
app.get('/api/analytics/user-registrations', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const registrations = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json({
      success: true,
      data: registrations
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving registration analytics'
    });
  }
});

app.get('/api/analytics/assessment-completion', async (req, res) => {
  try {
    const completionRates = await User.aggregate([
      {
        $lookup: {
          from: 'assessments',
          localField: '_id',
          foreignField: 'user',
          as: 'assessments'
        }
      },
      {
        $group: {
          _id: '$userType',
          totalUsers: { $sum: 1 },
          usersWithAssessments: {
            $sum: {
              $cond: [{ $gt: [{ $size: '$assessments' }, 0] }, 1, 0]
            }
          }
        }
      },
      {
        $project: {
          userType: '$_id',
          totalUsers: 1,
          usersWithAssessments: 1,
          completionRate: {
            $multiply: [
              { $divide: ['$usersWithAssessments', '$totalUsers'] },
              100
            ]
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: completionRates
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving completion analytics'
    });
  }
});

app.get('/api/analytics/stress-distribution', async (req, res) => {
  try {
    const stressDistribution = await Assessment.aggregate([
      {
        $match: {
          status: 'completed',
          'results.stressLevel': { $exists: true }
        }
      },
      {
        $group: {
          _id: '$results.stressLevel',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: stressDistribution
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving stress distribution analytics'
    });
  }
});

app.get('/api/analytics/platform-usage', async (req, res) => {
  try {
    const { period = 'daily' } = req.query;
    let dateFormat, daysBack;

    switch (period) {
      case 'weekly':
        dateFormat = '%Y-W%U';
        daysBack = 84; // 12 weeks
        break;
      case 'monthly':
        dateFormat = '%Y-%m';
        daysBack = 365; // 12 months
        break;
      default:
        dateFormat = '%Y-%m-%d';
        daysBack = 30; // 30 days
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const usage = await User.aggregate([
      {
        $match: {
          lastLoginAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: dateFormat, date: '$lastLoginAt' }
          },
          activeUsers: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json({
      success: true,
      data: usage
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving usage analytics'
    });
  }
});

app.get('/api/analytics/engagement-metrics', async (req, res) => {
  try {
    const metrics = await Promise.all([
      // Average assessments per user
      Assessment.aggregate([
        {
          $group: {
            _id: '$user',
            assessmentCount: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: null,
            avgAssessments: { $avg: '$assessmentCount' }
          }
        }
      ]),

      // Most active users
      Assessment.aggregate([
        {
          $group: {
            _id: '$user',
            assessmentCount: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $unwind: '$user'
        },
        {
          $project: {
            name: '$user.name',
            email: '$user.email',
            userType: '$user.userType',
            assessmentCount: 1
          }
        },
        {
          $sort: { assessmentCount: -1 }
        },
        {
          $limit: 10
        }
      ]),

      // Login frequency patterns
      User.aggregate([
        {
          $match: {
            lastLoginAt: { $exists: true }
          }
        },
        {
          $group: {
            _id: {
              $dayOfWeek: '$lastLoginAt'
            },
            loginCount: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ])
    ]);

    res.json({
      success: true,
      data: {
        averageAssessments: metrics[0][0]?.avgAssessments || 0,
        mostActiveUsers: metrics[1],
        loginPatterns: metrics[2]
      }
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving engagement metrics'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log('��� MStress Backend Server Starting...');
  console.log(`��� Server running on port ${PORT}`);
  console.log(`��� Health check: http://localhost:${PORT}/api/health`);
  console.log(`��� API Base URL: http://localhost:${PORT}/api`);
  console.log('✅ Backend server ready!');
});

module.exports = app;
