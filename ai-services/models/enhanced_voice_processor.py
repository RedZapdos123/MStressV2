#!/usr/bin/env python3
"""
Enhanced GPU-Powered Voice Processing for Army Mental Health Assessment
Supports Hinglish (Hindi-English mixed) voice-to-text conversion using Whisper
Transcribes Hindi speech to English transliteration (e.g., "mai acha hu")
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

class EnhancedVoiceProcessor:
    """
    Enhanced voice processor with GPU acceleration and Hinglish support
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
    
    def start_recording(self) -> bool:
        """Start recording audio from microphone"""
        if not AUDIO_AVAILABLE:
            logger.error("❌ Audio libraries not available")
            return False
        
        try:
            self.recording = True
            self.audio_queue = queue.Queue()
            
            # Start recording in a separate thread
            self.recording_thread = threading.Thread(target=self._record_audio)
            self.recording_thread.daemon = True
            self.recording_thread.start()
            
            logger.info("🎤 Recording started...")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to start recording: {e}")
            self.recording = False
            return False
    
    def stop_recording(self) -> Optional[np.ndarray]:
        """Stop recording and return audio data"""
        if not self.recording:
            return None
        
        try:
            self.recording = False
            
            # Wait for recording thread to finish
            if hasattr(self, 'recording_thread'):
                self.recording_thread.join(timeout=2.0)
            
            # Collect all audio data
            audio_data = []
            while not self.audio_queue.empty():
                try:
                    chunk = self.audio_queue.get_nowait()
                    audio_data.append(chunk)
                except queue.Empty:
                    break
            
            if audio_data:
                # Concatenate all chunks
                full_audio = np.concatenate(audio_data, axis=0)
                logger.info(f"🎵 Recording stopped. Audio length: {len(full_audio)/self.sample_rate:.2f} seconds")
                return full_audio
            else:
                logger.warning("⚠️ No audio data recorded")
                return None
                
        except Exception as e:
            logger.error(f"❌ Error stopping recording: {e}")
            return None
    
    def _record_audio(self):
        """Internal method to record audio in background thread"""
        try:
            def audio_callback(indata, frames, time, status):
                if status:
                    logger.warning(f"Audio callback status: {status}")
                if self.recording:
                    self.audio_queue.put(indata.copy().flatten())
            
            # Start recording stream
            with sd.InputStream(
                samplerate=self.sample_rate,
                channels=self.channels,
                dtype=self.dtype,
                callback=audio_callback,
                blocksize=1024
            ):
                while self.recording:
                    time.sleep(0.1)
                    
        except Exception as e:
            logger.error(f"❌ Recording thread error: {e}")
            self.recording = False
    
    def transcribe_audio(self, temp_path, language_hint: str = "hi") -> Dict:
        """
        Transcribe audio to text with Hinglish support

        Args:
            audio_data: Audio data as numpy array
            language_hint: Language hint ("hi" for Hindi/Hinglish, "en" for English)

        Returns:
            Dictionary with transcription results
        """
        if not self.is_initialized:
            return {"error": "Voice processor not initialized"}

        try:
            # # Save audio to temporary file
            # with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
            #     sf.write(temp_file.name, audio_data, self.sample_rate)
            #     temp_path = temp_file.name

            # Transcribe with Whisper
            logger.info("🔄 Transcribing audio with Whisper...")

            # Ensure only Hindi, English, and Hinglish are supported
            supported_languages = ["hi", "en"]
            if language_hint not in supported_languages and language_hint != "auto":
                logger.warning(f"⚠️ Unsupported language hint '{language_hint}', defaulting to Hindi")
                language_hint = "hi"

            # For Hinglish support, always use Hindi as base language
            # Whisper will handle mixed Hindi-English content better with Hindi as primary
            transcribe_language = None if language_hint == "auto" else language_hint
            if language_hint == "hi":
                # Force Hindi for better Hinglish detection
                transcribe_language = "hi"

            result = self.whisper_model.transcribe(
                temp_path,
                language=transcribe_language,
                task="transcribe",  # Always transcribe (not translate)
                fp16=GPU_AVAILABLE,  # Use FP16 for GPU acceleration
                verbose=False
            )
            
            # Clean up temporary file
            os.unlink(temp_path)
            
            # Extract transcription
            transcribed_text = result.get("text", "").strip()
            detected_language = result.get("language", "unknown")
            
            # Post-process for Hinglish
            processed_text = self._process_hinglish_text(transcribed_text, detected_language)
            
            logger.info(f"✅ Transcription completed: '{processed_text[:50]}...'")
            
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
    
    def _process_hinglish_text(self, text: str, detected_language: str) -> str:
        """
        Process text for Hinglish support - convert Hindi to English transliteration
        
        Args:
            text: Original transcribed text
            detected_language: Detected language from Whisper
            
        Returns:
            Processed text in English transliteration
        """
        try:
            # If already in English or mixed, return as is
            if detected_language == "en":
                return text
            

            if detected_language == "hi":
                return text
            
            
            # For Hindi text, Whisper often provides good transliteration
            # Additional processing can be added here for better results
            
            # Basic cleanup and formatting
            processed = text.lower().strip()
            
            # Common Hindi-English word mappings for better context
            hinglish_mappings = {
                "मैं": "mai",
                "तुम": "tum", 
                "आप": "aap",
                "हाँ": "haan",
                "नहीं": "nahi",
                "अच्छा": "acha",
                "बुरा": "bura",
                "कैसे": "kaise",
                "क्या": "kya",
                "कहाँ": "kahan",
                "कब": "kab",
                "क्यों": "kyon"
            }
            
            # Apply mappings if needed (Whisper usually handles this well)
            for hindi, english in hinglish_mappings.items():
                processed = processed.replace(hindi, english)
            
            return processed

        except Exception as e:
            logger.warning(f"⚠️ Text processing failed: {e}")
            return text

    def analyze_transcribed_text(self, transcribed_text: str, detected_language: str = "hi") -> Dict:
        """
        Perform comprehensive analysis on transcribed text including sentiment analysis and DASS scoring

        Args:
            transcribed_text: The transcribed text from voice
            detected_language: Detected language from transcription

        Returns:
            Dictionary with comprehensive analysis results
        """
        if not transcribed_text or not transcribed_text.strip():
            return {"error": "No text to analyze"}

        try:
            analysis_results = {
                "text": transcribed_text,
                "language": detected_language,
                "sentiment_analysis": {},
                "mental_health_scores": {},
                "dass_scores": {},
                "tone_analysis": {},
                "weighted_assessment": {}
            }

            # Perform sentiment analysis using Hindi sentiment model
            logger.info("🔄 Performing sentiment analysis...")
            sentiment_result = self._perform_sentiment_analysis(transcribed_text, detected_language)
            analysis_results["sentiment_analysis"] = sentiment_result
            logger.info(f"✅ Sentiment: {sentiment_result.get('sentiment_label', 'unknown')}")

            # Perform mental health analysis
            if self.mental_health_analyzer:
                logger.info("🔄 Performing mental health analysis...")
                mental_health_result = self.mental_health_analyzer.analyze_text_sentiment(
                    transcribed_text,
                    detected_language
                )
                analysis_results["mental_health_scores"] = mental_health_result
                logger.info("✅ Mental health analysis completed")

            # Calculate DASS-compatible scores
            dass_scores = self._calculate_dass_scores(
                analysis_results["sentiment_analysis"],
                analysis_results["mental_health_scores"],
                transcribed_text
            )
            analysis_results["dass_scores"] = dass_scores

            # Perform tone analysis
            tone_analysis = self._analyze_tone_patterns(transcribed_text, detected_language)
            analysis_results["tone_analysis"] = tone_analysis

            # Calculate weighted assessment (simplified for now)
            weighted_assessment = self._calculate_simple_weighted_assessment(analysis_results)
            analysis_results["weighted_assessment"] = weighted_assessment

            logger.info("✅ Complete voice analysis finished")
            return analysis_results

        except Exception as e:
            logger.error(f"❌ Text analysis failed: {e}")
            return {"error": str(e)}

    def _perform_sentiment_analysis(self, text: str, detected_language: str) -> Dict:
        """
        Perform sentiment analysis using Hindi sentiment model for Hindi/Hinglish text
        and fallback to other analyzers for English

        Args:
            text: Transcribed text to analyze
            detected_language: Language detected from transcription

        Returns:
            Sentiment analysis results
        """
        try:
            # Use Hindi sentiment model for Hindi/Hinglish text
            if detected_language == "hi" and HINDI_SENTIMENT_AVAILABLE:
                logger.info("🔄 Using Hindi sentiment model...")

                # Get basic sentiment analysis
                sentiment_result = analyze_hindi_sentiment(text)

                # Get detailed emotion analysis
                emotion_analysis = get_emotion_analysis(text)

                # Combine results
                combined_result = {
                    "sentiment_label": sentiment_result.get("sentiment_label", "NEUTRAL"),
                    "sentiment_score": sentiment_result.get("sentiment_score", 0.0),
                    "confidence_score": sentiment_result.get("confidence_score", 0.5),
                    "emotion_indicators": emotion_analysis.get("emotion_indicators", {}),
                    "model_used": "hindi_sentiment_roberta",
                    "detected_language": "hindi",
                    "analysis_quality": "high",
                    "raw_result": sentiment_result
                }

                logger.info(f"✅ Hindi sentiment analysis: {combined_result['sentiment_label']} (confidence: {combined_result['confidence_score']:.2f})")
                return combined_result

            # Fallback to sentiment analyzer for English or when Hindi model not available
            elif self.sentiment_analyzer:
                logger.info("🔄 Using fallback sentiment analyzer...")
                sentiment_result = self.sentiment_analyzer.analyze_sentiment(
                    text,
                    language="english"
                )

                # Convert to standardized format
                return {
                    "sentiment_label": sentiment_result.get("sentiment", "neutral").upper(),
                    "sentiment_score": sentiment_result.get("score", 0.0),
                    "confidence_score": sentiment_result.get("confidence", 0.5),
                    "emotion_indicators": {},
                    "model_used": "fallback_analyzer",
                    "detected_language": "english",
                    "analysis_quality": "medium",
                    "raw_result": sentiment_result
                }

            # Basic keyword-based fallback
            else:
                logger.warning("⚠️ No sentiment analyzers available, using basic keyword analysis")
                return self._basic_sentiment_analysis(text)

        except Exception as e:
            logger.error(f"❌ Sentiment analysis failed: {e}")
            return {
                "sentiment_label": "NEUTRAL",
                "sentiment_score": 0.0,
                "confidence_score": 0.0,
                "emotion_indicators": {},
                "model_used": "none",
                "detected_language": detected_language,
                "analysis_quality": "low",
                "error": str(e)
            }

    def _basic_sentiment_analysis(self, text: str) -> Dict:
        """
        Basic keyword-based sentiment analysis as final fallback
        """
        text_lower = text.lower()

        # Basic positive keywords (English and Hindi)
        positive_keywords = ['good', 'great', 'happy', 'excellent', 'wonderful', 'acha', 'khushi', 'accha']
        negative_keywords = ['bad', 'sad', 'terrible', 'awful', 'horrible', 'bura', 'dukh', 'pareshan']

        positive_count = sum(1 for keyword in positive_keywords if keyword in text_lower)
        negative_count = sum(1 for keyword in negative_keywords if keyword in text_lower)

        if positive_count > negative_count:
            sentiment = "POSITIVE"
            score = 0.6
        elif negative_count > positive_count:
            sentiment = "NEGATIVE"
            score = -0.6
        else:
            sentiment = "NEUTRAL"
            score = 0.0

        return {
            "sentiment_label": sentiment,
            "sentiment_score": score,
            "confidence_score": 0.4,  # Low confidence for basic analysis
            "emotion_indicators": {},
            "model_used": "basic_keywords",
            "detected_language": "unknown",
            "analysis_quality": "basic"
        }

    def _calculate_dass_scores(self, sentiment_result: Dict, mental_health_result: Dict, text: str) -> Dict:
        """
        Calculate DASS-21 compatible scores from sentiment and mental health analysis

        Args:
            sentiment_result: Results from sentiment analysis
            mental_health_result: Results from mental health analysis
            text: Original transcribed text

        Returns:
            DASS-compatible scores for depression, anxiety, and stress
        """
        try:
            # Initialize base scores
            depression_score = 0
            anxiety_score = 0
            stress_score = 0

            # Extract sentiment information
            sentiment = sentiment_result.get('sentiment', 'neutral')
            sentiment_score = sentiment_result.get('score', 0)
            confidence = sentiment_result.get('confidence', 0)

            # Base scoring from sentiment
            if sentiment == 'negative':
                depression_score += min(abs(sentiment_score) * 30, 15)  # Max 15 points from sentiment
                anxiety_score += min(abs(sentiment_score) * 25, 12)     # Max 12 points from sentiment
                stress_score += min(abs(sentiment_score) * 20, 10)      # Max 10 points from sentiment
            elif sentiment == 'positive':
                # Positive sentiment reduces scores
                depression_score = max(0, depression_score - 5)
                anxiety_score = max(0, anxiety_score - 3)
                stress_score = max(0, stress_score - 2)

            # Add scores from mental health analysis
            if mental_health_result:
                mh_sentiment_score = mental_health_result.get('sentiment_score', 0)
                keywords = mental_health_result.get('keywords', {})

                # Depression indicators
                depression_keywords = keywords.get('depression', 0) + keywords.get('sadness', 0)
                depression_score += min(depression_keywords * 3, 12)  # Max 12 points from keywords

                # Anxiety indicators
                anxiety_keywords = keywords.get('anxiety', 0) + keywords.get('worry', 0) + keywords.get('fear', 0)
                anxiety_score += min(anxiety_keywords * 3, 12)  # Max 12 points from keywords

                # Stress indicators
                stress_keywords = keywords.get('stress', 0) + keywords.get('pressure', 0) + keywords.get('overwhelmed', 0)
                stress_score += min(stress_keywords * 3, 12)  # Max 12 points from keywords

            # Text-based pattern analysis
            text_lower = text.lower()

            # Depression patterns
            depression_patterns = ['sad', 'depressed', 'hopeless', 'worthless', 'empty', 'down', 'udaas', 'pareshan']
            depression_count = sum(1 for pattern in depression_patterns if pattern in text_lower)
            depression_score += min(depression_count * 2, 8)  # Max 8 points from patterns

            # Anxiety patterns
            anxiety_patterns = ['anxious', 'worried', 'nervous', 'scared', 'panic', 'tense', 'chinta', 'dar']
            anxiety_count = sum(1 for pattern in anxiety_patterns if pattern in text_lower)
            anxiety_score += min(anxiety_count * 2, 8)  # Max 8 points from patterns

            # Stress patterns
            stress_patterns = ['stressed', 'pressure', 'overwhelmed', 'tired', 'exhausted', 'burden', 'tension', 'dabav']
            stress_count = sum(1 for pattern in stress_patterns if pattern in text_lower)
            stress_score += min(stress_count * 2, 8)  # Max 8 points from patterns

            # Apply confidence weighting
            depression_score *= confidence
            anxiety_score *= confidence
            stress_score *= confidence

            # Convert to DASS-21 scale (0-42 for each subscale)
            depression_dass = min(depression_score * 1.2, 42)  # Scale to DASS range
            anxiety_dass = min(anxiety_score * 1.2, 42)
            stress_dass = min(stress_score * 1.2, 42)

            # Determine severity levels
            depression_severity = self._score_to_severity(depression_dass, 'depression')
            anxiety_severity = self._score_to_severity(anxiety_dass, 'anxiety')
            stress_severity = self._score_to_severity(stress_dass, 'stress')

            return {
                'depression': {
                    'score': round(depression_dass, 1),
                    'severity': depression_severity,
                    'raw_score': round(depression_score, 1)
                },
                'anxiety': {
                    'score': round(anxiety_dass, 1),
                    'severity': anxiety_severity,
                    'raw_score': round(anxiety_score, 1)
                },
                'stress': {
                    'score': round(stress_dass, 1),
                    'severity': stress_severity,
                    'raw_score': round(stress_score, 1)
                },
                'overall_risk': self._calculate_overall_risk(depression_dass, anxiety_dass, stress_dass),
                'confidence': round(confidence, 2)
            }

        except Exception as e:
            logger.error(f"❌ DASS scoring failed: {e}")
            return {
                'depression': {'score': 0, 'severity': 'normal', 'raw_score': 0},
                'anxiety': {'score': 0, 'severity': 'normal', 'raw_score': 0},
                'stress': {'score': 0, 'severity': 'normal', 'raw_score': 0},
                'overall_risk': 'low',
                'confidence': 0.0,
                'error': str(e)
            }
    
    def transcribe_file(self, file_path: str, language_hint: str = "hi") -> Dict:
        """
        Transcribe audio file to text
        
        Args:
            file_path: Path to audio file
            language_hint: Language hint for transcription
            
        Returns:
            Dictionary with transcription results
        """
        if not self.is_initialized:
            return {"error": "Voice processor not initialized"}
        
        try:
            # Load audio file
            audio_data, sample_rate = sf.read(file_path)
            
            # Resample if needed
            if sample_rate != self.sample_rate:
                # Simple resampling (for production, use librosa for better quality)
                audio_data = np.interp(
                    np.linspace(0, len(audio_data), int(len(audio_data) * self.sample_rate / sample_rate)),
                    np.arange(len(audio_data)),
                    audio_data
                )
            
            return self.transcribe_audio(audio_data, language_hint)

        except Exception as e:
            logger.error(f"❌ File transcription failed: {e}")
            return {"error": str(e)}

    def process_audio_with_complete_analysis(self, temp_path: str, language_hint: str = "hi") -> Dict:
        """
        Complete audio processing pipeline: transcription + sentiment analysis + DASS scoring

        Args:
            temp_path: Path to temporary audio file
            language_hint: Language hint for transcription

        Returns:
            Complete analysis results including transcription, sentiment, and mental health scores
        """
        try:
            logger.info("🎤 Starting complete voice analysis pipeline...")

            # Step 1: Transcribe audio
            transcription_result = self.transcribe_audio(temp_path, language_hint)

            if "error" in transcription_result:
                return {
                    "success": False,
                    "error": transcription_result["error"],
                    "stage": "transcription"
                }

            transcribed_text = transcription_result.get("transcription", "")
            detected_language = transcription_result.get("detected_language", language_hint)

            if not transcribed_text or not transcribed_text.strip():
                return {
                    "success": False,
                    "error": "No text transcribed from audio",
                    "stage": "transcription",
                    "transcription_result": transcription_result
                }

            logger.info(f"✅ Transcription completed: '{transcribed_text[:50]}...'")

            # Step 2: Perform complete text analysis
            analysis_result = self.analyze_transcribed_text(transcribed_text, detected_language)

            if "error" in analysis_result:
                return {
                    "success": False,
                    "error": analysis_result["error"],
                    "stage": "analysis",
                    "transcription_result": transcription_result
                }

            # Step 3: Combine all results
            complete_result = {
                "success": True,
                "transcription": {
                    "text": transcribed_text,
                    "original_text": transcription_result.get("original_text", transcribed_text),
                    "detected_language": detected_language,
                    "confidence": transcription_result.get("confidence", 0.0)
                },
                "sentiment_analysis": analysis_result.get("sentiment_analysis", {}),
                "mental_health_scores": analysis_result.get("mental_health_scores", {}),
                "dass_scores": analysis_result.get("dass_scores", {}),
                "tone_analysis": analysis_result.get("tone_analysis", {}),
                "weighted_assessment": analysis_result.get("weighted_assessment", {}),
                "processing_pipeline": "complete",
                "analysis_timestamp": time.time()
            }

            logger.info("✅ Complete voice analysis pipeline finished successfully!")
            return complete_result

        except Exception as e:
            logger.error(f"❌ Complete audio processing failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "stage": "pipeline",
                "analysis_timestamp": time.time()
            }

    def _calculate_dass_scores(self, sentiment_result: Dict, mental_health_result: Dict, text: str) -> Dict:
        """
        Calculate DASS-21 compatible scores from sentiment and mental health analysis
        """
        try:
            # Initialize base scores
            depression_score = 0
            anxiety_score = 0
            stress_score = 0

            # Extract sentiment information
            sentiment_label = sentiment_result.get('sentiment_label', 'NEUTRAL')
            sentiment_score = sentiment_result.get('sentiment_score', 0)
            confidence = sentiment_result.get('confidence_score', 0)

            # Base scoring from sentiment
            if sentiment_label == 'NEGATIVE':
                depression_score += min(abs(sentiment_score) * 15, 15)
                anxiety_score += min(abs(sentiment_score) * 12, 12)
                stress_score += min(abs(sentiment_score) * 10, 10)
            elif sentiment_label == 'POSITIVE':
                # Positive sentiment reduces scores
                depression_score = max(0, depression_score - 3)
                anxiety_score = max(0, anxiety_score - 2)
                stress_score = max(0, stress_score - 1)

            # Add emotion indicators from Hindi sentiment model
            emotion_indicators = sentiment_result.get('emotion_indicators', {})
            if emotion_indicators:
                depression_score += emotion_indicators.get('sadness', 0) * 8
                anxiety_score += emotion_indicators.get('fear', 0) * 8
                stress_score += emotion_indicators.get('anger', 0) * 6

                # Positive emotions reduce scores
                happiness = emotion_indicators.get('happiness', 0)
                calmness = emotion_indicators.get('calmness', 0)
                depression_score = max(0, depression_score - happiness * 5)
                anxiety_score = max(0, anxiety_score - calmness * 4)
                stress_score = max(0, stress_score - calmness * 3)

            # Text pattern analysis
            text_lower = text.lower()

            # Depression patterns (Hindi and English)
            depression_patterns = ['sad', 'depressed', 'hopeless', 'udaas', 'pareshan', 'dukhi']
            depression_count = sum(1 for pattern in depression_patterns if pattern in text_lower)
            depression_score += depression_count * 3

            # Anxiety patterns
            anxiety_patterns = ['anxious', 'worried', 'nervous', 'chinta', 'dar', 'ghabrahat']
            anxiety_count = sum(1 for pattern in anxiety_patterns if pattern in text_lower)
            anxiety_score += anxiety_count * 3

            # Stress patterns
            stress_patterns = ['stressed', 'pressure', 'overwhelmed', 'tension', 'dabav', 'pareshani']
            stress_count = sum(1 for pattern in stress_patterns if pattern in text_lower)
            stress_score += stress_count * 3

            # Apply confidence weighting
            depression_score *= max(confidence, 0.3)  # Minimum 30% confidence
            anxiety_score *= max(confidence, 0.3)
            stress_score *= max(confidence, 0.3)

            # Convert to DASS-21 scale (0-42)
            depression_dass = min(depression_score * 1.5, 42)
            anxiety_dass = min(anxiety_score * 1.5, 42)
            stress_dass = min(stress_score * 1.5, 42)

            return {
                'depression': {
                    'score': round(depression_dass, 1),
                    'severity': self._score_to_severity(depression_dass, 'depression'),
                    'raw_score': round(depression_score, 1)
                },
                'anxiety': {
                    'score': round(anxiety_dass, 1),
                    'severity': self._score_to_severity(anxiety_dass, 'anxiety'),
                    'raw_score': round(anxiety_score, 1)
                },
                'stress': {
                    'score': round(stress_dass, 1),
                    'severity': self._score_to_severity(stress_dass, 'stress'),
                    'raw_score': round(stress_score, 1)
                },
                'overall_risk': self._calculate_overall_risk(depression_dass, anxiety_dass, stress_dass),
                'confidence': round(confidence, 2)
            }

        except Exception as e:
            logger.error(f"❌ DASS scoring failed: {e}")
            return {
                'depression': {'score': 0, 'severity': 'normal', 'raw_score': 0},
                'anxiety': {'score': 0, 'severity': 'normal', 'raw_score': 0},
                'stress': {'score': 0, 'severity': 'normal', 'raw_score': 0},
                'overall_risk': 'low',
                'confidence': 0.0,
                'error': str(e)
            }

    def _score_to_severity(self, score: float, category: str) -> str:
        """Convert DASS score to severity level"""
        if category == 'depression':
            if score <= 9: return 'normal'
            elif score <= 13: return 'mild'
            elif score <= 20: return 'moderate'
            elif score <= 27: return 'severe'
            else: return 'extremely_severe'
        elif category == 'anxiety':
            if score <= 7: return 'normal'
            elif score <= 9: return 'mild'
            elif score <= 14: return 'moderate'
            elif score <= 19: return 'severe'
            else: return 'extremely_severe'
        elif category == 'stress':
            if score <= 14: return 'normal'
            elif score <= 18: return 'mild'
            elif score <= 25: return 'moderate'
            elif score <= 33: return 'severe'
            else: return 'extremely_severe'
        return 'normal'

    def _calculate_overall_risk(self, depression: float, anxiety: float, stress: float) -> str:
        """Calculate overall risk level"""
        max_score = max(depression, anxiety, stress)
        avg_score = (depression + anxiety + stress) / 3

        if max_score >= 28 or avg_score >= 20:
            return 'high'
        elif max_score >= 15 or avg_score >= 12:
            return 'moderate'
        elif max_score >= 8 or avg_score >= 6:
            return 'mild'
        else:
            return 'low'

    def _analyze_tone_patterns(self, text: str, language: str) -> Dict:
        """Analyze tone patterns in the transcribed text"""
        try:
            text_lower = text.lower()

            # Tone indicators
            tone_analysis = {
                'emotional_tone': 'neutral',
                'speech_patterns': {},
                'linguistic_indicators': {},
                'confidence': 0.5
            }

            # Emotional tone indicators
            positive_tone = ['happy', 'good', 'great', 'wonderful', 'khushi', 'acha', 'badhiya']
            negative_tone = ['sad', 'bad', 'terrible', 'awful', 'udaas', 'bura', 'ganda']
            anxious_tone = ['worried', 'nervous', 'scared', 'chinta', 'dar', 'ghabrahat']

            positive_count = sum(1 for word in positive_tone if word in text_lower)
            negative_count = sum(1 for word in negative_tone if word in text_lower)
            anxious_count = sum(1 for word in anxious_tone if word in text_lower)

            if anxious_count > 0:
                tone_analysis['emotional_tone'] = 'anxious'
            elif negative_count > positive_count:
                tone_analysis['emotional_tone'] = 'negative'
            elif positive_count > 0:
                tone_analysis['emotional_tone'] = 'positive'

            # Speech patterns
            words = text.split()
            tone_analysis['speech_patterns'] = {
                'word_count': len(words),
                'avg_word_length': sum(len(word) for word in words) / len(words) if words else 0,
                'complexity': 'simple' if len(words) < 10 else 'moderate' if len(words) < 30 else 'complex'
            }

            return tone_analysis

        except Exception as e:
            logger.error(f"❌ Tone analysis failed: {e}")
            return {
                'emotional_tone': 'neutral',
                'speech_patterns': {},
                'linguistic_indicators': {},
                'confidence': 0.0,
                'error': str(e)
            }

    def _calculate_simple_weighted_assessment(self, analysis_results: Dict) -> Dict:
        """Calculate a simple weighted assessment from all analysis components"""
        try:
            sentiment = analysis_results.get('sentiment_analysis', {})
            dass_scores = analysis_results.get('dass_scores', {})
            tone = analysis_results.get('tone_analysis', {})

            # Simple weighted scoring
            overall_score = 50  # Start with neutral

            # Adjust based on sentiment (40% weight)
            sentiment_label = sentiment.get('sentiment_label', 'NEUTRAL')
            if sentiment_label == 'POSITIVE':
                overall_score += 20
            elif sentiment_label == 'NEGATIVE':
                overall_score -= 25

            # Adjust based on DASS scores (50% weight)
            depression_score = dass_scores.get('depression', {}).get('score', 0)
            anxiety_score = dass_scores.get('anxiety', {}).get('score', 0)
            stress_score = dass_scores.get('stress', {}).get('score', 0)

            avg_dass = (depression_score + anxiety_score + stress_score) / 3
            overall_score -= avg_dass * 1.5  # Higher DASS scores reduce overall score

            # Adjust based on tone (10% weight)
            emotional_tone = tone.get('emotional_tone', 'neutral')
            if emotional_tone == 'positive':
                overall_score += 5
            elif emotional_tone in ['negative', 'anxious']:
                overall_score -= 8

            # Ensure score is within bounds
            overall_score = max(0, min(100, overall_score))

            return {
                'overall_score': round(overall_score, 1),
                'risk_level': 'low' if overall_score >= 70 else 'moderate' if overall_score >= 40 else 'high',
                'confidence': sentiment.get('confidence_score', 0.5),
                'components_used': ['sentiment', 'dass_scores', 'tone_analysis']
            }

        except Exception as e:
            logger.error(f"❌ Weighted assessment failed: {e}")
            return {
                'overall_score': 50.0,
                'risk_level': 'moderate',
                'confidence': 0.0,
                'error': str(e)
            }
    
    def get_available_microphones(self) -> list:
        """Get list of available microphone devices"""
        if not AUDIO_AVAILABLE:
            return []
        
        try:
            devices = sd.query_devices()
            microphones = []
            
            for i, device in enumerate(devices):
                if device['max_input_channels'] > 0:
                    microphones.append({
                        'id': i,
                        'name': device['name'],
                        'channels': device['max_input_channels'],
                        'sample_rate': device['default_samplerate']
                    })
            
            return microphones
            
        except Exception as e:
            logger.error(f"❌ Error getting microphones: {e}")
            return []
    
    def test_microphone(self, duration: float = 2.0) -> Dict:
        """
        Test microphone by recording a short sample
        
        Args:
            duration: Test duration in seconds
            
        Returns:
            Test results
        """
        try:
            logger.info(f"🧪 Testing microphone for {duration} seconds...")
            
            if not self.start_recording():
                return {"error": "Failed to start recording"}
            
            # Record for specified duration
            time.sleep(duration)
            
            audio_data = self.stop_recording()
            
            if audio_data is not None:
                # Analyze audio quality
                rms = np.sqrt(np.mean(audio_data**2))
                max_amplitude = np.max(np.abs(audio_data))
                
                return {
                    "success": True,
                    "duration": len(audio_data) / self.sample_rate,
                    "rms_level": float(rms),
                    "max_amplitude": float(max_amplitude),
                    "quality": "good" if rms > 0.01 else "low" if rms > 0.001 else "very_low"
                }
            else:
                return {"error": "No audio recorded"}
                
        except Exception as e:
            logger.error(f"❌ Microphone test failed: {e}")
            return {"error": str(e)}

# Utility functions
def initialize_enhanced_voice_processor() -> EnhancedVoiceProcessor:
    """Initialize and return enhanced voice processor"""
    return EnhancedVoiceProcessor()

def process_voice_with_complete_analysis(audio_file_path: str, language_hint: str = "hi") -> Dict:
    """
    Convenience function to process voice file with complete analysis pipeline

    Args:
        audio_file_path: Path to audio file
        language_hint: Language hint for transcription

    Returns:
        Complete analysis results
    """
    processor = initialize_enhanced_voice_processor()

    if not processor.is_initialized:
        return {
            "success": False,
            "error": "Voice processor failed to initialize",
            "stage": "initialization"
        }

    return processor.process_audio_with_complete_analysis(audio_file_path, language_hint)

def install_voice_dependencies():
    """Install required dependencies for voice processing"""
    import subprocess
    import sys
    
    dependencies = [
        "torch",
        "whisper", 
        "sounddevice",
        "soundfile"
    ]
    
    for dep in dependencies:
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", dep])
            logger.info(f"✅ Installed {dep}")
        except subprocess.CalledProcessError as e:
            logger.error(f"❌ Failed to install {dep}: {e}")

if __name__ == "__main__":
    # Test the enhanced voice processor
    processor = initialize_enhanced_voice_processor()
    
    if processor.is_initialized:
        print("✅ Enhanced Voice Processor initialized successfully!")
        print(f"🎮 Using device: {processor.device}")
        
        # Test microphone
        mics = processor.get_available_microphones()
        print(f"🎤 Available microphones: {len(mics)}")
        for mic in mics:
            print(f"   - {mic['name']}")
    else:
        print("❌ Failed to initialize Enhanced Voice Processor")
