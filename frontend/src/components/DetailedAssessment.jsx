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
import AssessmentFormWithFacialCapture from './AssessmentFormWithFacialCapture';
import { useAuth } from '../App';
import toast from 'react-hot-toast';

const DetailedAssessment = ({ assessmentType = 'detailed_stress' }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [questionnaireResponses, setQuestionnaireResponses] = useState([]);
  const [facialImages, setFacialImages] = useState([]); // Array of 20 facial images
  const [submitting, setSubmitting] = useState(false);
  const [assessmentComplete, setAssessmentComplete] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();

  const steps = [
    {
      id: 'questionnaire_with_facial',
      title: 'Assessment with Facial Capture',
      description: 'Answer questions while we capture your facial expressions automatically',
      icon: ClipboardDocumentListIcon,
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
    console.log('Assessment complete data:', data);
    setQuestionnaireResponses(data.responses);
    setFacialImages(data.facialImages || []);
    toast.success(`Assessment completed! Captured ${data.facialImages?.length || 0} facial images.`);
    setCurrentStep(1); // Move to review step
  };

  const goBackToStep = (stepIndex) => {
    setCurrentStep(stepIndex);
  };

  const requestCameraPermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
      }).then(stream => {
        stream.getTracks().forEach(track => track.stop());
        toast.success('Camera permission granted!');
      });
    } catch (err) {
      toast.error('Camera permission denied. Please enable camera access to continue.');
      console.error('Camera permission error:', err);
    }
  };

  const submitAssessment = async () => {
    try {
      setSubmitting(true);

      const assessmentData = {
        userId: user?.id || 'anonymous',
        responses: questionnaireResponses,
        facialImages: facialImages, // Array of 20 facial images
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

        // Dispatch custom event for dashboard refresh
        window.dispatchEvent(new CustomEvent('assessmentCompleted', {
          detail: result.data
        }));

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
      case 0: // Questionnaire with Automatic Facial Capture
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Detailed Stress Assessment
              </h2>
              <p className="text-gray-600">
                Answer the following questions while we automatically capture your facial expressions.
                This helps us provide more accurate personalized recommendations.
              </p>
              <p className="text-sm text-purple-600 mt-2 font-medium">
                📷 Your camera will capture one image per question (20 total)
              </p>
            </div>

            <AssessmentFormWithFacialCapture
              assessmentType={assessmentType}
              onComplete={handleAssessmentComplete}
              userType={user?.userType || 'student'}
            />
          </div>
        );

      case 1: // Review & Submit
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Review Your Assessment
              </h2>
              <p className="text-gray-600">
                Please review your responses and captured facial images before submitting for analysis.
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
                    <span className="font-medium">Responses:</span> {Object.keys(questionnaireResponses).length} questions answered
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Status:</span>
                    <span className={Object.keys(questionnaireResponses).length === 20 ? "text-green-600 ml-1" : "text-yellow-600 ml-1"}>
                      {Object.keys(questionnaireResponses).length === 20 ? "✓ Complete" : "⚠ Incomplete"}
                    </span>
                  </p>
                  <button
                    onClick={() => goBackToStep(0)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Edit Responses
                  </button>
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
                    <span className="font-medium">Images Captured:</span>
                    <span className="text-green-600 ml-1">{facialImages.length} / 20</span>
                  </p>
                  {facialImages.length === 20 ? (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Status:</span>
                      <span className="text-green-600 ml-1">✓ Complete</span>
                    </p>
                  ) : (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Status:</span>
                      <span className="text-yellow-600 ml-1">⚠ Incomplete</span>
                    </p>
                  )}
                  <button
                    onClick={() => goBackToStep(0)}
                    className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                  >
                    Retake Assessment
                  </button>
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
                disabled={submitting || Object.keys(questionnaireResponses).length === 0 || facialImages.length === 0}
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
                (index === 0 && questionnaireResponses.length > 0 && facialImages.length === 20);

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
        {currentStep > 0 && (
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

