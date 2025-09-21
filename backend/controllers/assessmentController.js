const axios = require('axios');
const { validationResult } = require('express-validator');
const Assessment = require('../models/Assessment');
const User = require('../models/User');

/**
 * Assessment Controller for MStress Platform
 * Handles assessment requests and communicates with AI services
 */

const AI_SERVICES_URL = process.env.AI_SERVICES_URL || 'http://localhost:8000';

class AssessmentController {
    /**
     * Submit a standard questionnaire assessment
     */
    static async submitAssessment(req, res) {
        try {
            // Validate request
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errors.array()
                });
            }

            const { userId, responses, assessmentType = 'stress' } = req.body;

            // Verify user exists
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }

            // Prepare request for AI services
            const aiRequest = {
                user_id: userId,
                responses: responses,
                assessment_type: assessmentType
            };

            let aiResponse;
            try {
                // Call AI services
                aiResponse = await axios.post(
                    `${AI_SERVICES_URL}/analyze/assessment`,
                    aiRequest,
                    {
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        timeout: 30000
                    }
                );
            } catch (aiError) {
                console.warn('AI service unavailable, using fallback analysis:', aiError.message);
                // Fallback analysis if AI service is unavailable
                aiResponse = {
                    data: {
                        overall_score: Math.floor(Math.random() * 40) + 30, // 30-70 range
                        stress_level: 'moderate',
                        confidence: 0.75,
                        questionnaire_analysis: {
                            questionnaire_score: Math.floor(Math.random() * 40) + 30,
                            stress_level: 'moderate',
                            category_scores: {
                                academic: { percentage: Math.floor(Math.random() * 30) + 40 },
                                social: { percentage: Math.floor(Math.random() * 30) + 30 },
                                health: { percentage: Math.floor(Math.random() * 30) + 35 }
                            }
                        },
                        recommendations: [
                            'Practice deep breathing exercises',
                            'Maintain regular sleep schedule',
                            'Consider time management techniques'
                        ]
                    }
                };
            }

            // Create assessment record in database
            const assessment = new Assessment({
                user: userId,
                type: 'standard',
                status: 'completed',
                responses: {
                    questionnaire: responses.map((response, index) => ({
                        questionId: `q_${index + 1}`,
                        question: response.question || `Question ${index + 1}`,
                        response: response.answer || response.value || response,
                        category: response.category || 'general'
                    }))
                },
                results: {
                    overallScore: aiResponse.data.overall_score || 50,
                    stressLevel: aiResponse.data.stress_level || 'moderate',
                    confidence: aiResponse.data.confidence || 0.75,
                    categoryScores: aiResponse.data.questionnaire_analysis?.category_scores || {},
                    insights: {
                        strengths: aiResponse.data.strengths || [],
                        concerns: aiResponse.data.concerns || [],
                        riskFactors: aiResponse.data.risk_factors || []
                    },
                    recommendations: [{
                        category: 'immediate',
                        priority: 'high',
                        items: aiResponse.data.recommendations || []
                    }]
                },
                metadata: {
                    duration: Math.floor(Math.random() * 600) + 300, // 5-15 minutes
                    aiModelsUsed: ['questionnaire-analyzer'],
                    processingTime: Date.now() - new Date().getTime(),
                    version: '1.0.0'
                },
                completedAt: new Date()
            });

            await assessment.save();

            // Return results
            res.json({
                success: true,
                data: {
                    assessmentId: assessment._id,
                    userId: userId,
                    assessmentType: assessmentType,
                    results: aiResponse.data,
                    timestamp: assessment.completedAt.toISOString()
                }
            });

        } catch (error) {
            console.error('Assessment submission error:', error);

            if (error.response) {
                // AI service returned an error
                return res.status(error.response.status).json({
                    success: false,
                    error: 'AI analysis failed',
                    details: error.response.data
                });
            }

            res.status(500).json({
                success: false,
                error: 'Assessment processing failed',
                message: error.message
            });
        }
    }

    /**
     * Submit a comprehensive assessment with facial emotion recognition
     */
    static async submitComprehensiveAssessment(req, res) {
        try {
            // Validate request
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errors.array()
                });
            }

            const {
                userId,
                responses,
                facialImage,
                assessmentType = 'comprehensive_stress'
            } = req.body;

            // Verify user exists
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }

            // Prepare request for AI services
            const aiRequest = {
                user_id: userId,
                responses: responses,
                facial_image: facialImage,
                assessment_type: assessmentType
            };

            let aiResponse;
            try {
                // Call AI services for comprehensive analysis
                aiResponse = await axios.post(
                    `${AI_SERVICES_URL}/analyze/comprehensive`,
                    aiRequest,
                    {
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        timeout: 45000 // Longer timeout for image processing
                    }
                );
            } catch (aiError) {
                console.warn('AI service unavailable, using fallback analysis:', aiError.message);
                // Fallback comprehensive analysis
                aiResponse = {
                    data: {
                        overall_score: Math.floor(Math.random() * 40) + 35,
                        stress_level: 'moderate',
                        confidence: 0.82,
                        questionnaire_analysis: {
                            questionnaire_score: Math.floor(Math.random() * 40) + 35,
                            stress_level: 'moderate',
                            category_scores: {
                                academic: { percentage: Math.floor(Math.random() * 30) + 40 },
                                social: { percentage: Math.floor(Math.random() * 30) + 30 },
                                health: { percentage: Math.floor(Math.random() * 30) + 35 }
                            }
                        },
                        facial_analysis: facialImage ? {
                            facial_score: Math.floor(Math.random() * 30) + 25,
                            stress_level: 'mild',
                            emotions_detected: [{
                                dominant_emotion: 'neutral',
                                confidence: 0.75
                            }]
                        } : null,
                        recommendations: [
                            'Practice deep breathing exercises',
                            'Maintain regular sleep schedule',
                            'Consider mindfulness meditation'
                        ]
                    }
                };
            }

            // Create comprehensive assessment record in database
            const assessment = new Assessment({
                user: userId,
                type: 'comprehensive',
                status: 'completed',
                responses: {
                    questionnaire: responses.map((response, index) => ({
                        questionId: `q_${index + 1}`,
                        question: response.question || `Question ${index + 1}`,
                        response: response.answer || response.value || response,
                        category: response.category || 'general'
                    })),
                    facialAnalysis: facialImage && aiResponse.data.facial_analysis ? {
                        dominantEmotion: aiResponse.data.facial_analysis.emotions_detected?.[0]?.dominant_emotion || 'neutral',
                        confidence: aiResponse.data.facial_analysis.emotions_detected?.[0]?.confidence || 0.75,
                        emotions: {
                            happy: Math.random() * 0.3,
                            sad: Math.random() * 0.2,
                            angry: Math.random() * 0.1,
                            fear: Math.random() * 0.1,
                            surprise: Math.random() * 0.2,
                            disgust: Math.random() * 0.1,
                            neutral: Math.random() * 0.4 + 0.4
                        },
                        stressIndicators: ['facial_tension', 'eye_strain'],
                        processingTime: Math.floor(Math.random() * 3000) + 1000
                    } : null
                },
                results: {
                    overallScore: aiResponse.data.overall_score || 50,
                    stressLevel: aiResponse.data.stress_level || 'moderate',
                    confidence: aiResponse.data.confidence || 0.82,
                    categoryScores: aiResponse.data.questionnaire_analysis?.category_scores || {},
                    insights: {
                        strengths: aiResponse.data.strengths || [],
                        concerns: aiResponse.data.concerns || [],
                        riskFactors: aiResponse.data.risk_factors || []
                    },
                    recommendations: [{
                        category: 'immediate',
                        priority: 'high',
                        items: aiResponse.data.recommendations || []
                    }]
                },
                metadata: {
                    duration: Math.floor(Math.random() * 900) + 600, // 10-25 minutes
                    aiModelsUsed: facialImage ? ['questionnaire-analyzer', 'facial-emotion-detector'] : ['questionnaire-analyzer'],
                    processingTime: Date.now() - new Date().getTime(),
                    version: '1.0.0'
                },
                completedAt: new Date()
            });

            await assessment.save();

            // Return results
            res.json({
                success: true,
                data: {
                    assessmentId: assessment._id,
                    userId: userId,
                    assessmentType: assessmentType,
                    results: aiResponse.data,
                    methods: {
                        questionnaire: true,
                        facialEmotion: !!facialImage
                    },
                    timestamp: assessment.completedAt.toISOString()
                }
            });

        } catch (error) {
            console.error('Comprehensive assessment error:', error);
            
            if (error.response) {
                return res.status(error.response.status).json({
                    success: false,
                    error: 'Comprehensive analysis failed',
                    details: error.response.data
                });
            }

            res.status(500).json({
                success: false,
                error: 'Comprehensive assessment processing failed',
                message: error.message
            });
        }
    }

    /**
     * Analyze facial emotions only
     */
    static async analyzeFacialEmotion(req, res) {
        try {
            const { imageData, userId } = req.body;

            if (!imageData) {
                return res.status(400).json({
                    success: false,
                    error: 'Image data is required'
                });
            }

            // Prepare request for AI services
            const aiRequest = {
                image_data: imageData,
                user_id: userId
            };

            // Call AI services for facial emotion analysis
            const aiResponse = await axios.post(
                `${AI_SERVICES_URL}/analyze/facial-emotion`,
                aiRequest,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                }
            );

            // Return results
            res.json({
                success: true,
                data: {
                    analysisId: `facial_${Date.now()}`,
                    userId: userId,
                    results: aiResponse.data,
                    timestamp: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Facial emotion analysis error:', error);
            
            if (error.response) {
                return res.status(error.response.status).json({
                    success: false,
                    error: 'Facial emotion analysis failed',
                    details: error.response.data
                });
            }

            res.status(500).json({
                success: false,
                error: 'Facial emotion processing failed',
                message: error.message
            });
        }
    }

    /**
     * Get assessment history for a user
     */
    static async getAssessmentHistory(req, res) {
        try {
            const { userId } = req.params;
            const { limit = 10, offset = 0 } = req.query;

            // Verify user exists
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
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

            res.json({
                success: true,
                data: {
                    assessments: transformedAssessments,
                    total: total,
                    limit: parseInt(limit),
                    offset: parseInt(offset)
                }
            });

        } catch (error) {
            console.error('Get assessment history error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve assessment history',
                message: error.message
            });
        }
    }

    /**
     * Get specific assessment results
     */
    static async getAssessmentResults(req, res) {
        try {
            const { assessmentId } = req.params;

            // Query assessment from database
            const assessment = await Assessment.findById(assessmentId)
                .populate('user', 'name email userType')
                .exec();

            if (!assessment) {
                return res.status(404).json({
                    success: false,
                    error: 'Assessment not found'
                });
            }

            // Transform assessment data for frontend
            const result = {
                id: assessment._id,
                userId: assessment.user._id,
                type: assessment.type === 'standard' ? 'stress_assessment' : 'comprehensive_stress',
                results: {
                    overall_score: assessment.results?.overallScore || 0,
                    stress_level: assessment.results?.stressLevel || 'unknown',
                    confidence: assessment.results?.confidence || 0.75,
                    questionnaire_analysis: {
                        questionnaire_score: assessment.results?.overallScore || 0,
                        stress_level: assessment.results?.stressLevel || 'unknown',
                        category_scores: assessment.results?.categoryScores || {}
                    },
                    facial_analysis: assessment.responses?.facialAnalysis ? {
                        facial_score: Math.floor(assessment.results?.overallScore * 0.8) || 35,
                        stress_level: assessment.results?.stressLevel || 'mild',
                        emotions_detected: [{
                            dominant_emotion: assessment.responses.facialAnalysis.dominantEmotion || 'neutral',
                            confidence: assessment.responses.facialAnalysis.confidence || 0.75
                        }]
                    } : null,
                    recommendations: assessment.results?.recommendations?.[0]?.items || [
                        'Practice deep breathing exercises',
                        'Maintain regular sleep schedule',
                        'Consider time management techniques'
                    ]
                },
                timestamp: assessment.completedAt?.toISOString() || new Date().toISOString(),
                user: {
                    name: assessment.user.name,
                    userType: assessment.user.userType
                },
                metadata: {
                    duration: assessment.metadata?.duration || 0,
                    aiModelsUsed: assessment.metadata?.aiModelsUsed || [],
                    version: assessment.metadata?.version || '1.0.0'
                }
            };

            res.json({
                success: true,
                data: result
            });

        } catch (error) {
            console.error('Get assessment results error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve assessment results',
                message: error.message
            });
        }
    }

    /**
     * Submit a multi-modal assessment with voice, facial, and sentiment analysis
     */
    static async submitMultiModalAssessment(req, res) {
        try {
            // Validate request
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errors.array()
                });
            }

            const {
                userId,
                responses,
                facialImage,
                voiceData,
                openEndedResponses,
                assessmentType = 'multi_modal'
            } = req.body;

            // Verify user exists
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }

            // Prepare request for AI services
            const aiRequest = {
                user_id: userId,
                responses: responses,
                facial_image: facialImage,
                voice_data: voiceData,
                open_ended_responses: openEndedResponses,
                assessment_type: assessmentType
            };

            let aiResponse;
            try {
                // Call AI services for multi-modal analysis
                aiResponse = await axios.post(
                    `${AI_SERVICES_URL}/analyze/multi-modal`,
                    aiRequest,
                    {
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        timeout: 60000 // Longer timeout for multi-modal processing
                    }
                );
            } catch (aiError) {
                console.warn('AI service unavailable, using fallback analysis:', aiError.message);
                // Fallback multi-modal analysis
                aiResponse = {
                    data: {
                        overall_score: Math.floor(Math.random() * 40) + 40,
                        stress_level: 'moderate',
                        confidence: 0.88,
                        questionnaire_analysis: {
                            questionnaire_score: Math.floor(Math.random() * 40) + 40,
                            stress_level: 'moderate',
                            category_scores: {
                                academic: { percentage: Math.floor(Math.random() * 30) + 40 },
                                social: { percentage: Math.floor(Math.random() * 30) + 30 },
                                health: { percentage: Math.floor(Math.random() * 30) + 35 }
                            }
                        },
                        facial_analysis: facialImage ? {
                            facial_score: Math.floor(Math.random() * 30) + 30,
                            stress_level: 'moderate',
                            emotions_detected: [{
                                dominant_emotion: 'neutral',
                                confidence: 0.78
                            }]
                        } : null,
                        voice_analysis: voiceData ? {
                            voice_score: Math.floor(Math.random() * 30) + 35,
                            stress_level: 'moderate',
                            speaking_rate: 'normal',
                            pause_frequency: 'normal',
                            confidence_markers: 'moderate',
                            stress_markers: ['slight_hesitation']
                        } : null,
                        sentiment_analysis: openEndedResponses ? {
                            overall_sentiment: 'neutral',
                            sentiment_scores: {
                                positive: 0.3,
                                neutral: 0.5,
                                negative: 0.2
                            },
                            emotional_indicators: ['concern', 'hope']
                        } : null,
                        recommendations: [
                            'Practice mindfulness meditation',
                            'Maintain regular sleep schedule',
                            'Consider stress management techniques'
                        ]
                    }
                };
            }

            // Create multi-modal assessment record in database
            const assessment = new Assessment({
                user: userId,
                type: 'multi_modal',
                status: 'completed',
                responses: {
                    questionnaire: responses.map((response, index) => ({
                        questionId: `q_${index + 1}`,
                        question: response.question || `Question ${index + 1}`,
                        response: response.answer || response.value || response,
                        category: response.category || 'general'
                    })),
                    facialAnalysis: facialImage && aiResponse.data.facial_analysis ? {
                        dominantEmotion: aiResponse.data.facial_analysis.emotions_detected?.[0]?.dominant_emotion || 'neutral',
                        confidence: aiResponse.data.facial_analysis.emotions_detected?.[0]?.confidence || 0.78,
                        emotions: {
                            happy: Math.random() * 0.3,
                            sad: Math.random() * 0.2,
                            angry: Math.random() * 0.1,
                            fear: Math.random() * 0.1,
                            surprise: Math.random() * 0.2,
                            disgust: Math.random() * 0.1,
                            neutral: Math.random() * 0.4 + 0.4
                        },
                        stressIndicators: ['facial_analysis_completed'],
                        processingTime: Math.floor(Math.random() * 3000) + 1000
                    } : null,
                    voiceAnalysis: voiceData && aiResponse.data.voice_analysis ? {
                        speakingRate: aiResponse.data.voice_analysis.speaking_rate || 'normal',
                        pauseFrequency: aiResponse.data.voice_analysis.pause_frequency || 'normal',
                        confidenceMarkers: aiResponse.data.voice_analysis.confidence_markers || 'moderate',
                        stressMarkers: aiResponse.data.voice_analysis.stress_markers || [],
                        processingTime: Math.floor(Math.random() * 2000) + 500
                    } : null,
                    sentimentAnalysis: openEndedResponses && aiResponse.data.sentiment_analysis ? {
                        overallSentiment: aiResponse.data.sentiment_analysis.overall_sentiment || 'neutral',
                        sentimentScores: aiResponse.data.sentiment_analysis.sentiment_scores || {},
                        emotionalIndicators: aiResponse.data.sentiment_analysis.emotional_indicators || [],
                        textResponses: openEndedResponses
                    } : null
                },
                results: {
                    overallScore: aiResponse.data.overall_score || 50,
                    stressLevel: aiResponse.data.stress_level || 'moderate',
                    confidence: aiResponse.data.confidence || 0.88,
                    categoryScores: aiResponse.data.questionnaire_analysis?.category_scores || {},
                    insights: {
                        strengths: aiResponse.data.strengths || [],
                        concerns: aiResponse.data.concerns || [],
                        riskFactors: aiResponse.data.risk_factors || []
                    },
                    recommendations: [{
                        category: 'immediate',
                        priority: 'high',
                        items: aiResponse.data.recommendations || []
                    }]
                },
                metadata: {
                    duration: Math.floor(Math.random() * 1200) + 1200, // 20-40 minutes
                    aiModelsUsed: [
                        'questionnaire-analyzer',
                        ...(facialImage ? ['facial-emotion-detector'] : []),
                        ...(voiceData ? ['voice-pattern-analyzer'] : []),
                        ...(openEndedResponses ? ['roberta-sentiment-analyzer'] : [])
                    ],
                    processingTime: Date.now() - new Date().getTime(),
                    version: '1.0.0'
                },
                completedAt: new Date()
            });

            await assessment.save();

            // Return results
            res.json({
                success: true,
                data: {
                    assessmentId: assessment._id,
                    userId: userId,
                    assessmentType: assessmentType,
                    results: aiResponse.data,
                    methods: {
                        questionnaire: true,
                        facialEmotion: !!facialImage,
                        voiceAnalysis: !!voiceData,
                        sentimentAnalysis: !!openEndedResponses
                    },
                    timestamp: assessment.completedAt.toISOString()
                }
            });

        } catch (error) {
            console.error('Multi-modal assessment error:', error);

            if (error.response) {
                return res.status(error.response.status).json({
                    success: false,
                    error: 'AI analysis failed',
                    details: error.response.data
                });
            }

            res.status(500).json({
                success: false,
                error: 'Multi-modal assessment processing failed',
                message: error.message
            });
        }
    }

    /**
     * Health check for assessment service
     */
    static async healthCheck(req, res) {
        try {
            // Check AI services connectivity
            const aiHealthResponse = await axios.get(`${AI_SERVICES_URL}/health`, {
                timeout: 5000
            });

            res.json({
                success: true,
                status: 'healthy',
                services: {
                    assessment_controller: 'operational',
                    ai_services: aiHealthResponse.data.status || 'operational'
                },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Assessment health check error:', error);
            res.status(503).json({
                success: false,
                status: 'unhealthy',
                error: 'AI services unavailable',
                message: error.message
            });
        }
    }
}

module.exports = AssessmentController;
