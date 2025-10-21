"""
Whisper-based Speech-to-Text Service
Provides local speech transcription using OpenAI's Whisper model
"""

import logging
import os
import tempfile
from typing import Dict, Optional
import torch
# This file provides speech-to-text transcription using OpenAI's Whisper model.
import whisper
import librosa
import numpy as np

logger = logging.getLogger(__name__)

class WhisperTranscriptionService:
    """
    Speech-to-text service using OpenAI's Whisper model
    Supports local, offline transcription
    """
    
    def __init__(self, model_size: str = "base"):
        """
        Initialize Whisper transcription service
        
        Args:
            model_size: Model size ('tiny', 'base', 'small', 'medium', 'large')
        """
        self.model_size = model_size
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model = None
        self._initialize_model()
    
    def _initialize_model(self):
        """Initialize the Whisper model"""
        try:
            logger.info(f"Loading Whisper {self.model_size} model on {self.device}...")
            self.model = whisper.load_model(
                self.model_size,
                device=self.device,
                download_root=os.path.join(os.path.expanduser("~"), ".cache", "whisper")
            )
            logger.info(f"✓ Whisper model loaded successfully on {self.device}")
        except Exception as e:
            logger.error(f"Failed to load Whisper model: {e}")
            raise
    
    def transcribe_audio_file(self, audio_path: str, language: Optional[str] = None) -> Dict:
        """
        Transcribe audio file to text
        
        Args:
            audio_path: Path to audio file
            language: Language code (e.g., 'en', 'hi'). If None, auto-detect
            
        Returns:
            Dictionary with transcription results
        """
        try:
            if not os.path.exists(audio_path):
                return {
                    "success": False,
                    "text": "",
                    "error": "Audio file not found"
                }
            
            logger.info(f"Transcribing audio file: {audio_path}")
            
            # Transcribe with Whisper
            result = self.model.transcribe(
                audio_path,
                language=language,
                verbose=False
            )
            
            return {
                "success": True,
                "text": result.get("text", "").strip(),
                "language": result.get("language", "unknown"),
                "segments": result.get("segments", []),
                "confidence": self._calculate_confidence(result)
            }
        
        except Exception as e:
            logger.error(f"Error transcribing audio: {e}")
            return {
                "success": False,
                "text": "",
                "error": str(e)
            }
    
    def transcribe_audio_bytes(self, audio_bytes: bytes, language: Optional[str] = None) -> Dict:
        """
        Transcribe audio from bytes
        
        Args:
            audio_bytes: Audio data as bytes
            language: Language code
            
        Returns:
            Dictionary with transcription results
        """
        try:
            # Save bytes to temporary file
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp_file:
                tmp_file.write(audio_bytes)
                tmp_path = tmp_file.name
            
            # Transcribe
            result = self.transcribe_audio_file(tmp_path, language)
            
            # Clean up
            os.unlink(tmp_path)
            
            return result
        
        except Exception as e:
            logger.error(f"Error transcribing audio bytes: {e}")
            return {
                "success": False,
                "text": "",
                "error": str(e)
            }
    
    def _calculate_confidence(self, result: Dict) -> float:
        """Calculate overall confidence from transcription result"""
        try:
            segments = result.get("segments", [])
            if not segments:
                return 0.0
            
            # Average confidence from segments
            confidences = [seg.get("confidence", 0.5) for seg in segments if "confidence" in seg]
            if confidences:
                return float(np.mean(confidences))
            return 0.8  # Default confidence if not available
        except:
            return 0.8
    
    def analyze_audio_features(self, audio_path: str) -> Dict:
        """
        Analyze audio features using librosa
        
        Args:
            audio_path: Path to audio file
            
        Returns:
            Dictionary with audio features
        """
        try:
            # Load audio
            y, sr = librosa.load(audio_path, sr=None)
            
            # Extract features
            mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
            spectral_centroid = librosa.feature.spectral_centroid(y=y, sr=sr)
            zero_crossing_rate = librosa.feature.zero_crossing_rate(y)
            
            return {
                "sample_rate": int(sr),
                "duration": float(librosa.get_duration(y=y, sr=sr)),
                "mfcc_mean": float(np.mean(mfcc)),
                "spectral_centroid_mean": float(np.mean(spectral_centroid)),
                "zero_crossing_rate_mean": float(np.mean(zero_crossing_rate)),
                "rms_energy": float(np.sqrt(np.mean(y**2)))
            }
        except Exception as e:
            logger.error(f"Error analyzing audio features: {e}")
            return {"error": str(e)}
    
    def get_model_info(self) -> Dict:
        """Get information about the loaded model"""
        return {
            "model_size": self.model_size,
            "device": self.device,
            "model_type": "Whisper",
            "status": "ready"
        }


# Global instance
_transcription_service = None

def get_transcription_service() -> WhisperTranscriptionService:
    """Get or create the global transcription service instance"""
    global _transcription_service
    if _transcription_service is None:
        _transcription_service = WhisperTranscriptionService()
    return _transcription_service

def transcribe_audio_file(audio_path: str, language: Optional[str] = None) -> Dict:
    """Transcribe audio file using Whisper"""
    service = get_transcription_service()
    return service.transcribe_audio_file(audio_path, language)

def transcribe_audio_bytes(audio_bytes: bytes, language: Optional[str] = None) -> Dict:
    """Transcribe audio bytes using Whisper"""
    service = get_transcription_service()
    return service.transcribe_audio_bytes(audio_bytes, language)

def get_speech_service_info() -> Dict:
    """Get speech service information"""
    service = get_transcription_service()
    return service.get_model_info()

