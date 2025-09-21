#!/usr/bin/env python3
"""
Enhanced Sentiment Analysis Service for MStress Platform
Integrates RoBERTa model for advanced text sentiment analysis
Supports mental health assessment and stress detection
"""

import logging
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from typing import Dict, List, Optional, Union
import numpy as np
from datetime import datetime
import os
from pathlib import Path
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SentimentAnalysisService:
    """
    Advanced sentiment analysis service using RoBERTa model
    Designed for mental health and stress assessment applications
    """
    
    def __init__(self, model_path: Optional[str] = None):
        """
        Initialize the sentiment analysis service
        
        Args:
            model_path: Path to the RoBERTa sentiment model
        """
        self.model_path = model_path or "models/roberta_sentiment"
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
        # Sentiment labels for mental health context
        self.sentiment_labels = {
            0: 'negative',
            1: 'neutral', 
            2: 'positive'
        }
        
        # Mental health indicators
        self.stress_keywords = [
            'stressed', 'anxious', 'worried', 'overwhelmed', 'depressed',
            'sad', 'angry', 'frustrated', 'tired', 'exhausted', 'hopeless',
            'lonely', 'isolated', 'panic', 'fear', 'nervous', 'tense'
        ]
        
        self.positive_keywords = [
            'happy', 'joy', 'excited', 'grateful', 'peaceful', 'calm',
            'confident', 'optimistic', 'motivated', 'energetic', 'content',
            'relaxed', 'satisfied', 'hopeful', 'proud', 'accomplished'
        ]
        
        self.tokenizer = None
        self.model = None
        self.is_initialized = False
        
        # Initialize the service
        self.initialize()
    
    def initialize(self):
        """Initialize the RoBERTa sentiment analysis model"""
        try:
            # Check if model directory exists
            if not os.path.exists(self.model_path):
                logger.warning(f"Model path {self.model_path} not found, using fallback")
                self.is_initialized = False
                return False
            
            # Load tokenizer and model
            self.tokenizer = AutoTokenizer.from_pretrained(
                self.model_path,
                local_files_only=True
            )
            
            self.model = AutoModelForSequenceClassification.from_pretrained(
                self.model_path,
                local_files_only=True
            )
            
            # Move model to device
            self.model.to(self.device)
            self.model.eval()
            
            self.is_initialized = True
            logger.info(f"RoBERTa sentiment model loaded successfully from {self.model_path}")
            return True
            
        except Exception as e:
            logger.error(f"Error initializing sentiment model: {e}")
            self.is_initialized = False
            return False
    
    def analyze_sentiment(self, text: str) -> Dict:
        """
        Analyze sentiment of input text
        
        Args:
            text: Input text to analyze
            
        Returns:
            Dictionary with sentiment analysis results
        """
        try:
            if not self.is_initialized:
                return self._get_fallback_sentiment(text)
            
            # Preprocess text
            text = self._preprocess_text(text)
            
            # Tokenize input
            inputs = self.tokenizer(
                text,
                return_tensors="pt",
                truncation=True,
                padding=True,
                max_length=512
            )
            
            # Move inputs to device
            inputs = {k: v.to(self.device) for k, v in inputs.items()}
            
            # Get predictions
            with torch.no_grad():
                outputs = self.model(**inputs)
                predictions = torch.nn.functional.softmax(outputs.logits, dim=-1)
                predicted_class = torch.argmax(predictions, dim=-1).item()
                confidence_scores = predictions.cpu().numpy()[0]
            
            # Create sentiment results
            sentiment_scores = {}
            for idx, label in self.sentiment_labels.items():
                sentiment_scores[label] = float(confidence_scores[idx])
            
            dominant_sentiment = self.sentiment_labels[predicted_class]
            confidence = float(confidence_scores[predicted_class])
            
            # Analyze mental health indicators
            mental_health_analysis = self._analyze_mental_health_indicators(text)
            
            # Calculate stress level
            stress_level = self._calculate_stress_level(sentiment_scores, mental_health_analysis)
            
            return {
                'success': True,
                'dominant_sentiment': dominant_sentiment,
                'confidence': confidence,
                'sentiment_scores': sentiment_scores,
                'mental_health_indicators': mental_health_analysis,
                'stress_assessment': {
                    'stress_level': stress_level,
                    'risk_factors': mental_health_analysis.get('risk_factors', []),
                    'positive_indicators': mental_health_analysis.get('positive_indicators', [])
                },
                'analysis_metadata': {
                    'timestamp': datetime.now().isoformat(),
                    'model_version': 'roberta-sentiment-v1.0',
                    'text_length': len(text),
                    'processing_device': str(self.device)
                }
            }
            
        except Exception as e:
            logger.error(f"Error analyzing sentiment: {e}")
            return self._get_fallback_sentiment(text, error=str(e))
    
    def analyze_multiple_texts(self, texts: List[str]) -> List[Dict]:
        """
        Analyze sentiment for multiple texts
        
        Args:
            texts: List of texts to analyze
            
        Returns:
            List of sentiment analysis results
        """
        results = []
        for i, text in enumerate(texts):
            try:
                result = self.analyze_sentiment(text)
                result['text_id'] = i
                results.append(result)
            except Exception as e:
                logger.error(f"Error analyzing text {i}: {e}")
                results.append(self._get_fallback_sentiment(text, error=str(e)))
        
        return results
    
    def _preprocess_text(self, text: str) -> str:
        """Preprocess text for sentiment analysis"""
        if not text or not isinstance(text, str):
            return ""
        
        # Basic text cleaning
        text = text.strip()
        text = ' '.join(text.split())  # Remove extra whitespace
        
        return text
    
    def _analyze_mental_health_indicators(self, text: str) -> Dict:
        """Analyze mental health indicators in text"""
        text_lower = text.lower()
        
        # Find stress indicators
        stress_indicators = [word for word in self.stress_keywords if word in text_lower]
        positive_indicators = [word for word in self.positive_keywords if word in text_lower]
        
        # Calculate indicator scores
        stress_score = len(stress_indicators) / max(len(text.split()), 1)
        positive_score = len(positive_indicators) / max(len(text.split()), 1)
        
        return {
            'stress_indicators_found': stress_indicators,
            'positive_indicators_found': positive_indicators,
            'stress_indicator_score': round(stress_score, 3),
            'positive_indicator_score': round(positive_score, 3),
            'risk_factors': stress_indicators[:3],  # Top 3 risk factors
            'positive_indicators': positive_indicators[:3]  # Top 3 positive indicators
        }
    
    def _calculate_stress_level(self, sentiment_scores: Dict, mental_health_analysis: Dict) -> float:
        """Calculate overall stress level from sentiment and mental health indicators"""
        # Base stress from sentiment
        negative_sentiment = sentiment_scores.get('negative', 0)
        positive_sentiment = sentiment_scores.get('positive', 0)
        
        # Stress from sentiment (0-1 scale)
        sentiment_stress = negative_sentiment - (positive_sentiment * 0.5)
        
        # Stress from keywords
        keyword_stress = mental_health_analysis.get('stress_indicator_score', 0)
        positive_keywords = mental_health_analysis.get('positive_indicator_score', 0)
        
        # Combined stress level
        combined_stress = (sentiment_stress * 0.7) + (keyword_stress * 0.3) - (positive_keywords * 0.2)
        
        # Normalize to 0-1 scale
        stress_level = max(0, min(1, combined_stress))
        
        return round(stress_level, 3)
    
    def _get_fallback_sentiment(self, text: str, error: Optional[str] = None) -> Dict:
        """Get fallback sentiment analysis when model is unavailable"""
        # Simple keyword-based sentiment analysis
        text_lower = text.lower() if text else ""
        
        stress_count = sum(1 for word in self.stress_keywords if word in text_lower)
        positive_count = sum(1 for word in self.positive_keywords if word in text_lower)
        
        if stress_count > positive_count:
            dominant_sentiment = 'negative'
            confidence = 0.6
            sentiment_scores = {'negative': 0.6, 'neutral': 0.3, 'positive': 0.1}
        elif positive_count > stress_count:
            dominant_sentiment = 'positive'
            confidence = 0.6
            sentiment_scores = {'negative': 0.1, 'neutral': 0.3, 'positive': 0.6}
        else:
            dominant_sentiment = 'neutral'
            confidence = 0.5
            sentiment_scores = {'negative': 0.25, 'neutral': 0.5, 'positive': 0.25}
        
        return {
            'success': False if error else True,
            'dominant_sentiment': dominant_sentiment,
            'confidence': confidence,
            'sentiment_scores': sentiment_scores,
            'mental_health_indicators': {
                'stress_indicators_found': [word for word in self.stress_keywords if word in text_lower],
                'positive_indicators_found': [word for word in self.positive_keywords if word in text_lower],
                'stress_indicator_score': stress_count / max(len(text.split()), 1) if text else 0,
                'positive_indicator_score': positive_count / max(len(text.split()), 1) if text else 0
            },
            'stress_assessment': {
                'stress_level': min(1, stress_count * 0.2),
                'risk_factors': [],
                'positive_indicators': []
            },
            'analysis_metadata': {
                'timestamp': datetime.now().isoformat(),
                'model_version': 'fallback-v1.0',
                'text_length': len(text) if text else 0,
                'fallback_reason': error or 'Model not available'
            }
        }
    
    def get_service_info(self) -> Dict:
        """Get information about the sentiment analysis service"""
        return {
            'service_name': 'Enhanced Sentiment Analysis Service',
            'model_type': 'RoBERTa',
            'version': '1.0.0',
            'initialized': self.is_initialized,
            'model_path': self.model_path,
            'device': str(self.device),
            'supported_languages': ['English'],
            'capabilities': [
                'sentiment_analysis',
                'mental_health_indicators',
                'stress_assessment',
                'batch_processing'
            ]
        }

# Global service instance
_sentiment_service = None

def get_sentiment_service():
    """Get or create the global sentiment analysis service instance"""
    global _sentiment_service
    if _sentiment_service is None:
        _sentiment_service = SentimentAnalysisService()
    return _sentiment_service

def analyze_text_sentiment(text: str):
    """
    Main function to analyze text sentiment
    Used by FastAPI endpoints
    """
    service = get_sentiment_service()
    return service.analyze_sentiment(text)

def analyze_multiple_texts_sentiment(texts: List[str]):
    """
    Analyze sentiment for multiple texts
    Used by FastAPI endpoints
    """
    service = get_sentiment_service()
    return service.analyze_multiple_texts(texts)

def get_sentiment_service_info():
    """Get sentiment service information"""
    service = get_sentiment_service()
    return service.get_service_info()

if __name__ == "__main__":
    # Test the service
    service = SentimentAnalysisService()
    test_text = "I feel really stressed and anxious about my upcoming exams"
    result = service.analyze_sentiment(test_text)
    print("Sentiment analysis result:", json.dumps(result, indent=2))
