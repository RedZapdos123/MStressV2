#!/usr/bin/env python3
"""
Comprehensive Assessment Service for MStress Platform
Integrates questionnaire responses with facial emotion recognition
Provides unified stress assessment results
"""

import json
import logging
import numpy as np
import base64
from typing import Dict, List, Optional, Any
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AssessmentService:
    """
    Service for comprehensive stress assessment combining multiple modalities
    """
    
    def __init__(self):
        """Initialize the assessment service"""
        self.stress_categories = {
            'academic': ['study_pressure', 'exam_anxiety', 'workload'],
            'social': ['relationships', 'social_anxiety', 'isolation'],
            'financial': ['money_concerns', 'job_security', 'debt'],
            'health': ['physical_health', 'mental_health', 'sleep'],
            'work': ['job_stress', 'work_life_balance', 'career_concerns']
        }
        
        self.emotion_stress_mapping = {
            'angry': 0.8,
            'fear': 0.9,
            'sad': 0.7,
            'disgust': 0.6,
            'surprise': 0.4,
            'happy': 0.1,
            'neutral': 0.3
        }
    
    def analyze_questionnaire_responses(self, responses: List[Dict]) -> Dict:
        """
        Analyze questionnaire responses for stress indicators
        
        Args:
            responses: List of questionnaire responses
            
        Returns:
            Dictionary with questionnaire analysis results
        """
        try:
            if not responses:
                return {
                    'questionnaire_score': 0,
                    'stress_level': 'unknown',
                    'category_scores': {},
                    'analysis': 'No questionnaire responses provided'
                }
            
            total_score = 0
            max_possible_score = 0
            category_scores = {}
            
            # Initialize category scores
            for category in self.stress_categories:
                category_scores[category] = {'score': 0, 'max_score': 0, 'count': 0}
            
            # Process each response
            for response in responses:
                question_id = response.get('id', '')
                value = response.get('value', 0)
                weight = response.get('weight', 1.0)
                scale_max = response.get('scale_max', 5)
                category = response.get('category', 'general')
                
                # Calculate weighted score
                weighted_score = value * weight
                max_weighted_score = scale_max * weight
                
                total_score += weighted_score
                max_possible_score += max_weighted_score
                
                # Update category scores
                if category in category_scores:
                    category_scores[category]['score'] += weighted_score
                    category_scores[category]['max_score'] += max_weighted_score
                    category_scores[category]['count'] += 1
            
            # Calculate normalized scores
            overall_score = (total_score / max_possible_score * 100) if max_possible_score > 0 else 0
            
            # Calculate category percentages
            for category in category_scores:
                if category_scores[category]['max_score'] > 0:
                    category_scores[category]['percentage'] = (
                        category_scores[category]['score'] / 
                        category_scores[category]['max_score'] * 100
                    )
                else:
                    category_scores[category]['percentage'] = 0
            
            # Determine stress level
            if overall_score >= 75:
                stress_level = 'high'
            elif overall_score >= 50:
                stress_level = 'moderate'
            elif overall_score >= 25:
                stress_level = 'mild'
            else:
                stress_level = 'low'
            
            return {
                'questionnaire_score': round(overall_score, 2),
                'stress_level': stress_level,
                'category_scores': category_scores,
                'total_responses': len(responses),
                'analysis': f"Analyzed {len(responses)} questionnaire responses"
            }
            
        except Exception as e:
            logger.error(f"Error analyzing questionnaire responses: {e}")
            return {
                'questionnaire_score': 0,
                'stress_level': 'unknown',
                'category_scores': {},
                'analysis': f'Error in questionnaire analysis: {str(e)}'
            }
    
    def analyze_facial_emotions(self, image_data: str) -> Dict:
        """
        Analyze facial emotions from image data using enhanced ElenaRyumina model
        
        Args:
            image_data: Base64 encoded image string
            
        Returns:
            Dictionary with facial emotion analysis results
        """
        try:
            # Import facial emotion service
            try:
                from .facial_emotion_service import facial_emotion_service
                
                # Decode base64 image
                import cv2
                import numpy as np
                
                image_bytes = base64.b64decode(image_data.split(',')[1] if ',' in image_data else image_data)
                image_array = np.frombuffer(image_bytes, np.uint8)
                image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
                
                if image is None:
                    raise ValueError("Invalid image data")
                
                # Analyze emotions using facial emotion service
                emotion_results = facial_emotion_service.analyze_frame(image)
                stress_assessment = facial_emotion_service.calculate_stress_level(emotion_results)
                
                result = {
                    'success': True,
                    'emotions': emotion_results,
                    'stress_assessment': stress_assessment
                }
                
            except ImportError:
                logger.warning("Facial emotion service not available")
                return {
                    'facial_score': 0,
                    'stress_level': 'unknown',
                    'emotions_detected': [],
                    'analysis': 'Facial emotion service not available'
                }
            
            if not result.get('success', False):
                return {
                    'facial_score': 0,
                    'stress_level': 'unknown',
                    'emotions_detected': [],
                    'analysis': result.get('error', 'Failed to analyze facial emotions')
                }
            
            # Extract emotion data
            emotions = result.get('emotions', [])
            stress_assessment = result.get('stress_assessment', {})
            
            return {
                'facial_score': stress_assessment.get('stress_score', 0),
                'stress_level': stress_assessment.get('stress_level', 'unknown'),
                'emotions_detected': emotions,
                'faces_detected': result.get('faces_detected', 0),
                'confidence': stress_assessment.get('confidence', 0),
                'analysis': stress_assessment.get('analysis', 'Facial emotion analysis completed')
            }
            
        except Exception as e:
            logger.error(f"Error analyzing facial emotions: {e}")
            return {
                'facial_score': 0,
                'stress_level': 'unknown',
                'emotions_detected': [],
                'analysis': f'Error in facial emotion analysis: {str(e)}'
            }
    
    def generate_comprehensive_assessment(self, 
                                        questionnaire_responses: List[Dict],
                                        facial_image_data: Optional[str] = None) -> Dict:
        """
        Generate comprehensive assessment combining questionnaire and facial analysis
        
        Args:
            questionnaire_responses: List of questionnaire responses
            facial_image_data: Optional base64 encoded image for facial analysis
            
        Returns:
            Dictionary with comprehensive assessment results
        """
        try:
            # Analyze questionnaire responses
            questionnaire_analysis = self.analyze_questionnaire_responses(questionnaire_responses)
            
            # Analyze facial emotions if image provided
            facial_analysis = None
            if facial_image_data:
                facial_analysis = self.analyze_facial_emotions(facial_image_data)
            
            # Combine results
            combined_score = questionnaire_analysis['questionnaire_score']
            combined_confidence = 1.0
            
            if facial_analysis and facial_analysis['facial_score'] > 0:
                # Weight questionnaire more heavily (70%) than facial analysis (30%)
                questionnaire_weight = 0.7
                facial_weight = 0.3
                
                combined_score = (
                    questionnaire_analysis['questionnaire_score'] * questionnaire_weight +
                    facial_analysis['facial_score'] * facial_weight
                )
                
                # Average confidence
                combined_confidence = (
                    1.0 * questionnaire_weight +
                    facial_analysis['confidence'] * facial_weight
                )
            
            # Determine final stress level
            if combined_score >= 75:
                final_stress_level = 'high'
            elif combined_score >= 50:
                final_stress_level = 'moderate'
            elif combined_score >= 25:
                final_stress_level = 'mild'
            else:
                final_stress_level = 'low'
            
            # Generate recommendations
            recommendations = self.generate_recommendations(
                final_stress_level, 
                questionnaire_analysis.get('category_scores', {}),
                facial_analysis
            )
            
            return {
                'overall_score': round(combined_score, 2),
                'stress_level': final_stress_level,
                'confidence': round(combined_confidence, 2),
                'questionnaire_analysis': questionnaire_analysis,
                'facial_analysis': facial_analysis,
                'recommendations': recommendations,
                'assessment_methods': {
                    'questionnaire': True,
                    'facial_emotion': facial_analysis is not None
                },
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error generating comprehensive assessment: {e}")
            return {
                'overall_score': 0,
                'stress_level': 'unknown',
                'confidence': 0,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    def generate_recommendations(self, 
                               stress_level: str, 
                               category_scores: Dict,
                               facial_analysis: Optional[Dict] = None) -> List[str]:
        """
        Generate personalized recommendations based on assessment results
        
        Args:
            stress_level: Overall stress level
            category_scores: Scores by stress category
            facial_analysis: Optional facial emotion analysis results
            
        Returns:
            List of personalized recommendations
        """
        recommendations = []
        
        try:
            # Base recommendations by stress level
            if stress_level == 'high':
                recommendations.extend([
                    "Consider speaking with a mental health professional",
                    "Practice deep breathing exercises for 10-15 minutes daily",
                    "Ensure you're getting 7-9 hours of quality sleep",
                    "Try progressive muscle relaxation techniques"
                ])
            elif stress_level == 'moderate':
                recommendations.extend([
                    "Practice mindfulness or meditation for 10-15 minutes daily",
                    "Maintain a regular sleep schedule",
                    "Take short breaks throughout your day",
                    "Try stress-reducing activities like yoga or walking"
                ])
            elif stress_level == 'mild':
                recommendations.extend([
                    "Continue current stress management practices",
                    "Maintain work-life balance",
                    "Stay physically active",
                    "Practice gratitude exercises"
                ])
            else:
                recommendations.extend([
                    "Maintain your current healthy lifestyle",
                    "Continue regular exercise and good sleep habits",
                    "Stay connected with your support network"
                ])
            
            # Category-specific recommendations
            for category, scores in category_scores.items():
                if scores.get('percentage', 0) >= 70:
                    if category == 'academic':
                        recommendations.append("Consider time management techniques for academic workload")
                    elif category == 'social':
                        recommendations.append("Focus on building supportive social connections")
                    elif category == 'financial':
                        recommendations.append("Consider financial planning or counseling resources")
                    elif category == 'health':
                        recommendations.append("Prioritize physical and mental health self-care")
                    elif category == 'work':
                        recommendations.append("Explore work-life balance strategies")
            
            # Facial emotion-based recommendations
            if facial_analysis and facial_analysis.get('emotions_detected'):
                dominant_emotions = [
                    emotion.get('dominant_emotion', '') 
                    for emotion in facial_analysis['emotions_detected']
                ]
                
                if 'angry' in dominant_emotions:
                    recommendations.append("Practice anger management techniques")
                if 'sad' in dominant_emotions:
                    recommendations.append("Consider mood-boosting activities and social support")
                if 'fear' in dominant_emotions:
                    recommendations.append("Try anxiety reduction techniques like grounding exercises")
            
            # Remove duplicates and limit to top recommendations
            recommendations = list(dict.fromkeys(recommendations))[:8]
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error generating recommendations: {e}")
            return [
                "Practice deep breathing exercises",
                "Maintain regular sleep schedule",
                "Stay physically active",
                "Consider speaking with a mental health professional if needed"
            ]

# Global service instance
assessment_service = AssessmentService()
