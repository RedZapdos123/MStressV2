import React, { useRef, useEffect, useState } from 'react';

/**
 * EmotionVisualization Component
 * Provides real-time emotion detection overlay on camera feed
 */
const EmotionVisualization = ({ 
  webcamRef, 
  isAnalyzing, 
  emotionResults, 
  onEmotionDetected 
}) => {
  const canvasRef = useRef(null);
  const [detectedFaces, setDetectedFaces] = useState([]);
  const [currentEmotion, setCurrentEmotion] = useState(null);
  const [lastAnalysisTime, setLastAnalysisTime] = useState(0);
  const animationFrameRef = useRef(null);

  // Analysis frequency control (analyze every 2 seconds)
  const ANALYSIS_INTERVAL = 2000;

  // Mock face detection for demonstration (replace with actual face detection)
  const detectFaces = async () => {
    if (!webcamRef.current || !isAnalyzing) return [];

    // Simulate face detection with bounding box
    // In production, this would use actual face detection library
    const mockFace = {
      x: 120, // x position of face
      y: 80,  // y position of face
      width: 200, // width of face bounding box
      height: 240, // height of face bounding box
      confidence: 0.95
    };

    return [mockFace];
  };

  // Analyze emotions from detected faces
  const analyzeEmotions = async (faces) => {
    if (!faces.length || !webcamRef.current) return;

    try {
      // Capture current frame for analysis
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) return;

      // Convert base64 image to blob
      const response = await fetch(imageSrc);
      const blob = await response.blob();

      // Create FormData for API request
      const formData = new FormData();
      formData.append('image', blob, 'webcam_frame.jpg');

      // Call enhanced facial emotion API
      const apiResponse = await fetch('http://localhost:8000/analyze_webcam_frame', {
        method: 'POST',
        body: formData
      });

      if (!apiResponse.ok) {
        throw new Error(`API error: ${apiResponse.status}`);
      }

      const result = await apiResponse.json();
      
      if (result.status === 'success' && result.data) {
        const { emotions, dominant_emotion, confidence } = result.data;
        
        const emotionData = {
          emotions: emotions,
          dominantEmotion: dominant_emotion,
          confidence: confidence,
          timestamp: Date.now(),
          faces: faces
        };

        setCurrentEmotion(emotionData);
        
        if (onEmotionDetected) {
          onEmotionDetected(emotionData);
        }
      } else {
        // Fallback to neutral emotion if no face detected
        const fallbackEmotion = {
          emotions: { neutral: 1.0 },
          dominantEmotion: 'neutral',
          confidence: 1.0,
          timestamp: Date.now(),
          faces: []
        };
        setCurrentEmotion(fallbackEmotion);
      }
    } catch (error) {
      console.error('Emotion analysis error:', error);
      // Keep previous emotion state on error
    }
  };

  // Draw overlay on canvas
  const drawOverlay = () => {
    const canvas = canvasRef.current;
    const video = webcamRef.current?.video;
    
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    const { videoWidth, videoHeight } = video;
    
    // Set canvas size to match video
    canvas.width = videoWidth;
    canvas.height = videoHeight;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!isAnalyzing) return;

    // Draw face bounding boxes
    detectedFaces.forEach((face, index) => {
      // Draw bounding box
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 3;
      ctx.strokeRect(face.x, face.y, face.width, face.height);

      // Draw confidence label
      ctx.fillStyle = '#00ff00';
      ctx.font = '16px Arial';
      ctx.fillText(
        `Face ${index + 1} (${(face.confidence * 100).toFixed(1)}%)`,
        face.x,
        face.y - 10
      );

      // Draw emotion labels if available
      if (currentEmotion) {
        const emotions = Object.entries(currentEmotion.emotions)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3); // Show top 3 emotions

        emotions.forEach(([emotion, confidence], i) => {
          const y = face.y + face.height + 25 + (i * 20);
          const percentage = (confidence * 100).toFixed(1);
          
          ctx.fillStyle = i === 0 ? '#ff6b6b' : '#4ecdc4';
          ctx.font = '14px Arial';
          ctx.fillText(
            `${emotion}: ${percentage}%`,
            face.x,
            y
          );
        });
      }
    });

    // Draw analysis status
    if (isAnalyzing) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(10, 10, 200, 30);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px Arial';
      ctx.fillText('🔍 Analyzing emotions...', 20, 30);
    }
  };

  // Animation loop for real-time updates
  const animate = async () => {
    if (isAnalyzing) {
      const currentTime = Date.now();
      
      // Always draw overlay for smooth visual feedback
      drawOverlay();
      
      // Only analyze emotions at specified intervals to avoid overwhelming the API
      if (currentTime - lastAnalysisTime >= ANALYSIS_INTERVAL) {
        const faces = await detectFaces();
        setDetectedFaces(faces);
        
        if (faces.length > 0 || !currentEmotion) {
          await analyzeEmotions(faces.length > 0 ? faces : [{ x: 120, y: 80, width: 200, height: 240, confidence: 0.8 }]);
          setLastAnalysisTime(currentTime);
        }
      }
    }
    
    animationFrameRef.current = requestAnimationFrame(animate);
  };

  // Start/stop animation based on analysis state
  useEffect(() => {
    if (isAnalyzing) {
      animate();
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      // Clear overlay when not analyzing
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isAnalyzing]);

  return (
    <div className="relative">
      {/* Canvas overlay for emotion visualization */}
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full pointer-events-none z-10"
        style={{
          mixBlendMode: 'normal',
          opacity: isAnalyzing ? 1 : 0,
          transition: 'opacity 0.3s ease'
        }}
      />
      
      {/* Real-time emotion display */}
      {isAnalyzing && currentEmotion && (
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-80 text-white p-4 rounded-lg z-20 min-w-48">
          <div className="text-sm font-medium mb-3 text-green-400">🎭 Live Emotion Analysis</div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-300">Dominant:</span>
              <span className="font-medium text-yellow-400 text-sm">
                {currentEmotion.dominantEmotion?.toUpperCase()} 
                <span className="text-xs text-gray-400 ml-1">
                  ({(currentEmotion.confidence * 100).toFixed(1)}%)
                </span>
              </span>
            </div>
            
            <div className="border-t border-gray-600 pt-2">
              <div className="text-xs text-gray-300 mb-2">All Emotions:</div>
              {Object.entries(currentEmotion.emotions || {})
                .sort(([,a], [,b]) => b - a)
                .slice(0, 4)
                .map(([emotion, confidence]) => (
                  <div key={emotion} className="flex justify-between text-xs mb-1">
                    <span className="capitalize">{emotion}:</span>
                    <div className="flex items-center">
                      <div className="w-12 h-1 bg-gray-600 rounded mr-2">
                        <div 
                          className="h-full bg-blue-400 rounded"
                          style={{ width: `${confidence * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-blue-300">{(confidence * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                ))
              }
            </div>
            
            <div className="text-xs text-gray-400 pt-2 border-t border-gray-600">
              Updated: {new Date(currentEmotion.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}
      
      {/* Analysis indicator */}
      {isAnalyzing && (
        <div className="absolute top-4 right-4 z-20">
          <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium animate-pulse flex items-center">
            🔴 <span className="ml-1">ANALYZING</span>
          </div>
          <div className="text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded mt-1 text-center">
            ElenaRyumina AI
          </div>
        </div>
      )}
    </div>
  );
};

export default EmotionVisualization;
