#!/usr/bin/env python3
# This file provides the FastAPI application with endpoints for AI-powered mental health analysis.
"""
MStress AI Services - Facial Emotion Recognition
FastAPI service for comprehensive mental health assessment
"""

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from datetime import datetime
from typing import Dict, List, Optional
from pydantic import BaseModel
import base64
import logging

# Import our services (each guarded to prevent startup failure if one import breaks)
facial_emotion_service = None
assessment_service = None
analyze_text_sentiment = None
analyze_multiple_texts_sentiment = None
get_sentiment_service_info = None
transcribe_audio_file = None
get_speech_service_info = None
recognize_emotion = None
detect_faces = None
get_fer_service_info = None
extract_features = None
analyze_speech_rate = None
analyze_stress_indicators = None
get_audio_service_info = None

# Legacy/optional services that may rely on mediapipe; keep non-fatal if they fail
try:
    from services.facial_emotion_service import facial_emotion_service  # legacy, optional
except Exception as e:
    logging.warning(f"services.facial_emotion_service unavailable: {e}")

try:
    from services.assessment_service import assessment_service  # legacy, optional
except Exception as e:
    logging.warning(f"services.assessment_service unavailable: {e}")

# Core services used in the refactor
try:
    from services.roberta_sentiment_service import (
        analyze_text_sentiment,
        analyze_multiple_texts_sentiment,
        get_sentiment_service_info,
    )
except Exception as e:
    logging.warning(f"roberta_sentiment_service unavailable: {e}")

try:
    from services.whisper_transcription_service import (
        transcribe_audio_file,
        get_speech_service_info,
    )
except Exception as e:
    logging.warning(f"whisper_transcription_service unavailable: {e}")

try:
    from services.fer_libreface_service import (
        recognize_emotion,
        detect_faces,
        get_fer_service_info,
    )
except Exception as e:
    logging.warning(f"fer_libreface_service unavailable: {e}")

try:
    from services.audio_analysis_service import (
        extract_features,
        analyze_speech_rate,
        analyze_stress_indicators,
        get_audio_service_info,
    )
except Exception as e:
    logging.warning(f"audio_analysis_service unavailable: {e}")

# DASS-21 Scoring Service
dass21_scorer = None
try:
    from services.dass21_scoring_service import DASS21ScoringService
    dass21_scorer = DASS21ScoringService()
except Exception as e:
    logging.warning(f"dass21_scoring_service unavailable: {e}")

app = FastAPI(
    title="MStress AI Services",
    version="1.0.0",
    description="AI-powered mental health assessment services with facial emotion recognition"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class AssessmentRequest(BaseModel):
    user_id: str
    responses: List[Dict]
    assessment_type: str = "stress"

class ComprehensiveAssessmentRequest(BaseModel):
    user_id: str
    responses: List[Dict]
    facial_image: Optional[str] = None  # Base64 encoded image
    assessment_type: str = "comprehensive_stress"

class FacialEmotionRequest(BaseModel):
    image_data: str  # Base64 encoded image
    user_id: Optional[str] = None

class WebcamFrameRequest(BaseModel):
    image_data: str  # Base64 encoded image
    frame_number: Optional[int] = None
    reset_temporal: Optional[bool] = False
    user_id: Optional[str] = None

class SentimentAnalysisRequest(BaseModel):
    text: str
    user_id: Optional[str] = None

class MultipleSentimentRequest(BaseModel):
    texts: List[str]
    user_id: Optional[str] = None

class SpeechToTextRequest(BaseModel):
    audio_data: str  # Base64 encoded audio
    language: Optional[str] = None
    user_id: Optional[str] = None

class DASS21ScoringRequest(BaseModel):
    responses: List[int]  # List of 20 responses (0-3 scale)
    user_id: Optional[str] = None

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
        "services": {
            "ai_analysis": "operational",
            "recommendation_engine": "operational"
        }
    }

@app.get("/")
async def root():
    return {
        "message": "MStress AI Services",
        "version": "1.0.0",
        "status": "operational",
        "endpoints": {
            "health": "/health",
            "analyze_assessment": "/analyze/assessment",
            "analyze_comprehensive": "/analyze/comprehensive",
            "analyze_facial_emotion": "/analyze/facial-emotion",
            "analyze_webcam_frame": "/analyze/webcam-frame",
            "docs": "/docs"
        }
    }

@app.post("/analyze/facial-emotion")
async def analyze_facial_emotion(request: FacialEmotionRequest):
    """Analyze facial emotions from an image using LibreFace FER service"""
    try:
        # Use LibreFace FER service (primary) or fallback to legacy service
        if recognize_emotion:
            # Use LibreFace FER service
            result = recognize_emotion(request.image_data)
            return {
                "success": True,
                "data": result,
                "user_id": request.user_id,
                "timestamp": datetime.now().isoformat()
            }
        elif facial_emotion_service:
            # Fallback to legacy service
            import cv2
            import numpy as np

            # Decode base64 image
            try:
                image_data = base64.b64decode(request.image_data.split(',')[1] if ',' in request.image_data else request.image_data)
                image_array = np.frombuffer(image_data, np.uint8)
                image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)

                if image is None:
                    raise ValueError("Invalid image data")

            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Invalid image data: {str(e)}")

            # Analyze emotions in the frame
            emotion_results = facial_emotion_service.analyze_frame(image)

            if not emotion_results:
                return {
                    "success": True,
                    "data": {
                        "faces_detected": 0,
                        "emotions": [],
                        "message": "No faces detected in the image"
                    },
                    "timestamp": datetime.now().isoformat()
                }

            # Calculate overall stress level
            stress_assessment = facial_emotion_service.calculate_stress_level(emotion_results)

            return {
                "success": True,
                "data": {
                    "faces_detected": len(emotion_results),
                    "emotions": emotion_results,
                    "stress_assessment": stress_assessment,
                    "model_info": {
                        "name": "ElenaRyumina Emo-AffectNet",
                        "type": "dynamic" if facial_emotion_service.use_dynamic else "static",
                        "backbone": "ResNet50",
                        "temporal": facial_emotion_service.use_dynamic
                    }
                },
                "timestamp": datetime.now().isoformat()
            }
        else:
            raise HTTPException(status_code=503, detail="No facial emotion service available")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Facial emotion analysis failed: {str(e)}")

@app.post("/analyze/webcam-frame")
async def analyze_webcam_frame(request: WebcamFrameRequest):
    """Analyze facial emotions from webcam frame with temporal consistency"""
    try:
        if not facial_emotion_service:
            raise HTTPException(status_code=503, detail="Facial emotion service not available")
        
        # Reset temporal state if requested
        if request.reset_temporal:
            facial_emotion_service.reset_temporal_state()
        
        import cv2
        import numpy as np
        
        # Decode base64 image
        try:
            image_data = base64.b64decode(request.image_data.split(',')[1] if ',' in request.image_data else request.image_data)
            image_array = np.frombuffer(image_data, np.uint8)
            image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
            
            if image is None:
                raise ValueError("Invalid image data")
                
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid image data: {str(e)}")
        
        # Analyze emotions in the frame (uses temporal model)
        emotion_results = facial_emotion_service.analyze_frame(image)
        
        if not emotion_results:
            return {
                "success": True,
                "data": {
                    "faces_detected": 0,
                    "emotions": [],
                    "frame_number": request.frame_number,
                    "message": "No faces detected in the frame"
                },
                "timestamp": datetime.now().isoformat()
            }
        
        # Calculate stress level for this frame
        stress_assessment = facial_emotion_service.calculate_stress_level(emotion_results)
        
        result = {
            "success": True,
            "faces_detected": len(emotion_results),
            "emotions": emotion_results,
            "stress_assessment": stress_assessment,
            "frame_number": request.frame_number,
            "temporal_analysis": True,
            "model_info": {
                "name": "ElenaRyumina Emo-AffectNet Dynamic",
                "type": "dynamic",
                "backbone": "ResNet50",
                "temporal": "LSTM"
            }
        }
        
        return {
            "success": True,
            "data": result,
            "timestamp": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Webcam frame analysis failed: {str(e)}")

@app.post("/analyze/comprehensive")
async def analyze_comprehensive_assessment(request: ComprehensiveAssessmentRequest):
    """Analyze comprehensive assessment with questionnaire and optional facial emotion data"""
    try:
        if not assessment_service:
            raise HTTPException(status_code=503, detail="Assessment service not available")

        result = assessment_service.generate_comprehensive_assessment(
            questionnaire_responses=request.responses,
            facial_image_data=request.facial_image
        )

        if 'error' in result:
            raise HTTPException(status_code=400, detail=result['error'])

        return {
            "success": True,
            "data": result,
            "timestamp": datetime.now().isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Comprehensive assessment failed: {str(e)}")

# Sentiment Analysis Endpoints
@app.post("/sentiment/analyze")
async def analyze_sentiment(request: SentimentAnalysisRequest):
    """Analyze sentiment of text input"""
    try:
        if not analyze_text_sentiment:
            raise HTTPException(status_code=503, detail="Sentiment analysis service not available")

        result = analyze_text_sentiment(request.text)

        return {
            "success": True,
            "data": result,
            "user_id": request.user_id,
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sentiment analysis failed: {str(e)}")

@app.post("/sentiment/analyze-multiple")
async def analyze_multiple_sentiments(request: MultipleSentimentRequest):
    """Analyze sentiment of multiple texts"""
    try:
        if not analyze_multiple_texts_sentiment:
            raise HTTPException(status_code=503, detail="Sentiment analysis service not available")

        results = analyze_multiple_texts_sentiment(request.texts)

        return {
            "success": True,
            "data": results,
            "user_id": request.user_id,
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Multiple sentiment analysis failed: {str(e)}")

@app.get("/sentiment/info")
async def get_sentiment_info():
    """Get sentiment analysis service information"""
    try:
        if not get_sentiment_service_info:
            raise HTTPException(status_code=503, detail="Sentiment analysis service not available")

        info = get_sentiment_service_info()
        return {"success": True, "data": info}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get sentiment service info: {str(e)}")

# Speech-to-Text Endpoints
@app.post("/speech/transcribe")
async def transcribe_speech(request: SpeechToTextRequest):
    """Transcribe audio to text"""
    try:
        if not transcribe_audio_file:
            raise HTTPException(status_code=503, detail="Speech-to-text service not available")

        result = transcribe_audio_file(request.audio_data, request.language)

        return {
            "success": True,
            "data": result,
            "user_id": request.user_id,
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Speech transcription failed: {str(e)}")

@app.post("/speech/analyze-stress")
async def analyze_speech_stress(request: SpeechToTextRequest):
    """Analyze voice for stress indicators"""
    try:
        if not analyze_voice_stress:
            raise HTTPException(status_code=503, detail="Voice stress analysis service not available")

        result = analyze_voice_stress(request.audio_data)

        return {
            "success": True,
            "data": result,
            "user_id": request.user_id,
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Voice stress analysis failed: {str(e)}")

# ============ NEW AI SERVICES ENDPOINTS ============

@app.post("/fer/recognize-emotion")
async def fer_recognize_emotion(request: FacialEmotionRequest):
    """Recognize emotions from facial image using libreface"""
    try:
        if not recognize_emotion:
            raise HTTPException(status_code=503, detail="FER service not available")

        result = recognize_emotion(request.image_data)

        return {
            "success": True,
            "data": result,
            "user_id": request.user_id,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Emotion recognition failed: {str(e)}")

@app.post("/fer/detect-faces")
async def fer_detect_faces(request: FacialEmotionRequest):
    """Detect faces in image"""
    try:
        if not detect_faces:
            raise HTTPException(status_code=503, detail="Face detection service not available")

        result = detect_faces(request.image_data)

        return {
            "success": True,
            "data": result,
            "user_id": request.user_id,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Face detection failed: {str(e)}")

@app.get("/fer/info")
async def fer_info():
    """Get FER service information"""
    if not get_fer_service_info:
        raise HTTPException(status_code=503, detail="FER service not available")

    return {
        "success": True,
        "data": get_fer_service_info()
    }

@app.post("/audio/extract-features")
async def audio_extract_features(request: SpeechToTextRequest):
    """Extract audio features"""
    try:
        if not extract_features:
            raise HTTPException(status_code=503, detail="Audio analysis service not available")

        result = extract_features(request.audio_data)

        return {
            "success": True,
            "data": result,
            "user_id": request.user_id,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Feature extraction failed: {str(e)}")

@app.post("/audio/analyze-stress")
async def audio_analyze_stress(request: SpeechToTextRequest):
    """Analyze audio for stress indicators"""
    try:
        if not analyze_stress_indicators:
            raise HTTPException(status_code=503, detail="Audio analysis service not available")

        result = analyze_stress_indicators(request.audio_data)

        return {
            "success": True,
            "data": result,
            "user_id": request.user_id,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Stress analysis failed: {str(e)}")

@app.get("/audio/info")
async def audio_info():
    """Get audio analysis service information"""
    if not get_audio_service_info:
        raise HTTPException(status_code=503, detail="Audio service not available")

    return {
        "success": True,
        "data": get_audio_service_info()
    }

@app.get("/speech/info")
async def get_speech_info():
    """Get speech-to-text service information"""
    try:
        if not get_speech_service_info:
            raise HTTPException(status_code=503, detail="Speech-to-text service not available")

        info = get_speech_service_info()
        return {"success": True, "data": info}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get speech service info: {str(e)}")

@app.post("/score/dass21")
async def score_dass21(request: DASS21ScoringRequest):
    """
    Score a DASS-21 assessment based on 20 MCQ responses.

    Request body:
    {
        "responses": [0, 1, 2, 3, ...],  # List of 20 integers (0-3 scale)
        "user_id": "optional_user_id"
    }

    Returns:
    {
        "success": true,
        "data": {
            "depression": {"score": X, "severity": "...", "percentage": X},
            "anxiety": {"score": X, "severity": "...", "percentage": X},
            "stress": {"score": X, "severity": "...", "percentage": X},
            "overall": {"score": X, "severity": "...", "percentage": X},
            "interpretation": "...",
            "recommendations": [...]
        }
    }
    """
    try:
        if not dass21_scorer:
            raise HTTPException(status_code=503, detail="DASS-21 scoring service not available")

        # Score the assessment
        result = dass21_scorer.score_assessment(request.responses)

        return {
            "success": True,
            "data": result,
            "user_id": request.user_id,
            "timestamp": datetime.now().isoformat()
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid request: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DASS-21 scoring failed: {str(e)}")

@app.get("/services/all")
async def get_all_services_info():
    """Get information about all available AI services"""
    services_info = {
        "sentiment_analysis": get_sentiment_service_info() if get_sentiment_service_info else {"status": "unavailable"},
        "speech_to_text": get_speech_service_info() if get_speech_service_info else {"status": "unavailable"},
        "facial_emotion_recognition": get_fer_service_info() if get_fer_service_info else {"status": "unavailable"},
        "audio_analysis": get_audio_service_info() if get_audio_service_info else {"status": "unavailable"},
        "dass21_scoring": {"status": "available"} if dass21_scorer else {"status": "unavailable"}
    }

    return {
        "success": True,
        "timestamp": datetime.now().isoformat(),
        "services": services_info
    }

if __name__ == "__main__":
    print("Starting MStress AI Services...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
