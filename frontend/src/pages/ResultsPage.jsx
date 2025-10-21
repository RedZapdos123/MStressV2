import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  HeartIcon,
  ChartBarIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  LightBulbIcon,
  PhoneIcon,
  CalendarIcon,
  ClockIcon,
  CameraIcon,
  MicrophoneIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../App';
import axios from 'axios';

const ResultsPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [review, setReview] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    const fetchAssessmentResults = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await axios.get(`/api/assessments/${id}/results`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
          const data = response.data.data;
          // Transform API data to match frontend format
          setResults({
            assessmentId: id,
            id: data.id,
            type: data.type === 'stress_assessment' ? 'Stress Assessment' : 'Comprehensive Stress Assessment',
            completedAt: data.timestamp,
            duration: `${Math.floor((data.metadata?.duration || 0) / 60)} minutes`,
            overallScore: data.results?.overall_score || 0,
            stressLevel: data.results?.stress_level || 'Unknown',
            confidence: data.results?.confidence || 0.75,
            components: {
              questionnaire: {
                score: data.results?.questionnaire_analysis?.questionnaire_score || 0,
                responses: Object.keys(data.results?.questionnaire_analysis?.category_scores || {}).length || 0,
                categories: data.results?.questionnaire_analysis?.category_scores || {}
              },
              ...(data.results?.facial_analysis && {
                facialEmotion: {
                  score: data.results.facial_analysis.facial_score || 0,
                  dominantEmotion: data.results.facial_analysis.emotions_detected?.[0]?.dominant_emotion || 'neutral',
                  confidence: data.results.facial_analysis.emotions_detected?.[0]?.confidence || 0.75,
                  emotions: {
                    neutral: 0.45,
                    happy: 0.25,
                    stressed: 0.15,
                    anxious: 0.10,
                    angry: 0.05
                  },
                  stressIndicators: ['facial_analysis_completed']
                }
              }),
              ...(data.results?.voice_analysis && {
                voiceAnalysis: {
                  score: data.results.voice_analysis.voice_score || 0,
                  speakingRate: data.results.voice_analysis.speaking_rate || 'normal',
                  pauseFrequency: data.results.voice_analysis.pause_frequency || 'normal',
                  confidenceMarkers: data.results.voice_analysis.confidence_markers || 'normal',
                  stressMarkers: data.results.voice_analysis.stress_markers || []
                }
              })
            },
        insights: {
          strengths: [
            'Good emotional regulation in most situations',
            'Healthy sleep patterns most nights',
            'Strong social support network'
          ],
          concerns: [
            'Work-related stress levels are elevated',
            'Physical tension indicators present',
            'Some signs of anxiety in voice patterns'
          ],
          riskFactors: [
            'High workload pressure',
            'Limited relaxation time',
            'Perfectionist tendencies'
          ]
        },
        recommendations: [
          {
            category: 'Immediate Actions',
            priority: 'high',
            items: [
              'Practice deep breathing exercises 3 times daily',
              'Take 5-minute breaks every hour during work',
              'Establish a consistent bedtime routine'
            ]
          },
          {
            category: 'Weekly Goals',
            priority: 'medium',
            items: [
              'Schedule 2-3 relaxation sessions per week',
              'Engage in physical activity for 30 minutes, 3 times weekly',
              'Practice mindfulness meditation for 10 minutes daily'
            ]
          },
          {
            category: 'Long-term Strategies',
            priority: 'low',
            items: [
              'Consider stress management counseling',
              'Evaluate work-life balance and boundaries',
              'Develop a personal stress management toolkit'
            ]
          }
        ],
        resources: [
          {
            type: 'emergency',
            title: 'National Mental Health Helpline',
            contact: '1800-599-0019',
            description: '24/7 support for mental health emergencies'
          },
          {
            type: 'support',
            title: 'Vandrevala Foundation',
            contact: '9999 666 555',
            description: 'Free counseling and emotional support'
          },
          {
            type: 'professional',
            title: 'iCall Psychosocial Helpline',
            contact: '022-25521111',
            description: 'Professional counseling services'
          }
        ]
      });

      // Fetch review if available
      try {
        const reviewResponse = await axios.get(`/api/reviews/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (reviewResponse.data.review) {
          setReview(reviewResponse.data.review);
        }
      } catch (err) {
        console.log('No review available yet');
      }
      } else {
          console.error('Failed to fetch assessment results');
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Error fetching assessment results:', error);
        if (error.response?.status === 401) {
          navigate('/login');
        } else {
          navigate('/dashboard');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAssessmentResults();
  }, [id, navigate]);

  const getStressLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'low': return 'text-purple-600 bg-purple-100 border-purple-200';
      case 'moderate': return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'high': return 'text-red-600 bg-red-100 border-red-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getStressLevelIcon = (level) => {
    switch (level?.toLowerCase()) {
      case 'low': return <CheckCircleIcon className="h-5 w-5" />;
      case 'moderate': return <ExclamationTriangleIcon className="h-5 w-5" />;
      case 'high': return <ExclamationTriangleIcon className="h-5 w-5" />;
      default: return <InformationCircleIcon className="h-5 w-5" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-l-red-500 bg-red-50';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50';
      case 'low': return 'border-l-green-500 bg-green-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const exportResults = (format) => {
    if (format === 'pdf') {
      // Mock PDF export
      alert('PDF export functionality would generate a comprehensive report');
    } else if (format === 'summary') {
      // Mock summary export
      const summary = `
MStress Assessment Results Summary
================================
Assessment Type: ${results.type}
Completed: ${new Date(results.completedAt).toLocaleDateString()}
Overall Stress Level: ${results.stressLevel}
Score: ${results.overallScore}/100

Key Insights:
${results.insights.concerns.map(concern => `- ${concern}`).join('\n')}

Immediate Recommendations:
${results.recommendations[0].items.map(item => `- ${item}`).join('\n')}
      `;

      const blob = new Blob([summary], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mstress-assessment-summary.txt';
      a.click();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Analyzing your assessment results...</p>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Assessment Not Found</h2>
          <p className="text-gray-600 mb-6">The assessment results you're looking for could not be found.</p>
          <Link to="/dashboard" className="btn-primary">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-primary">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center">
              <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                <HeartIcon className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gradient">MStress</span>
            </Link>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => exportResults('pdf')}
                className="btn-secondary"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Export PDF
              </button>
              <Link to="/dashboard" className="btn-primary">Dashboard</Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results Header */}
        <div className="card mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-6 lg:mb-0">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Assessment Results
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  {new Date(results.completedAt).toLocaleDateString()}
                </div>
                <div className="flex items-center">
                  <ClockIcon className="h-4 w-4 mr-1" />
                  {results.duration}
                </div>
                <div className="flex items-center">
                  <ChartBarIcon className="h-4 w-4 mr-1" />
                  {results.type}
                </div>
              </div>
            </div>

            <div className="text-center lg:text-right">
              <div className={`inline-flex items-center px-4 py-2 rounded-lg border-2 ${getStressLevelColor(results.stressLevel)} mb-2`}>
                {getStressLevelIcon(results.stressLevel)}
                <span className="ml-2 font-semibold">{results.stressLevel} Stress</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {results.overallScore}/100
              </div>
              <div className="text-sm text-gray-600">
                Confidence: {Math.round(results.confidence * 100)}%
              </div>
            </div>
          </div>
        </div>

        {/* Component Breakdown */}
        <div className={`grid grid-cols-1 ${Object.keys(results.components).length === 1 ? 'lg:grid-cols-1' : Object.keys(results.components).length === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-3'} gap-6 mb-8`}>
          {/* Questionnaire Results - Always present */}
          {results.components.questionnaire && (
            <div className="card">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-blue-50 rounded-lg mr-3">
                <ClipboardDocumentListIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Questionnaire</h3>
                <p className="text-sm text-gray-600">{results.components.questionnaire.responses} responses</p>
              </div>
            </div>

            <div className="space-y-3">
              {Object.entries(results.components.questionnaire.categories).map(([category, data]) => (
                <div key={category} className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">{category}</span>
                  <div className="flex items-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStressLevelColor(data.level)}`}>
                      {data.level}
                    </span>
                    <span className="ml-2 text-sm font-medium text-gray-900">{data.score}</span>
                  </div>
                </div>
              ))}
            </div>
            </div>
          )}

          {/* Facial Emotion Results - Only if facial analysis was performed */}
          {results.components.facialEmotion && (
            <div className="card">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-purple-50 rounded-lg mr-3">
                <CameraIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Facial Analysis</h3>
                <p className="text-sm text-gray-600">Emotion recognition</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">Dominant Emotion</span>
                <span className="font-medium text-gray-900 capitalize">{results.components.facialEmotion.dominantEmotion}</span>
              </div>

              {Object.entries(results.components.facialEmotion.emotions).slice(0, 3).map(([emotion, score]) => (
                <div key={emotion} className="flex justify-between items-center">
                  <span className="text-sm text-gray-700 capitalize">{emotion}</span>
                  <div className="flex items-center">
                    <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: `${score * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{Math.round(score * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>
            </div>
          )}

          {/* Voice Analysis Results - Only if voice analysis was performed */}
          {results.components.voiceAnalysis && (
            <div className="card">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-green-50 rounded-lg mr-3">
                <MicrophoneIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Voice Analysis</h3>
                <p className="text-sm text-gray-600">Speech patterns</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">Speaking Rate</span>
                <span className="font-medium text-gray-900">{results.components.voiceAnalysis.speakingRate} wps</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">Pause Frequency</span>
                <span className="font-medium text-gray-900 capitalize">{results.components.voiceAnalysis.pauseFrequency}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">Confidence</span>
                <span className="font-medium text-gray-900 capitalize">{results.components.voiceAnalysis.confidenceMarkers}</span>
              </div>
            </div>
            </div>
          )}
        </div>

        {/* Insights Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Strengths & Concerns */}
          <div className="card">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Key Insights</h3>

            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-green-900 mb-3 flex items-center">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                  Strengths
                </h4>
                <ul className="space-y-2">
                  {results.insights.strengths.map((strength, index) => (
                    <li key={index} className="text-sm text-gray-700 flex items-start">
                      <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-yellow-900 mb-3 flex items-center">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2" />
                  Areas of Concern
                </h4>
                <ul className="space-y-2">
                  {results.insights.concerns.map((concern, index) => (
                    <li key={index} className="text-sm text-gray-700 flex items-start">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      {concern}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Risk Factors */}
          <div className="card">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Risk Factors</h3>

            <div className="space-y-4">
              {results.insights.riskFactors.map((factor, index) => (
                <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-red-800">{factor}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-4">
                If you're experiencing significant distress, please reach out for professional support.
              </p>
              <div className="space-y-2">
                {results.resources.slice(0, 2).map((resource, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{resource.title}</span>
                    <a href={`tel:${resource.contact}`} className="text-blue-600 hover:text-blue-700 font-medium">
                      {resource.contact}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="card mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <LightBulbIcon className="h-6 w-6 text-yellow-500 mr-2" />
            Personalized Recommendations
          </h3>

          <div className="space-y-6">
            {results.recommendations.map((category, index) => (
              <div key={index} className={`border-l-4 pl-6 py-4 ${getPriorityColor(category.priority)}`}>
                <h4 className="font-semibold text-gray-900 mb-3">{category.category}</h4>
                <ul className="space-y-2">
                  {category.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="text-sm text-gray-700 flex items-start">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Professional Review Section */}
        {review && (
          <div className="card bg-blue-50 border-blue-200 mb-8">
            <div className="flex items-start">
              <CheckCircleIcon className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">
                  Professional Review
                </h3>
                <div className="bg-white rounded-lg p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Reviewer</p>
                      <p className="font-medium text-gray-900">{review.reviewer?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Review Status</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        review.status === 'approved' ? 'bg-green-100 text-green-800' :
                        review.status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {review.status}
                      </span>
                    </div>
                    {review.reviewScore && (
                      <div>
                        <p className="text-sm text-gray-600">Review Score</p>
                        <p className="font-medium text-gray-900">{review.reviewScore}/100</p>
                      </div>
                    )}
                    {review.riskAssessment && (
                      <div>
                        <p className="text-sm text-gray-600">Risk Assessment</p>
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                          review.riskAssessment === 'critical' ? 'bg-red-100 text-red-800' :
                          review.riskAssessment === 'high' ? 'bg-orange-100 text-orange-800' :
                          review.riskAssessment === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {review.riskAssessment}
                        </span>
                      </div>
                    )}
                  </div>
                  {review.comments && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Comments</p>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded">{review.comments}</p>
                    </div>
                  )}
                  {review.recommendations && review.recommendations.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Reviewer Recommendations</p>
                      <ul className="space-y-2">
                        {review.recommendations.map((rec, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-start">
                            <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {review.flaggedForFollowUp && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                      <p className="text-sm text-yellow-800">
                        <strong>⚠️ Flagged for Follow-up:</strong> {review.followUpNotes || 'This assessment requires professional follow-up.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Emergency Resources */}
        <div className="card bg-red-50 border-red-200">
          <div className="flex items-start">
            <PhoneIcon className="h-6 w-6 text-red-600 mr-3 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-900 mb-4">
                Emergency Mental Health Resources (India)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {results.resources.map((resource, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 border border-red-200">
                    <h4 className="font-medium text-red-900 mb-2">{resource.title}</h4>
                    <p className="text-sm text-red-800 mb-3">{resource.description}</p>
                    <a
                      href={`tel:${resource.contact}`}
                      className="inline-flex items-center text-red-600 hover:text-red-700 font-medium text-sm"
                    >
                      <PhoneIcon className="h-4 w-4 mr-1" />
                      {resource.contact}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Link to="/assessment" className="btn-primary">
            Take Another Assessment
          </Link>
          <Link to="/dashboard" className="btn-secondary">
            View Dashboard
          </Link>
          <button
            onClick={() => exportResults('summary')}
            className="btn-secondary"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Export Summary
          </button>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: 'MStress Assessment Results',
                  text: `I completed a mental health assessment with an overall stress level of ${results.stressLevel}.`,
                  url: window.location.href
                });
              } else {
                navigator.clipboard.writeText(window.location.href);
                alert('Results link copied to clipboard');
              }
            }}
            className="btn-secondary"
          >
            <ShareIcon className="h-4 w-4 mr-2" />
            Share Results
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;
