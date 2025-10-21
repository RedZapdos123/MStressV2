"""
RoBERTa-based Sentiment Analysis Service
Provides sentiment analysis using the RoBERTa model from Hugging Face
"""

import logging
from typing import Dict, Optional
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import numpy as np

logger = logging.getLogger(__name__)

class RoBERTaSentimentAnalyzer:
    """
    Sentiment analyzer using RoBERTa model
    Supports both English and multilingual analysis
    """
    
    def __init__(self, model_name: str = "cardiffnlp/twitter-roberta-base-sentiment-latest"):
        """
        Initialize RoBERTa sentiment analyzer
        
        Args:
            model_name: Hugging Face model identifier
        """
        self.model_name = model_name
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.tokenizer = None
        self.model = None
        self.id2label = None
        self.label2id = None
        self._initialize_model()
    
    def _initialize_model(self):
        """Initialize the RoBERTa model and tokenizer"""
        try:
            logger.info(f"Loading RoBERTa model: {self.model_name}")
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
            self.model = AutoModelForSequenceClassification.from_pretrained(self.model_name)
            self.model.to(self.device)
            self.model.eval()
            
            # Get label mappings
            self.id2label = self.model.config.id2label
            self.label2id = self.model.config.label2id
            
            logger.info(f"✓ RoBERTa model loaded successfully on {self.device}")
        except Exception as e:
            logger.error(f"Failed to load RoBERTa model: {e}")
            raise
    
    def analyze_sentiment(self, text: str) -> Dict:
        """
        Analyze sentiment of input text
        
        Args:
            text: Input text to analyze
            
        Returns:
            Dictionary with sentiment analysis results
        """
        try:
            if not text or not text.strip():
                return {
                    "sentiment": "neutral",
                    "score": 0.0,
                    "confidence": 0.0,
                    "error": "Empty text provided"
                }
            
            # Tokenize input
            inputs = self.tokenizer(
                text,
                return_tensors="pt",
                truncation=True,
                max_length=512,
                padding=True
            ).to(self.device)
            
            # Get predictions
            with torch.no_grad():
                outputs = self.model(**inputs)
                logits = outputs.logits
                probabilities = torch.softmax(logits, dim=-1)
            
            # Get the predicted label and confidence
            predicted_label_id = torch.argmax(logits, dim=-1).item()
            predicted_label = self.id2label[predicted_label_id]
            confidence = probabilities[0][predicted_label_id].item()
            
            # Map to standard sentiment labels
            sentiment_mapping = {
                "negative": "negative",
                "neutral": "neutral",
                "positive": "positive"
            }
            
            sentiment = sentiment_mapping.get(predicted_label.lower(), "neutral")
            
            # Calculate sentiment score (-1 to 1)
            if sentiment == "positive":
                score = confidence
            elif sentiment == "negative":
                score = -confidence
            else:
                score = 0.0
            
            return {
                "sentiment": sentiment,
                "score": float(score),
                "confidence": float(confidence),
                "label": predicted_label,
                "all_scores": {
                    self.id2label[i]: float(probabilities[0][i].item())
                    for i in range(len(self.id2label))
                }
            }
        
        except Exception as e:
            logger.error(f"Error analyzing sentiment: {e}")
            return {
                "sentiment": "neutral",
                "score": 0.0,
                "confidence": 0.0,
                "error": str(e)
            }
    
    def analyze_batch(self, texts: list) -> list:
        """
        Analyze sentiment for multiple texts
        
        Args:
            texts: List of texts to analyze
            
        Returns:
            List of sentiment analysis results
        """
        results = []
        for text in texts:
            results.append(self.analyze_sentiment(text))
        return results
    
    def get_model_info(self) -> Dict:
        """Get information about the loaded model"""
        return {
            "model_name": self.model_name,
            "device": self.device,
            "labels": self.id2label,
            "model_type": "RoBERTa",
            "status": "ready"
        }


# Global instance
_sentiment_analyzer = None

def get_sentiment_analyzer() -> RoBERTaSentimentAnalyzer:
    """Get or create the global sentiment analyzer instance"""
    global _sentiment_analyzer
    if _sentiment_analyzer is None:
        _sentiment_analyzer = RoBERTaSentimentAnalyzer()
    return _sentiment_analyzer

def analyze_text_sentiment(text: str) -> Dict:
    """Analyze sentiment of text using RoBERTa"""
    analyzer = get_sentiment_analyzer()
    return analyzer.analyze_sentiment(text)

def analyze_multiple_texts_sentiment(texts: list) -> list:
    """Analyze sentiment of multiple texts"""
    analyzer = get_sentiment_analyzer()
    return analyzer.analyze_batch(texts)

def get_sentiment_service_info() -> Dict:
    """Get sentiment service information"""
    analyzer = get_sentiment_analyzer()
    return analyzer.get_model_info()

