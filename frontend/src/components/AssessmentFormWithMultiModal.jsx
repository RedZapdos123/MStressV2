import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ClipboardDocumentListIcon,
  CameraIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  MicrophoneIcon,
  StopIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../App';
import toast from 'react-hot-toast';

const AssessmentFormWithMultiModal = ({ 
  assessmentType = 'multi_modal',
  onComplete,
  userType = 'student'
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState({});
  const [facialImages, setFacialImages] = useState([]);
  const [stream, setStream] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const { user } = useAuth();

  // 20 DASS-21 questions
  const questions = [
    { id: 'q1', text: 'I found it hard to wind down', category: 'stress' },
    { id: 'q2', text: 'I was aware of dryness of my mouth', category: 'anxiety' },
    { id: 'q3', text: 'I could not experience any positive feeling at all', category: 'depression' },
    { id: 'q4', text: 'I experienced breathing difficulty', category: 'anxiety' },
    { id: 'q5', text: 'I found it difficult to work up the initiative to do things', category: 'depression' },
    { id: 'q6', text: 'I tended to over-react to situations', category: 'stress' },
    { id: 'q7', text: 'I experienced trembling', category: 'anxiety' },
    { id: 'q8', text: 'I felt that I was using a lot of nervous energy', category: 'stress' },
    { id: 'q9', text: 'I was worried about situations in which I might panic', category: 'anxiety' },
    { id: 'q10', text: 'I felt that I had nothing to look forward to', category: 'depression' },
    { id: 'q11', text: 'I found myself getting agitated', category: 'stress' },
    { id: 'q12', text: 'I found it difficult to relax', category: 'stress' },
    { id: 'q13', text: 'I felt downhearted and blue', category: 'depression' },
    { id: 'q14', text: 'I was intolerant of anything that kept me from getting on with what I was doing', category: 'stress' },
    { id: 'q15', text: 'I felt I was close to panic', category: 'anxiety' },
    { id: 'q16', text: 'I was unable to become enthusiastic about anything', category: 'depression' },
    { id: 'q17', text: 'I felt I was not worth much as a person', category: 'depression' },
    { id: 'q18', text: 'I felt that I was rather touchy', category: 'stress' },
    { id: 'q19', text: 'I was aware of the action of my heart in the absence of physical exertion', category: 'anxiety' },
    { id: 'q20', text: 'I felt scared without any good reason', category: 'anxiety' }
  ];

  const currentQuestion = questions[currentQuestionIndex];

  // Initialize camera only (video for facial capture)
  useEffect(() => {
    const initMedia = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
        });

        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.onloadedmetadata = () => {
            setCameraReady(true);
          };
        }
      } catch (err) {
        console.error('Camera access error:', err);
        setError('Unable to access camera. Please enable permissions.');
        toast.error('Camera access denied');
      }
    };

    initMedia();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Capture facial image
  const captureFacialImage = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !cameraReady) {
      return null;
    }

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;
      canvas.width = width;
      canvas.height = height;

      if (video.videoWidth > 0 && video.videoHeight > 0) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
      } else {
        context.fillStyle = '#e5e7eb';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = '#6b7280';
        context.font = '20px Arial';
        context.textAlign = 'center';
        context.fillText(`Q${currentQuestionIndex + 1}`, canvas.width / 2, canvas.height / 2);
      }

      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      const base64Data = imageDataUrl.split(',')[1];
      
      return base64Data;
    } catch (err) {
      console.error('Image capture error:', err);
      return null;
    }
  }, [cameraReady, currentQuestionIndex]);

  // Note: Voice recording removed from DASS-21 questions
  // Voice analysis will be handled in a separate section after DASS-21 completion

  // Handle next question
  const handleNextQuestion = async () => {
    if (!(currentQuestion.id in responses)) {
      toast.error('Please select an answer before proceeding');
      return;
    }

    setIsCapturing(true);
    try {
      // Capture facial image only (no voice recording during DASS-21)
      const facialImage = await captureFacialImage();

      let updatedImages = facialImages;
      if (facialImage) {
        updatedImages = [...facialImages, {
          questionIndex: currentQuestionIndex,
          questionId: currentQuestion.id,
          imageData: facialImage,
          timestamp: new Date().toISOString()
        }];
        setFacialImages(updatedImages);
      }

      // Move to next question
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        // All DASS-21 questions answered - pass updated arrays directly
        if (onComplete) {
          onComplete({
            responses: responses,
            facialImages: updatedImages,
            completedAt: new Date().toISOString()
          });
        }
      }
    } catch (err) {
      console.error('Error processing question:', err);
      toast.error('Error processing question. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete({
        responses: responses,
        facialImages: facialImages,
        completedAt: new Date().toISOString()
      });
    }
  };

  const handleResponseChange = (questionId, value) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  // No auto-start needed - voice recording is handled in separate VoiceAnalysisSection

  return (
    <div className="space-y-6">
      {/* Multi-Modal Capture Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Video Feed */}
        <div className="lg:col-span-1">
          <div className="bg-black rounded-lg overflow-hidden shadow-lg">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-48 object-cover"
            />
            <div className="bg-gray-900 p-3 text-center">
              <p className="text-white text-sm font-medium">📷 Camera</p>
              <p className="text-gray-400 text-xs mt-1">{facialImages.length}/20</p>
            </div>
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Voice Recording - Handled in separate VoiceAnalysisSection after DASS-21 */}

        {/* Question */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg p-6 shadow-sm border h-full">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  Q{currentQuestionIndex + 1}/{questions.length}
                </h3>
                <span className="text-sm text-purple-600 font-medium">
                  {currentQuestion.category.toUpperCase()}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                ></div>
              </div>
            </div>

            <p className="text-lg text-gray-900 mb-6">
              {currentQuestion.text}
            </p>

            {/* Response Options */}
            <div className="space-y-3">
              {[
                { value: 0, label: 'Did not apply' },
                { value: 1, label: 'Applied somewhat' },
                { value: 2, label: 'Applied considerably' },
                { value: 3, label: 'Applied very much' }
              ].map(option => (
                <label key={option.value} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-blue-50 transition-colors" style={{
                  borderColor: responses[currentQuestion.id] === option.value ? '#2563eb' : '#e5e7eb',
                  backgroundColor: responses[currentQuestion.id] === option.value ? '#eff6ff' : 'white'
                }}>
                  <input
                    type="radio"
                    name={currentQuestion.id}
                    value={option.value}
                    checked={responses[currentQuestion.id] === option.value}
                    onChange={() => handleResponseChange(currentQuestion.id, option.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="ml-3 text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <button
          onClick={handlePreviousQuestion}
          disabled={currentQuestionIndex === 0}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Previous
        </button>

        <button
          onClick={handleNextQuestion}
          disabled={isCapturing || !(currentQuestion.id in responses)}
          className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isCapturing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processing...
            </>
          ) : currentQuestionIndex === questions.length - 1 ? (
            <>
              Complete
              <CheckCircleIcon className="h-4 w-4 ml-2" />
            </>
          ) : (
            <>
              Next
              <ArrowRightIcon className="h-4 w-4 ml-2" />
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-red-900">Media Error</h4>
            <p className="text-sm text-red-800 mt-1">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssessmentFormWithMultiModal;

