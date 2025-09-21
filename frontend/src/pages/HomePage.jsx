import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  HeartIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  UserGroupIcon,
  SparklesIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  PlayCircleIcon,
  CameraIcon,
  ClipboardDocumentListIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../App';
import IndianMentalHealthResources from '../components/IndianMentalHealthResources';
import toast from 'react-hot-toast';
import axios from 'axios';

const HomePage = () => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Clear axios default headers
    delete axios.defaults.headers.common['Authorization'];

    // Call logout from auth context if available
    if (logout) {
      logout();
    }

    toast.success('Logged out successfully');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-primary">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading MStress Platform...</p>
        </div>
      </div>
    );
  }

  const features = [
    {
      icon: ClipboardDocumentListIcon,
      title: 'Evidence-Based Questionnaires',
      description: 'Scientifically validated mental health assessments designed by clinical professionals.',
      color: 'text-blue-500'
    },
    {
      icon: CameraIcon,
      title: 'Facial Emotion Recognition',
      description: 'Advanced AI-powered facial emotion analysis for enhanced assessment accuracy.',
      color: 'text-purple-500'
    },
    {
      icon: SparklesIcon,
      title: 'AI-Powered Insights',
      description: 'Personalized recommendations and actionable insights based on comprehensive analysis.',
      color: 'text-indigo-500'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Privacy & Security',
      description: 'HIPAA-compliant platform with local image processing and secure data handling.',
      color: 'text-green-500'
    },
    {
      icon: ChartBarIcon,
      title: 'Progress Tracking',
      description: 'Monitor your mental health journey with comprehensive analytics and trend visualization.',
      color: 'text-orange-500'
    },
    {
      icon: UserGroupIcon,
      title: 'Professional Support',
      description: 'Connect with licensed mental health professionals and access crisis support resources.',
      color: 'text-teal-500'
    }
  ];

  // Statistics section removed as requested

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                  <HeartIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gradient">MStress</h1>
                  <p className="text-xs text-gray-500 -mt-1">Mental Health Assessment</p>
                </div>
              </div>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#features" className="text-gray-700 hover:text-blue-600 transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-700 hover:text-blue-600 transition-colors">How It Works</a>
              {user ? (
                <div className="flex items-center space-x-4">
                  <Link to="/dashboard" className="text-blue-600 font-semibold">Dashboard</Link>
                  <button
                    onClick={handleLogout}
                    className="text-gray-700 hover:text-red-600 transition-colors flex items-center"
                  >
                    <ArrowRightOnRectangleIcon className="h-4 w-4 mr-1" />
                    Logout
                  </button>
                </div>
              ) : (
                <Link to="/login" className="text-gray-700 hover:text-blue-600 transition-colors">Sign In</Link>
              )}
            </nav>
            <div className="flex items-center space-x-4">
              {!user && (
                <Link to="/admin/login" className="text-purple-700 hover:text-purple-900 font-medium transition-colors flex items-center">
                  <ShieldCheckIcon className="h-4 w-4 mr-1" />
                  Admin
                </Link>
              )}
              {user ? (
                <div className="flex items-center space-x-4">
                  {user.userType === 'admin' && (
                    <Link to="/admin/dashboard" className="text-purple-700 hover:text-purple-900 font-medium transition-colors flex items-center">
                      <ShieldCheckIcon className="h-4 w-4 mr-1" />
                      Admin Panel
                    </Link>
                  )}
                  <Link to="/assessment" className="btn-primary">
                    Start Assessment
                  </Link>
                </div>
              ) : (
                <Link to="/register" className="btn-primary">
                  Get Started
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Your Mental Health
              <span className="block text-gradient">Matters</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto">
              Professional mental health assessments with AI-powered insights including 
              facial emotion recognition and personalized recommendations for better wellbeing.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              {user ? (
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link to="/dashboard" className="btn-primary text-lg px-8 py-4">
                    Go to Dashboard
                    <ArrowRightIcon className="ml-2 h-5 w-5" />
                  </Link>
                  <Link to="/assessment" className="btn-secondary text-lg px-8 py-4">
                    Start New Assessment
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link to="/register" className="btn-primary text-lg px-8 py-4">
                    Start Your Assessment
                    <ArrowRightIcon className="ml-2 h-5 w-5" />
                  </Link>
                  <button
                    onClick={() => window.open('https://www.youtube.com/watch?v=DxIDKZHW3-E', '_blank')}
                    className="btn-secondary text-lg px-6 py-4"
                  >
                    <PlayCircleIcon className="mr-2 h-5 w-5" />
                    Watch Demo
                  </button>
                </div>
              )}
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500">
              <div className="flex items-center">
                <ShieldCheckIcon className="h-5 w-5 text-green-500 mr-2" />
                HIPAA Compliant
              </div>
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-blue-500 mr-2" />
                Evidence-Based
              </div>
              <div className="flex items-center">
                <HeartIcon className="h-5 w-5 text-red-500 mr-2" />
                Clinically Validated
              </div>
              <div className="flex items-center">
                <CameraIcon className="h-5 w-5 text-purple-500 mr-2" />
                AI-Powered
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics section removed as requested */}

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Comprehensive Mental Health Support
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform combines clinical expertise with cutting-edge technology to provide 
              you with the tools and insights you need for better mental health.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card hover:shadow-xl transition-all duration-300 group">
                <div className={`inline-flex p-3 rounded-lg bg-gray-50 mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`h-8 w-8 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Start Your Mental Health Journey?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of users who have taken control of their mental health with MStress.
            Experience the power of AI-enhanced assessment today.
          </p>
          {!user && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl">
                Get Started Today
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
              <Link to="/login" className="inline-flex items-center px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-blue-600 transition-all duration-200">
                Sign In
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Indian Mental Health Resources Section */}
      <section className="py-16 bg-gradient-to-br from-red-50 to-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Mental Health Support in India
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Access immediate help and professional mental health resources across India.
              Support is available 24/7 in multiple languages.
            </p>
          </div>

          <IndianMentalHealthResources variant="full" />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        {/* Emergency Banner - Indian Context */}
        <div className="bg-red-600 py-3">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center space-x-4 text-center">
              <ShieldCheckIcon className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm font-medium">
                Mental Health Emergency? Contact:
                <span className="ml-2 font-bold">1800-599-0019 (National Helpline)</span>
                <span className="mx-2">|</span>
                <span className="font-bold">9999 666 555 (Vandrevala Foundation)</span>
                <span className="mx-2">|</span>
                <span className="font-bold">022-25521111 (iCall)</span>
              </p>
            </div>
          </div>
        </div>

        {/* Main Footer */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <HeartIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gradient">MStress</h3>
                <p className="text-xs text-gray-400">Mental Health Assessment</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm mb-4 max-w-md mx-auto">
              Empowering individuals and organizations with professional mental health assessment tools 
              and AI-powered insights for better wellbeing outcomes.
            </p>
            
            <div className="border-t border-gray-800 mt-8 pt-8">
              <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-8">
                <div className="flex items-center space-x-4 text-sm text-gray-400">
                  <p>&copy; 2024 MStress Platform. All rights reserved.</p>
                  <span className="hidden md:block">|</span>
                  <p className="flex items-center">
                    <HeartIcon className="h-4 w-4 mr-1 text-red-400" />
                    Built with care for mental health
                  </p>
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-gray-400">
                  <span className="flex items-center">
                    <ShieldCheckIcon className="h-4 w-4 mr-1 text-green-400" />
                    HIPAA Compliant
                  </span>
                  <span className="flex items-center">
                    <CheckCircleIcon className="h-4 w-4 mr-1 text-blue-400" />
                    Evidence-Based
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
