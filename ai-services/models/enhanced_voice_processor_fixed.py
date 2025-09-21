#!/usr/bin/env python3
"""
Enhanced GPU-Powered Voice Processing for Army Mental Health Assessment
Fixed version with proper Hindi language handling and unknown language detection
"""

import logging
import numpy as np
import tempfile
import os
from typing import Dict, Optional, Tuple
import threading
import queue
import time
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

try:
    from utils.sentiment_analyzer import SentimentAnalyzer
    SENTIMENT_ANALYZER_AVAILABLE = True
except ImportError:
    SENTIMENT_ANALYZER_AVAILABLE = False
    logger.warning("⚠️ Sentiment analyzer not available")

try:
    from models.mental_health_analyzer import QWarriorMentalHealthAnalyzer
    MENTAL_HEALTH_ANALYZER_AVAILABLE = True
except ImportError:
    MENTAL_HEALTH_ANALYZER_AVAILABLE = False
    logger.warning("⚠️ Mental health analyzer not available")

try:
    from models.hindi_sentiment import analyze_hindi_sentiment, get_emotion_analysis
    HINDI_SENTIMENT_AVAILABLE = True
except ImportError:
    HINDI_SENTIMENT_AVAILABLE = False
    logger.warning("⚠️ Hindi sentiment model not available")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Try to import GPU-accelerated libraries
try:
    import torch
    import whisper
    GPU_AVAILABLE = torch.cuda.is_available()
    logger.info(f"🚀 GPU Available: {GPU_AVAILABLE}")
    if GPU_AVAILABLE:
        logger.info(f"🎮 GPU Device: {torch.cuda.get_device_name(0)}")
except ImportError:
    GPU_AVAILABLE = False
    logger.warning("⚠️ PyTorch/Whisper not available. Install with: pip install torch whisper")

try:
    import sounddevice as sd
    import soundfile as sf
    AUDIO_AVAILABLE = True
except ImportError:
    AUDIO_AVAILABLE = False
    logger.warning("⚠️ Audio libraries not available. Install with: pip install sounddevice soundfile")

class EnhancedVoiceProcessorFixed:
    """
    Enhanced voice processor with GPU acceleration and proper Hindi language support
    """
    
    def __init__(self):
        """Initialize the enhanced voice processor"""
        self.whisper_model = None
        self.is_initialized = False
        self.device = "cuda" if GPU_AVAILABLE else "cpu"
        self.recording = False
        self.audio_queue = queue.Queue()

        # Audio settings
        self.sample_rate = 16000  # Whisper's preferred sample rate
        self.channels = 1
        self.dtype = np.float32

        # Initialize analysis components
        self.sentiment_analyzer = None
        self.mental_health_analyzer = None

        # Initialize components
        self._initialize_whisper()
        self._initialize_analyzers()
        
    def _initialize_whisper(self):
        """Initialize Whisper model with GPU support"""
        try:
            if not GPU_AVAILABLE:
                logger.warning("🔄 GPU not available, using CPU for Whisper")
                # Use smaller model for CPU
                model_size = "base"
            else:
                logger.info("🚀 Initializing Whisper with GPU acceleration")
                # Use larger model for GPU
                model_size = "medium"  # Good balance of speed and accuracy
            
            # Load Whisper model with explicit GPU device
            if self.device == "cuda":
                self.whisper_model = whisper.load_model(model_size, device="cuda")
                logger.info(f"✅ Whisper model '{model_size}' loaded on GPU (CUDA)")
            else:
                self.whisper_model = whisper.load_model(model_size, device="cpu")
                logger.info(f"✅ Whisper model '{model_size}' loaded on CPU")

            # Verify GPU usage
            if self.device == "cuda":
                import torch
                if torch.cuda.is_available():
                    gpu_memory = torch.cuda.memory_allocated(0) / 1024**2
                    logger.info(f"🎮 GPU Memory after Whisper load: {gpu_memory:.1f}MB")
            
            self.is_initialized = True

        except Exception as e:
            logger.error(f"❌ Failed to initialize Whisper: {e}")
            self.is_initialized = False

    def _initialize_analyzers(self):
        """Initialize sentiment and mental health analyzers"""
        try:
            if SENTIMENT_ANALYZER_AVAILABLE:
                self.sentiment_analyzer = SentimentAnalyzer()
                logger.info("✅ Sentiment analyzer initialized")

            if MENTAL_HEALTH_ANALYZER_AVAILABLE:
                self.mental_health_analyzer = QWarriorMentalHealthAnalyzer()
                logger.info("✅ Mental health analyzer initialized")

        except Exception as e:
            logger.warning(f"⚠️ Failed to initialize analyzers: {e}")
    
    def transcribe_audio(self, temp_path, language_hint: str = "hi") -> Dict:
        """
        Transcribe audio to text with enhanced Hindi support and unknown language handling
        """
        if not self.is_initialized:
            return {"error": "Voice processor not initialized"}

        try:
            logger.info("🔄 Transcribing audio with enhanced Hindi support...")

            # Enhanced language handling with Hindi prioritization
            supported_languages = ["hi", "en", "auto"]
            if language_hint not in supported_languages:
                logger.warning(f"⚠️ Unsupported language hint '{language_hint}', defaulting to Hindi")
                language_hint = "hi"

            # Use Hindi as primary language for better Hinglish detection
            transcribe_language = "hi" if language_hint == "hi" else None
            
            result = self.whisper_model.transcribe(
                temp_path,
                language=transcribe_language,
                task="transcribe",
                fp16=GPU_AVAILABLE,
                verbose=False
            )
            
            # Clean up temporary file
            os.unlink(temp_path)
            
            # Extract transcription
            transcribed_text = result.get("text", "").strip()
            detected_language = result.get("language", "unknown")
            
            # Enhanced processing for Hindi and unknown languages
            processed_text = self._process_hindi_transcription(
                transcribed_text, 
                detected_language
            )
            
            # Ensure Hindi conversion for unknown languages
            if detected_language == "unknown" or detected_language not in ["hi", "en"]:
                processed_text = self._convert_to_hindi(processed_text)
                detected_language = "hi"
            
            logger.info(f"✅ Transcription completed: '{processed_text[:50]}...' (Language: {detected_language})")
            return {
                "transcription": processed_text,
                "original_text": transcribed_text,
                "detected_language": detected_language,
                "confidence": result.get("segments", [{}])[0].get("avg_logprob", 0) if result.get("segments") else 0,
                "processing_time": result.get("processing_time", 0)
            }

        except Exception as e:
            logger.error(f"❌ Transcription failed: {e}")
            return {"error": str(e)}

    def _process_hindi_transcription(self, text: str, detected_language: str) -> str:
        """
        Enhanced processing for Hindi transcription and unknown language handling
        """
        try:
            # If detected as Hindi or unknown, ensure proper Hindi handling
            if detected_language in ["hi", "unknown"]:
                # Clean up the text and ensure Hindi characters are preserved
                processed = text.strip()
                
                # Common Hindi-English mappings for better context
                hindi_mappings = {
                    "mai": "मैं",
                    "tum": "तुम",
                    "aap": "आप",
                    "haan": "हाँ",
                    "nahi": "नहीं",
                    "acha": "अच्छा",
                    "bura": "बुरा",
                    "kaise": "कैसे",
                    "kya": "क्या",
                    "kahan": "कहाँ",
                    "kab": "कब",
                    "kyon": "क्यों",
                    "khushi": "खुशी",
                    "dukh": "दुख",
                    "pareshan": "परेशान",
                    "udaas": "उदास",
                    "dar": "डर",
                    "chinta": "चिंता"
                }
                
                # Apply mappings for better Hindi representation
                for eng, hindi in hindi_mappings.items():
                    processed = processed.replace(eng, hindi)
                
                return processed
            
            return text

        except Exception as e:
            logger.warning(f"⚠️ Hindi transcription processing failed: {e}")
            return text

    def _convert_to_hindi(self, text: str) -> str:
        """
        Convert transliterated Hindi to proper Hindi script
        """
        try:
            # Basic transliteration mapping
            transliteration_map = {
                "mai": "मैं",
                "main": "मैं",
                "tum": "तुम",
                "aap": "आप",
                "haan": "हाँ",
                "han": "हाँ",
                "nahi": "नहीं",
                "na": "ना",
                "acha": "अच्छा",
                "accha": "अच्छा",
                "bura": "बुरा",
                "kaise": "कैसे",
                "kya": "क्या",
                "kahan": "कहाँ",
