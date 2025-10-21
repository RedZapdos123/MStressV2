import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ClipboardDocumentListIcon,
  CameraIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import AssessmentForm from './AssessmentForm';
import FacialEmotionCapture from './FacialEmotionCapture';
import { useAuth } from '../App';
import toast from 'react-hot-toast';

const DetailedAssessment = ({ assessmentType = 'detailed_stress' }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [questionnaireResponses, setQuestionnaireResponses] = useState([]);
  const [facialImageData, setFacialImageData] = useState(null);
  const [facialAnalysisResult, setFacialAnalysisResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [assessmentComplete, setAssessmentComplete] = useState(false);
  
  const { user } = useAuth();
  const navigate = useNavigate();

  const steps = [
    {
      id: 'questionnaire',
      title: 'Questionnaire',
      description: 'Answer questions about your stress levels and mental health',
      icon: ClipboardDocumentListIcon,
      required: true
    },
    {
      id: 'facial_emotion',
      title: 'Facial Emotion Analysis',
      description: 'Optional: Capture a photo for emotion analysis',
      icon: CameraIcon,
      required: false
    },
    {
      id: 'review',
      title: 'Review & Submit',
      description: 'Review your responses and submit for analysis',
      icon: CheckCircleIcon,
      required: true
    }
  ];

  const currentStepData = steps[currentStep];

  const handleQuestionnaireComplete = (responses) => {
    setQuestionnaireResponses(responses);
    toast.success('Questionnaire completed successfully!');
    setCurrentStep(1); // Move to facial emotion step
  };

  const handleFacialImageCapture = (imageData) => {
    setFacialImageData(imageData);
    toast.success('Photo captured successfully!');
  };

  const handleFacialAnalysisComplete = (analysisResult) => {
    setFacialAnalysisResult(analysisResult);
  };

  const skipFacialAnalysis = () => {
    setCurrentStep(2); // Move to review step
  };

  const proceedToReview = () => {
    setCurrentStep(2); // Move to review step
  };

  const goBackToStep = (stepIndex) => {
    setCurrentStep(stepIndex);
  };

  const submitAssessment = async () => {
    try {
      setSubmitting(true);

      const assessmentData = {
        userId: user?.id || 'anonymous',
        questionnaire: questionnaireResponses,
        facialImage: facialImageData,
        assessmentType: assessmentType
      };

      const response = await fetch('http://localhost:5000/api/assessments/detailed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assessmentData)
      });

      if (!response.ok) {
        throw new Error(`Assessment submission failed: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        setAssessmentComplete(true);
        toast.success('Assessment completed successfully!');
        
        // Navigate to results page with the assessment data
        navigate(`/results/${result.data.assessmentId}`, {
          state: {
            results: result.data.results,
            assessmentType: assessmentType,
            methods: result.data.methods
          }
        });
      } else {
        throw new Error(result.error || 'Assessment submission failed');
      }
    } catch (error) {
      console.error('Assessment submission error:', error);
      toast.error(`Assessment submission failed: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Questionnaire
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Mental Health Questionnaire
              </h2>
              <p className="text-gray-600">
                Please answer the following questions honestly. Your responses will help us provide personalized recommendations.
              </p>
            </div>
            
            <AssessmentForm
              assessmentId={assessmentType}
              onComplete={handleQuestionnaireComplete}
              userType={user?.userType || 'student'}
            />
          </div>
        );

      case 1: // Facial Emotion Analysis
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Facial Emotion Analysis
              </h2>
              <p className="text-gray-600">
                This optional step provides additional insights by analyzing your facial expressions.
                Your photo is processed securely and not stored permanently.
              </p>
            </div>

            <FacialEmotionCapture
              onImageCapture={handleFacialImageCapture}
              onAnalysisComplete={handleFacialAnalysisComplete}
            />

            <div className="flex justify-center space-x-4 pt-6">
              <button
                onClick={skipFacialAnalysis}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Skip This Step
              </button>
              {(facialImageData || facialAnalysisResult) && (
                <button
                  onClick={proceedToReview}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Continue to Review
                </button>
              )}
            </div>
          </div>
        );

      case 2: // Review & Submit
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Review Your Assessment
              </h2>
              <p className="text-gray-600">
                Please review your responses before submitting for analysis.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Questionnaire Summary */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <ClipboardDocumentListIcon className="h-6 w-6 text-blue-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Questionnaire</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Responses:</span> {questionnaireResponses.length} questions answered
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Status:</span> 
                    <span className="text-green-600 ml-1">✓ Complete</span>
                  </p>
                  <button
                    onClick={() => goBackToStep(0)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Edit Responses
                  </button>
                </div>
              </div>

              {/* Facial Analysis Summary */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <CameraIcon className="h-6 w-6 text-purple-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Facial Analysis</h3>
                </div>
                <div className="space-y-2">
                  {facialImageData ? (
                    <>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Photo:</span> 
                        <span className="text-green-600 ml-1">✓ Captured</span>
                      </p>
                      {facialAnalysisResult && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Analysis:</span> 
                          <span className="text-green-600 ml-1">✓ Complete</span>
                        </p>
                      )}
                      <button
                        onClick={() => goBackToStep(1)}
                        className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                      >
                        Retake Photo
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Status:</span> 
                        <span className="text-yellow-600 ml-1">⚠ Skipped</span>
                      </p>
                      <button
                        onClick={() => goBackToStep(1)}
                        className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                      >
                        Add Facial Analysis
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Privacy Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <ExclamationTriangleIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-blue-900 mb-1">Privacy Notice</h4>
                  <p className="text-sm text-blue-800">
                    Your responses and any captured images are processed securely and used only for generating your personalized mental health assessment. 
                    No personal data is stored permanently without your explicit consent.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="text-center pt-6">
              <button
                onClick={submitAssessment}
                disabled={submitting || questionnaireResponses.length === 0}
                className="inline-flex items-center px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg font-semibold"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Processing Assessment...
                  </>
                ) : (
                  <>
                    Submit Assessment
                    <ArrowRightIcon className="h-5 w-5 ml-2" />
                  </>
                )}
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep || 
                (index === 0 && questionnaireResponses.length > 0) ||
                (index === 1 && facialImageData);
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                    isActive 
                      ? 'border-blue-600 bg-blue-600 text-white' 
                      : isCompleted 
                        ? 'border-green-600 bg-green-600 text-white'
                        : 'border-gray-300 bg-white text-gray-400'
                  }`}>
                    <StepIcon className="h-6 w-6" />
                  </div>
                  <div className="ml-4 min-w-0 flex-1">
                    <p className={`text-sm font-medium ${
                      isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </p>
                    <p className="text-sm text-gray-500">{step.description}</p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-0.5 mx-4 ${
                      index < currentStep ? 'bg-green-600' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        {currentStep > 0 && currentStep < 2 && (
          <div className="mt-6 flex justify-between">
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Previous Step
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DetailedAssessment;
