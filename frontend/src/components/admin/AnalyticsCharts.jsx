import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import axios from 'axios';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const AnalyticsCharts = () => {
  const [registrationData, setRegistrationData] = useState(null);
  const [completionData, setCompletionData] = useState(null);
  const [stressData, setStressData] = useState(null);
  const [usageData, setUsageData] = useState(null);
  const [engagementData, setEngagementData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const [registrations, completion, stress, usage, engagement] = await Promise.all([
        axios.get('/api/analytics/user-registrations'),
        axios.get('/api/analytics/assessment-completion'),
        axios.get('/api/analytics/stress-distribution'),
        axios.get('/api/analytics/platform-usage'),
        axios.get('/api/analytics/engagement-metrics')
      ]);

      setRegistrationData(registrations.data.data);
      setCompletionData(completion.data.data);
      setStressData(stress.data.data);
      setUsageData(usage.data.data);
      setEngagementData(engagement.data.data);
    } catch (err) {
      setError('Failed to load analytics data');
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Chart options with accessibility and color-blind friendly colors
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const colorBlindFriendlyPalette = [
    '#1f77b4', // blue
    '#ff7f0e', // orange
    '#2ca02c', // green
    '#d62728', // red
    '#9467bd', // purple
    '#8c564b', // brown
    '#e377c2', // pink
    '#7f7f7f', // gray
  ];

  // Registration trends chart data
  const registrationChartData = registrationData ? {
    labels: registrationData.map(item => item._id),
    datasets: [
      {
        label: 'Daily Registrations',
        data: registrationData.map(item => item.count),
        borderColor: colorBlindFriendlyPalette[0],
        backgroundColor: colorBlindFriendlyPalette[0] + '20',
        tension: 0.1,
      },
    ],
  } : null;

  // Assessment completion chart data
  const completionChartData = completionData ? {
    labels: completionData.map(item => item.userType),
    datasets: [
      {
        label: 'Completion Rate (%)',
        data: completionData.map(item => item.completionRate),
        backgroundColor: colorBlindFriendlyPalette.slice(0, completionData.length),
        borderColor: colorBlindFriendlyPalette.slice(0, completionData.length),
        borderWidth: 1,
      },
    ],
  } : null;

  // Stress distribution chart data
  const stressChartData = stressData ? {
    labels: stressData.map(item => item._id),
    datasets: [
      {
        label: 'Stress Level Distribution',
        data: stressData.map(item => item.count),
        backgroundColor: [
          '#2ca02c', // green for low
          '#ff7f0e', // orange for moderate
          '#d62728', // red for high
          '#8b0000', // dark red for severe
        ],
        borderWidth: 2,
      },
    ],
  } : null;

  // Platform usage chart data
  const usageChartData = usageData ? {
    labels: usageData.map(item => item._id),
    datasets: [
      {
        label: 'Active Users',
        data: usageData.map(item => item.activeUsers),
        borderColor: colorBlindFriendlyPalette[2],
        backgroundColor: colorBlindFriendlyPalette[2] + '20',
        tension: 0.1,
      },
    ],
  } : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="text-red-600">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Analytics Error</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
        <button
          onClick={fetchAnalyticsData}
          className="mt-3 bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-50 rounded-lg">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Registrations</p>
              <p className="text-2xl font-semibold text-gray-900">
                {registrationData?.reduce((sum, item) => sum + item.count, 0) || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-50 rounded-lg">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Assessments/User</p>
              <p className="text-2xl font-semibold text-gray-900">
                {engagementData?.averageAssessments?.toFixed(1) || '0.0'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Users (30d)</p>
              <p className="text-2xl font-semibold text-gray-900">
                {usageData?.reduce((sum, item) => sum + item.activeUsers, 0) || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-50 rounded-lg">
              <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Assessments</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stressData?.reduce((sum, item) => sum + item.count, 0) || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Registration Trends */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Registration Trends (30 Days)</h3>
          <div className="h-64" role="img" aria-label="User registration trends over the last 30 days">
            {registrationChartData && (
              <Line data={registrationChartData} options={chartOptions} />
            )}
          </div>
        </div>

        {/* Assessment Completion Rates */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Assessment Completion by User Type</h3>
          <div className="h-64" role="img" aria-label="Assessment completion rates by user type">
            {completionChartData && (
              <Bar data={completionChartData} options={chartOptions} />
            )}
          </div>
        </div>

        {/* Stress Level Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Stress Level Distribution</h3>
          <div className="h-64" role="img" aria-label="Distribution of stress levels across all assessments">
            {stressChartData && (
              <Pie 
                data={stressChartData} 
                options={{
                  ...chartOptions,
                  scales: undefined, // Remove scales for pie chart
                }} 
              />
            )}
          </div>
        </div>

        {/* Platform Usage */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Usage (30 Days)</h3>
          <div className="h-64" role="img" aria-label="Daily active users over the last 30 days">
            {usageChartData && (
              <Line data={usageChartData} options={chartOptions} />
            )}
          </div>
        </div>
      </div>

      {/* Most Active Users */}
      {engagementData?.mostActiveUsers && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Active Users</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assessments
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {engagementData.mostActiveUsers.map((user, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.userType === 'admin' ? 'bg-purple-100 text-purple-800' :
                        user.userType === 'professional' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {user.userType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.assessmentCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsCharts;
