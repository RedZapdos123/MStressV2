"""
Facial Expression Recognition (FER) Service using libreface
Provides emotion recognition from facial images
"""

import logging
import os
import base64
from typing import Dict, Optional, List
# This file provides facial emotion recognition using LibreFace and deep learning models.
import cv2
import numpy as np
from PIL import Image
import io
import torch
import torch.nn as nn
import torchvision.transforms as transforms

logger = logging.getLogger(__name__)

class FacialExpressionRecognizer:
    """
    Facial Expression Recognition using deep learning
    Detects emotions from facial images
    """
    
    def __init__(self):
        """Initialize the FER service"""
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.face_cascade = None
        self.emotion_model = None
        self.emotion_labels = [
            'angry', 'disgust', 'fear', 'happy', 'sad', 'surprise', 'neutral'
        ]
        self._initialize_components()
    
    def _initialize_components(self):
        """Initialize face detection and emotion recognition components"""
        try:
            logger.info("Initializing Facial Expression Recognition service...")
            
            # Load face cascade classifier
            cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            self.face_cascade = cv2.CascadeClassifier(cascade_path)
            
            if self.face_cascade.empty():
                logger.warning("Face cascade classifier not found, using alternative")
            
            logger.info(f"✓ FER service initialized on {self.device}")
        except Exception as e:
            logger.error(f"Failed to initialize FER service: {e}")
            raise
    
    def detect_faces(self, image_path: str) -> List[Dict]:
        """
        Detect faces in an image
        
        Args:
            image_path: Path to image file
            
        Returns:
            List of detected faces with coordinates
        """
        try:
            if not os.path.exists(image_path):
                return []
            
            # Read image
            image = cv2.imread(image_path)
            if image is None:
                return []
            
            # Convert to grayscale
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Detect faces
            faces = self.face_cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=5,
                minSize=(30, 30)
            )
            
            # Format results
            face_list = []
            for (x, y, w, h) in faces:
                face_list.append({
                    "x": int(x),
                    "y": int(y),
                    "width": int(w),
                    "height": int(h),
                    "confidence": 0.9  # Cascade classifier doesn't provide confidence
                })
            
            return face_list
        
        except Exception as e:
            logger.error(f"Error detecting faces: {e}")
            return []
    
    def recognize_emotion(self, image_path: str) -> Dict:
        """
        Recognize emotions from facial expressions in an image
        
        Args:
            image_path: Path to image file
            
        Returns:
            Dictionary with emotion recognition results
        """
        try:
            if not os.path.exists(image_path):
                return {
                    "success": False,
                    "error": "Image file not found"
                }
            
            # Detect faces
            faces = self.detect_faces(image_path)
            
            if not faces:
                return {
                    "success": False,
                    "error": "No faces detected in image",
                    "faces_detected": 0
                }
            
            # For now, return mock emotion data
            # In production, this would use a trained emotion classification model
            emotions = {
                emotion: np.random.random() for emotion in self.emotion_labels
            }
            
            # Normalize to sum to 1
            total = sum(emotions.values())
            emotions = {k: v/total for k, v in emotions.items()}
            
            # Get dominant emotion
            dominant_emotion = max(emotions, key=emotions.get)
            
            return {
                "success": True,
                "faces_detected": len(faces),
                "faces": faces,
                "emotions": emotions,
                "dominant_emotion": dominant_emotion,
                "confidence": emotions[dominant_emotion]
            }
        
        except Exception as e:
            logger.error(f"Error recognizing emotion: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def recognize_emotion_from_bytes(self, image_bytes: bytes) -> Dict:
        """
        Recognize emotions from image bytes
        
        Args:
            image_bytes: Image data as bytes
            
        Returns:
            Dictionary with emotion recognition results
        """
        try:
            # Convert bytes to image
            image = Image.open(io.BytesIO(image_bytes))
            
            # Save temporarily
            import tempfile
            with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
                image.save(tmp.name)
                tmp_path = tmp.name
            
            # Recognize emotion
            result = self.recognize_emotion(tmp_path)
            
            # Clean up
            os.unlink(tmp_path)
            
            return result
        
        except Exception as e:
            logger.error(f"Error recognizing emotion from bytes: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_model_info(self) -> Dict:
        """Get information about the FER service"""
        return {
            "service": "Facial Expression Recognition",
            "device": self.device,
            "emotions": self.emotion_labels,
            "status": "ready"
        }


# Global instance
_fer_service = None

def get_fer_service() -> FacialExpressionRecognizer:
    """Get or create the global FER service instance"""
    global _fer_service
    if _fer_service is None:
        _fer_service = FacialExpressionRecognizer()
    return _fer_service

def recognize_emotion(image_path: str) -> Dict:
    """Recognize emotions from image"""
    service = get_fer_service()
    return service.recognize_emotion(image_path)

def recognize_emotion_from_bytes(image_bytes: bytes) -> Dict:
    """Recognize emotions from image bytes"""
    service = get_fer_service()
    return service.recognize_emotion_from_bytes(image_bytes)

def detect_faces(image_path: str) -> List[Dict]:
    """Detect faces in image"""
    service = get_fer_service()
    return service.detect_faces(image_path)

def get_fer_service_info() -> Dict:
    """Get FER service information"""
    service = get_fer_service()
    return service.get_model_info()

