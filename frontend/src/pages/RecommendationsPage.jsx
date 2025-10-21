import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  SparklesIcon,
  CheckCircleIcon,
  CalendarIcon,
  ChartBarIcon,
  MapPinIcon,
  PhoneIcon,
  ExclamationTriangleIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../App';
import axios from 'axios';
import toast from 'react-hot-toast';

const RecommendationsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState(null);
  const [resources, setResources] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stressScore, setStressScore] = useState(null);
  const [stressLevel, setStressLevel] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  const fetchRecommendationsWithLocation = async (location) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');

      if (!token || !userData) {
        navigate('/login');
        return;
      }

      const parsedUser = JSON.parse(userData);
      const userId = parsedUser.id || parsedUser._id;

      // Build URL with geolocation parameters if available
      let url = `/api/recommendations/user/${userId}`;
      if (location?.latitude && location?.longitude) {
        url += `?latitude=${location.latitude}&longitude=${location.longitude}`;
      }

      // Fetch recommendations
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setRecommendations(response.data.recommendations);
        setStressScore(response.data.stressScore);
        setStressLevel(response.data.stressLevel);
        setResources(response.data.resources);
        console.log('Resources received:', response.data.resources);
      } else {
        toast.error('Failed to load recommendations');
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      toast.error('Error loading recommendations');
    } finally {
      setLoading(false);
    }
  };

  // Request user's geolocation first
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setUserLocation(location);
          // Fetch recommendations immediately after getting geolocation
          fetchRecommendationsWithLocation(location);
        },
        (error) => {
          console.warn('Geolocation error:', error);
          // Continue without geolocation
          fetchRecommendationsWithLocation(null);
        }
      );
    } else {
      // Geolocation not supported, fetch without location
      fetchRecommendationsWithLocation(null);
    }
  }, []);

  const fetchRecommendations = async () => {
    fetchRecommendationsWithLocation(userLocation);
  };

  const getStressLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'severe':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStressGaugeColor = (score) => {
    if (score < 25) return 'from-green-400 to-green-600';
    if (score < 50) return 'from-yellow-400 to-yellow-600';
    if (score < 75) return 'from-orange-400 to-orange-600';
    return 'from-red-400 to-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading recommendations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-primary">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          {/* Logo */}
          <div className="flex items-center mb-6">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center hover:opacity-80 transition-opacity"
              title="Go to Dashboard"
            >
              <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-2">
                <HeartIcon className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gradient">MStress</span>
            </button>
          </div>
          {/* TODO: Replace with actual SVG logo file */}
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-blue-600 hover:text-blue-700 font-medium mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Personalized Mental Health Recommendations
          </h1>
          <p className="text-gray-600">
            Based on your latest assessment, here are tailored recommendations to support your mental health journey.
          </p>
        </div>

        {/* Stress Score Summary */}
        {stressScore !== null && (
          <div className="card mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Your Stress Score</h2>
              <ChartBarIcon className="h-6 w-6 text-gray-400" />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-baseline mb-2">
                  <span className="text-4xl font-bold text-gray-900">{stressScore}</span>
                  <span className="text-gray-600 ml-2">/100</span>
                </div>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStressLevelColor(stressLevel)}`}>
                  {stressLevel?.charAt(0).toUpperCase() + stressLevel?.slice(1) || 'Unknown'}
                </span>
              </div>
              <div className="w-32 h-32">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="url(#stressGradient)"
                    strokeWidth="8"
                    strokeDasharray={`${(stressScore / 100) * 283} 283`}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                  />
                  <defs>
                    <linearGradient id="stressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={stressScore < 25 ? '#10b981' : stressScore < 50 ? '#f59e0b' : stressScore < 75 ? '#f97316' : '#ef4444'} />
                      <stop offset="100%" stopColor={stressScore < 25 ? '#059669' : stressScore < 50 ? '#d97706' : stressScore < 75 ? '#ea580c' : '#dc2626'} />
                    </linearGradient>
                  </defs>
                  <text x="50" y="55" textAnchor="middle" fontSize="20" fontWeight="bold" fill="#1f2937">
                    {stressScore}%
                  </text>
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {recommendations && (
          <div className="space-y-6 mb-8">
            {/* Immediate Actions */}
            <div className="card">
              <div className="flex items-center mb-4">
                <SparklesIcon className="h-6 w-6 text-blue-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">Immediate Actions</h2>
              </div>
              <p className="text-gray-600 text-sm mb-4">Things you can do today to feel better:</p>
              <ul className="space-y-3">
                {recommendations.immediateActions?.map((action, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircleIcon className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{action}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Weekly Practices */}
            <div className="card">
              <div className="flex items-center mb-4">
                <CalendarIcon className="h-6 w-6 text-purple-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">Weekly Practices</h2>
              </div>
              <p className="text-gray-600 text-sm mb-4">Habits to build this week:</p>
              <ul className="space-y-3">
                {recommendations.weeklyPractices?.map((practice, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircleIcon className="h-5 w-5 text-purple-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{practice}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Long-term Strategies */}
            <div className="card">
              <div className="flex items-center mb-4">
                <ExclamationTriangleIcon className="h-6 w-6 text-orange-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">Long-term Strategies</h2>
              </div>
              <p className="text-gray-600 text-sm mb-4">Ongoing practices for sustained mental health:</p>
              <ul className="space-y-3">
                {recommendations.longTermStrategies?.map((strategy, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircleIcon className="h-5 w-5 text-orange-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{strategy}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Summary */}
            {recommendations.summary && (
              <div className="card bg-blue-50 border border-blue-200">
                <p className="text-gray-800 italic">{recommendations.summary}</p>
              </div>
            )}
          </div>
        )}

        {/* Nearby Resources */}
        {resources && (
          <div className="card mb-8">
            <div className="flex items-center mb-6">
              <MapPinIcon className="h-6 w-6 text-red-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Nearby Mental Health Resources</h2>
            </div>
            <div className="space-y-4">
              {/* Resources List */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Available Resources</h4>
                {resources.resources && resources.resources.length > 0 ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {resources.resources.map((resource, index) => (
                      <div
                        key={index}
                        className="p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-gray-50 transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900 text-sm">{resource.name}</h5>
                            <div className="flex items-center text-gray-600 text-xs mt-1">
                              <MapPinIcon className="h-3 w-3 mr-1" />
                              <span>{resource.address}</span>
                            </div>
                            {resource.distance && (
                              <p className="text-xs text-gray-500 mt-1">
                                <strong>Distance:</strong> {resource.distance} km
                              </p>
                            )}
                          </div>
                          {resource.rating && (
                            <div className="flex items-center ml-2">
                              <span className="text-xs font-medium text-gray-700">
                                ⭐ {resource.rating}
                              </span>
                            </div>
                          )}
                        </div>
                        {resource.openNow !== null && (
                          <div className="mt-2">
                            <span
                              className={`text-xs font-medium px-2 py-1 rounded ${
                                resource.openNow
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {resource.openNow ? 'Open Now' : 'Closed'}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-sm">No resources found in your area.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Emergency Hotlines */}
        {resources?.emergencyHotlines && (
          <div className="card bg-red-50 border border-red-200">
            <h3 className="text-lg font-semibold text-red-900 mb-4">Emergency Support</h3>
            <div className="space-y-3">
              {resources.emergencyHotlines.map((hotline, index) => (
                <div key={index} className="flex items-start">
                  <PhoneIcon className="h-5 w-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-red-900">{hotline.name}</p>
                    <p className="text-red-700 text-sm">{hotline.number}</p>
                    {hotline.description && (
                      <p className="text-red-600 text-xs mt-1">{hotline.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Back Button */}
        <div className="mt-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-primary w-full"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecommendationsPage;

