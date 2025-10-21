import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  HeartIcon,
  EyeIcon,
  EyeSlashIcon,
  UserIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../App';
import toast from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';

// Configure axios base URL
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { login } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Use the auth context login function
      const result = await login({
        email: formData.email,
        password: formData.password
      });

      if (result.success) {
        toast.success('Welcome back! Login successful.');

        // Redirect based on user role
        if (result.user.role === 'admin') {
          navigate('/admin/dashboard');
        } else if (result.user.role === 'human_reviewer') {
          navigate('/reviewer/dashboard');
        } else {
          navigate('/dashboard');
        }
      } else {
        toast.error(result.error || 'Login failed. Please check your credentials.');
      }

    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setIsLoading(true);

      const response = await axios.post('/api/auth/google/verify', {
        credential: credentialResponse.credential,
        clientId: credentialResponse.clientId
      });

      if (response.data.success) {
        // Store token and user data
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        toast.success('Google login successful!');
        window.location.href = '/dashboard';
      } else {
        toast.error(response.data.message || 'Google login failed');
      }
    } catch (error) {
      console.error('Google login error:', error);
      if (error.response?.status === 404) {
        toast.error('Google OAuth not configured. Please use email/password login.');
      } else {
        toast.error('Google login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = (error) => {
    console.error('Google OAuth error:', error);
    toast.error('Google authentication failed. Please use email/password login.');
  };

  // Check if Google OAuth is properly configured
  const isGoogleOAuthConfigured = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    return clientId && clientId !== 'demo-client-id-for-development' && !clientId.includes('YOUR_GOOGLE_CLIENT_ID');
  };

  const handleDemoLogin = () => {
    setFormData({
      email: 'demo@mstress.com',
      password: 'demo123'
    });
    toast.success('Demo credentials filled. Click Sign In to continue.');
  };

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center justify-center mb-6">
            <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
              <HeartIcon className="h-7 w-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-gradient">MStress</span>
          </Link>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome Back
          </h2>
          <p className="text-gray-600">
            Sign in to your account to continue your mental health journey
          </p>
        </div>

        {/* Login Form */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`input-field pl-10 ${errors.email ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`input-field pl-10 pr-10 ${errors.password ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>
              <Link
                to="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing In...
                </div>
              ) : (
                'Sign In'
              )}
            </button>

            {/* Demo Login */}
            <button
              type="button"
              onClick={handleDemoLogin}
              className="w-full btn-secondary"
            >
              Try Demo Account
            </button>

            {/* Google OAuth Section - Only show if properly configured */}
            {isGoogleOAuthConfigured() ? (
              <>
                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or continue with</span>
                  </div>
                </div>

                {/* Google OAuth Button */}
                <div className="w-full flex justify-center">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    useOneTap={false}
                    theme="outline"
                    size="large"
                    text="signin_with"
                    shape="rectangular"
                    logo_alignment="left"
                    width={320}
                    auto_select={false}
                    cancel_on_tap_outside={true}
                  />
                </div>
              </>
            ) : (
              /* Development Notice */
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Google OAuth Setup Required</h3>
                    <p className="mt-1 text-sm text-blue-700">
                      To enable Google Sign-In, configure your Google OAuth 2.0 credentials.
                      See <code className="bg-blue-100 px-1 rounded">GOOGLE_OAUTH_SETUP_GUIDE.md</code> for instructions.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </form>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">
                Sign up for free
              </Link>
            </p>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            By signing in, you agree to our{' '}
            <button className="text-blue-600 hover:text-blue-700">Terms of Service</button>
            {' '}and{' '}
            <button className="text-blue-600 hover:text-blue-700">Privacy Policy</button>
          </p>
        </div>

        {/* Emergency Resources */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-center">
            <p className="text-sm text-red-800 font-medium mb-2">
              Need immediate help?
            </p>
            <div className="space-y-1 text-xs text-red-700">
              <p>National Mental Health Helpline: <strong>1800-599-0019</strong></p>
              <p>Vandrevala Foundation: <strong>9999 666 555</strong></p>
              <p>iCall: <strong>022-25521111</strong></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
