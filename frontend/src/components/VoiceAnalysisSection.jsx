import React, { useState, useRef, useCallback } from 'react';
import { 
  MicrophoneIcon,
  StopIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const VoiceAnalysisSection = ({ 
  onComplete,
  onBack,
  facialImages = []
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [voiceRecordings, setVoiceRecordings] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [stream, setStream] = useState(null);
  
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);

  // Voice analysis questions
  const voiceQuestions = [
    {
      id: 'voice_q1',
      text: 'Describe how you have been feeling this week. What emotions have been most prominent?',
      placeholder: 'Speak naturally about your feelings...'
    },
    {
      id: 'voice_q2',
      text: 'What has been causing you the most stress or concern lately?',
      placeholder: 'Share what is on your mind...'
    },
    {
      id: 'voice_q3',
      text: 'How would you describe your current emotional state in one or two sentences?',
      placeholder: 'Express your emotional state...'
    },
    {
      id: 'voice_q4',
      text: 'What coping strategies have you been using to manage stress?',
      placeholder: 'Tell us about your coping methods...'
    },
    {
      id: 'voice_q5',
      text: 'Is there anything else you would like to share about your mental health or well-being?',
      placeholder: 'Share any additional thoughts...'
    }
  ];

  const currentQuestion = voiceQuestions[currentQuestionIndex];

  // Initialize audio stream
  const initializeAudio = useCallback(async () => {
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStream(audioStream);
      return audioStream;
    } catch (err) {
      console.error('Audio access error:', err);
      toast.error('Unable to access microphone. Please enable permissions.');
      return null;
    }
  }, []);

  // Start recording
  const startRecording = useCallback(async () => {
    let audioStream = stream;
    if (!audioStream) {
      audioStream = await initializeAudio();
      if (!audioStream) return;
    }

    audioChunksRef.current = [];
    const recorder = new MediaRecorder(audioStream);

    recorder.ondataavailable = (event) => {
      audioChunksRef.current.push(event.data);
    };

    recorder.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Audio = reader.result.split(',')[1];
        setVoiceRecordings(prev => [...prev, {
          questionIndex: currentQuestionIndex,
          questionId: currentQuestion.id,
          audioData: base64Audio,
          timestamp: new Date().toISOString()
        }]);
        toast.success('Recording saved!');
      };
      reader.readAsDataURL(audioBlob);
    };

    recorder.start();
    setMediaRecorder(recorder);
    setIsRecording(true);
    setRecordingTime(0);

    // Start timer
    timerIntervalRef.current = setInterval(() => {
      setRecordingTime(prev => {
        if (prev >= 60) {
          recorder.stop();
          setIsRecording(false);
          clearInterval(timerIntervalRef.current);
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
  }, [stream, currentQuestionIndex, currentQuestion.id, initializeAudio]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      setRecordingTime(0);
    }
  }, [mediaRecorder]);

  // Handle next question
  const handleNextQuestion = () => {
    if (currentQuestionIndex < voiceQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // All voice questions completed
      if (onComplete) {
        onComplete({
          voiceRecordings: voiceRecordings,
          completedAt: new Date().toISOString()
        });
      }
    }
  };

  // Handle previous question
  const handlePreviousQuestion = () => {
    if (isRecording) {
      stopRecording();
    }
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const hasRecordingForCurrentQuestion = voiceRecordings.some(
    rec => rec.questionIndex === currentQuestionIndex
  );

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Voice Analysis Questions
        </h2>
        <p className="text-gray-600">
          Please answer the following open-ended questions by speaking naturally.
        </p>
        <p className="text-sm text-purple-600 mt-2 font-medium">
          Question {currentQuestionIndex + 1} of {voiceQuestions.length}
        </p>
      </div>

      {/* Question Card */}
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-8 border border-purple-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">
          {currentQuestion.text}
        </h3>

        {/* Recording Controls */}
        <div className="space-y-4">
          {/* Recording Status */}
          {isRecording && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="animate-pulse w-3 h-3 bg-red-600 rounded-full mr-3"></div>
                <span className="text-red-700 font-medium">Recording in progress...</span>
              </div>
              <span className="text-red-600 font-mono text-lg">{formatTime(recordingTime)}</span>
            </div>
          )}

          {/* Recording Buttons */}
          <div className="flex gap-4">
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
              >
                <MicrophoneIcon className="h-5 w-5 mr-2" />
                Start Recording
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
              >
                <StopIcon className="h-5 w-5 mr-2" />
                Stop Recording
              </button>
            )}
          </div>

          {/* Recording Status */}
          {hasRecordingForCurrentQuestion && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-green-700 font-medium">Recording saved for this question</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Recordings: {voiceRecordings.length} / {voiceQuestions.length}
          </span>
          <span className="text-sm text-gray-600">
            {Math.round((voiceRecordings.length / voiceQuestions.length) * 100)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-purple-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(voiceRecordings.length / voiceQuestions.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-4 pt-6">
        <button
          onClick={handlePreviousQuestion}
          disabled={currentQuestionIndex === 0}
          className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Previous
        </button>

        <button
          onClick={handleNextQuestion}
          className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
        >
          {currentQuestionIndex === voiceQuestions.length - 1 ? (
            <>
              Complete Voice Analysis
              <CheckCircleIcon className="h-5 w-5 ml-2" />
            </>
          ) : (
            <>
              Next Question
              <ArrowRightIcon className="h-5 w-5 ml-2" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default VoiceAnalysisSection;

