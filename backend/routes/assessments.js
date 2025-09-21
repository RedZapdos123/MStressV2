const express = require('express');
const { body, param, query } = require('express-validator');
const AssessmentController = require('../controllers/assessmentController');

const router = express.Router();

/**
 * Assessment Routes for MStress Platform
 * Handles all assessment-related API endpoints
 */

// Validation middleware
const validateAssessmentSubmission = [
    body('userId').notEmpty().withMessage('User ID is required'),
    body('responses').isArray().withMessage('Responses must be an array'),
    body('responses.*.id').notEmpty().withMessage('Response ID is required'),
    body('responses.*.value').isNumeric().withMessage('Response value must be numeric'),
    body('assessmentType').optional().isString()
];

const validateComprehensiveAssessment = [
    body('userId').notEmpty().withMessage('User ID is required'),
    body('responses').isArray().withMessage('Responses must be an array'),
    body('responses.*.id').notEmpty().withMessage('Response ID is required'),
    body('responses.*.value').isNumeric().withMessage('Response value must be numeric'),
    body('facialImage').optional().isString().withMessage('Facial image must be base64 string'),
    body('assessmentType').optional().isString()
];

const validateFacialEmotion = [
    body('imageData').notEmpty().withMessage('Image data is required'),
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
router.post('/submit', validateAssessmentSubmission, AssessmentController.submitAssessment);

/**
 * @route   POST /api/assessments/comprehensive
 * @desc    Submit a comprehensive assessment with optional facial emotion recognition
 * @access  Public (should be protected in production)
 */
router.post('/comprehensive', validateComprehensiveAssessment, AssessmentController.submitComprehensiveAssessment);

/**
 * @route   POST /api/assessments/facial-emotion
 * @desc    Analyze facial emotions from an image
 * @access  Public (should be protected in production)
 */
router.post('/facial-emotion', validateFacialEmotion, AssessmentController.analyzeFacialEmotion);

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
                    id: 'stress',
                    name: 'Stress Assessment',
                    description: 'Comprehensive stress level evaluation',
                    duration: '10-15 minutes',
                    questions: 20,
                    methods: ['questionnaire']
                },
                {
                    id: 'comprehensive_stress',
                    name: 'Comprehensive Stress Assessment',
                    description: 'Multi-modal stress assessment with facial emotion recognition',
                    duration: '15-20 minutes',
                    questions: 20,
                    methods: ['questionnaire', 'facial_emotion']
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
            comprehensive_stress: [
                // Include all stress questions plus additional ones
                {
                    id: 'comp_stress_q1',
                    text: 'How often do you feel overwhelmed by your daily responsibilities?',
                    type: 'scale',
                    scale: { min: 1, max: 5, labels: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'] },
                    category: 'general_stress',
                    weight: 1.0
                },
                {
                    id: 'comp_stress_q2',
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

module.exports = router;
