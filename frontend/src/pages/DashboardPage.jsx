import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  HeartIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  MinusIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../App';
import axios from 'axios';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Configure axios base URL
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Register Chart.js components including Filler for area charts
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [assessmentHistory, setAssessmentHistory] = useState([]);
  const [stressData, setStressData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Function to refresh dashboard data
  const refreshDashboardData = async () => {
    setLoading(true);
    await fetchUserData();
  };

  // Retry mechanism for failed API calls
  const retryFetchData = async (retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        await fetchUserData();
        return;
      } catch (error) {
        if (i === retries - 1) {
          throw error; // Re-throw on final attempt
        }
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
  };

  // Fetch real user assessment data
  const fetchUserData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        if (!token) {
          navigate('/login');
          return;
        }

        // Fetch user assessments
        const response = await axios.get('/api/user/assessments', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
          const assessments = response.data.assessments || [];
          setAssessmentHistory(assessments);

          // Transform assessment data for chart
          const chartData = assessments.map(assessment => ({
            date: new Date(assessment.createdAt).toLocaleDateString(),
            score: assessment.stressScore || assessment.score || 0,
            level: assessment.stressLevel || 'Unknown'
          })).reverse(); // Show chronological order

          setStressData(chartData);
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);

        // If token is invalid, redirect to login
        if (error.response?.status === 401) {
          handleLogout();
        } else {
          // Set empty arrays for no data instead of mock data
          setAssessmentHistory([]);
          setStressData([]);

          // Detailed error handling based on error type
          if (error.code === 'NETWORK_ERROR' || !error.response) {
            toast.error('Unable to connect to server. Please check your internet connection and try again.');
          } else if (error.response?.status === 500) {
            toast.error('Server error occurred. Please try again later or contact support.');
          } else if (error.response?.status === 404) {
            toast.error('Assessment data not found. This may be normal if you haven\'t completed any assessments yet.');
          } else if (error.response?.status >= 400 && error.response?.status < 500) {
            toast.error('There was a problem with your request. Please try refreshing the page.');
          } else {
            toast.error('An unexpected error occurred. Please try again.');
          }
        }
      } finally {
        setLoading(false);
      }
    };

  // Initial data fetch and setup for real-time updates
  useEffect(() => {
    fetchUserData();

    // Listen for assessment completion events
    const handleAssessmentComplete = () => {
      setTimeout(() => {
        refreshDashboardData();
      }, 1000); // Small delay to ensure data is saved
    };

    // Add event listener for custom assessment completion event
    window.addEventListener('assessmentCompleted', handleAssessmentComplete);

    // Cleanup
    return () => {
      window.removeEventListener('assessmentCompleted', handleAssessmentComplete);
    };
  }, [user, navigate]);

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

  const getStressLevelColor = (level) => {
    switch (level.toLowerCase()) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'moderate': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStressLevelIcon = (level) => {
    switch (level.toLowerCase()) {
      case 'low': return <CheckCircleIcon className="h-5 w-5" />;
      case 'moderate': return <ExclamationTriangleIcon className="h-5 w-5" />;
      case 'high': return <ExclamationTriangleIcon className="h-5 w-5" />;
      default: return <ClockIcon className="h-5 w-5" />;
    }
  };

  const getStressTrend = () => {
    if (assessmentHistory.length < 2) return { trend: 'stable', icon: MinusIcon, color: 'text-gray-500' };

    const latest = assessmentHistory[0];
    const previous = assessmentHistory[1];

    const latestScore = latest.score || latest.stressScore || 0;
    const previousScore = previous.score || previous.stressScore || 0;

    if (latestScore > previousScore + 5) {
      return { trend: 'increasing', icon: ArrowUpIcon, color: 'text-red-500' };
    } else if (latestScore < previousScore - 5) {
      return { trend: 'decreasing', icon: ArrowDownIcon, color: 'text-green-500' };
    } else {
      return { trend: 'stable', icon: MinusIcon, color: 'text-gray-500' };
    }
  };

  const exportData = async (format) => {
    try {
      if (assessmentHistory.length === 0) {
        // Create empty template files
        if (format === 'csv') {
          const csvHeaders = 'Date,Assessment Type,Stress Level,Score,Duration (minutes),Methods Used\n';
          const csvContent = csvHeaders + 'No assessment data available,,,,,';

          const blob = new Blob([csvContent], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'assessment-history-template.csv';
          a.click();
          window.URL.revokeObjectURL(url);
          toast.success('Empty CSV template downloaded');
        } else if (format === 'pdf') {
          const pdf = new jsPDF();
          pdf.setFontSize(20);
          pdf.text('MStress Assessment Report', 20, 30);
          pdf.setFontSize(12);
          pdf.text('No assessment data available', 20, 50);
          pdf.text('Complete an assessment to generate a detailed report.', 20, 70);
          pdf.save('assessment-report-template.pdf');
          toast.success('Empty PDF template downloaded');
        }
        return;
      }

      // Prepare data for export
      const exportData = assessmentHistory.map(assessment => ({
        Date: new Date(assessment.date).toLocaleDateString(),
        'Assessment Type': assessment.type,
        'Stress Level': assessment.stressLevel,
        Score: assessment.score || assessment.stressScore || 'N/A',
        'Duration (minutes)': Math.floor((assessment.duration || 0) / 60),
        'Methods Used': assessment.methods ? assessment.methods.join(', ') : 'questionnaire'
      }));

      if (format === 'csv') {
        // Generate CSV
        const csvHeaders = Object.keys(exportData[0]).join(',') + '\n';
        const csvRows = exportData.map(row =>
          Object.values(row).map(value =>
            typeof value === 'string' && value.includes(',') ? `"${value}"` : value
          ).join(',')
        ).join('\n');

        const csvContent = csvHeaders + csvRows;
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `assessment-history-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success('CSV file downloaded successfully');

      } else if (format === 'pdf') {
        // Generate PDF
        const pdf = new jsPDF();

        // Header
        pdf.setFontSize(20);
        pdf.text('MStress Assessment Report', 20, 30);

        // User info
        pdf.setFontSize(12);
        pdf.text(`Generated for: ${user?.name || 'User'}`, 20, 50);
        pdf.text(`Report Date: ${new Date().toLocaleDateString()}`, 20, 65);
        pdf.text(`Total Assessments: ${assessmentHistory.length}`, 20, 80);

        // Summary statistics
        const avgScore = stressData.length > 0
          ? Math.round(stressData.reduce((acc, curr) => acc + (curr.score || 0), 0) / stressData.length)
          : 'N/A';
        pdf.text(`Average Stress Score: ${avgScore}`, 20, 95);

        const latestLevel = assessmentHistory[0]?.stressLevel || 'N/A';
        pdf.text(`Current Stress Level: ${latestLevel}`, 20, 110);

        // Assessment history table
        pdf.setFontSize(14);
        pdf.text('Assessment History:', 20, 135);

        pdf.setFontSize(10);
        let yPosition = 150;

        // Table headers
        pdf.text('Date', 20, yPosition);
        pdf.text('Type', 60, yPosition);
        pdf.text('Level', 120, yPosition);
        pdf.text('Score', 160, yPosition);

        yPosition += 10;

        // Table data
        exportData.slice(0, 15).forEach((assessment, index) => { // Limit to 15 entries to fit on page
          pdf.text(assessment.Date, 20, yPosition);
          pdf.text(assessment['Assessment Type'].substring(0, 20), 60, yPosition);
          pdf.text(assessment['Stress Level'], 120, yPosition);
          pdf.text(String(assessment.Score), 160, yPosition);
          yPosition += 15;
        });

        if (assessmentHistory.length > 15) {
          pdf.text(`... and ${assessmentHistory.length - 15} more assessments`, 20, yPosition + 10);
        }

        // Footer
        pdf.setFontSize(8);
        pdf.text('Generated by MStress Mental Health Platform', 20, 280);

        pdf.save(`assessment-report-${new Date().toISOString().split('T')[0]}.pdf`);
        toast.success('PDF report downloaded successfully');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error(`Failed to export ${format.toUpperCase()} file`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
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
                onClick={refreshDashboardData}
                className="btn-secondary flex items-center"
                disabled={loading}
                title="Refresh dashboard data"
              >
                <ArrowPathIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <Link to="/assessment" className="btn-primary">New Assessment</Link>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-600">{user?.name || 'User'}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
                  title="Logout"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name || 'User'}!
          </h1>
          <p className="text-gray-600">
            Track your mental health journey and view your assessment insights.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-50 mr-4">
                <ClipboardDocumentListIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Assessments</p>
                <p className="text-2xl font-bold text-gray-900">{assessmentHistory.length}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-50 mr-4">
                <ArrowTrendingDownIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600">Current Stress Level</p>
                <div className="flex items-center">
                  <p className="text-2xl font-bold text-gray-900 mr-2">
                    {stressData[stressData.length - 1]?.level || 'N/A'}
                  </p>
                  {(() => {
                    const trend = getStressTrend();
                    const TrendIcon = trend.icon;
                    return (
                      <div className={`flex items-center ${trend.color}`} title={`Stress trend: ${trend.trend}`}>
                        <TrendIcon className="h-5 w-5" />
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-purple-50 mr-4">
                <ChartBarIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Average Score</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stressData.length > 0
                    ? Math.round(stressData.reduce((acc, curr) => acc + (curr.score || 0), 0) / stressData.length)
                    : 'N/A'
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-orange-50 mr-4">
                <CalendarIcon className="h-8 w-8 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Last Assessment</p>
                <p className="text-2xl font-bold text-gray-900">
                  {assessmentHistory[0]?.date ? new Date(assessmentHistory[0].date).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Stress Trend Chart */}
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Stress Level Trends</h3>
              <ChartBarIcon className="h-6 w-6 text-gray-400" />
            </div>

            {stressData.length > 0 ? (
              <div className="mb-6">
                <Line
                  data={{
                    labels: stressData.map(data => data.date),
                    datasets: [
                      {
                        label: 'Stress Score',
                        data: stressData.map(data => data.score),
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: 'rgb(59, 130, 246)',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 6,
                        pointHoverRadius: 8,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                      tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: 'rgb(59, 130, 246)',
                        borderWidth: 1,
                        callbacks: {
                          label: function(context) {
                            const dataIndex = context.dataIndex;
                            const level = stressData[dataIndex]?.level || 'Unknown';
                            return `Score: ${context.parsed.y} (${level})`;
                          }
                        }
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                          color: 'rgba(0, 0, 0, 0.1)',
                        },
                        ticks: {
                          color: '#6B7280',
                        },
                      },
                      x: {
                        grid: {
                          color: 'rgba(0, 0, 0, 0.1)',
                        },
                        ticks: {
                          color: '#6B7280',
                        },
                      },
                    },
                  }}
                  height={200}
                />
              </div>
            ) : (
              <div className="text-center py-8">
                <ChartBarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No assessment data available yet.</p>
                <p className="text-sm text-gray-400">Take your first assessment to see trends.</p>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-gray-200">
              <Link to="/assessment" className="btn-primary w-full">
                Take New Assessment
              </Link>
            </div>
          </div>

          {/* Assessment History */}
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Recent Assessments</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => exportData('csv')}
                  className="btn-secondary text-sm"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                  CSV
                </button>
                <button
                  onClick={() => exportData('pdf')}
                  className="btn-secondary text-sm"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                  PDF
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {assessmentHistory.map((assessment) => (
                <div key={assessment.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900">{assessment.type}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStressLevelColor(assessment.stressLevel)}`}>
                      {assessment.stressLevel}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>{new Date(assessment.date).toLocaleDateString()}</span>
                    <span>Score: {assessment.score || assessment.stressScore || 'N/A'}/100</span>
                  </div>
                  <div className="mt-3">
                    <Link
                      to={`/results/${assessment.id}`}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <Link to="/assessment" className="text-blue-600 hover:text-blue-700 font-medium">
                View All Assessments →
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className="mt-8">
          <div className="card">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Wellness Tools</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Link to="/mindfulness" className="bg-blue-50 rounded-lg p-6 hover:bg-blue-100 transition-colors block">
                <div className="flex items-center mb-4">
                  <HeartIcon className="h-6 w-6 text-blue-600 mr-2" />
                  <h4 className="font-semibold text-blue-900">Mindfulness</h4>
                </div>
                <p className="text-blue-800 text-sm mb-4">
                  Discover personalized mindfulness techniques and meditation practices based on your assessments.
                </p>
                <span className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  Start Practice →
                </span>
              </Link>

              <Link to="/exercises" className="bg-green-50 rounded-lg p-6 hover:bg-green-100 transition-colors block">
                <div className="flex items-center mb-4">
                  <ArrowTrendingUpIcon className="h-6 w-6 text-green-600 mr-2" />
                  <h4 className="font-semibold text-green-900">Exercise</h4>
                </div>
                <p className="text-green-800 text-sm mb-4">
                  Explore calming exercises and mental wellness techniques to help manage stress.
                </p>
                <span className="text-green-600 hover:text-green-700 text-sm font-medium">
                  Get Started →
                </span>
              </Link>

              <Link to="/find-help" className="bg-purple-50 rounded-lg p-6 hover:bg-purple-100 transition-colors block">
                <div className="flex items-center mb-4">
                  <UserIcon className="h-6 w-6 text-purple-600 mr-2" />
                  <h4 className="font-semibold text-purple-900">Find Help</h4>
                </div>
                <p className="text-purple-800 text-sm mb-4">
                  Locate nearby mental health professionals and support resources in your area.
                </p>
                <span className="text-purple-600 hover:text-purple-700 text-sm font-medium">
                  Find Help →
                </span>
              </Link>

              <Link to="/assessment" className="bg-orange-50 rounded-lg p-6 hover:bg-orange-100 transition-colors block">
                <div className="flex items-center mb-4">
                  <ClipboardDocumentListIcon className="h-6 w-6 text-orange-600 mr-2" />
                  <h4 className="font-semibold text-orange-900">New Assessment</h4>
                </div>
                <p className="text-orange-800 text-sm mb-4">
                  Take another assessment to track your progress and get updated insights.
                </p>
                <span className="text-orange-600 hover:text-orange-700 text-sm font-medium">
                  Start Assessment →
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
