import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  HeartIcon,
  UserIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import axios from 'axios';

// Configure axios base URL
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [resetToken, setResetToken] = useState(null);
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
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
      const response = await axios.post('/api/auth/forgot-password', {
        email: email.toLowerCase()
      });

      if (response.data.success) {
        setResetToken(response.data.resetToken);
        toast.success('Password reset token generated! Redirecting to reset page...');
        
        // Redirect to reset password page with token
        setTimeout(() => {
          navigate(`/reset-password/${response.data.resetToken}`);
        }, 1500);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to process password reset request';
      toast.error(errorMessage);
      console.error('Forgot password error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { value } = e.target;
    setEmail(value);

    // Clear error when user starts typing
    if (errors.email) {
      setErrors(prev => ({
        ...prev,
        email: ''
      }));
    }
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
            Forgot Password?
          </h2>
          <p className="text-gray-600">
            Enter your email address and we'll help you reset your password
          </p>
        </div>

        {/* Form */}
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
                  value={email}
                  onChange={handleChange}
                  className={`input-field pl-10 ${errors.email ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                  placeholder="Enter your email"
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processing...' : 'Send Reset Link'}
            </button>
          </form>

          {/* Back to Login Link */}
          <div className="mt-6 flex items-center justify-center">
            <Link
              to="/login"
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Back to Login
            </Link>
          </div>
        </div>

        {/* Info Box */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 <strong>Tip:</strong> Check your email for password reset instructions. If you don't see it, check your spam folder.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;

