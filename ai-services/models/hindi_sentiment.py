"""
Hindi Sentiment Analysis Model for Army Mental Health Assessment
CPU-ONLY, OFFLINE-CAPABLE VERSION
"""
import os
import sys
import re
import numpy as np
from pathlib import Path
from typing import Dict, List, Tuple, Optional

# Force CPU usage - NO GPU
os.environ["CUDA_VISIBLE_DEVICES"] = ""
os.environ["TORCH_USE_CUDA"] = "0"

try:
    import torch
    # Force CPU device - compatible with older PyTorch versions
    if hasattr(torch, 'set_default_device'):
        torch.set_default_device('cpu')
    if hasattr(torch, 'set_default_dtype'):
        torch.set_default_dtype(torch.float32)

    from transformers import AutoTokenizer, AutoModelForSequenceClassification, pipeline
    TRANSFORMERS_AVAILABLE = True
except ImportError as e:
    print(f"Transformers not available: {e}")
    TRANSFORMERS_AVAILABLE = False

# Add parent directory to path for config import
sys.path.append(str(Path(__file__).parent.parent.parent))

try:
    from config import MODELS_DIR, HINDI_MODELS, MODEL_CONFIG
except ImportError:
    # Fallback configuration with absolute model paths
    MODELS_DIR = Path(r"./models")
    MODELS_DIR.mkdir(exist_ok=True)
    HINDI_MODELS = {
        "sentiment_primary": {
            "model_name": "ai4bharat/indic-bert",
            "local_path": MODELS_DIR / "indic-bert"
        },
        "sentiment_secondary": {
            "model_name": "l3cube-pune/hindi-bert-v2",
            "local_path": MODELS_DIR / "hindi-bert-v2"
        },
        "sentiment_fallback": {
            "model_name": "roberta-base",
            "local_path": MODELS_DIR / "roberta-sentiment"
        }
    }
    MODEL_CONFIG = {"device": "cpu", "local_files_only": True}

class HindiSentimentAnalyzer:
    """
    Hindi Sentiment Analysis using local Hugging Face models
    """
    
    def __init__(self):
        self.model = None
        self.tokenizer = None
        self.sentiment_pipeline = None
        self.model_loaded = False
        # Try multiple models in order of preference for better Hindi/Hinglish support
        self.model_candidates = [
            "cardiffnlp/twitter-xlm-roberta-base-sentiment",  # Multilingual XLM-RoBERTa
            "ai4bharat/indic-bert",  # Indic-BERT for Indian languages
            "cardiffnlp/twitter-roberta-base-sentiment-latest",  # Fallback English model
        ]
        self.current_model_name = None
        
    def download_and_load_model(self) -> bool:
        """
        Download and load Hindi sentiment analysis model with priority-based selection
        """
        if not TRANSFORMERS_AVAILABLE:
            print("⚠ Transformers not available, using enhanced keyword-based sentiment analysis")
            self._setup_fallback_analyzer()
            return False

        # Try models in priority order - better multilingual models first
        for model_name in self.model_candidates:
            try:
                print(f"Attempting to load {model_name} (CPU-only)")

                if self._try_load_model_direct(model_name):
                    print(f"✓ Successfully loaded {model_name}")
                    self.current_model_name = model_name
                    return True
                else:
                    print(f"✗ Failed to load {model_name}, trying next...")

            except Exception as e:
                print(f"✗ Error loading {model_name}: {str(e)}")
                continue

        # If all models fail, use enhanced keyword-based analysis
        print("⚠ All transformer models failed, using enhanced keyword-based sentiment analysis")
        self._setup_fallback_analyzer()
        return False

    def _try_load_model(self, model_name: str, local_path) -> bool:
        """Try to load a specific model"""
        try:

            # Create local directory if it doesn't exist
            local_path.mkdir(parents=True, exist_ok=True)

            # Try to load from local cache first (offline mode)
            try:
                self.tokenizer = AutoTokenizer.from_pretrained(
                    str(local_path),
                    local_files_only=True
                )

                self.model = AutoModelForSequenceClassification.from_pretrained(
                    str(local_path),
                    local_files_only=True,
                    torch_dtype=torch.float32,
                    low_cpu_mem_usage=True
                )
                print("✓ Loaded model from local cache (offline mode)")

            except Exception as local_error:
                print(f"Local model not found, downloading: {local_error}")

                # Download and save model locally (requires internet - one time only)
                self.tokenizer = AutoTokenizer.from_pretrained(
                    model_name,
                    cache_dir=str(local_path)
                )

                self.model = AutoModelForSequenceClassification.from_pretrained(
                    model_name,
                    cache_dir=str(local_path),
                    torch_dtype=torch.float32,
                    low_cpu_mem_usage=True
                )

                # Save for offline use
                self.tokenizer.save_pretrained(str(local_path))
                self.model.save_pretrained(str(local_path))
                print("✓ Model downloaded and saved for offline use")

            # Force CPU usage
            self.model.to('cpu')
            self.model.eval()  # Set to evaluation mode

            # Create sentiment analysis pipeline (CPU-only)
            self.sentiment_pipeline = pipeline(
                "sentiment-analysis",
                model=self.model,
                tokenizer=self.tokenizer,
                device=-1,  # Force CPU
                framework="pt"
            )

            self.model_loaded = True
            print("✓ Hindi sentiment model loaded successfully (CPU-only)")
            return True

        except Exception as e:
            print(f"✗ Error loading Hindi sentiment model: {str(e)}")
            print("⚠ Falling back to keyword-based sentiment analysis")
            # Fallback to a simpler approach if model loading fails
            self._setup_fallback_analyzer()
            return False

    def _try_load_model_direct(self, model_name: str) -> bool:
        """Try to load a model directly from Hugging Face"""
        try:
            # Try to load from cache first, then download if needed
            self.sentiment_pipeline = pipeline(
                "sentiment-analysis",
                model=model_name,
                device=-1,  # Force CPU
                framework="pt",
                return_all_scores=True
            )

            self.model_loaded = True
            print(f"✓ {model_name} loaded successfully (CPU-only)")
            return True

        except Exception as e:
            print(f"✗ Error loading {model_name}: {str(e)}")
            return False

    def _setup_fallback_analyzer(self):
        """
        Setup fallback sentiment analyzer using keyword-based approach
        """
        print("Setting up fallback keyword-based sentiment analyzer...")

        # Enhanced Hindi and English sentiment keywords
        self.positive_keywords = [
            # English positive emotions
            "happy", "good", "great", "excellent", "wonderful", "amazing", "fantastic",
            "awesome", "brilliant", "perfect", "outstanding", "superb", "marvelous",
            "delighted", "pleased", "satisfied", "content", "joyful", "cheerful",
            "excited", "enthusiastic", "optimistic", "confident", "proud", "grateful",
            "blessed", "lucky", "successful", "accomplished", "victorious", "winning",
            "strong", "powerful", "healthy", "fit", "energetic", "vibrant", "alive",
            "calm", "peaceful", "relaxed", "comfortable", "secure", "safe", "stable",
            "love", "loved", "loving", "caring", "kind", "friendly", "supportive",
            "team", "together", "unity", "cooperation", "collaboration", "help",
            "better", "improved", "progress", "achievement", "success", "victory",
            "very good", "very happy", "feeling great", "doing well", "going well",

            # Hindi positive emotions
            "खुश", "प्रसन्न", "अच्छा", "बेहतर", "सकारात्मक", "शांत", "संतुष्ट",
            "आनंद", "हर्ष", "उत्साह", "आशा", "विश्वास", "स्वस्थ", "मजबूत",
            # Confidence and strength
            "आत्मविश्वास", "तंदुरुस्त", "फिट", "सक्षम", "योग्य", "ताकतवर",
            # Satisfaction and pride
            "गर्व", "सम्मान", "राजी", "खुशी", "प्रेम", "स्नेह",
            # Military positive terms
            "तैयार", "सेवा", "कर्तव्य", "मिशन", "टीम", "साथी", "यूनिट", "सहयोग",
            # Additional positive
            "बहुत अच्छा", "बहुत खुश", "बहुत बेहतर"
        ]

        self.negative_keywords = [
            # English negative emotions
            "sad", "bad", "terrible", "awful", "horrible", "disgusting", "hate",
            "angry", "mad", "furious", "rage", "annoyed", "irritated", "frustrated",
            "depressed", "depression", "hopeless", "helpless", "worthless", "useless",
            "anxious", "anxiety", "worried", "nervous", "scared", "afraid", "fearful",
            "stressed", "stress", "pressure", "overwhelmed", "exhausted", "tired",
            "weak", "sick", "ill", "pain", "hurt", "suffering", "miserable",
            "lonely", "alone", "isolated", "abandoned", "rejected", "disappointed",
            "upset", "disturbed", "troubled", "concerned", "bothered", "uncomfortable",
            "negative", "pessimistic", "doubtful", "uncertain", "confused", "lost",
            "failed", "failure", "defeated", "losing", "lost", "broken", "damaged",
            "very sad", "very bad", "feeling terrible", "going badly", "not good",

            # Hindi negative emotions
            "दुख", "उदास", "दुखी", "परेशान", "चिंतित", "तनाव", "डर", "भय", "गुस्सा",
            "क्रोध", "निराश", "हताश", "अवसाद", "बेचैन", "घबराहट", "कमजोर",
            # Additional negative terms
            "बीमार", "दर्द", "पीड़ा", "तकलीफ", "कष्ट", "समस्या", "मुश्किल",
            "अकेला", "अकेलापन", "थका", "थकान", "सुस्त", "बेदम", "निढाल",
            # Intensity markers
            "बहुत दुख", "बहुत परेशान", "बहुत तनाव", "बहुत चिंता"
        ]

        self.neutral_keywords = [
            # English neutral
            "okay", "ok", "fine", "normal", "average", "usual", "regular", "typical",
            "maybe", "perhaps", "sometimes", "usually", "generally", "mostly",
            # Hindi neutral
            "सामान्य", "ठीक", "वैसा", "कभी", "शायद", "लगता", "होता", "रहता"
        ]

        # Intensity multipliers for better scoring
        self.intensity_words = {
            # English intensifiers
            "very": 1.5, "extremely": 2.0, "really": 1.3, "quite": 1.2, "so": 1.4,
            "too": 1.3, "much": 1.2, "highly": 1.4, "deeply": 1.5, "totally": 1.6,
            # Hindi intensifiers
            "बहुत": 1.5, "अत्यधिक": 2.0, "काफी": 1.3, "ज्यादा": 1.4, "अधिक": 1.2
        }

        self.model_loaded = True
    
    def preprocess_text(self, text: str) -> str:
        """
        Preprocess text for sentiment analysis (supports both Hindi and English)
        """
        if not text:
            return ""

        # Convert to lowercase for better matching
        text = text.lower()

        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text.strip())

        # Keep Hindi characters (Devanagari), English letters, numbers, and basic punctuation
        # This allows both Hindi and English text to be processed
        text = re.sub(r'[^\u0900-\u097Fa-zA-Z0-9\s\.\,\!\?\-]', '', text)

        return text
    
    def analyze_sentiment_with_model(self, text: str) -> Dict[str, float]:
        """
        Analyze sentiment using the loaded model
        """
        try:
            if not self.sentiment_pipeline:
                raise Exception("Model not loaded")

            # Preprocess text
            processed_text = self.preprocess_text(text)

            if not processed_text:
                return {"label": "NEUTRAL", "score": 0.5}

            # Get sentiment prediction
            results = self.sentiment_pipeline(processed_text)

            # Handle different pipeline output formats
            if isinstance(results[0], list):
                # Multiple scores returned (return_all_scores=True)
                result = max(results[0], key=lambda x: x['score'])
            else:
                # Single result returned
                result = results[0]

            # Normalize labels for different models
            label = result["label"].upper()
            if label in ["POSITIVE", "POS", "LABEL_2"]:
                label = "POSITIVE"
            elif label in ["NEGATIVE", "NEG", "LABEL_0"]:
                label = "NEGATIVE"
            else:
                label = "NEUTRAL"

            return {
                "label": label,
                "score": result["score"]
            }

        except Exception as e:
            print(f"Error in model-based sentiment analysis: {str(e)}")
            return self.analyze_sentiment_fallback(text)
    
    def analyze_sentiment_fallback(self, text: str) -> Dict[str, float]:
        """
        Enhanced fallback keyword-based sentiment analysis
        """
        processed_text = self.preprocess_text(text)

        if not processed_text:
            return {"label": "NEUTRAL", "score": 0.5}

        # Count keyword matches with better scoring
        positive_matches = []
        negative_matches = []
        neutral_matches = []

        # Find all keyword matches
        for keyword in self.positive_keywords:
            if keyword.lower() in processed_text:
                positive_matches.append(keyword)

        for keyword in self.negative_keywords:
            if keyword.lower() in processed_text:
                negative_matches.append(keyword)

        for keyword in self.neutral_keywords:
            if keyword.lower() in processed_text:
                neutral_matches.append(keyword)

        positive_count = len(positive_matches)
        negative_count = len(negative_matches)
        neutral_count = len(neutral_matches)

        # Enhanced scoring logic
        if positive_count == 0 and negative_count == 0:
            if neutral_count > 0:
                return {"label": "NEUTRAL", "score": 0.6}
            return {"label": "NEUTRAL", "score": 0.5}

        # Calculate base scores
        positive_score = positive_count * 1.0
        negative_score = negative_count * 1.0

        # Apply intensity multipliers
        intensity_multiplier = 1.0
        for intensity_word, multiplier in self.intensity_words.items():
            if intensity_word.lower() in processed_text:
                intensity_multiplier = max(intensity_multiplier, multiplier)
                break

        # Apply intensity to the dominant sentiment
        if positive_count > negative_count:
            positive_score *= intensity_multiplier
        elif negative_count > positive_count:
            negative_score *= intensity_multiplier
        else:
            # Equal counts, apply to both
            positive_score *= intensity_multiplier
            negative_score *= intensity_multiplier

        total_score = positive_score + negative_score

        # Determine final sentiment with improved confidence calculation
        if positive_score > negative_score:
            # Calculate confidence based on dominance and intensity
            dominance_ratio = positive_score / max(total_score, 1)
            base_confidence = 0.65 + (dominance_ratio * 0.3)  # Base range: 0.65-0.95

            # Boost confidence for clear positive indicators
            if positive_count >= 2 or intensity_multiplier > 1.2:
                base_confidence = min(base_confidence + 0.1, 0.95)

            return {"label": "POSITIVE", "score": base_confidence}

        elif negative_score > positive_score:
            # Calculate confidence based on dominance and intensity
            dominance_ratio = negative_score / max(total_score, 1)
            base_confidence = 0.65 + (dominance_ratio * 0.3)  # Base range: 0.65-0.95

            # Boost confidence for clear negative indicators
            if negative_count >= 2 or intensity_multiplier > 1.2:
                base_confidence = min(base_confidence + 0.1, 0.95)

            return {"label": "NEGATIVE", "score": base_confidence}
        else:
            # Equal positive and negative - lean towards neutral but with some uncertainty
            return {"label": "NEUTRAL", "score": 0.55}
    
    def analyze_sentiment(self, text: str) -> Dict[str, any]:
        """
        Main method to analyze sentiment of Hindi text
        """
        if not self.model_loaded:
            self.download_and_load_model()
        
        # Try model-based analysis first, fallback to keyword-based
        if self.sentiment_pipeline:
            result = self.analyze_sentiment_with_model(text)
        else:
            result = self.analyze_sentiment_fallback(text)
        
        # Convert to standardized format
        sentiment_score = result["score"]
        if result["label"] == "NEGATIVE":
            sentiment_score = -sentiment_score
        elif result["label"] == "NEUTRAL":
            sentiment_score = 0.0
        
        return {
            "sentiment_label": result["label"],
            "sentiment_score": sentiment_score,  # -1 to 1 scale
            "confidence_score": abs(result["score"]),
            "raw_result": result
        }
    
    def batch_analyze_sentiment(self, texts: List[str]) -> List[Dict[str, any]]:
        """
        Analyze sentiment for multiple texts
        """
        results = []
        for text in texts:
            results.append(self.analyze_sentiment(text))
        return results
    
    def get_emotion_indicators(self, text: str) -> Dict[str, float]:
        """
        Get specific emotion indicators from text (supports both Hindi and English)
        """
        processed_text = self.preprocess_text(text)

        emotion_keywords = {
            "stress": [
                # English
                "stress", "stressed", "pressure", "overwhelmed", "burden", "strain",
                # Hindi
                "तनाव", "दबाव", "परेशानी", "चिंता", "बेचैनी"
            ],
            "depression": [
                # English
                "sad", "depressed", "depression", "hopeless", "despair", "miserable",
                # Hindi
                "उदासी", "अवसाद", "निराशा", "हताशा", "दुख"
            ],
            "anxiety": [
                # English
                "anxious", "anxiety", "worried", "nervous", "scared", "afraid",
                # Hindi
                "घबराहट", "डर", "भय", "चिंता", "बेचैनी"
            ],
            "anger": [
                # English
                "angry", "mad", "furious", "rage", "annoyed", "irritated",
                # Hindi
                "गुस्सा", "क्रोध", "चिढ़", "नाराजगी", "रोष"
            ],
            "happiness": [
                # English
                "happy", "joyful", "cheerful", "delighted", "pleased", "excited",
                # Hindi
                "खुश", "प्रसन्न", "आनंद", "हर्ष", "उत्साह"
            ],
            "calmness": [
                # English
                "calm", "peaceful", "relaxed", "serene", "tranquil", "composed",
                # Hindi
                "शांत", "आराम", "स्थिर", "संयम", "धैर्य"
            ]
        }

        emotion_scores = {}
        for emotion, keywords in emotion_keywords.items():
            count = sum(1 for keyword in keywords if keyword.lower() in processed_text)
            # Improved scoring with better normalization
            if count > 0:
                emotion_scores[emotion] = min(count / max(len(keywords) * 0.3, 1), 1.0)
            else:
                emotion_scores[emotion] = 0.0

        return emotion_scores

# Global instance
hindi_sentiment_analyzer = HindiSentimentAnalyzer()

def analyze_hindi_sentiment(text: str) -> Dict[str, any]:
    """
    Convenience function to analyze Hindi sentiment
    """
    return hindi_sentiment_analyzer.analyze_sentiment(text)

def get_emotion_analysis(text: str) -> Dict[str, any]:
    """
    Get comprehensive emotion analysis for Hindi text
    """
    sentiment_result = hindi_sentiment_analyzer.analyze_sentiment(text)
    emotion_indicators = hindi_sentiment_analyzer.get_emotion_indicators(text)
    
    return {
        **sentiment_result,
        "emotion_indicators": emotion_indicators
    }
