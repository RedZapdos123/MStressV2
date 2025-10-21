#!/usr/bin/env python3.
"""
Facial Emotion Recognition Service using ElenaRyumina's Emo-AffectNet Model
Provides facial emotion analysis for stress assessment with state-of-the-art accuracy
Integrates with the comprehensive assessment system
"""

# Suppress MediaPipe warnings before importing.
import os
import warnings
import logging

# Comprehensive warning suppression for MediaPipe and TensorFlow.
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'  # Suppress TensorFlow warnings
os.environ['CUDA_VISIBLE_DEVICES'] = ''  # Force CPU usage to avoid CUDA warnings
os.environ['GLOG_minloglevel'] = '3'      # Suppress MediaPipe C++ warnings
os.environ['MEDIAPIPE_DISABLE_GPU'] = '1'  # Disable MediaPipe GPU processing
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'  # Disable TensorFlow optimization warnings

# Configure logging to suppress warnings from external libraries.
logging.getLogger('tensorflow').setLevel(logging.ERROR)
logging.getLogger('mediapipe').setLevel(logging.ERROR)
logging.getLogger('absl').setLevel(logging.ERROR)

warnings.filterwarnings('ignore', category=UserWarning, module='google.protobuf')
warnings.filterwarnings('ignore', category=UserWarning, module='tensorflow')
warnings.filterwarnings('ignore', category=UserWarning, module='mediapipe')
warnings.filterwarnings('ignore', category=FutureWarning)
warnings.filterwarnings('ignore', category=DeprecationWarning)

import cv2
import numpy as np
import logging
import base64
import io
import math
from typing import Dict, List, Optional, Tuple
from datetime import datetime
from PIL import Image
import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import transforms
from pathlib import Path
import sys
from contextlib import contextmanager

@contextmanager
def suppress_stderr():
    """Context manager to temporarily suppress stderr output"""
    with open(os.devnull, "w") as devnull:
        old_stderr = sys.stderr
        sys.stderr = devnull
        try:
            yield
        finally:
            sys.stderr = old_stderr

# Import MediaPipe with stderr suppression to avoid C++ warnings.
with suppress_stderr():
    import mediapipe as mp

# Configure logging.
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class Bottleneck(nn.Module):
    expansion = 4
    def __init__(self, in_channels, out_channels, i_downsample=None, stride=1):
        super(Bottleneck, self).__init__()
        
        self.conv1 = nn.Conv2d(in_channels, out_channels, kernel_size=1, stride=stride, padding=0, bias=False)
        self.batch_norm1 = nn.BatchNorm2d(out_channels, eps=0.001, momentum=0.99)
        
        self.conv2 = nn.Conv2d(out_channels, out_channels, kernel_size=3, padding='same', bias=False)
        self.batch_norm2 = nn.BatchNorm2d(out_channels, eps=0.001, momentum=0.99)
        
        self.conv3 = nn.Conv2d(out_channels, out_channels*self.expansion, kernel_size=1, stride=1, padding=0, bias=False)
        self.batch_norm3 = nn.BatchNorm2d(out_channels*self.expansion, eps=0.001, momentum=0.99)
        
        self.i_downsample = i_downsample
        self.stride = stride
        self.relu = nn.ReLU()
        
    def forward(self, x):
        identity = x.clone()
        x = self.relu(self.batch_norm1(self.conv1(x)))
        
        x = self.relu(self.batch_norm2(self.conv2(x)))
        
        x = self.conv3(x)
        x = self.batch_norm3(x)
        
        #downsample if needed.
        if self.i_downsample is not None:
            identity = self.i_downsample(identity)
        #add identity.
        x+=identity
        x=self.relu(x)
        
        return x

class Conv2dSame(torch.nn.Conv2d):
    def calc_same_pad(self, i: int, k: int, s: int, d: int) -> int:
        return max((math.ceil(i / s) - 1) * s + (k - 1) * d + 1 - i, 0)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        ih, iw = x.size()[-2:]

        pad_h = self.calc_same_pad(i=ih, k=self.kernel_size[0], s=self.stride[0], d=self.dilation[0])
        pad_w = self.calc_same_pad(i=iw, k=self.kernel_size[1], s=self.stride[1], d=self.dilation[1])

        if pad_h > 0 or pad_w > 0:
            x = F.pad(
                x, [pad_w // 2, pad_w - pad_w // 2, pad_h // 2, pad_h - pad_h // 2]
            )
        return F.conv2d(
            x,
            self.weight,
            self.bias,
            self.stride,
            self.padding,
            self.dilation,
            self.groups,
        )

class ResNet(nn.Module):
    def __init__(self, ResBlock, layer_list, num_classes, num_channels=3):
        super(ResNet, self).__init__()
        self.in_channels = 64

        self.conv_layer_s2_same = Conv2dSame(num_channels, 64, 7, stride=2, groups=1, bias=False)
        self.batch_norm1 = nn.BatchNorm2d(64, eps=0.001, momentum=0.99)
        self.relu = nn.ReLU()
        self.max_pool = nn.MaxPool2d(kernel_size = 3, stride=2)
        
        self.layer1 = self._make_layer(ResBlock, layer_list[0], planes=64, stride=1)
        self.layer2 = self._make_layer(ResBlock, layer_list[1], planes=128, stride=2)
        self.layer3 = self._make_layer(ResBlock, layer_list[2], planes=256, stride=2)
        self.layer4 = self._make_layer(ResBlock, layer_list[3], planes=512, stride=2)
        
        self.avgpool = nn.AdaptiveAvgPool2d((1,1))
        self.fc1 = nn.Linear(512*ResBlock.expansion, 512)
        self.relu1 = nn.ReLU()
        self.fc2 = nn.Linear(512, num_classes)

    def extract_features(self, x):
        x = self.relu(self.batch_norm1(self.conv_layer_s2_same(x)))
        x = self.max_pool(x)
        x = self.layer1(x)
        x = self.layer2(x)
        x = self.layer3(x)
        x = self.layer4(x)
        
        x = self.avgpool(x)
        x = x.reshape(x.shape[0], -1)
        x = self.fc1(x)
        return x
        
    def forward(self, x):
        x = self.extract_features(x)
        x = self.relu1(x)
        x = self.fc2(x)
        return x
        
    def _make_layer(self, ResBlock, blocks, planes, stride=1):
        ii_downsample = None
        layers = []
        
        if stride != 1 or self.in_channels != planes*ResBlock.expansion:
            ii_downsample = nn.Sequential(
                nn.Conv2d(self.in_channels, planes*ResBlock.expansion, kernel_size=1, stride=stride, bias=False, padding=0),
                nn.BatchNorm2d(planes*ResBlock.expansion, eps=0.001, momentum=0.99)
            )
            
        layers.append(ResBlock(self.in_channels, planes, i_downsample=ii_downsample, stride=stride))
        self.in_channels = planes*ResBlock.expansion
        
        for i in range(blocks-1):
            layers.append(ResBlock(self.in_channels, planes))
            
        return nn.Sequential(*layers)

def ResNet50(num_classes, channels=3):
    return ResNet(Bottleneck, [3,4,6,3], num_classes, channels)

class LSTMPyTorch(nn.Module):
    def __init__(self):
        super(LSTMPyTorch, self).__init__()
        
        self.lstm1 = nn.LSTM(input_size=512, hidden_size=512, batch_first=True, bidirectional=False)
        self.lstm2 = nn.LSTM(input_size=512, hidden_size=256, batch_first=True, bidirectional=False)
        self.fc = nn.Linear(256, 7)
        self.softmax = nn.Softmax(dim=1)

    def forward(self, x):
        x, _ = self.lstm1(x)
        x, _ = self.lstm2(x)        
        x = self.fc(x[:, -1, :])
        x = self.softmax(x)
        return x

class PreprocessInput(torch.nn.Module):
    def __init__(self):
        super(PreprocessInput, self).__init__()

    def forward(self, x):
        x = x.to(torch.float32)
        x = torch.flip(x, dims=(0,))
        x[0, :, :] -= 91.4953
        x[1, :, :] -= 103.8827
        x[2, :, :] -= 131.0912
        return x

class FacialEmotionService:
    """
    Service for analyzing facial emotions using ElenaRyumina's Emo-AffectNet model
    Provides both static and dynamic (temporal) emotion recognition
    """
    
    def __init__(self, model_path: Optional[str] = None, use_dynamic: bool = True):
        """
        Initialize the enhanced facial emotion recognition service
        
        Args:
            model_path: Path to the model directory
            use_dynamic: Whether to use dynamic LSTM model for temporal analysis
        """
        self.model_path = model_path or "models/face_emotion_recognition"
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.use_dynamic = use_dynamic
        
        # Emotion labels matching the training data.
        self.emotion_labels = ['Neutral', 'Happiness', 'Sadness', 'Surprise', 'Fear', 'Disgust', 'Anger']
        self.emotion_mapping = {i: label for i, label in enumerate(self.emotion_labels)}
        
        # Stress level mapping based on emotions.
        self.stress_indicators = {
            'high_stress': ['Anger', 'Fear', 'Sadness'],
            'moderate_stress': ['Disgust', 'Surprise'],
            'low_stress': ['Happiness', 'Neutral']
        }
        
        # Initialize MediaPipe face detection with optimized settings.
        self.mp_face_mesh = mp.solutions.face_mesh
        try:
            # Use static image mode to avoid temporal inference feedback warnings.
            self.face_mesh = self.mp_face_mesh.FaceMesh(
                max_num_faces=1,
                refine_landmarks=False,
                min_detection_confidence=0.5,
                min_tracking_confidence=0.5,
                static_image_mode=True  # Use static mode to avoid feedback tensor warnings
            )
            logger.info("MediaPipe face mesh initialized successfully")
        except Exception as e:
            logger.warning(f"MediaPipe initialization warning (non-critical): {e}")
            # Fallback initialization with minimal settings.
            self.face_mesh = self.mp_face_mesh.FaceMesh(
                max_num_faces=1,
                static_image_mode=True
            )
        
        # Load models.
        self.backbone_model = self._load_backbone_model()
        if self.use_dynamic:
            self.lstm_model = self._load_lstm_model()
            self.lstm_features = []  # Store features for temporal analysis
        
        # Image preprocessing.
        self.transform = transforms.Compose([
            transforms.PILToTensor(),
            PreprocessInput()
        ])
    
    def _load_backbone_model(self):
        """Load the ResNet50 backbone model"""
        try:
            model = ResNet50(7, channels=3)
            model_file = os.path.join(self.model_path, "FER_static_ResNet50_AffectNet.pt")
            
            if os.path.exists(model_file):
                # Load model with proper error handling.
                try:
                    # First try with weights_only=False for better compatibility.
                    state_dict = torch.load(model_file, map_location='cpu')
                    if isinstance(state_dict, dict):
                        model.load_state_dict(state_dict)
                    else:
                        # If it's a complete model, extract state_dict.
                        if hasattr(state_dict, 'state_dict'):
                            model.load_state_dict(state_dict.state_dict())
                        else:
                            model = state_dict  # Use the loaded model directly
                    logger.info(f"✅ Successfully loaded backbone model from {model_file}")
                except Exception as load_error:
                    logger.warning(f"⚠️ Error loading model weights: {load_error}, using random initialization")
            else:
                logger.warning(f"⚠️ Model file not found at {model_file}, using random weights")
            
            model.to(self.device)
            model.eval()
            return model
            
        except Exception as e:
            logger.error(f"❌ Error creating backbone model: {e}")
            return None
    
    def _load_lstm_model(self):
        """Load the LSTM model for temporal analysis"""
        try:
            model = LSTMPyTorch()
            # Use Aff-Wild2 model as default (best performance).
            model_file = os.path.join(self.model_path, "FER_dinamic_LSTM_Aff-Wild2.pt")
            
            if os.path.exists(model_file):
                try:
                    # Load with CPU mapping for better compatibility.
                    state_dict = torch.load(model_file, map_location='cpu')
                    if isinstance(state_dict, dict):
                        model.load_state_dict(state_dict)
                    else:
                        # If it's a complete model, extract state_dict.
                        if hasattr(state_dict, 'state_dict'):
                            model.load_state_dict(state_dict.state_dict())
                        else:
                            model = state_dict  # Use the loaded model directly
                    logger.info(f"✅ Successfully loaded LSTM model from {model_file}")
                except Exception as load_error:
                    logger.warning(f"⚠️ Error loading LSTM model weights: {load_error}")
                    return None
            else:
                logger.warning(f"⚠️ LSTM model file not found at {model_file}")
                return None
            
            model.to(self.device)
            model.eval()
            return model
            
        except Exception as e:
            logger.error(f"❌ Error creating LSTM model: {e}")
            return None
    
    def _norm_coordinates(self, normalized_x, normalized_y, image_width, image_height):
        """Convert normalized coordinates to pixel coordinates"""
        x_px = min(math.floor(normalized_x * image_width), image_width - 1)
        y_px = min(math.floor(normalized_y * image_height), image_height - 1)
        return x_px, y_px
    
    def _get_face_box(self, landmarks, w, h):
        """Extract face bounding box from MediaPipe landmarks"""
        idx_to_coors = {}
        for idx, landmark in enumerate(landmarks.landmark):
            landmark_px = self._norm_coordinates(landmark.x, landmark.y, w, h)
            if landmark_px:
                idx_to_coors[idx] = landmark_px

        if not idx_to_coors:
            return None

        x_coords = [coord[0] for coord in idx_to_coors.values()]
        y_coords = [coord[1] for coord in idx_to_coors.values()]
        
        x_min = min(x_coords)
        y_min = min(y_coords)
        x_max = max(x_coords)
        y_max = max(y_coords)

        startX = max(0, x_min)
        startY = max(0, y_min)
        endX = min(w - 1, x_max)
        endY = min(h - 1, y_max)
        
        return startX, startY, endX, endY
    
    def detect_faces(self, image: np.ndarray) -> List[Tuple[int, int, int, int]]:
        """
        Detect faces in an image using MediaPipe
        
        Args:
            image: Input image as numpy array
            
        Returns:
            List of face bounding boxes (x, y, w, h)
        """
        try:
            h, w = image.shape[:2]
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            results = self.face_mesh.process(rgb_image)
            
            faces = []
            if results.multi_face_landmarks:
                for landmarks in results.multi_face_landmarks:
                    box = self._get_face_box(landmarks, w, h)
                    if box:
                        faces.append(box)
            
            return faces
        except Exception as e:
            logger.error(f"Error detecting faces: {e}")
            return []
    
    def _preprocess_face(self, face_image: np.ndarray) -> torch.Tensor:
        """Preprocess face image for model input"""
        try:
            # Convert to PIL Image.
            pil_image = Image.fromarray(cv2.cvtColor(face_image, cv2.COLOR_BGR2RGB))
            
            # Resize to model input size.
            pil_image = pil_image.resize((224, 224), Image.Resampling.NEAREST)
            
            # Apply transforms.
            input_tensor = self.transform(pil_image).unsqueeze(0).to(self.device)
            
            return input_tensor
        except Exception as e:
            logger.error(f"Error preprocessing face image: {e}")
            return None
    
    def analyze_emotion_static(self, face_image: np.ndarray) -> Dict:
        """
        Analyze emotion in a face image using static model
        
        Args:
            face_image: Cropped face image
            
        Returns:
            Dictionary with emotion predictions and confidence scores
        """
        try:
            if self.backbone_model is None:
                return self._get_mock_emotion_result()
            
            # Preprocess the face image.
            input_tensor = self._preprocess_face(face_image)
            if input_tensor is None:
                return self._get_mock_emotion_result()
            
            # Get emotion predictions.
            with torch.no_grad():
                outputs = self.backbone_model(input_tensor)
                probabilities = torch.nn.functional.softmax(outputs, dim=1)
                confidence_scores = probabilities.cpu().numpy()[0]
            
            # Create emotion results.
            emotion_results = {}
            for i, emotion in enumerate(self.emotion_labels):
                emotion_results[emotion] = float(confidence_scores[i])
            
            # Get dominant emotion.
            dominant_emotion_idx = np.argmax(confidence_scores)
            dominant_emotion = self.emotion_labels[dominant_emotion_idx]
            confidence = float(np.max(confidence_scores))
            
            return {
                'dominant_emotion': dominant_emotion,
                'confidence': confidence,
                'all_emotions': emotion_results,
                'timestamp': datetime.now().isoformat(),
                'model_type': 'static'
            }
            
        except Exception as e:
            logger.error(f"Error analyzing emotion: {e}")
            return self._get_mock_emotion_result()
    
    def analyze_emotion_dynamic(self, face_image: np.ndarray) -> Dict:
        """
        Analyze emotion using dynamic LSTM model for temporal consistency
        
        Args:
            face_image: Cropped face image
            
        Returns:
            Dictionary with emotion predictions and confidence scores
        """
        try:
            if self.backbone_model is None or self.lstm_model is None:
                return self.analyze_emotion_static(face_image)
            
            # Preprocess the face image.
            input_tensor = self._preprocess_face(face_image)
            if input_tensor is None:
                return self._get_mock_emotion_result()
            
            # Extract features using backbone.
            with torch.no_grad():
                features = torch.nn.functional.relu(
                    self.backbone_model.extract_features(input_tensor)
                ).cpu().detach().numpy()
            
            # Maintain sliding window of features (10 frames).
            if len(self.lstm_features) == 0:
                self.lstm_features = [features] * 10
            else:
                self.lstm_features = self.lstm_features[1:] + [features]
            
            # Prepare LSTM input.
            lstm_input = torch.from_numpy(np.vstack(self.lstm_features))
            lstm_input = torch.unsqueeze(lstm_input, 0).to(self.device)
            
            # Get emotion predictions.
            with torch.no_grad():
                outputs = self.lstm_model(lstm_input)
                confidence_scores = outputs.cpu().detach().numpy()[0]
            
            # Create emotion results.
            emotion_results = {}
            for i, emotion in enumerate(self.emotion_labels):
                emotion_results[emotion] = float(confidence_scores[i])
            
            # Get dominant emotion.
            dominant_emotion_idx = np.argmax(confidence_scores)
            dominant_emotion = self.emotion_labels[dominant_emotion_idx]
            confidence = float(np.max(confidence_scores))
            
            return {
                'dominant_emotion': dominant_emotion,
                'confidence': confidence,
                'all_emotions': emotion_results,
                'timestamp': datetime.now().isoformat(),
                'model_type': 'dynamic'
            }
            
        except Exception as e:
            logger.error(f"Error analyzing dynamic emotion: {e}")
            return self.analyze_emotion_static(face_image)
    
    def analyze_emotion(self, face_image: np.ndarray) -> Dict:
        """
        Analyze emotion in a face image (uses dynamic model if available)
        
        Args:
            face_image: Cropped face image
            
        Returns:
            Dictionary with emotion predictions and confidence scores
        """
        if self.use_dynamic and self.lstm_model is not None:
            return self.analyze_emotion_dynamic(face_image)
        else:
            return self.analyze_emotion_static(face_image)
    
    def analyze_frame(self, image: np.ndarray) -> List[Dict]:
        """
        Analyze emotions in all faces found in an image frame
        
        Args:
            image: Input image as numpy array
            
        Returns:
            List of emotion analysis results for each detected face
        """
        try:
            faces = self.detect_faces(image)
            results = []
            
            for face_box in faces:
                startX, startY, endX, endY = face_box
                face_image = image[startY:endY, startX:endX]
                
                if face_image.size > 0:
                    emotion_result = self.analyze_emotion(face_image)
                    emotion_result['face_box'] = face_box
                    results.append(emotion_result)
            
            return results
            
        except Exception as e:
            logger.error(f"Error analyzing frame: {e}")
            return []
    
    def _get_mock_emotion_result(self) -> Dict:
        """Return mock emotion results for testing"""
        return {
            'dominant_emotion': 'Neutral',
            'confidence': 0.75,
            'all_emotions': {
                'Neutral': 0.75,
                'Happiness': 0.15,
                'Sadness': 0.05,
                'Surprise': 0.02,
                'Fear': 0.01,
                'Disgust': 0.01,
                'Anger': 0.01
            },
            'timestamp': datetime.now().isoformat(),
            'model_type': 'mock'
        }
    
    def calculate_stress_level(self, emotion_results: List[Dict]) -> Dict:
        """
        Calculate stress level based on emotion analysis results
        
        Args:
            emotion_results: List of emotion analysis results
            
        Returns:
            Dictionary with stress assessment
        """
        try:
            if not emotion_results:
                return {
                    'stress_level': 'unknown',
                    'stress_score': 0,
                    'confidence': 0,
                    'analysis': 'No emotion data available'
                }
            
            # Calculate weighted stress score.
            total_stress_score = 0
            total_confidence = 0
            emotion_counts = {emotion: 0 for emotion in self.emotion_labels}
            
            for result in emotion_results:
                dominant_emotion = result.get('dominant_emotion', 'Neutral')
                confidence = result.get('confidence', 0)
                
                emotion_counts[dominant_emotion] += 1
                total_confidence += confidence
                
                # Assign stress weights.
                if dominant_emotion in self.stress_indicators['high_stress']:
                    total_stress_score += 3 * confidence
                elif dominant_emotion in self.stress_indicators['moderate_stress']:
                    total_stress_score += 2 * confidence
                else:
                    total_stress_score += 1 * confidence
            
            # Normalize stress score.
            avg_confidence = total_confidence / len(emotion_results)
            normalized_stress_score = (total_stress_score / (3 * len(emotion_results))) * 100
            
            # Determine stress level.
            if normalized_stress_score >= 70:
                stress_level = 'high'
            elif normalized_stress_score >= 40:
                stress_level = 'moderate'
            else:
                stress_level = 'low'
            
            return {
                'stress_level': stress_level,
                'stress_score': round(normalized_stress_score, 2),
                'confidence': round(avg_confidence, 2),
                'emotion_distribution': emotion_counts,
                'total_frames_analyzed': len(emotion_results),
                'analysis': f"Analyzed {len(emotion_results)} frames with {avg_confidence:.2f} average confidence"
            }
            
        except Exception as e:
            logger.error(f"Error calculating stress level: {e}")
            return {
                'stress_level': 'error',
                'stress_score': 0,
                'confidence': 0,
                'analysis': f'Error in stress calculation: {str(e)}'
            }

    def reset_temporal_state(self):
        """Reset the temporal state for LSTM model"""
        self.lstm_features = []

# Create a global instance.
facial_emotion_service = FacialEmotionService()