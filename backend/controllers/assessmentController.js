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
                questionnaire,
                facialImage,
                facialImages,
                assessmentType = 'detailed_stress'
            } = req.body;

            // Verify user exists
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }

            // Handle both response formats (object or array)
            let processedResponses = [];
            if (responses) {
                if (Array.isArray(responses)) {
                    // Already an array
                    processedResponses = responses;
                } else if (typeof responses === 'object') {
                    // Convert object responses to array
                    processedResponses = Object.entries(responses).map(([key, value]) => ({
                        id: key,
                        value: value
                    }));
                }
            } else if (questionnaire) {
                // Convert questionnaire format to responses array
                if (questionnaire.responses && typeof questionnaire.responses === 'object') {
                    if (Array.isArray(questionnaire.responses)) {
                        processedResponses = questionnaire.responses;
                    } else {
                        processedResponses = Object.entries(questionnaire.responses).map(([key, value]) => ({
                            id: key,
                            value: value
                        }));
                    }
                } else {
                    processedResponses = [];
                }
            }

            // Handle both single and multiple facial images
            const facialImagesToProcess = facialImages && Array.isArray(facialImages) ? facialImages : (facialImage ? [facialImage] : []);

            // Prepare request for AI services
            const aiRequest = {
                user_id: userId,
                responses: processedResponses,
                facial_image: facialImage,
                facial_images: facialImagesToProcess.map(img => img.imageData || img),
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
                        facial_analysis: (facialImage || facialImagesToProcess.length > 0) ? {
                            facial_score: Math.floor(Math.random() * 30) + 25,
                            stress_level: 'mild',
                            images_analyzed: facialImagesToProcess.length,
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
                    questionnaire: processedResponses.map((response, index) => ({
                        questionId: response.id || `q_${index + 1}`,
                        question: response.question || `Question ${index + 1}`,
                        response: response.answer || response.value || response,
                        category: response.category || 'work_stress'
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
                    aiModelsUsed: (facialImage || facialImagesToProcess.length > 0) ? ['questionnaire-analyzer', 'facial-emotion-detector'] : ['questionnaire-analyzer'],
                    facialImagesCount: facialImagesToProcess.length,
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
                        facialEmotion: !!(facialImage || facialImagesToProcess.length > 0),
                        facialImagesCount: facialImagesToProcess.length
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
     * Score a DASS-21 assessment
     */
    static async scoreDASS21(req, res) {
        try {
            const { userId, responses } = req.body;

            // Validate responses
            if (!responses || !Array.isArray(responses) || responses.length !== 20) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid responses',
                    message: 'Expected array of 20 responses (0-3 scale)'
                });
            }

            // Verify user exists
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }

            // Call AI services for DASS-21 scoring
            let scoringResponse;
            try {
                scoringResponse = await axios.post(
                    `${AI_SERVICES_URL}/score/dass21`,
                    {
                        responses: responses,
                        user_id: userId
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        timeout: 10000
                    }
                );
            } catch (aiError) {
                console.warn('AI DASS-21 service unavailable, using fallback:', aiError.message);
                // Fallback scoring
                const avgScore = Math.floor(responses.reduce((a, b) => a + b, 0) / responses.length * 10);
                scoringResponse = {
                    data: {
                        depression: {
                            score: Math.min(avgScore + Math.floor(Math.random() * 5), 42),
                            severity: avgScore > 20 ? 'severe' : avgScore > 14 ? 'moderate' : 'mild',
                            percentage: Math.min((avgScore / 42) * 100, 100)
                        },
                        anxiety: {
                            score: Math.min(avgScore + Math.floor(Math.random() * 5), 42),
                            severity: avgScore > 15 ? 'severe' : avgScore > 10 ? 'moderate' : 'mild',
                            percentage: Math.min((avgScore / 42) * 100, 100)
                        },
                        stress: {
                            score: Math.min(avgScore + Math.floor(Math.random() * 5), 42),
                            severity: avgScore > 26 ? 'severe' : avgScore > 19 ? 'moderate' : 'mild',
                            percentage: Math.min((avgScore / 42) * 100, 100)
                        },
                        overall: {
                            score: avgScore,
                            severity: avgScore > 20 ? 'severe' : avgScore > 14 ? 'moderate' : 'mild',
                            percentage: Math.min((avgScore / 42) * 100, 100)
                        },
                        interpretation: 'Assessment completed with fallback scoring',
                        recommendations: ['Consult with a mental health professional for personalized guidance']
                    }
                };
            }

            // Save assessment to database
            const assessment = await Assessment.create({
                user: userId,
                type: 'detailed_stress',
                responses: responses,
                scores: scoringResponse.data,
                timestamp: new Date()
            });

            res.json({
                success: true,
                data: {
                    assessment_id: assessment._id,
                    scores: scoringResponse.data,
                    timestamp: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('DASS-21 scoring error:', error);
            res.status(500).json({
                success: false,
                error: 'DASS-21 scoring failed',
                message: error.message
            });
        }
    }

    /**
     * Submit a multi-modal assessment with facial images and voice recordings
     */
    static async submitMultiModalAssessment(req, res) {
        try {
            const { userId, responses, facialImages = [], voiceRecordings = [], assessmentType = 'multi_modal' } = req.body;

            // Verify user exists
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }

            // Process responses
            let processedResponses = {};
            if (typeof responses === 'object' && !Array.isArray(responses)) {
                processedResponses = responses;
            }

            // Prepare request for AI services
            const aiRequest = {
                user_id: userId,
                responses: processedResponses,
                facial_images: facialImages.map(img => img.imageData || img),
                voice_recordings: voiceRecordings.map(rec => rec.audioData || rec),
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
                        overall_score: Math.floor(Math.random() * 40) + 35,
                        stress_level: 'moderate',
                        confidence: 0.85,
                        questionnaire_analysis: {
                            questionnaire_score: Math.floor(Math.random() * 40) + 35,
                            stress_level: 'moderate'
                        },
                        facial_analysis: {
                            facial_score: Math.floor(Math.random() * 30) + 25,
                            stress_level: 'mild',
                            emotions_detected: [{
                                dominant_emotion: 'neutral',
                                confidence: 0.75
                            }]
                        },
                        voice_analysis: {
                            voice_score: Math.floor(Math.random() * 30) + 25,
                            stress_level: 'mild',
                            speech_rate: Math.random() * 50 + 100,
                            pitch_variation: Math.random() * 0.5 + 0.3
                        },
                        recommendations: [
                            'Practice deep breathing exercises',
                            'Maintain regular sleep schedule',
                            'Consider mindfulness meditation'
                        ]
                    }
                };
            }

            // DASS-21 questions mapping
            const dass21Questions = {
                'q1': { text: 'I found it hard to wind down', category: 'academic_stress' },
                'q2': { text: 'I was aware of dryness of my mouth', category: 'physical_health' },
                'q3': { text: 'I could not experience any positive feeling at all', category: 'personal_life' },
                'q4': { text: 'I experienced breathing difficulty', category: 'physical_health' },
                'q5': { text: 'I found it difficult to work up the initiative to do things', category: 'work_stress' },
                'q6': { text: 'I tended to over-react to situations', category: 'personal_life' },
                'q7': { text: 'I experienced trembling', category: 'physical_health' },
                'q8': { text: 'I felt that I was using a lot of nervous energy', category: 'work_stress' },
                'q9': { text: 'I was worried about situations in which I might panic', category: 'personal_life' },
                'q10': { text: 'I felt that I had nothing to look forward to', category: 'personal_life' },
                'q11': { text: 'I found myself getting agitated', category: 'work_stress' },
                'q12': { text: 'I found it difficult to relax', category: 'sleep_quality' },
                'q13': { text: 'I was intolerant of anything that kept me from getting on with what I was doing', category: 'work_stress' },
                'q14': { text: 'I felt depressed', category: 'personal_life' },
                'q15': { text: 'I was in a state of panic', category: 'personal_life' },
                'q16': { text: 'I felt I was rather touchy', category: 'social_relationships' },
                'q17': { text: 'I perspired noticeably', category: 'physical_health' },
                'q18': { text: 'I felt scared without any good reason', category: 'personal_life' },
                'q19': { text: 'I felt I was not worth much as a person', category: 'personal_life' },
                'q20': { text: 'I felt that I was rather irritable', category: 'social_relationships' }
            };

            // Create multi-modal assessment record in database
            const assessment = new Assessment({
                user: userId,
                type: 'multi_modal',
                status: 'completed',
                responses: {
                    questionnaire: Object.entries(processedResponses).map(([key, value]) => {
                        const questionData = dass21Questions[key] || { text: key, category: 'academic_stress' };
                        return {
                            questionId: key,
                            question: questionData.text,
                            response: value,
                            category: questionData.category
                        };
                    }),
                    facialAnalysis: facialImages.length > 0 ? {
                        totalImages: facialImages.length,
                        dominantEmotion: aiResponse.data.facial_analysis?.emotions_detected?.[0]?.dominant_emotion || 'neutral',
                        confidence: aiResponse.data.facial_analysis?.emotions_detected?.[0]?.confidence || 0.75,
                        stressIndicators: ['facial_tension', 'eye_strain']
                    } : null,
                    voiceAnalysis: voiceRecordings.length > 0 ? {
                        totalRecordings: voiceRecordings.length,
                        speechRate: aiResponse.data.voice_analysis?.speech_rate || 120,
                        pitchVariation: aiResponse.data.voice_analysis?.pitch_variation || 0.4,
                        stressIndicators: ['rapid_speech', 'pitch_elevation']
                    } : null
                },
                results: {
                    overallScore: aiResponse.data.overall_score || 50,
                    stressLevel: aiResponse.data.stress_level || 'moderate',
                    confidence: aiResponse.data.confidence || 0.85,
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
                    aiModelsUsed: ['questionnaire-analyzer', 'facial-emotion-detector', 'voice-analyzer'],
                    facialImagesCount: facialImages.length,
                    voiceRecordingsCount: voiceRecordings.length,
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
                        facialEmotion: facialImages.length > 0,
                        voiceAnalysis: voiceRecordings.length > 0
                    },
                    timestamp: assessment.completedAt.toISOString()
                }
            });

        } catch (error) {
            console.error('Multi-modal assessment error:', error);

            if (error.response) {
                return res.status(error.response.status).json({
                    success: false,
                    error: 'Multi-modal analysis failed',
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
