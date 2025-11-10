import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardDocumentListIcon,
  CameraIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  MicrophoneIcon
} from '@heroicons/react/24/outline';
import AssessmentFormWithMultiModal from './AssessmentFormWithMultiModal';
import VoiceAnalysisSection from './VoiceAnalysisSection';
import { useAuth } from '../App';
import toast from 'react-hot-toast';

const MultiModalAssessment = ({ assessmentType = 'multi_modal' }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [questionnaireResponses, setQuestionnaireResponses] = useState([]);
  const [facialImages, setFacialImages] = useState([]);
  const [voiceRecordings, setVoiceRecordings] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [assessmentComplete, setAssessmentComplete] = useState(false);
  
  const { user } = useAuth();
  const navigate = useNavigate();

  const steps = [
    {
      id: 'dass21_assessment',
      title: 'DASS-21 Questionnaire',
      description: 'Answer 20 questions with automatic facial capture',
      icon: ClipboardDocumentListIcon,
      required: true
    },
    {
      id: 'voice_analysis',
      title: 'Voice Analysis',
      description: 'Answer 5 open-ended questions with voice recording',
      icon: MicrophoneIcon,
      required: true
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

  const handleAssessmentComplete = (data) => {
    setQuestionnaireResponses(data.responses);
    setFacialImages(data.facialImages || []);
    toast.success(`DASS-21 Assessment completed! Captured ${data.facialImages?.length || 0} facial images.`);
    setCurrentStep(1); // Move to voice analysis
  };

  const handleVoiceAnalysisComplete = (data) => {
    setVoiceRecordings(data.voiceRecordings || []);
    toast.success(`Voice analysis completed! Captured ${data.voiceRecordings?.length || 0} voice recordings.`);
    setCurrentStep(2); // Move to review
  };

  const goBackToStep = (stepIndex) => {
    setCurrentStep(stepIndex);
  };

  const submitAssessment = async () => {
    try {
      setSubmitting(true);

      const assessmentData = {
        userId: user?.id || 'anonymous',
        responses: questionnaireResponses,
        facialImages: facialImages,
        voiceRecordings: voiceRecordings,
        assessmentType: assessmentType
      };

      const response = await fetch('http://localhost:5000/api/assessments/multi-modal', {
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
        
        // Dispatch custom event for dashboard refresh
        window.dispatchEvent(new CustomEvent('assessmentCompleted', {
          detail: result.data
        }));
        
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
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                DASS-21 Questionnaire with Facial Capture
              </h2>
              <p className="text-gray-600">
                Answer 20 questions about your mental health. Your facial expressions will be automatically captured.
              </p>
              <p className="text-sm text-purple-600 mt-2 font-medium">
                📷 Automatic facial capture (one image per question)
              </p>
            </div>

            <AssessmentFormWithMultiModal
              assessmentType={assessmentType}
              onComplete={handleAssessmentComplete}
              userType={user?.userType || 'student'}
            />
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <VoiceAnalysisSection
              onComplete={handleVoiceAnalysisComplete}
              onBack={() => setCurrentStep(0)}
              facialImages={facialImages}
            />
          </div>
        );

      case 2:
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Questionnaire Summary */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <ClipboardDocumentListIcon className="h-6 w-6 text-blue-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Questionnaire</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Responses:</span> {questionnaireResponses.length} / 20
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Status:</span> 
                    <span className="text-green-600 ml-1">✓ Complete</span>
                  </p>
                </div>
              </div>

              {/* Facial Capture Summary */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <CameraIcon className="h-6 w-6 text-purple-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Facial Capture</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Images:</span> {facialImages.length} / 20
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Status:</span> 
                    <span className={facialImages.length === 20 ? 'text-green-600 ml-1' : 'text-yellow-600 ml-1'}>
                      {facialImages.length === 20 ? '✓ Complete' : '⚠ Incomplete'}
                    </span>
                  </p>
                </div>
              </div>

              {/* Voice Recording Summary */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <MicrophoneIcon className="h-6 w-6 text-red-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Voice Analysis</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Recordings:</span> {voiceRecordings.length} / 5
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Status:</span>
                    <span className={voiceRecordings.length === 5 ? 'text-green-600 ml-1' : 'text-yellow-600 ml-1'}>
                      {voiceRecordings.length === 5 ? '✓ Complete' : '⚠ Incomplete'}
                    </span>
                  </p>
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
                    Your responses, facial images, and voice recordings are processed securely and used only for generating your personalized mental health assessment.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="text-center pt-6">
              <button
                onClick={submitAssessment}
                disabled={submitting || Object.keys(questionnaireResponses).length === 0 || facialImages.length === 0 || voiceRecordings.length === 0}
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep ||
                (index === 0 && questionnaireResponses.length > 0 && facialImages.length === 20) ||
                (index === 1 && voiceRecordings.length === 5);
              
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
        {currentStep > 0 && currentStep !== 1 && (
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

export default MultiModalAssessment;

