const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const AssessmentController = require('../controllers/assessmentController');

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
 * Assessment Routes for MStress Platform
 * Handles all assessment-related API endpoints
 */

// Validation middleware - SIMPLIFIED FOR DEMO
const validateAssessmentSubmission = [
    body('userId').optional(),
    body('responses').optional(),
    body('assessmentType').optional().isString()
];

const validateComprehensiveAssessment = [
    body('userId').optional(),
    body('responses').optional(),
    body('questionnaire').optional(),
    body('facialImage').optional(),
    body('facialImages').optional(),
    body('assessmentType').optional().isString()
];

const validateFacialEmotion = [
    body('imageData')
        .notEmpty().withMessage('Image data is required')
        .isString().withMessage('Image data must be a string'),
    body('userId').optional().isString()
];

const validateUserId = [
    param('userId').notEmpty().withMessage('User ID is required')
];

const validateAssessmentId = [
    param('assessmentId').notEmpty().withMessage('Assessment ID is required')
];

/**
 * @route   POST /api/assessments/submit
 * @desc    Submit a standard questionnaire assessment
 * @access  Public (should be protected in production)
 */
router.post('/submit', validateAssessmentSubmission, handleValidationErrors, AssessmentController.submitAssessment);

/**
 * @route   POST /api/assessments/detailed
 * @desc    Submit a detailed assessment with optional facial emotion recognition
 * @access  Public (should be protected in production)
 */
router.post('/detailed', validateComprehensiveAssessment, handleValidationErrors, AssessmentController.submitComprehensiveAssessment);

/**
 * @route   POST /api/assessments/comprehensive
 * @desc    Submit a comprehensive assessment (deprecated - use /detailed)
 * @access  Public (should be protected in production)
 */
router.post('/comprehensive', validateComprehensiveAssessment, handleValidationErrors, AssessmentController.submitComprehensiveAssessment);

/**
 * @route   POST /api/assessments/facial-emotion
 * @desc    Analyze facial emotions from an image
 * @access  Public (should be protected in production)
 */
router.post('/facial-emotion', validateFacialEmotion, handleValidationErrors, AssessmentController.analyzeFacialEmotion);

/**
 * @route   GET /api/assessments/user/:userId
 * @desc    Get assessments for a specific user (test-compatible format)
 * @access  Public (should be protected in production)
 */
router.get('/user/:userId',
    validateUserId,
    handleValidationErrors,
    async (req, res) => {
        try {
            const { userId } = req.params;
            const { limit = 10, offset = 0 } = req.query;
            const Assessment = require('../models/Assessment');
            const User = require('../models/User');

            // Verify user exists
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Query assessments from database
            const assessments = await Assessment.find({
                user: userId,
                status: 'completed'
            })
            .sort({ completedAt: -1 })
            .skip(parseInt(offset))
            .limit(parseInt(limit))
            .select('_id type results.overallScore results.stressLevel completedAt metadata.duration responses.facialAnalysis');

            // Get total count for pagination
            const total = await Assessment.countDocuments({
                user: userId,
                status: 'completed'
            });

            // Transform data for frontend
            const transformedAssessments = assessments.map(assessment => ({
                id: assessment._id,
                userId: userId,
                type: assessment.type === 'standard' ? 'stress_assessment' : 'comprehensive_stress',
                score: assessment.results?.overallScore || 0,
                level: assessment.results?.stressLevel || 'unknown',
                date: assessment.completedAt?.toISOString() || new Date().toISOString(),
                methods: assessment.type === 'comprehensive' && assessment.responses?.facialAnalysis
                    ? ['questionnaire', 'facial_emotion']
                    : ['questionnaire'],
                duration: assessment.metadata?.duration || 0
            }));

            // Return in test-compatible format
            res.json({
                assessments: transformedAssessments,
                total: total,
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

        } catch (error) {
            console.error('Get assessments error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve assessments',
                error: error.message
            });
        }
    }
);

/**
 * @route   GET /api/assessments/history/:userId
 * @desc    Get assessment history for a specific user
 * @access  Public (should be protected in production)
 */
router.get('/history/:userId',
    validateUserId,
    [
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
        query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative')
    ],
    AssessmentController.getAssessmentHistory
);

/**
 * @route   GET /api/assessments/results/:assessmentId
 * @desc    Get specific assessment results
 * @access  Public (should be protected in production)
 */
router.get('/results/:assessmentId', validateAssessmentId, AssessmentController.getAssessmentResults);

/**
 * @route   GET /api/assessments/health
 * @desc    Health check for assessment services
 * @access  Public
 */
router.get('/health', AssessmentController.healthCheck);

/**
 * @route   GET /api/assessments/types
 * @desc    Get available assessment types
 * @access  Public
 */
router.get('/types', (req, res) => {
    res.json({
        success: true,
        data: {
            assessment_types: [
                {
                    id: 'standard',
                    name: 'Standard Questionnaire Assessment',
                    description: 'DASS-21 based questionnaire with sentiment analysis',
                    duration: '10-15 minutes',
                    questions: 20,
                    methods: ['questionnaire', 'sentiment_analysis']
                },
                {
                    id: 'advanced',
                    name: 'Advanced Stress Assessment',
                    description: 'Advanced questionnaire with enhanced sentiment analysis',
                    duration: '12-18 minutes',
                    questions: 20,
                    methods: ['questionnaire', 'sentiment_analysis']
                },
                {
                    id: 'detailed_stress',
                    name: 'Detailed Stress Assessment',
                    description: 'Questionnaire with automatic facial emotion recognition per question',
                    duration: '15-25 minutes',
                    questions: 20,
                    methods: ['questionnaire', 'facial_emotion', 'sentiment_analysis']
                },
                {
                    id: 'multi_modal',
                    name: 'Multi-Modal Stress Assessment',
                    description: 'Complete assessment with facial, voice, and sentiment analysis',
                    duration: '25-40 minutes',
                    questions: 20,
                    methods: ['questionnaire', 'facial_emotion', 'voice_analysis', 'sentiment_analysis']
                },
                {
                    id: 'anxiety',
                    name: 'Anxiety Screening',
                    description: 'Anxiety symptoms and severity assessment',
                    duration: '8-12 minutes',
                    questions: 15,
                    methods: ['questionnaire']
                },
                {
                    id: 'wellbeing',
                    name: 'General Wellbeing Check',
                    description: 'Overall mental health and wellbeing assessment',
                    duration: '15-20 minutes',
                    questions: 30,
                    methods: ['questionnaire']
                }
            ]
        }
    });
});

/**
 * @route   GET /api/assessments/questions/:assessmentType
 * @desc    Get questions for a specific assessment type
 * @access  Public
 */
router.get('/questions/:assessmentType', 
    param('assessmentType').notEmpty().withMessage('Assessment type is required'),
    (req, res) => {
        const { assessmentType } = req.params;
        
        // Mock questions - in production, these would come from database
        const questionSets = {
            stress: [
                {
                    id: 'stress_q1',
                    text: 'How often do you feel overwhelmed by your daily responsibilities?',
                    type: 'scale',
                    scale: { min: 1, max: 5, labels: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'] },
                    category: 'general_stress',
                    weight: 1.0
                },
                {
                    id: 'stress_q2',
                    text: 'How would you rate your current stress level?',
                    type: 'scale',
                    scale: { min: 1, max: 10, labels: ['No stress', 'Extreme stress'] },
                    category: 'general_stress',
                    weight: 1.2
                },
                {
                    id: 'stress_q3',
                    text: 'How often do you have trouble sleeping due to stress?',
                    type: 'scale',
                    scale: { min: 1, max: 5, labels: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'] },
                    category: 'sleep_stress',
                    weight: 1.0
                },
                {
                    id: 'stress_q4',
                    text: 'How satisfied are you with your work-life balance?',
                    type: 'scale',
                    scale: { min: 1, max: 5, labels: ['Very dissatisfied', 'Dissatisfied', 'Neutral', 'Satisfied', 'Very satisfied'] },
                    category: 'work_stress',
                    weight: 1.0
                },
                {
                    id: 'stress_q5',
                    text: 'What specific situations cause you the most stress? (Optional)',
                    type: 'text',
                    category: 'general_stress',
                    weight: 0.5
                }
            ],
            detailed_stress: [
                // Include all stress questions plus additional ones
                {
                    id: 'detailed_stress_q1',
                    text: 'How often do you feel overwhelmed by your daily responsibilities?',
                    type: 'scale',
                    scale: { min: 1, max: 5, labels: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'] },
                    category: 'general_stress',
                    weight: 1.0
                },
                {
                    id: 'detailed_stress_q2',
                    text: 'How comfortable are you with taking a photo for emotion analysis?',
                    type: 'scale',
                    scale: { min: 1, max: 5, labels: ['Very uncomfortable', 'Uncomfortable', 'Neutral', 'Comfortable', 'Very comfortable'] },
                    category: 'assessment_comfort',
                    weight: 0.5
                }
            ]
        };
        
        const questions = questionSets[assessmentType] || questionSets.stress;
        
        res.json({
            success: true,
            data: {
                assessment_type: assessmentType,
                questions: questions,
                total_questions: questions.length,
                estimated_duration: Math.ceil(questions.length * 0.75) + ' minutes'
            }
        });
    }
);

/**
 * @route   POST /api/assessments/score/dass21
 * @desc    Score a DASS-21 assessment with 20 MCQ responses
 * @access  Public (should be protected in production)
 */
router.post('/score/dass21', [
    body('userId').notEmpty().withMessage('User ID is required'),
    body('responses').isArray({ min: 20, max: 20 }).withMessage('Responses must be an array of exactly 20 items'),
    body('responses.*').isInt({ min: 0, max: 3 }).withMessage('Each response must be 0-3')
], handleValidationErrors, AssessmentController.scoreDASS21);

/**
 * @route   POST /api/assessments/multi-modal
 * @desc    Submit a multi-modal assessment with facial images and voice recordings
 * @access  Public (should be protected in production)
 */
router.post('/multi-modal', [
    body('userId').notEmpty().withMessage('User ID is required'),
    body('responses').isObject().withMessage('Responses must be an object'),
    body('facialImages').isArray().withMessage('Facial images must be an array'),
    body('voiceRecordings').isArray().withMessage('Voice recordings must be an array'),
    body('assessmentType').optional().isString()
], handleValidationErrors, AssessmentController.submitMultiModalAssessment);

module.exports = router;
