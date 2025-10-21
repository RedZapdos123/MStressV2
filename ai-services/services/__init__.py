# This file exports all AI service modules for mental health assessment.
"""
MStress AI Services Module
Comprehensive AI services for mental health assessment
"""

# Import all services
try:
    from .roberta_sentiment_service import (
        RoBERTaSentimentAnalyzer,
        get_sentiment_analyzer,
        analyze_text_sentiment,
        analyze_multiple_texts_sentiment,
        get_sentiment_service_info
    )
except ImportError as e:
    print(f"Warning: RoBERTa sentiment service not available: {e}")

try:
    from .whisper_transcription_service import (
        WhisperTranscriptionService,
        get_transcription_service,
        transcribe_audio_file,
        transcribe_audio_bytes,
        get_speech_service_info
    )
except ImportError as e:
    print(f"Warning: Whisper transcription service not available: {e}")

try:
    from .fer_libreface_service import (
        FacialExpressionRecognizer,
        get_fer_service,
        recognize_emotion,
        recognize_emotion_from_bytes,
        detect_faces,
        get_fer_service_info
    )
except ImportError as e:
    print(f"Warning: FER service not available: {e}")

try:
    from .audio_analysis_service import (
        AudioAnalysisService,
        get_audio_service,
        extract_features,
        analyze_speech_rate,
        analyze_stress_indicators,
        get_audio_service_info
    )
except ImportError as e:
    print(f"Warning: Audio analysis service not available: {e}")

__all__ = [
    # RoBERTa Sentiment Analysis
    'RoBERTaSentimentAnalyzer',
    'get_sentiment_analyzer',
    'analyze_text_sentiment',
    'analyze_multiple_texts_sentiment',
    'get_sentiment_service_info',
    
    # Whisper Transcription
    'WhisperTranscriptionService',
    'get_transcription_service',
    'transcribe_audio_file',
    'transcribe_audio_bytes',
    'get_speech_service_info',
    
    # Facial Expression Recognition
    'FacialExpressionRecognizer',
    'get_fer_service',
    'recognize_emotion',
    'recognize_emotion_from_bytes',
    'detect_faces',
    'get_fer_service_info',
    
    # Audio Analysis
    'AudioAnalysisService',
    'get_audio_service',
    'extract_features',
    'analyze_speech_rate',
    'analyze_stress_indicators',
    'get_audio_service_info'
]

