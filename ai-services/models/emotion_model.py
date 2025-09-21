#!/usr/bin/env python3
"""
Simple Emotion Model for MStress Platform
Provides basic facial emotion recognition capabilities
"""

import cv2
import numpy as np
import logging
from typing import Dict, List, Tuple, Optional
import time
from datetime import datetime
import json
import torch
import torch.nn as nn
import torchvision.transforms as transforms
from PIL import Image
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SimpleEmotionModel:
    """
    Simple emotion recognition model for MStress platform
    Uses OpenCV for face detection and basic emotion classification
    """
    
    def __init__(self):
        self.emotions = ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise']
        self.face_cascade = None
        self.model_loaded = False
        self.initialize_model()
    
    def initialize_model(self):
        """Initialize the emotion recognition model"""
        try:
            # Load OpenCV face cascade
            cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            self.face_cascade = cv2.CascadeClassifier(cascade_path)
            
            if self.face_cascade.empty():
                logger.warning("Could not load face cascade classifier")
                return False
            
            self.model_loaded = True
            logger.info("Simple emotion model initialized successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error initializing emotion model: {e}")
            return False
    
    def detect_faces(self, image):
        """Detect faces in the image"""
        if not self.model_loaded:
            return []
        
        try:
            # Convert to grayscale for face detection
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Detect faces
            faces = self.face_cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=5,
                minSize=(30, 30)
            )
            
            return faces
            
        except Exception as e:
            logger.error(f"Error detecting faces: {e}")
            return []
    
    def analyze_emotion(self, image_data, confidence_threshold=0.5):
        """
        Analyze emotions in the provided image
        Returns emotion analysis results
        """
        try:
            # Convert base64 or bytes to image
            if isinstance(image_data, str):
                # Handle base64 encoded image
                import base64
                image_bytes = base64.b64decode(image_data.split(',')[1] if ',' in image_data else image_data)
                nparr = np.frombuffer(image_bytes, np.uint8)
                image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            elif isinstance(image_data, bytes):
                nparr = np.frombuffer(image_data, np.uint8)
                image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            else:
                image = image_data
            
            if image is None:
                return self._create_error_response("Invalid image data")
            
            # Detect faces
            faces = self.detect_faces(image)
            
            if len(faces) == 0:
                return self._create_error_response("No faces detected in image")
            
            # For simplicity, analyze the first (largest) face
            face = max(faces, key=lambda x: x[2] * x[3])  # largest face by area
            x, y, w, h = face
            
            # Extract face region
            face_roi = image[y:y+h, x:x+w]
            
            # Simple emotion analysis (mock implementation)
            # In a real implementation, this would use a trained CNN model
            emotion_scores = self._mock_emotion_analysis(face_roi)
            
            # Get dominant emotion
            dominant_emotion = max(emotion_scores.items(), key=lambda x: x[1])
            
            # Calculate stress indicators
            stress_level = self._calculate_stress_level(emotion_scores)
            
            return {
                'success': True,
                'faces_detected': len(faces),
                'dominant_emotion': {
                    'emotion': dominant_emotion[0],
                    'confidence': dominant_emotion[1]
                },
                'emotion_scores': emotion_scores,
                'stress_indicators': {
                    'stress_level': stress_level,
                    'anxiety_score': emotion_scores.get('fear', 0) + emotion_scores.get('sad', 0),
                    'positive_mood': emotion_scores.get('happy', 0),
                    'emotional_stability': 1.0 - (emotion_scores.get('angry', 0) + emotion_scores.get('fear', 0))
                },
                'analysis_metadata': {
                    'timestamp': datetime.now().isoformat(),
                    'model_version': '1.0.0',
                    'processing_time_ms': 100  # Mock processing time
                }
            }
            
        except Exception as e:
            logger.error(f"Error analyzing emotion: {e}")
            return self._create_error_response(f"Analysis failed: {str(e)}")
    
    def _mock_emotion_analysis(self, face_roi):
        """
        Mock emotion analysis - returns random but realistic emotion scores
        In production, this would use a trained deep learning model
        """
        # Simple heuristic based on image properties
        gray_face = cv2.cvtColor(face_roi, cv2.COLOR_BGR2GRAY)
        
        # Calculate basic image statistics
        mean_intensity = np.mean(gray_face)
        std_intensity = np.std(gray_face)
        
        # Mock emotion scores based on image properties
        # This is a simplified approach for demonstration
        base_scores = {
            'neutral': 0.4,
            'happy': 0.2,
            'sad': 0.1,
            'angry': 0.1,
            'fear': 0.1,
            'surprise': 0.05,
            'disgust': 0.05
        }
        
        # Adjust scores based on image characteristics
        if mean_intensity > 120:  # Brighter images might indicate happiness
            base_scores['happy'] += 0.2
            base_scores['neutral'] -= 0.1
        elif mean_intensity < 80:  # Darker images might indicate sadness
            base_scores['sad'] += 0.2
            base_scores['neutral'] -= 0.1
        
        if std_intensity > 50:  # High contrast might indicate surprise or fear
            base_scores['surprise'] += 0.1
            base_scores['fear'] += 0.1
            base_scores['neutral'] -= 0.1
        
        # Normalize scores to sum to 1.0
        total = sum(base_scores.values())
        normalized_scores = {k: v/total for k, v in base_scores.items()}
        
        return normalized_scores
    
    def _calculate_stress_level(self, emotion_scores):
        """Calculate overall stress level from emotion scores"""
        # Stress indicators: anger, fear, sadness
        stress_emotions = ['angry', 'fear', 'sad']
        stress_score = sum(emotion_scores.get(emotion, 0) for emotion in stress_emotions)
        
        # Positive emotions reduce stress
        positive_emotions = ['happy']
        positive_score = sum(emotion_scores.get(emotion, 0) for emotion in positive_emotions)
        
        # Calculate final stress level (0-1 scale)
        stress_level = max(0, min(1, stress_score - (positive_score * 0.5)))
        
        return round(stress_level, 3)
    
    def _create_error_response(self, error_message):
        """Create standardized error response"""
        return {
            'success': False,
            'error': error_message,
            'faces_detected': 0,
            'dominant_emotion': None,
            'emotion_scores': {},
            'stress_indicators': {},
            'analysis_metadata': {
                'timestamp': datetime.now().isoformat(),
                'model_version': '1.0.0',
                'error': True
            }
        }
    
    def get_model_info(self):
        """Get information about the loaded model"""
        return {
            'model_name': 'Simple Emotion Model',
            'version': '1.0.0',
            'emotions': self.emotions,
            'loaded': self.model_loaded,
            'capabilities': [
                'face_detection',
                'emotion_recognition',
                'stress_analysis'
            ]
        }

# Global model instance
_emotion_model = None

def get_emotion_model():
    """Get or create the global emotion model instance"""
    global _emotion_model
    if _emotion_model is None:
        _emotion_model = SimpleEmotionModel()
    return _emotion_model

def analyze_facial_emotion(image_data):
    """
    Main function to analyze facial emotions
    Used by the FastAPI endpoints
    """
    model = get_emotion_model()
    return model.analyze_emotion(image_data)

def get_model_status():
    """Get the current model status"""
    model = get_emotion_model()
    return model.get_model_info()

if __name__ == "__main__":
    # Test the model
    model = SimpleEmotionModel()
    print("Model info:", model.get_model_info())
