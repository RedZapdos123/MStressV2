import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../App';

const ReviewerLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/login', {
        email,
        password
      });

      const { token, user } = response.data;

      // Check if user is a reviewer or admin
      if (user.role !== 'human_reviewer' && user.role !== 'admin') {
        setError('Access denied. Reviewer credentials required.');
        setLoading(false);
        return;
      }

      // Store token and user info
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      // Set axios authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Update auth context
      login({ email, password });

      // Redirect to reviewer dashboard
      setTimeout(() => {
        navigate('/reviewer/dashboard');
      }, 100);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-purple-900 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">MStress</h1>
          <p className="text-purple-300">Reviewer Portal</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Reviewer Login</h2>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                placeholder="reviewer@mstress.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-black text-white font-semibold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-purple-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-2">Demo Credentials:</p>
            <p className="text-xs text-gray-600">
              Email: <span className="font-mono">reviewer1@mstress.com</span>
            </p>
            <p className="text-xs text-gray-600">
              Password: <span className="font-mono">TestPassword123!</span>
            </p>
          </div>

          {/* Back to home */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Not a reviewer?{' '}
              <a href="/" className="text-purple-600 hover:text-purple-700 font-medium">
                Go back home
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewerLogin;

