import React, { useState, useEffect } from 'react';
import { useAuth } from '../../App';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const ReviewerDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('pending');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingAssessments, setPendingAssessments] = useState([]);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [assessmentHistory, setAssessmentHistory] = useState([]);
  const [reviewHistory, setReviewHistory] = useState([]);
  const [showAssessmentHistory, setShowAssessmentHistory] = useState(false);
  const [showReviewHistory, setShowReviewHistory] = useState(false);
  const [reviewData, setReviewData] = useState({
    reviewScore: '',
    comments: '',
    status: 'reviewed',
    riskAssessment: 'low',
    recommendations: [],
    flaggedForFollowUp: false,
    followUpNotes: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is reviewer
  if (!user || (user.role !== 'human_reviewer' && user.role !== 'admin')) {
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    fetchPendingAssessments();
  }, []);

  const fetchPendingAssessments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/reviews/pending', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingAssessments(response.data.assessments || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching pending assessments:', err);
      setError('Failed to load pending assessments');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAssessment = async (assessment) => {
    setSelectedAssessment(assessment);
    setShowAssessmentHistory(false);
    setShowReviewHistory(false);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/reviews/${assessment._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.review) {
        setReviewData({
          reviewScore: response.data.review.reviewScore || '',
          comments: response.data.review.comments || '',
          status: response.data.review.status || 'reviewed',
          riskAssessment: response.data.review.riskAssessment || 'low',
          recommendations: response.data.review.recommendations || [],
          flaggedForFollowUp: response.data.review.flaggedForFollowUp || false,
          followUpNotes: response.data.review.followUpNotes || ''
        });
      } else {
        setReviewData({
          reviewScore: '',
          comments: '',
          status: 'reviewed',
          riskAssessment: 'low',
          recommendations: [],
          flaggedForFollowUp: false,
          followUpNotes: ''
        });
      }
    } catch (err) {
      console.error('Error fetching review:', err);
    }
  };

  const fetchAssessmentHistory = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/assessments/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAssessmentHistory(response.data.assessments || []);
      setShowAssessmentHistory(true);
    } catch (err) {
      console.error('Error fetching assessment history:', err);
    }
  };

  const fetchReviewHistory = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/reviews/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReviewHistory(response.data.reviews || []);
      setShowReviewHistory(true);
    } catch (err) {
      console.error('Error fetching review history:', err);
    }
  };

  const handleSubmitReview = async () => {
    if (!selectedAssessment) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/reviews/${selectedAssessment._id}`, reviewData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Review submitted successfully');
      setSelectedAssessment(null);
      fetchPendingAssessments();
    } catch (err) {
      console.error('Error submitting review:', err);
      alert('Failed to submit review');
    }
  };

  const handleLogout = () => {
    logout();
  };

  const navigation = [
    {
      name: 'Pending Reviews',
      id: 'pending',
      icon: ClockIcon,
      description: 'Assessments awaiting review'
    },
    {
      name: 'Completed Reviews',
      id: 'completed',
      icon: CheckCircleIcon,
      description: 'Reviewed assessments'
    },
    {
      name: 'High Risk Cases',
      id: 'high-risk',
      icon: ExclamationTriangleIcon,
      description: 'Critical assessments requiring attention'
    }
  ];

  const highRiskCount = pendingAssessments.filter(a => a.results?.stressLevel === 'severe').length;
  const reviewedCount = pendingAssessments.filter(a => a.reviewStatus === 'reviewed').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex flex-col w-64 bg-white shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Reviewer Panel</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <nav className="flex-1 p-4 space-y-2">
              {navigation.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === item.id
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                </button>
              ))}
            </nav>
            <div className="p-4 border-t">
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-3" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex h-screen bg-gray-100">
        {/* Sidebar */}
        <div className="hidden lg:flex lg:flex-col lg:w-64 lg:bg-white lg:shadow-lg">
          <div className="flex items-center justify-center h-16 bg-gradient-to-r from-purple-600 to-black">
            <h1 className="text-xl font-bold text-white">MStress Reviewer</h1>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === item.id
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <item.icon className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div>{item.name}</div>
                  <div className="text-xs text-gray-500">{item.description}</div>
                </div>
              </button>
            ))}
          </nav>
          <div className="p-4 border-t">
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-3" />
              Logout
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top bar */}
          <div className="bg-white shadow">
            <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
              <h2 className="text-2xl font-bold text-gray-900">
                {navigation.find(n => n.id === activeTab)?.name}
              </h2>
              <div className="text-sm text-gray-600">
                Welcome, {user?.name}
              </div>
            </div>
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-auto">
            <div className="p-4 sm:p-6 lg:p-8">
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                  <p className="mt-4 text-gray-600">Loading assessments...</p>
                </div>
              ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                  {error}
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Assessments list */}
                  <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow">
                      <div className="px-4 py-5 sm:px-6 border-b">
                        <h3 className="text-lg font-medium text-gray-900">
                          {activeTab === 'pending' ? 'Pending Reviews' : 'Assessments'}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {pendingAssessments.length} total
                        </p>
                      </div>
                      <div className="divide-y max-h-96 overflow-y-auto">
                        {pendingAssessments.map((assessment) => (
                          <button
                            key={assessment._id}
                            onClick={() => handleSelectAssessment(assessment)}
                            className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                              selectedAssessment?._id === assessment._id ? 'bg-purple-50' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-900">{assessment.user?.name}</p>
                                <p className="text-sm text-gray-500">
                                  Score: {assessment.results?.overallScore}
                                </p>
                              </div>
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                assessment.results?.stressLevel === 'severe' ? 'bg-red-100 text-red-800' :
                                assessment.results?.stressLevel === 'high' ? 'bg-orange-100 text-orange-800' :
                                assessment.results?.stressLevel === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {assessment.results?.stressLevel}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Review form */}
                  {selectedAssessment && (
                    <div className="lg:col-span-2">
                      <div className="bg-white rounded-lg shadow">
                        <div className="px-4 py-5 sm:px-6 border-b">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">Review Assessment</h3>
                              <p className="mt-1 text-sm text-gray-500">
                                {selectedAssessment.user?.name} - Score: {selectedAssessment.results?.overallScore}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => fetchAssessmentHistory(selectedAssessment.user?._id)}
                                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                              >
                                Assessment History
                              </button>
                              <button
                                onClick={() => fetchReviewHistory(selectedAssessment.user?._id)}
                                className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                              >
                                Review History
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="px-4 py-5 sm:px-6 space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Review Score (0-100)</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={reviewData.reviewScore}
                              onChange={(e) => setReviewData({...reviewData, reviewScore: e.target.value})}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">Risk Assessment</label>
                            <select
                              value={reviewData.riskAssessment}
                              onChange={(e) => setReviewData({...reviewData, riskAssessment: e.target.value})}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                            >
                              <option value="low">Low Risk</option>
                              <option value="moderate">Moderate Risk</option>
                              <option value="high">High Risk</option>
                              <option value="critical">Critical Risk</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">Comments</label>
                            <textarea
                              value={reviewData.comments}
                              onChange={(e) => setReviewData({...reviewData, comments: e.target.value})}
                              rows="4"
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                              placeholder="Enter your review comments..."
                            />
                          </div>

                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={reviewData.flaggedForFollowUp}
                              onChange={(e) => setReviewData({...reviewData, flaggedForFollowUp: e.target.checked})}
                              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                            />
                            <label className="ml-2 block text-sm text-gray-700">Flag for Follow-up</label>
                          </div>

                          <button
                            onClick={handleSubmitReview}
                            className="w-full bg-gradient-to-r from-purple-600 to-black text-white font-medium py-2 px-4 rounded-lg hover:opacity-90 transition-opacity"
                          >
                            Submit Review
                          </button>
                        </div>
                      </div>

                      {/* Assessment History */}
                      {showAssessmentHistory && (
                        <div className="mt-6 bg-white rounded-lg shadow">
                          <div className="px-4 py-5 sm:px-6 border-b">
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-medium text-gray-900">Assessment History</h3>
                              <button
                                onClick={() => setShowAssessmentHistory(false)}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-gray-50 border-b">
                                <tr>
                                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Type</th>
                                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Score</th>
                                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Stress Level</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {assessmentHistory.map((assessment) => (
                                  <tr key={assessment._id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm text-gray-900">
                                      {new Date(assessment.completedAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-900">{assessment.type}</td>
                                    <td className="px-4 py-3 text-sm text-gray-900">{assessment.results?.overallScore}</td>
                                    <td className="px-4 py-3 text-sm">
                                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                        assessment.results?.stressLevel === 'severe' ? 'bg-red-100 text-red-800' :
                                        assessment.results?.stressLevel === 'high' ? 'bg-orange-100 text-orange-800' :
                                        assessment.results?.stressLevel === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-green-100 text-green-800'
                                      }`}>
                                        {assessment.results?.stressLevel}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Review History */}
                      {showReviewHistory && (
                        <div className="mt-6 bg-white rounded-lg shadow">
                          <div className="px-4 py-5 sm:px-6 border-b">
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-medium text-gray-900">Review History</h3>
                              <button
                                onClick={() => setShowReviewHistory(false)}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                          <div className="space-y-4 p-4">
                            {reviewHistory.length > 0 ? (
                              reviewHistory.map((review) => (
                                <div key={review._id} className="border rounded-lg p-4 hover:bg-gray-50">
                                  <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-medium text-gray-900">
                                      Assessment ID: {review.assessment}
                                    </p>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                      review.status === 'reviewed' ? 'bg-green-100 text-green-800' :
                                      review.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-blue-100 text-blue-800'
                                    }`}>
                                      {review.status}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-500 mb-2">
                                    {new Date(review.createdAt).toLocaleDateString()}
                                  </p>
                                  <p className="text-sm text-gray-700">{review.comments}</p>
                                  <div className="mt-2 text-sm text-gray-600">
                                    <p>Risk Assessment: <span className="font-medium">{review.riskAssessment}</span></p>
                                    <p>Review Score: <span className="font-medium">{review.reviewScore}</span></p>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-gray-500 text-center py-4">No reviews found for this user.</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewerDashboard;

