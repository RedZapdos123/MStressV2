import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ClipboardDocumentListIcon,
  CameraIcon,
  ClockIcon,
  ShieldCheckIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  ArrowLeftIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import Webcam from 'react-webcam';
import AssessmentForm from '../components/AssessmentForm';
import DetailedAssessment from '../components/DetailedAssessment';
import MultiModalAssessment from '../components/MultiModalAssessment';
import EmotionVisualization from '../components/EmotionVisualization';
import { useAuth } from '../App';
import toast from 'react-hot-toast';
import axios from 'axios';

const AssessmentPage = () => {
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Webcam and facial analysis state
  const [showWebcam, setShowWebcam] = useState(false);
  const [webcamEnabled, setWebcamEnabled] = useState(false);
  const [webcamError, setWebcamError] = useState(null);
  const [videoFrames, setVideoFrames] = useState([]);
  const [facialAnalysisEnabled, setFacialAnalysisEnabled] = useState(false);
  const [cameraPermission, setCameraPermission] = useState('prompt'); // 'granted', 'denied', 'prompt'
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [analysisResults, setAnalysisResults] = useState(null);
  const webcamRef = useRef(null);
  const frameIntervalRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const videoDataRef = useRef([]);

  // Check if a specific assessment type was requested
  const requestedType = searchParams.get('type');

  // Webcam utility functions
  const requestCameraPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
          facingMode: 'user'
        }
      });

      // Permission granted
      setCameraPermission('granted');
      setWebcamEnabled(true);
      setWebcamError(null);

      // Stop the stream immediately as we'll let react-webcam handle it
      stream.getTracks().forEach(track => track.stop());

      return true;
    } catch (error) {
      console.error('Camera permission error:', error);
      setCameraPermission('denied');
      setWebcamError(error.message);

      if (error.name === 'NotAllowedError') {
        toast.error('Camera permission denied. Assessment will continue without facial analysis.');
      } else if (error.name === 'NotFoundError') {
        toast.error('No camera found. Assessment will continue without facial analysis.');
      } else {
        toast.error('Camera access failed. Assessment will continue without facial analysis.');
      }

      return false;
    }
  }, []);

  const analyzeFrameRealTime = useCallback(async (imageData, frameNumber) => {
    try {
      const response = await axios.post('http://localhost:8000/analyze/webcam-frame', {
        image_data: imageData,
        frame_number: frameNumber,
        reset_temporal: frameNumber === 1, // Reset on first frame
        user_id: user?.id
      });

      if (response.data.success && response.data.data.faces_detected > 0) {
        const emotionData = response.data.data.emotions[0];
        
        // Update analysis results in real-time
        setAnalysisResults(prev => ({
          ...prev,
          currentEmotion: emotionData.dominant_emotion,
          currentConfidence: emotionData.confidence,
          currentStressLevel: response.data.data.stress_assessment.stress_level,
          realTimeUpdate: true,
          frameNumber: frameNumber
        }));
        
        return emotionData;
      }
    } catch (error) {
      console.error('Real-time analysis error:', error);
    }
    return null;
  }, [user?.id]);

  const captureVideoFrame = useCallback(() => {
    // Debug logging
    console.log('🎥 Attempting frame capture:', {
      webcamRef: !!webcamRef.current,
      webcamEnabled,
      isRecording,
      hasVideo: !!webcamRef.current?.video
    });

    if (!webcamRef.current) {
      console.warn('❌ Webcam ref not available');
      return null;
    }

    if (!webcamEnabled) {
      console.warn('❌ Webcam not enabled');
      return null;
    }

    if (!isRecording) {
      console.warn('❌ Not currently recording');
      return null;
    }

    try {
      // Wait for webcam to be ready
      const video = webcamRef.current.video;
      if (!video || video.readyState !== 4) {
        console.warn('❌ Video not ready, readyState:', video?.readyState);
        return null;
      }

      const imageSrc = webcamRef.current.getScreenshot({
        width: 640,
        height: 480,
        quality: 0.8
      });

      if (imageSrc) {
        const timestamp = new Date().toISOString();
        const frameData = { imageSrc, timestamp };

        // Store frame in memory for real-time analysis
        videoDataRef.current.push(frameData);
        setVideoFrames(prev => [...prev, frameData]);

        console.log('✅ Frame captured successfully, total frames:', videoDataRef.current.length);

        // Perform real-time analysis every 3rd frame to reduce load
        if (videoDataRef.current.length % 3 === 0) {
          analyzeFrameRealTime(imageSrc, videoDataRef.current.length);
        }

        // Keep only last 60 frames (30 seconds at 2 FPS)
        if (videoDataRef.current.length > 60) {
          videoDataRef.current = videoDataRef.current.slice(-60);
          setVideoFrames(prev => prev.slice(-60));
        }

        return imageSrc;
      } else {
        console.warn('❌ getScreenshot() returned null');
      }
    } catch (error) {
      console.error('❌ Error capturing video frame:', error);
    }

    return null;
  }, [webcamEnabled, isRecording, analyzeFrameRealTime]);

  const startVideoRecording = useCallback(() => {
    if (facialAnalysisEnabled && webcamEnabled) {
      setIsRecording(true);
      setRecordingDuration(0);
      videoDataRef.current = [];
      setVideoFrames([]);

      // Start capturing frames at 2 FPS for real-time analysis
      frameIntervalRef.current = setInterval(() => {
        captureVideoFrame();
      }, 500); // 500ms = 2 FPS

      // Start recording timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          const newDuration = prev + 1;

          // Stop recording after 10 seconds and analyze
          if (newDuration >= 10) {
            stopVideoRecording();
            analyzeVideoData();
          }

          return newDuration;
        });
      }, 1000);

      toast.success('Real-time facial analysis started - recording for 10 seconds');
    }
  }, [facialAnalysisEnabled, webcamEnabled, captureVideoFrame]);

  const stopVideoRecording = useCallback(() => {
    setIsRecording(false);

    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  }, []);

  const analyzeVideoData = useCallback(async () => {
    if (videoDataRef.current.length === 0) {
      console.warn('No video frames captured for analysis');
      return null;
    }

    try {
      toast.loading('Analyzing facial emotions using advanced AI...');

      // Use the most recent frame for analysis
      const latestFrame = videoDataRef.current[videoDataRef.current.length - 1];

      // Try the new enhanced AI service first
      try {
        const aiResponse = await axios.post('http://localhost:8000/analyze/webcam-frame', {
          image_data: latestFrame.imageSrc,
          frame_number: videoDataRef.current.length,
          reset_temporal: videoDataRef.current.length === 1, // Reset on first frame
          user_id: user?.id
        });

        if (aiResponse.data.success && aiResponse.data.data.faces_detected > 0) {
          const emotionData = aiResponse.data.data.emotions[0]; // Use first detected face
          const analysisResults = {
            dominantEmotion: emotionData.dominant_emotion,
            confidence: emotionData.confidence,
            emotions: emotionData.all_emotions,
            stressLevel: aiResponse.data.data.stress_assessment.stress_level,
            stressScore: aiResponse.data.data.stress_assessment.stress_score,
            modelInfo: aiResponse.data.data.model_info,
            facesDetected: aiResponse.data.data.faces_detected
          };

          setAnalysisResults(analysisResults);
          toast.dismiss();
          toast.success(`AI Emotion Analysis Complete! Detected: ${emotionData.dominant_emotion} (${Math.round(emotionData.confidence * 100)}% confidence)`);
          return analysisResults;
        }
      } catch (aiError) {
        console.warn('Enhanced AI service unavailable, falling back to backend:', aiError);
      }

      // Fallback to backend service
      const response = await axios.post('/api/assessments/facial-analysis', {
        imageData: latestFrame.imageSrc,
        userId: user?.id,
        videoFrameCount: videoDataRef.current.length,
        recordingDuration: recordingDuration
      });

      if (response.data.success) {
        setAnalysisResults(response.data.data);
        toast.dismiss();
        toast.success(`Facial analysis complete! Detected: ${response.data.data.dominantEmotion}`);
        return response.data.data;
      }
    } catch (error) {
      console.error('Video analysis failed:', error);
      toast.dismiss();
      toast.error('Facial analysis failed, but assessment will continue.');
    }
    return null;
  }, [user?.id, recordingDuration]);

  // New function for post-assessment 30-second recording
  const startPostAssessmentRecording = useCallback(() => {
    return new Promise((resolve, reject) => {
      console.log('🎬 Starting post-assessment recording...');

      // Check if webcam is ready
      if (!webcamRef.current) {
        console.error('❌ Webcam ref not available for recording');
        reject(new Error('Webcam not available'));
        return;
      }

      if (!webcamEnabled) {
        console.error('❌ Webcam not enabled for recording');
        reject(new Error('Webcam not enabled'));
        return;
      }

      // Wait for video to be ready before starting
      const video = webcamRef.current.video;
      if (!video || video.readyState < 3) {
        console.log('⏳ Waiting for video to be ready...');
        const checkReady = () => {
          if (video && video.readyState >= 3) {
            startRecordingProcess();
          } else {
            setTimeout(checkReady, 100);
          }
        };
        checkReady();
      } else {
        startRecordingProcess();
      }

      function startRecordingProcess() {
        console.log('🎥 Starting 30-second recording process');
        setIsRecording(true);
        setRecordingDuration(0);
        videoDataRef.current = [];
        setVideoFrames([]);

        // Start capturing frames at 2 FPS for 30 seconds
        frameIntervalRef.current = setInterval(() => {
          const result = captureVideoFrame();
          if (!result) {
            console.warn('⚠️ Frame capture failed during recording');
          }
        }, 500); // 500ms = 2 FPS

        // Start recording timer for exactly 30 seconds
        recordingTimerRef.current = setInterval(() => {
          setRecordingDuration(prev => {
            const newDuration = prev + 1;
            console.log(`⏱️ Recording progress: ${newDuration}/30 seconds`);

            // Stop recording after exactly 30 seconds
            if (newDuration >= 30) {
              console.log('✅ 30-second recording completed');
              stopVideoRecording();
              resolve();
            }

            return newDuration;
          });
        }, 1000);

        toast.success('30-second facial emotion analysis started');
      }
    });
  }, [captureVideoFrame, webcamEnabled, stopVideoRecording]);

  // Wait for analysis completion and return results
  const waitForAnalysisCompletion = useCallback(async () => {
    // Wait a moment for recording to fully stop
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Analyze the captured video data
    return await analyzeVideoData();
  }, [analyzeVideoData]);

  // Handle real-time emotion detection from overlay
  const handleEmotionDetected = useCallback((emotionData) => {
    // Store real-time emotion data for analysis
    const timestamp = new Date().toISOString();
    const frameData = {
      emotions: emotionData.emotions,
      dominantEmotion: emotionData.dominantEmotion,
      confidence: emotionData.confidence,
      timestamp
    };

    // Add to video data for final analysis
    videoDataRef.current.push(frameData);

    // Keep only recent data (last 60 frames for 30 seconds at 2 FPS)
    if (videoDataRef.current.length > 60) {
      videoDataRef.current = videoDataRef.current.slice(-60);
    }
  }, []);

  const enableFacialAnalysis = async () => {
    const hasPermission = await requestCameraPermission();
    if (hasPermission) {
      setFacialAnalysisEnabled(true);
      setShowWebcam(true);
      toast.success('Real-time facial analysis enabled. Camera will record for 10 seconds when you start the assessment.');
    }
  };

  const disableFacialAnalysis = () => {
    setFacialAnalysisEnabled(false);
    setShowWebcam(false);
    stopVideoRecording();
    setVideoFrames([]);
    setAnalysisResults(null);
    videoDataRef.current = [];
    toast.success('Facial analysis disabled. Assessment will continue with questionnaire only.');
  };

  // Sample assessments with facial emotion recognition options
  const sampleAssessments = [
    {
      id: 'standard-questionnaire',
      title: 'Standard Questionnaire Assessment',
      description: 'Evaluate your stress levels through 20 DASS-21 based MCQ questions and 2-4 subjective text questions for sentiment analysis.',
      duration: '10-15 minutes',
      questions: 20,
      category: 'standard',
      methods: ['questionnaire', 'sentiment_analysis'],
      targetAudience: ['student', 'professional'],
      features: [
        'DASS-21 based questionnaire',
        'RoBERTa sentiment analysis',
        'AI-powered analysis',
        'Personalized recommendations',
        'Progress tracking'
      ]
    },
    {
      id: 'advanced-stress',
      title: 'Advanced Stress Assessment',
      description: 'Advanced stress evaluation with 20 MCQ questions and 2-4 subjective text questions for enhanced sentiment analysis.',
      duration: '12-18 minutes',
      questions: 20,
      category: 'advanced',
      methods: ['questionnaire', 'sentiment_analysis'],
      targetAudience: ['student', 'professional'],
      features: [
        'DASS-21 based questionnaire',
        'Advanced RoBERTa sentiment analysis',
        'Enhanced AI analysis',
        'Detailed stress insights',
        'Privacy-protected processing'
      ],
      isAdvanced: true
    },
    {
      id: 'detailed-stress',
      title: 'Detailed Stress Assessment',
      description: 'Comprehensive assessment with automatic facial emotion capture during each question, plus questionnaire and sentiment analysis.',
      duration: '15-25 minutes',
      questions: 20,
      category: 'detailed_stress',
      methods: ['questionnaire', 'facial_emotion', 'sentiment_analysis'],
      targetAudience: ['student', 'professional'],
      features: [
        'Automatic facial capture per question',
        'Live video preview',
        'DASS-21 questionnaire',
        'RoBERTa sentiment analysis',
        'LibreFace FER analysis',
        'Multi-modal insights'
      ],
      isAdvanced: true
    },
    {
      id: 'multi-modal-assessment',
      title: 'Multi-Modal Stress Assessment',
      description: 'The most comprehensive assessment combining questionnaire, automatic facial capture, voice analysis, and sentiment analysis.',
      duration: '25-40 minutes',
      questions: 20,
      category: 'multi_modal',
      methods: ['questionnaire', 'facial_emotion', 'voice_analysis', 'sentiment_analysis'],
      targetAudience: ['student', 'professional'],
      features: [
        'Automatic facial capture per question',
        'Voice recording and analysis',
        'Whisper speech-to-text',
        'Librosa audio features',
        'DASS-21 questionnaire',
        'RoBERTa sentiment analysis',
        'Complete mental health evaluation'
      ],
      isAdvanced: true,
      isNew: true
    },
    {
      id: 'anxiety-screening',
      title: 'Anxiety Screening Tool',
      description: 'Screen for anxiety symptoms and get insights into your anxiety patterns and triggers.',
      duration: '8-12 minutes',
      questions: 15,
      category: 'anxiety',
      methods: ['questionnaire'],
      targetAudience: ['student', 'professional'],
      features: [
        'GAD-7 based assessment',
        'Symptom severity scoring',
        'Coping strategy recommendations',
        'Professional referral guidance'
      ]
    },
    {
      id: 'wellbeing-check',
      title: 'General Wellbeing Check',
      description: 'A comprehensive overview of your mental health and wellbeing across multiple dimensions.',
      duration: '15-20 minutes',
      questions: 30,
      category: 'wellbeing',
      methods: ['questionnaire'],
      targetAudience: ['student', 'professional'],
      features: [
        'Multi-dimensional assessment',
        'Holistic wellbeing score',
        'Lifestyle recommendations',
        'Goal setting assistance'
      ]
    }
  ];

  useEffect(() => {
    // Simulate API call to fetch available assessments
    const fetchAssessments = async () => {
      try {
        setLoading(true);
        // Filter assessments based on user type
        const filteredAssessments = sampleAssessments.filter(assessment => 
          assessment.targetAudience.includes(user?.userType || 'student')
        );
        setAssessments(filteredAssessments);

        // Auto-select assessment if type was specified in URL
        if (requestedType) {
          const requestedAssessment = filteredAssessments.find(a => a.id === requestedType);
          if (requestedAssessment) {
            handleAssessmentSelect(requestedAssessment);
          }
        }
      } catch (error) {
        console.error('Failed to fetch assessments:', error);
        toast.error('Failed to load assessments');
      } finally {
        setLoading(false);
      }
    };

    fetchAssessments();
  }, [user, requestedType]);

  // Cleanup effect for webcam
  useEffect(() => {
    return () => {
      stopVideoRecording();
    };
  }, [stopVideoRecording]);

  // Don't start recording during assessment - only after completion
  // This effect is now disabled to prevent recording during quiz

  const handleAssessmentSelect = (assessment) => {
    setSelectedAssessment(assessment);
    setShowForm(true);

    // Check if this assessment supports facial analysis
    if (assessment.methods && assessment.methods.includes('facial_emotion')) {
      // Show facial analysis option for supported assessments
      setTimeout(() => {
        if (window.confirm('This assessment supports facial emotion analysis. Would you like to enable camera for enhanced analysis?')) {
          enableFacialAnalysis();
        }
      }, 500);
    }
  };

  const handleAssessmentComplete = async (results) => {
    try {
      console.log('Assessment completed:', results);

      // If facial analysis is enabled, start the 30-second post-assessment recording
      if (facialAnalysisEnabled && webcamEnabled) {
        toast.success('Assessment complete! Starting 30-second facial emotion analysis...');

        // Start the 30-second recording session
        await startPostAssessmentRecording();

        // Wait for the recording to complete and get results
        const facialAnalysisResults = await waitForAnalysisCompletion();

        // Combine results with facial analysis
        const enhancedResults = {
          ...results,
          facialAnalysis: facialAnalysisResults,
          videoFrameCount: videoDataRef.current.length,
          recordingDuration: 30, // Fixed 30-second duration
          facialAnalysisEnabled,
          postAssessmentAnalysis: true
        };

        toast.success('Assessment and facial analysis completed!');

        // Navigate to results page
        navigate(`/results/${results.id}`, {
          state: {
            results: enhancedResults,
            assessment: selectedAssessment
          }
        });
      } else {
        // No facial analysis - proceed directly to results
        toast.success('Assessment completed successfully!');

        navigate(`/results/${results.id}`, {
          state: {
            results,
            assessment: selectedAssessment
          }
        });
      }

      // Dispatch custom event for dashboard refresh
      window.dispatchEvent(new CustomEvent('assessmentCompleted', {
        detail: results
      }));

    } catch (error) {
      console.error('Failed to save assessment results:', error);
      toast.error('Failed to save assessment results');
    }
  };

  const handleBackToSelection = () => {
    setShowForm(false);
    setSelectedAssessment(null);

    // Clean up webcam state
    disableFacialAnalysis();
  };

  const getMethodIcon = (method) => {
    switch (method) {
      case 'questionnaire':
        return <ClipboardDocumentListIcon className="h-4 w-4" />;
      case 'facial_emotion':
        return <CameraIcon className="h-4 w-4" />;
      default:
        return <CheckCircleIcon className="h-4 w-4" />;
    }
  };

  const getMethodLabel = (method) => {
    switch (method) {
      case 'questionnaire':
        return 'Questionnaire';
      case 'facial_emotion':
        return 'Facial Emotion Recognition';
      default:
        return method;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assessments...</p>
        </div>
      </div>
    );
  }

  if (showForm && selectedAssessment) {
    // Render multi-modal assessment for multi-modal type
    if (selectedAssessment.id === 'multi-modal-assessment') {
      return <MultiModalAssessment assessmentType={selectedAssessment.category} />;
    }

    // Render detailed assessment for detailed stress type
    if (selectedAssessment.id === 'detailed-stress') {
      return <DetailedAssessment assessmentType={selectedAssessment.category} />;
    }

    // Render standard assessment form for questionnaire-based assessments
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <button
              onClick={handleBackToSelection}
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Back to Assessment Selection
            </button>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {selectedAssessment.title}
            </h1>
            <p className="text-gray-600 mb-4">
              {selectedAssessment.description}
            </p>
            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center">
                <ClockIcon className="h-4 w-4 mr-1" />
                {selectedAssessment.duration}
              </div>
              <div className="flex items-center">
                <ClipboardDocumentListIcon className="h-4 w-4 mr-1" />
                {selectedAssessment.questions} questions
              </div>
              <div className="flex items-center">
                <ShieldCheckIcon className="h-4 w-4 mr-1" />
                Confidential
              </div>
            </div>
          </div>

          {/* Facial Analysis Section */}
          {(selectedAssessment.methods && selectedAssessment.methods.includes('facial_emotion')) && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <CameraIcon className="h-6 w-6 text-blue-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Facial Emotion Analysis</h3>
                </div>
                <div className="flex items-center space-x-2">
                  {facialAnalysisEnabled ? (
                    <button
                      onClick={disableFacialAnalysis}
                      className="btn-secondary text-sm"
                    >
                      <XMarkIcon className="h-4 w-4 mr-1" />
                      Disable Camera
                    </button>
                  ) : (
                    <button
                      onClick={enableFacialAnalysis}
                      className="btn-primary text-sm"
                    >
                      <CameraIcon className="h-4 w-4 mr-1" />
                      Start Camera
                    </button>
                  )}
                </div>
              </div>

              {!facialAnalysisEnabled && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start">
                    <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-900 mb-1">Post-Assessment Emotion Analysis</h4>
                      <p className="text-sm text-blue-700">
                        Enable your camera for a 30-second facial emotion analysis that will start AFTER you complete the quiz.
                        This provides additional insights without interrupting your assessment. Your privacy is protected - images are processed locally and not stored.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {webcamError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-red-900 mb-1">Camera Access Issue</h4>
                      <p className="text-sm text-red-700">{webcamError}</p>
                      <p className="text-sm text-red-600 mt-1">Assessment will continue without facial analysis.</p>
                    </div>
                  </div>
                </div>
              )}

              {showWebcam && facialAnalysisEnabled && (
                <div className="space-y-4">
                  <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                    <Webcam
                      ref={webcamRef}
                      audio={false}
                      screenshotFormat="image/jpeg"
                      width={640}
                      height={480}
                      className="w-full max-w-lg mx-auto"
                      videoConstraints={{
                        width: 640,
                        height: 480,
                        facingMode: "user"
                      }}
                      onUserMedia={(stream) => {
                        console.log('✅ Webcam initialized successfully', stream);
                        setWebcamEnabled(true);
                        setWebcamError(null);
                        toast.success('Camera ready for emotion analysis');
                      }}
                      onUserMediaError={(error) => {
                        console.error('❌ Webcam initialization failed:', error);
                        setWebcamEnabled(false);
                        setWebcamError(error.message || error.toString());
                        toast.error(`Camera error: ${error.message || 'Failed to access camera'}`);
                      }}
                    />

                    {/* Emotion Visualization Overlay */}
                    <EmotionVisualization
                      webcamRef={webcamRef}
                      isAnalyzing={isRecording}
                      emotionResults={analysisResults}
                      onEmotionDetected={handleEmotionDetected}
                    />

                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                      Live
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-2 ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
                      {isRecording ? `Recording... ${recordingDuration}s/10s` : 'Camera ready'}
                    </div>
                    <div>
                      Frames captured: {videoFrames.length}
                    </div>
                  </div>

                  {isRecording && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-700">
                        🔴 Recording facial expressions for real-time analysis ({recordingDuration}/10 seconds)
                      </p>
                      <div className="w-full bg-red-200 rounded-full h-2 mt-2">
                        <div
                          className="bg-red-600 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${(recordingDuration / 10) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {!isRecording && facialAnalysisEnabled && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-sm text-green-700">
                        ✓ Camera is ready for facial emotion analysis. A 30-second analysis session will start automatically AFTER you complete the assessment questions.
                      </p>
                    </div>
                  )}

                  {analysisResults && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <h4 className="text-sm font-medium text-blue-900 mb-2">Analysis Results</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
                        <div>Dominant Emotion: <span className="font-medium">{analysisResults.dominantEmotion}</span></div>
                        <div>Stress Level: <span className="font-medium">{analysisResults.stressLevel}</span></div>
                        <div>Confidence: <span className="font-medium">{Math.round(analysisResults.confidence * 100)}%</span></div>
                        <div>Stress Score: <span className="font-medium">{analysisResults.stressScore}/100</span></div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <AssessmentForm
            assessmentType={selectedAssessment.category}
            onComplete={handleAssessmentComplete}
            userType={user?.userType || 'student'}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center text-blue-600 hover:text-blue-700 font-medium mb-8"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Dashboard
        </button>

        {/* Header */}
        <div className="text-center mb-12">
          {/* Logo */}
          <div className="flex items-center justify-center mb-6">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center hover:opacity-80 transition-opacity"
              title="Go to Dashboard"
            >
              <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                <HeartIcon className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gradient">MStress</span>
            </button>
          </div>
          {/* TODO: Replace with actual SVG logo file */}
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Mental Health Assessments
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose from our scientifically validated assessments to gain insights into your mental health
            and receive personalized recommendations for improvement.
          </p>
        </div>

        {/* Important Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-start">
            <InformationCircleIcon className="h-6 w-6 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Important Information
              </h3>
              <ul className="text-blue-800 space-y-1 text-sm">
                <li>• These assessments are for informational purposes and do not replace professional diagnosis</li>
                <li>• All responses are confidential and securely encrypted</li>
                <li>• Facial emotion recognition is optional and processed locally for privacy</li>
                <li>• If you're experiencing a mental health crisis, please contact emergency services or a crisis hotline</li>
                <li>• Results include recommendations for professional support when appropriate</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Assessment Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {assessments.map((assessment) => (
            <div key={assessment.id} className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden ${assessment.isAdvanced ? 'ring-2 ring-purple-200' : ''}`}>
              <div className="p-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">
                    {assessment.title}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <div className={`px-3 py-1 text-sm font-medium rounded-full ${
                      assessment.isAdvanced 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {assessment.category}
                    </div>
                    {assessment.isAdvanced && (
                      <div className="flex items-center px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-medium rounded-full">
                        <SparklesIcon className="h-3 w-3 mr-1" />
                        Advanced
                      </div>
                    )}
                    {assessment.isNew && (
                      <div className="flex items-center px-2 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-medium rounded-full">
                        NEW
                      </div>
                    )}
                  </div>
                </div>
                
                <p className="text-gray-600 mb-6">
                  {assessment.description}
                </p>

                {/* Assessment Methods */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Assessment Methods:</h4>
                  <div className="flex flex-wrap gap-2">
                    {assessment.methods.map((method, index) => (
                      <div key={index} className="flex items-center px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                        {getMethodIcon(method)}
                        <span className="ml-1">{getMethodLabel(method)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-6 mb-6 text-sm text-gray-500">
                  <div className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    {assessment.duration}
                  </div>
                  <div className="flex items-center">
                    <ClipboardDocumentListIcon className="h-4 w-4 mr-1" />
                    {assessment.questions} questions
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Features:</h4>
                  <ul className="space-y-2">
                    {assessment.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-600">
                        <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => handleAssessmentSelect(assessment)}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg ${
                    assessment.isAdvanced
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
                  }`}
                >
                  Start Assessment
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Crisis Support Section */}
        <div className="mt-12 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center justify-center">
              <ShieldCheckIcon className="h-8 w-8 text-red-600 mr-3" />
              Need Support?
            </h3>
            <p className="text-gray-700 text-lg">
              If you're experiencing distress or need immediate support, help is available 24/7.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ClipboardDocumentListIcon className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Crisis Support</h4>
                <a
                  href="tel:1800-599-0019"
                  className="text-2xl font-bold text-blue-600 hover:text-blue-800 transition-colors block mb-2"
                >
                  1800-599-0019
                </a>
                <p className="text-sm text-gray-600">KIRAN National Mental Health Helpline</p>
                <p className="text-xs text-gray-500 mt-1">24/7 Free Support</p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <InformationCircleIcon className="h-6 w-6 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Suicide & Crisis Lifeline</h4>
                <a
                  href="tel:9999666555"
                  className="text-2xl font-bold text-green-600 hover:text-green-800 transition-colors block mb-2"
                >
                  9999 666 555
                </a>
                <p className="text-sm text-gray-600">Vandrevala Foundation</p>
                <p className="text-xs text-gray-500 mt-1">24/7 Confidential Support</p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircleIcon className="h-6 w-6 text-purple-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Text Support</h4>
                <a
                  href="tel:91-22-27546669"
                  className="text-xl font-bold text-purple-600 hover:text-purple-800 transition-colors block mb-2"
                >
                  91-22-27546669
                </a>
                <p className="text-sm text-gray-600">Aasra</p>
                <p className="text-xs text-gray-500 mt-1">Mumbai-based Support</p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow border-2 border-red-200">
              <div className="text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <SparklesIcon className="h-6 w-6 text-red-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Emergency</h4>
                <a
                  href="tel:112"
                  className="text-3xl font-bold text-red-600 hover:text-red-800 transition-colors block mb-2"
                >
                  112
                </a>
                <p className="text-sm text-gray-600">National Emergency Number</p>
                <p className="text-xs text-gray-500 mt-1">Police, Fire, Medical</p>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-white rounded-lg p-6 shadow-md">
            <div className="text-center">
              <h4 className="font-semibold text-gray-900 mb-3">Additional Resources</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="text-left">
                  <p className="font-medium text-gray-800">Connecting Trust:</p>
                  <a href="tel:022-25521111" className="text-blue-600 hover:text-blue-800">022-25521111</a>
                  <p className="text-gray-600 text-xs">Mumbai-based counseling</p>
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-800">iCall:</p>
                  <a href="tel:9152987821" className="text-blue-600 hover:text-blue-800">9152987821</a>
                  <p className="text-gray-600 text-xs">TISS Helpline</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentPage;
