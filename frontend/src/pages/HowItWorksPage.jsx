import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  SparklesIcon,
  CameraIcon,
  MicrophoneIcon,
  ChartBarIcon,
  HeartIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';

const HowItWorksPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-primary">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <HeartIcon className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">MStress</h1>
            </div>
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span>Back to Home</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-4xl font-bold text-gray-900 mb-2">How It Works</h2>
        <p className="text-lg text-gray-600 mb-12">
          Comprehensive guide to understanding MStress assessment methodology and AI-powered analysis
        </p>

        {/* DASS-21 Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <ClipboardDocumentListIcon className="h-8 w-8 text-blue-500" />
            <h3 className="text-2xl font-bold text-gray-900">DASS-21 Scoring Methodology</h3>
          </div>
          <p className="text-gray-600 mb-4">
            The Depression Anxiety Stress Scale (DASS-21) is a scientifically validated 21-item questionnaire that measures three related negative emotional states:
          </p>
          <ul className="space-y-3 text-gray-600">
            <li className="flex items-start">
              <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
              <span><strong>Depression (7 items):</strong> Measures hopelessness, anhedonia, and negative affect</span>
            </li>
            <li className="flex items-start">
              <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
              <span><strong>Anxiety (7 items):</strong> Measures autonomic arousal, skeletal muscle effects, and situational anxiety</span>
            </li>
            <li className="flex items-start">
              <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
              <span><strong>Stress (7 items):</strong> Measures difficulty relaxing, nervous arousal, and being easily upset</span>
            </li>
          </ul>
          <p className="text-gray-600 mt-4">
            Each item is scored on a 4-point scale (0-3), with total scores ranging from 0-126. Higher scores indicate greater severity.
          </p>
        </div>

        {/* Assessment Types Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <ChartBarIcon className="h-8 w-8 text-purple-500" />
            <h3 className="text-2xl font-bold text-gray-900">Assessment Types</h3>
          </div>
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-bold text-gray-900">Standard Questionnaire</h4>
              <p className="text-gray-600">Traditional DASS-21 questionnaire with 21 multiple-choice questions. Quick assessment taking 5-10 minutes.</p>
            </div>
            <div className="border-l-4 border-purple-500 pl-4">
              <h4 className="font-bold text-gray-900">Advanced Stress Assessment</h4>
              <p className="text-gray-600">Extended questionnaire with additional stress-specific questions and lifestyle factors analysis.</p>
            </div>
            <div className="border-l-4 border-indigo-500 pl-4">
              <h4 className="font-bold text-gray-900">Detailed Stress Analysis</h4>
              <p className="text-gray-600">Comprehensive assessment including DASS-21 questions with automatic facial emotion recognition during the assessment.</p>
            </div>
            <div className="border-l-4 border-pink-500 pl-4">
              <h4 className="font-bold text-gray-900">Multi-Modal Stress Assessment</h4>
              <p className="text-gray-600">Advanced assessment combining questionnaire, facial emotion recognition, voice analysis, and sentiment analysis for comprehensive evaluation.</p>
            </div>
          </div>
        </div>

        {/* AI Services Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <SparklesIcon className="h-8 w-8 text-indigo-500" />
            <h3 className="text-2xl font-bold text-gray-900">AI Services & Technologies</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <CameraIcon className="h-6 w-6 text-purple-500 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-gray-900">LibreFace - Facial Emotion Recognition</h4>
                <p className="text-gray-600">Advanced computer vision model that analyzes facial expressions to detect emotions (happy, sad, angry, neutral, surprised, disgusted, fearful). Captures images during assessments to provide additional emotional context.</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <MicrophoneIcon className="h-6 w-6 text-blue-500 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-gray-900">OpenAI Whisper - Speech-to-Text</h4>
                <p className="text-gray-600">State-of-the-art speech recognition model that transcribes voice responses with high accuracy across multiple languages and accents.</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <SparklesIcon className="h-6 w-6 text-indigo-500 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-gray-900">RoBERTa - Sentiment Analysis</h4>
                <p className="text-gray-600">Transformer-based NLP model that analyzes the sentiment and emotional tone of transcribed voice responses to detect stress indicators and emotional patterns.</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <ChartBarIcon className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-gray-900">Librosa - Audio Analysis</h4>
                <p className="text-gray-600">Audio processing library that analyzes voice characteristics including pitch, tone, and speech patterns to identify stress indicators.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Scoring System Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <ChartBarIcon className="h-8 w-8 text-green-500" />
            <h3 className="text-2xl font-bold text-gray-900">Scoring System</h3>
          </div>
          <p className="text-gray-600 mb-4">
            MStress uses a comprehensive scoring algorithm that combines multiple data sources:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-bold text-gray-900 mb-2">Questionnaire Score (40%)</h4>
              <p className="text-sm text-gray-600">DASS-21 responses normalized to 0-100 scale</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-bold text-gray-900 mb-2">Facial Emotion Score (20%)</h4>
              <p className="text-sm text-gray-600">Detected emotions mapped to stress indicators</p>
            </div>
            <div className="bg-indigo-50 p-4 rounded-lg">
              <h4 className="font-bold text-gray-900 mb-2">Voice Sentiment Score (20%)</h4>
              <p className="text-sm text-gray-600">RoBERTa sentiment analysis of transcribed responses</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-bold text-gray-900 mb-2">Audio Characteristics (20%)</h4>
              <p className="text-sm text-gray-600">Librosa analysis of pitch, tone, and speech patterns</p>
            </div>
          </div>
          <p className="text-gray-600 mt-4">
            <strong>Stress Level Categories:</strong> Low (0-40), Moderate (41-70), High (71-85), Critical (86-100)
          </p>
        </div>

        {/* Recommendations Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <SparklesIcon className="h-8 w-8 text-yellow-500" />
            <h3 className="text-2xl font-bold text-gray-900">Personalized Recommendations</h3>
          </div>
          <p className="text-gray-600 mb-4">
            After completing an assessment, MStress generates personalized recommendations using Google's Gemini 2.0 Flash API:
          </p>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-start">
              <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
              <span>Tailored coping strategies based on your stress level and assessment responses</span>
            </li>
            <li className="flex items-start">
              <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
              <span>Lifestyle modifications and wellness practices</span>
            </li>
            <li className="flex items-start">
              <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
              <span>Professional resources and mental health support options</span>
            </li>
            <li className="flex items-start">
              <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
              <span>Nearby mental health facilities and resources using Google Maps API</span>
            </li>
          </ul>
        </div>

        {/* Privacy & Security Section */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center space-x-3 mb-4">
            <CheckCircleIcon className="h-8 w-8 text-green-500" />
            <h3 className="text-2xl font-bold text-gray-900">Privacy & Security</h3>
          </div>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-start">
              <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
              <span>All data is encrypted in transit and at rest</span>
            </li>
            <li className="flex items-start">
              <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
              <span>Facial images are processed locally and not stored on servers</span>
            </li>
            <li className="flex items-start">
              <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
              <span>Voice recordings are transcribed and then deleted</span>
            </li>
            <li className="flex items-start">
              <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
              <span>User data is protected with industry-standard security practices</span>
            </li>
          </ul>
        </div>

        {/* CTA Section */}
        <div className="mt-12 text-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-primary px-8 py-3 text-lg"
          >
            Start Your Assessment
          </button>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksPage;

