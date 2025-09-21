#!/usr/bin/env python3
"""
Speech-to-Text Service for MStress Platform
Integrates Whisper model for audio transcription and analysis
Supports mental health assessment through voice analysis
"""

import logging
import whisper
import torch
import numpy as np
from typing import Dict, List, Optional, Union
import tempfile
import os
from datetime import datetime
import base64
import io
import wave
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SpeechToTextService:
    """
    Speech-to-text service using Whisper model
    Designed for mental health assessment and voice analysis
    """
    
    def __init__(self, model_path: Optional[str] = None, model_size: str = "base"):
        """
        Initialize the speech-to-text service
        
        Args:
            model_path: Path to the Whisper model file
            model_size: Size of the Whisper model (tiny, base, small, medium, large)
        """
        self.model_path = model_path or "models/whisper/base.pt"
        self.model_size = model_size
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
        # Voice analysis parameters
        self.voice_indicators = {
            'stress_markers': [
                'um', 'uh', 'like', 'you know', 'actually', 'basically',
                'sort of', 'kind of', 'i mean', 'well'
            ],
            'confidence_markers': [
                'definitely', 'certainly', 'absolutely', 'clearly',
                'obviously', 'exactly', 'precisely'
            ]
        }
        
        self.model = None
        self.is_initialized = False
        
        # Initialize the service
        self.initialize()
    
    def initialize(self):
        """Initialize the Whisper speech-to-text model"""
        try:
            # Try to load local model first
            if os.path.exists(self.model_path):
                logger.info(f"Loading Whisper model from {self.model_path}")
                self.model = whisper.load_model(self.model_path, device=self.device)
            else:
                # Fallback to downloading model
                logger.info(f"Local model not found, downloading Whisper {self.model_size} model")
                self.model = whisper.load_model(self.model_size, device=self.device)
            
            self.is_initialized = True
            logger.info(f"Whisper model loaded successfully on {self.device}")
            return True
            
        except Exception as e:
            logger.error(f"Error initializing Whisper model: {e}")
            self.is_initialized = False
            return False
    
    def transcribe_audio(self, audio_data: Union[str, bytes, np.ndarray], 
                        language: Optional[str] = None) -> Dict:
        """
        Transcribe audio to text
        
        Args:
            audio_data: Audio data (file path, base64 string, or numpy array)
            language: Language code for transcription (optional)
            
        Returns:
            Dictionary with transcription results and voice analysis
        """
        try:
            if not self.is_initialized:
                return self._get_fallback_transcription()
            
            # Process audio data
            audio_file_path = self._process_audio_input(audio_data)
            
            if not audio_file_path:
                return self._create_error_response("Invalid audio data")
            
            # Transcribe audio
            result = self.model.transcribe(
                audio_file_path,
                language=language,
                task="transcribe",
                fp16=False  # Use fp32 for better compatibility
            )
            
            # Extract transcription
            transcription = result.get("text", "").strip()
            detected_language = result.get("language", "unknown")
            
            # Analyze voice characteristics
            voice_analysis = self._analyze_voice_characteristics(result)
            
            # Analyze speech patterns for mental health indicators
            speech_analysis = self._analyze_speech_patterns(transcription, result)
            
            # Clean up temporary file
            if audio_file_path.startswith(tempfile.gettempdir()):
                try:
                    os.unlink(audio_file_path)
                except:
                    pass
            
            return {
                'success': True,
                'transcription': transcription,
                'detected_language': detected_language,
                'confidence': self._calculate_overall_confidence(result),
                'voice_analysis': voice_analysis,
                'speech_patterns': speech_analysis,
                'segments': result.get("segments", []),
                'analysis_metadata': {
                    'timestamp': datetime.now().isoformat(),
                    'model_version': f'whisper-{self.model_size}',
                    'processing_device': str(self.device),
                    'audio_duration': result.get("duration", 0)
                }
            }
            
        except Exception as e:
            logger.error(f"Error transcribing audio: {e}")
            return self._create_error_response(f"Transcription failed: {str(e)}")
    
    def analyze_voice_for_stress(self, audio_data: Union[str, bytes, np.ndarray]) -> Dict:
        """
        Analyze voice for stress indicators
        
        Args:
            audio_data: Audio data to analyze
            
        Returns:
            Dictionary with stress analysis results
        """
        try:
            # Get transcription and voice analysis
            transcription_result = self.transcribe_audio(audio_data)
            
            if not transcription_result.get('success'):
                return transcription_result
            
            # Extract relevant data
            transcription = transcription_result.get('transcription', '')
            voice_analysis = transcription_result.get('voice_analysis', {})
            speech_patterns = transcription_result.get('speech_patterns', {})
            
            # Calculate stress indicators
            stress_score = self._calculate_stress_score(voice_analysis, speech_patterns)
            
            # Generate recommendations
            recommendations = self._generate_voice_recommendations(stress_score, speech_patterns)
            
            return {
                'success': True,
                'transcription': transcription,
                'stress_assessment': {
                    'stress_score': stress_score,
                    'stress_level': self._categorize_stress_level(stress_score),
                    'voice_indicators': voice_analysis,
                    'speech_patterns': speech_patterns,
                    'recommendations': recommendations
                },
                'analysis_metadata': transcription_result.get('analysis_metadata', {})
            }
            
        except Exception as e:
            logger.error(f"Error analyzing voice for stress: {e}")
            return self._create_error_response(f"Voice stress analysis failed: {str(e)}")
    
    def _process_audio_input(self, audio_data: Union[str, bytes, np.ndarray]) -> Optional[str]:
        """Process different types of audio input"""
        try:
            if isinstance(audio_data, str):
                if os.path.exists(audio_data):
                    # File path
                    return audio_data
                elif audio_data.startswith('data:audio'):
                    # Base64 encoded audio
                    header, encoded = audio_data.split(',', 1)
                    audio_bytes = base64.b64decode(encoded)
                    return self._save_temp_audio(audio_bytes)
                else:
                    # Base64 string without header
                    audio_bytes = base64.b64decode(audio_data)
                    return self._save_temp_audio(audio_bytes)
            
            elif isinstance(audio_data, bytes):
                # Raw audio bytes
                return self._save_temp_audio(audio_data)
            
            elif isinstance(audio_data, np.ndarray):
                # Numpy array
                return self._save_temp_audio_array(audio_data)
            
            return None
            
        except Exception as e:
            logger.error(f"Error processing audio input: {e}")
            return None
    
    def _save_temp_audio(self, audio_bytes: bytes) -> str:
        """Save audio bytes to temporary file"""
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_file:
            temp_file.write(audio_bytes)
            return temp_file.name
    
    def _save_temp_audio_array(self, audio_array: np.ndarray, sample_rate: int = 16000) -> str:
        """Save numpy audio array to temporary file"""
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_file:
            # Normalize audio array
            if audio_array.dtype != np.int16:
                audio_array = (audio_array * 32767).astype(np.int16)
            
            # Write WAV file
            with wave.open(temp_file.name, 'wb') as wav_file:
                wav_file.setnchannels(1)  # Mono
                wav_file.setsampwidth(2)  # 16-bit
                wav_file.setframerate(sample_rate)
                wav_file.writeframes(audio_array.tobytes())
            
            return temp_file.name
    
    def _analyze_voice_characteristics(self, whisper_result: Dict) -> Dict:
        """Analyze voice characteristics from Whisper result"""
        segments = whisper_result.get("segments", [])
        
        if not segments:
            return {}
        
        # Calculate speaking rate
        total_duration = sum(seg.get("end", 0) - seg.get("start", 0) for seg in segments)
        total_words = sum(len(seg.get("text", "").split()) for seg in segments)
        speaking_rate = total_words / max(total_duration, 1)  # words per second
        
        # Calculate pause patterns
        pauses = []
        for i in range(1, len(segments)):
            pause_duration = segments[i].get("start", 0) - segments[i-1].get("end", 0)
            if pause_duration > 0:
                pauses.append(pause_duration)
        
        avg_pause_duration = np.mean(pauses) if pauses else 0
        
        # Calculate confidence variations
        confidences = [seg.get("avg_logprob", 0) for seg in segments]
        confidence_std = np.std(confidences) if confidences else 0
        
        return {
            'speaking_rate_wps': round(speaking_rate, 2),
            'average_pause_duration': round(avg_pause_duration, 2),
            'confidence_variation': round(confidence_std, 3),
            'total_speaking_time': round(total_duration, 2),
            'word_count': total_words,
            'segment_count': len(segments)
        }
    
    def _analyze_speech_patterns(self, transcription: str, whisper_result: Dict) -> Dict:
        """Analyze speech patterns for mental health indicators"""
        text_lower = transcription.lower()
        words = text_lower.split()
        
        # Count filler words (stress indicators)
        filler_count = sum(1 for word in words if word in self.voice_indicators['stress_markers'])
        
        # Count confidence markers
        confidence_count = sum(1 for word in words if word in self.voice_indicators['confidence_markers'])
        
        # Calculate ratios
        total_words = len(words)
        filler_ratio = filler_count / max(total_words, 1)
        confidence_ratio = confidence_count / max(total_words, 1)
        
        return {
            'filler_word_count': filler_count,
            'confidence_marker_count': confidence_count,
            'filler_word_ratio': round(filler_ratio, 3),
            'confidence_marker_ratio': round(confidence_ratio, 3),
            'total_words': total_words,
            'speech_clarity_score': round(1 - filler_ratio, 3)
        }
    
    def _calculate_overall_confidence(self, whisper_result: Dict) -> float:
        """Calculate overall transcription confidence"""
        segments = whisper_result.get("segments", [])
        if not segments:
            return 0.0
        
        # Average log probability across all segments
        avg_logprobs = [seg.get("avg_logprob", -1.0) for seg in segments]
        overall_logprob = np.mean(avg_logprobs)
        
        # Convert log probability to confidence score (0-1)
        confidence = max(0, min(1, (overall_logprob + 1) / 1))
        return round(confidence, 3)
    
    def _calculate_stress_score(self, voice_analysis: Dict, speech_patterns: Dict) -> float:
        """Calculate stress score from voice and speech analysis"""
        # Voice-based stress indicators
        speaking_rate = voice_analysis.get('speaking_rate_wps', 2.0)
        pause_duration = voice_analysis.get('average_pause_duration', 0.5)
        confidence_variation = voice_analysis.get('confidence_variation', 0.1)
        
        # Speech pattern stress indicators
        filler_ratio = speech_patterns.get('filler_word_ratio', 0.0)
        clarity_score = speech_patterns.get('speech_clarity_score', 1.0)
        
        # Calculate stress components
        rate_stress = abs(speaking_rate - 2.0) / 2.0  # Optimal rate ~2 words/second
        pause_stress = max(0, pause_duration - 0.5) / 2.0  # Long pauses indicate stress
        variation_stress = min(1.0, confidence_variation * 10)  # High variation = stress
        filler_stress = min(1.0, filler_ratio * 5)  # High filler ratio = stress
        clarity_stress = 1.0 - clarity_score  # Low clarity = stress
        
        # Weighted stress score
        stress_score = (
            rate_stress * 0.2 +
            pause_stress * 0.2 +
            variation_stress * 0.2 +
            filler_stress * 0.3 +
            clarity_stress * 0.1
        )
        
        return round(min(1.0, stress_score), 3)
    
    def _categorize_stress_level(self, stress_score: float) -> str:
        """Categorize stress level based on score"""
        if stress_score < 0.3:
            return "Low"
        elif stress_score < 0.6:
            return "Moderate"
        else:
            return "High"
    
    def _generate_voice_recommendations(self, stress_score: float, speech_patterns: Dict) -> List[str]:
        """Generate recommendations based on voice analysis"""
        recommendations = []
        
        if stress_score > 0.6:
            recommendations.append("Consider practicing deep breathing exercises before speaking")
            recommendations.append("Try speaking more slowly and deliberately")
        
        if speech_patterns.get('filler_word_ratio', 0) > 0.1:
            recommendations.append("Practice reducing filler words through mindful speaking")
        
        if speech_patterns.get('speech_clarity_score', 1) < 0.7:
            recommendations.append("Focus on clear articulation and pronunciation")
        
        if not recommendations:
            recommendations.append("Your speech patterns indicate good emotional regulation")
        
        return recommendations
    
    def _get_fallback_transcription(self) -> Dict:
        """Get fallback response when model is unavailable"""
        return {
            'success': False,
            'transcription': '',
            'error': 'Speech-to-text model not available',
            'voice_analysis': {},
            'speech_patterns': {},
            'analysis_metadata': {
                'timestamp': datetime.now().isoformat(),
                'model_version': 'fallback',
                'fallback_reason': 'Model not initialized'
            }
        }
    
    def _create_error_response(self, error_message: str) -> Dict:
        """Create standardized error response"""
        return {
            'success': False,
            'error': error_message,
            'transcription': '',
            'voice_analysis': {},
            'speech_patterns': {},
            'analysis_metadata': {
                'timestamp': datetime.now().isoformat(),
                'error': True
            }
        }
    
    def get_service_info(self) -> Dict:
        """Get information about the speech-to-text service"""
        return {
            'service_name': 'Whisper Speech-to-Text Service',
            'model_type': 'Whisper',
            'model_size': self.model_size,
            'version': '1.0.0',
            'initialized': self.is_initialized,
            'device': str(self.device),
            'supported_formats': ['wav', 'mp3', 'mp4', 'm4a', 'flac'],
            'capabilities': [
                'speech_transcription',
                'voice_analysis',
                'stress_detection',
                'multilingual_support'
            ]
        }

# Global service instance
_speech_service = None

def get_speech_service():
    """Get or create the global speech-to-text service instance"""
    global _speech_service
    if _speech_service is None:
        _speech_service = SpeechToTextService()
    return _speech_service

def transcribe_audio_file(audio_data: Union[str, bytes], language: Optional[str] = None):
    """
    Main function to transcribe audio
    Used by FastAPI endpoints
    """
    service = get_speech_service()
    return service.transcribe_audio(audio_data, language)

def analyze_voice_stress(audio_data: Union[str, bytes]):
    """
    Analyze voice for stress indicators
    Used by FastAPI endpoints
    """
    service = get_speech_service()
    return service.analyze_voice_for_stress(audio_data)

def get_speech_service_info():
    """Get speech service information"""
    service = get_speech_service()
    return service.get_service_info()

if __name__ == "__main__":
    # Test the service
    service = SpeechToTextService()
    print("Service info:", service.get_service_info())
