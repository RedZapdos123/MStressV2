"""
Audio Analysis Service using librosa
Provides comprehensive audio feature extraction and analysis
"""

import logging
import os
from typing import Dict, Optional
import librosa
import numpy as np
import soundfile as sf

logger = logging.getLogger(__name__)

class AudioAnalysisService:
    """
    Audio analysis service using librosa
    Extracts features for stress detection and voice analysis
    """
    
    def __init__(self):
        """Initialize the audio analysis service"""
        logger.info("Initializing Audio Analysis Service...")
    
    def load_audio(self, audio_path: str, sr: Optional[int] = 16000) -> tuple:
        """
        Load audio file
        
        Args:
            audio_path: Path to audio file
            sr: Sample rate (default 16000 Hz)
            
        Returns:
            Tuple of (audio_data, sample_rate)
        """
        try:
            if not os.path.exists(audio_path):
                raise FileNotFoundError(f"Audio file not found: {audio_path}")
            
            y, sr = librosa.load(audio_path, sr=sr)
            return y, sr
        except Exception as e:
            logger.error(f"Error loading audio: {e}")
            raise
    
    def extract_features(self, audio_path: str) -> Dict:
        """
        Extract comprehensive audio features
        
        Args:
            audio_path: Path to audio file
            
        Returns:
            Dictionary with extracted features
        """
        try:
            y, sr = self.load_audio(audio_path)
            
            # Duration
            duration = librosa.get_duration(y=y, sr=sr)
            
            # Energy features
            rms_energy = np.sqrt(np.mean(y**2))
            
            # Spectral features
            spectral_centroid = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
            spectral_rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)[0]
            
            # MFCC (Mel-frequency cepstral coefficients)
            mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
            
            # Zero crossing rate
            zcr = librosa.feature.zero_crossing_rate(y)[0]
            
            # Chroma features
            chroma = librosa.feature.chroma_stft(y=y, sr=sr)
            
            # Tempogram
            onset_env = librosa.onset.onset_strength(y=y, sr=sr)
            tempogram = librosa.feature.tempogram(onset_env=onset_env, sr=sr)
            
            return {
                "duration": float(duration),
                "sample_rate": int(sr),
                "rms_energy": float(np.mean(rms_energy)),
                "spectral_centroid_mean": float(np.mean(spectral_centroid)),
                "spectral_centroid_std": float(np.std(spectral_centroid)),
                "spectral_rolloff_mean": float(np.mean(spectral_rolloff)),
                "spectral_rolloff_std": float(np.std(spectral_rolloff)),
                "mfcc_mean": float(np.mean(mfcc)),
                "mfcc_std": float(np.std(mfcc)),
                "zero_crossing_rate_mean": float(np.mean(zcr)),
                "zero_crossing_rate_std": float(np.std(zcr)),
                "chroma_mean": float(np.mean(chroma)),
                "chroma_std": float(np.std(chroma)),
                "tempogram_mean": float(np.mean(tempogram)),
                "tempogram_std": float(np.std(tempogram))
            }
        except Exception as e:
            logger.error(f"Error extracting features: {e}")
            return {"error": str(e)}
    
    def analyze_speech_rate(self, audio_path: str) -> Dict:
        """
        Analyze speech rate and pauses
        
        Args:
            audio_path: Path to audio file
            
        Returns:
            Dictionary with speech rate analysis
        """
        try:
            y, sr = self.load_audio(audio_path)
            
            # Detect onsets (speech activity)
            onset_env = librosa.onset.onset_strength(y=y, sr=sr)
            onsets = librosa.onset.onset_detect(onset_envelope=onset_env, sr=sr)
            
            # Duration
            duration = librosa.get_duration(y=y, sr=sr)
            
            # Speech rate (onsets per second)
            speech_rate = len(onsets) / duration if duration > 0 else 0
            
            # Silence detection
            S = librosa.feature.melspectrogram(y=y, sr=sr)
            S_db = librosa.power_to_db(S, ref=np.max)
            
            # Threshold for silence
            threshold = np.mean(S_db) - 10
            silent_frames = np.sum(S_db < threshold)
            total_frames = S_db.shape[1]
            silence_ratio = silent_frames / total_frames if total_frames > 0 else 0
            
            return {
                "speech_rate": float(speech_rate),
                "duration": float(duration),
                "num_onsets": int(len(onsets)),
                "silence_ratio": float(silence_ratio),
                "speech_ratio": float(1 - silence_ratio)
            }
        except Exception as e:
            logger.error(f"Error analyzing speech rate: {e}")
            return {"error": str(e)}
    
    def analyze_stress_indicators(self, audio_path: str) -> Dict:
        """
        Analyze audio for stress indicators
        
        Args:
            audio_path: Path to audio file
            
        Returns:
            Dictionary with stress indicators
        """
        try:
            features = self.extract_features(audio_path)
            speech_analysis = self.analyze_speech_rate(audio_path)
            
            if "error" in features or "error" in speech_analysis:
                return {"error": "Failed to analyze audio"}
            
            # Stress indicators
            # High pitch (spectral centroid) can indicate stress
            high_pitch_indicator = min(1.0, features["spectral_centroid_mean"] / 3000)
            
            # High energy can indicate stress
            high_energy_indicator = min(1.0, features["rms_energy"] * 10)
            
            # Fast speech rate can indicate stress
            fast_speech_indicator = min(1.0, speech_analysis["speech_rate"] / 10)
            
            # Low silence ratio (less pauses) can indicate stress
            low_silence_indicator = 1 - speech_analysis["silence_ratio"]
            
            # Calculate overall stress score (0-1)
            stress_score = np.mean([
                high_pitch_indicator,
                high_energy_indicator,
                fast_speech_indicator,
                low_silence_indicator
            ])
            
            return {
                "stress_score": float(stress_score),
                "high_pitch_indicator": float(high_pitch_indicator),
                "high_energy_indicator": float(high_energy_indicator),
                "fast_speech_indicator": float(fast_speech_indicator),
                "low_silence_indicator": float(low_silence_indicator),
                "features": features,
                "speech_analysis": speech_analysis
            }
        except Exception as e:
            logger.error(f"Error analyzing stress indicators: {e}")
            return {"error": str(e)}
    
    def get_model_info(self) -> Dict:
        """Get information about the audio analysis service"""
        return {
            "service": "Audio Analysis",
            "library": "librosa",
            "status": "ready"
        }


# Global instance
_audio_service = None

def get_audio_service() -> AudioAnalysisService:
    """Get or create the global audio analysis service instance"""
    global _audio_service
    if _audio_service is None:
        _audio_service = AudioAnalysisService()
    return _audio_service

def extract_features(audio_path: str) -> Dict:
    """Extract audio features"""
    service = get_audio_service()
    return service.extract_features(audio_path)

def analyze_speech_rate(audio_path: str) -> Dict:
    """Analyze speech rate"""
    service = get_audio_service()
    return service.analyze_speech_rate(audio_path)

def analyze_stress_indicators(audio_path: str) -> Dict:
    """Analyze stress indicators from audio"""
    service = get_audio_service()
    return service.analyze_stress_indicators(audio_path)

def get_audio_service_info() -> Dict:
    """Get audio service information"""
    service = get_audio_service()
    return service.get_model_info()

