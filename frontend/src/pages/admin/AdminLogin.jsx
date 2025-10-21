import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../App';
import toast from 'react-hot-toast';
import axios from 'axios';
import {
  EyeIcon,
  EyeSlashIcon,
  ShieldCheckIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

// Configure axios base URL
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Call the backend login API directly
      const response = await axios.post('/api/auth/login', {
        email: formData.email,
        password: formData.password
      });

      if (response.data.success) {
        // Verify user is admin
        if (response.data.user.role === 'admin') {
          // Store token and user data
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.user));

          // Set axios authorization header
          axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;

          // Update auth context
          login({ email: formData.email, password: formData.password });

          toast.success('Admin login successful');

          // Redirect to admin dashboard
          setTimeout(() => {
            navigate('/admin/dashboard');
          }, 100);
        } else {
          toast.error('Access denied. Admin privileges required.');
        }
      } else {
        toast.error(response.data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Admin login error:', error);

      if (error.response?.status === 400 || error.response?.status === 401) {
        toast.error('Invalid admin credentials. Please check your email and password.');
      } else if (error.response?.status === 500) {
        toast.error('Server error. Please try again later.');
      } else {
        toast.error('Login failed. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
            <ShieldCheckIcon className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-white">
            Admin Access
          </h2>
          <p className="mt-2 text-sm text-gray-300">
            MStress Platform Administration
          </p>
        </div>

        {/* Admin Info Card */}
        <div className="bg-purple-900/30 backdrop-blur-sm border border-purple-500/20 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">MM</span>
            </div>
            <div>
              <p className="text-white font-medium">Mridankan Mandal</p>
              <p className="text-purple-300 text-sm">System Administrator</p>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-2">
                Admin Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="iib2024017@iiita.ac.in"
                className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-md text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-2">
                Admin Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter admin password"
                  className="w-full px-3 py-2 pr-10 bg-white/20 border border-white/30 rounded-md text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-300 hover:text-white"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Authenticating...
                </div>
              ) : (
                'Access Admin Dashboard'
              )}
            </button>
          </div>
        </form>

        {/* Security Notice */}
        <div className="bg-yellow-900/30 backdrop-blur-sm border border-yellow-500/20 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <ShieldCheckIcon className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-yellow-200 text-sm font-medium">Security Notice</p>
              <p className="text-yellow-300 text-xs mt-1">
                This is a restricted area. All admin activities are logged and monitored for security purposes.
              </p>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center">
          <Link
            to="/"
            className="inline-flex items-center text-sm text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to MStress Platform
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-400">
            MStress Admin Panel v1.0 | Secure Access Portal
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
