// This file displays the user dashboard with assessment history, trends, and statistics.
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
  ArrowPathIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../App';
import axios from 'axios';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
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
  const [recommendations, setRecommendations] = useState(null);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);

  // Function to get user-friendly assessment type name
  const getAssessmentTypeName = (type) => {
    const typeMap = {
      'standard': 'Standard Questionnaire Assessment',
      'advanced': 'Advanced Stress Assessment',
      'detailed_stress': 'Detailed Stress Analysis',
      'multi_modal': 'Multi-Modal Stress Assessment',
      'anxiety': 'Anxiety Screening Tool',
      'wellbeing': 'General Wellbeing Check',
      'comprehensive_stress': 'Detailed Stress Analysis', // Legacy name mapping
      'comprehensive': 'Detailed Stress Analysis', // Legacy name mapping
      'detailed': 'Detailed Stress Analysis', // Legacy name mapping
      'stress_assessment': 'Advanced Stress Assessment' // Legacy name mapping
    };
    return typeMap[type] || type;
  };

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
        const userData = localStorage.getItem('user');

        if (!token || !userData) {
          navigate('/login');
          return;
        }

        const parsedUser = JSON.parse(userData);
        const userId = parsedUser.id || parsedUser._id;

        // Fetch user assessments
        const response = await axios.get(`/api/assessments/user/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const assessments = response.data.assessments || [];
        setAssessmentHistory(assessments);

        // Transform assessment data for chart
        const chartData = assessments.map(assessment => ({
          date: new Date(assessment.date).toLocaleDateString(),
          score: assessment.score || 0,
          level: assessment.level || 'Unknown'
        })).reverse(); // Show chronological order

        setStressData(chartData);
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

  // Fetch recommendations
  const fetchRecommendations = async () => {
    try {
      setRecommendationsLoading(true);
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');

      if (!token || !userData) {
        return;
      }

      const parsedUser = JSON.parse(userData);
      const userId = parsedUser.id || parsedUser._id;

      const response = await axios.get(`/api/recommendations/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setRecommendations(response.data.recommendations);
      }
    } catch (error) {
      console.warn('Error fetching recommendations:', error);
    } finally {
      setRecommendationsLoading(false);
    }
  };

  // Initial data fetch and setup for real-time updates
  useEffect(() => {
    fetchUserData();
    fetchRecommendations();

    // Listen for assessment completion events
    const handleAssessmentComplete = () => {
      // Immediate refresh for demo
      fetchUserData();
      fetchRecommendations();
      
      // Also refresh after delay to catch any late saves
      setTimeout(() => {
        fetchUserData();
        fetchRecommendations();
      }, 500);
    };

    // Listen for page visibility changes (when user returns to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchUserData();
        fetchRecommendations();
      }
    };

    // Add event listener for custom assessment completion event
    window.addEventListener('assessmentCompleted', handleAssessmentComplete);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      window.removeEventListener('assessmentCompleted', handleAssessmentComplete);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
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
    // Handle undefined, null, or empty values
    if (!level || typeof level !== 'string') {
      return 'text-gray-600 bg-gray-100';
    }

    switch (level.toLowerCase().trim()) {
      case 'low': return 'text-purple-600 bg-purple-100';
      case 'moderate': return 'text-blue-600 bg-blue-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStressLevelIcon = (level) => {
    // Handle undefined, null, or empty values
    if (!level || typeof level !== 'string') {
      return <ClockIcon className="h-5 w-5" />;
    }

    switch (level.toLowerCase().trim()) {
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
          pdf.setFont('helvetica', 'bold');
          pdf.text('MStress Assessment Report', 105, 30, { align: 'center' });
          
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'normal');
          pdf.text('No assessment data available', 105, 60, { align: 'center' });
          pdf.text('Complete an assessment to generate a detailed report.', 105, 75, { align: 'center' });
          
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'italic');
          pdf.text(
            'Generated by MStress Mental Health Platform',
            105,
            pdf.internal.pageSize.height - 10,
            { align: 'center' }
          );
          
          pdf.save('assessment-report-template.pdf');
          toast.success('Empty PDF template downloaded');
        }
        return;
      }

      // Prepare data for export
      const exportData = assessmentHistory.map(assessment => ({
        Date: new Date(assessment.date).toLocaleDateString(),
        'Assessment Type': assessment.type || assessment.assessmentType || 'N/A',
        'Stress Level': assessment.stressLevel || assessment.level || 'N/A',
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
        // Generate PDF with proper formatting
        const pdf = new jsPDF();

        // Header
        pdf.setFontSize(20);
        pdf.setFont('helvetica', 'bold');
        pdf.text('MStress Assessment Report', 105, 20, { align: 'center' });

        // User info section
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Generated for: ${user?.name || 'User'}`, 20, 40);
        pdf.text(`Report Date: ${new Date().toLocaleDateString()}`, 20, 50);
        pdf.text(`Total Assessments: ${assessmentHistory.length}`, 20, 60);

        // Summary statistics
        const avgScore = stressData.length > 0
          ? Math.round(stressData.reduce((acc, curr) => acc + (curr.score || 0), 0) / stressData.length)
          : 'N/A';
        pdf.text(`Average Stress Score: ${String(avgScore)}`, 20, 70);

        const latestLevel = assessmentHistory[0]?.stressLevel || assessmentHistory[0]?.level || 'N/A';
        pdf.text(`Current Stress Level: ${String(latestLevel)}`, 20, 80);

        // Assessment history table using autoTable
        const tableData = exportData.map(assessment => [
          String(assessment.Date || 'N/A'),
          String(assessment['Assessment Type'] || 'N/A'),
          String(assessment['Stress Level'] || 'N/A'),
          String(assessment.Score || 'N/A')
        ]);

        pdf.autoTable({
          head: [['Date', 'Assessment Type', 'Stress Level', 'Score']],
          body: tableData,
          startY: 95,
          theme: 'grid',
          headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
          styles: { fontSize: 10, cellPadding: 5 },
          alternateRowStyles: { fillColor: [245, 247, 250] },
          margin: { top: 95, left: 20, right: 20 }
        });

        // Footer
        const pageCount = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          pdf.setPage(i);
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'italic');
          pdf.text(
            'Generated by MStress Mental Health Platform',
            105,
            pdf.internal.pageSize.height - 10,
            { align: 'center' }
          );
          pdf.text(
            `Page ${i} of ${pageCount}`,
            pdf.internal.pageSize.width - 20,
            pdf.internal.pageSize.height - 10,
            { align: 'right' }
          );
        }

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
                <Link
                  to="/profile"
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                  title="Profile Settings"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </Link>
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

        {/* Stress Trends and Recent Assessments - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
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
                    <h4 className="font-medium text-gray-900">{getAssessmentTypeName(assessment.type)}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStressLevelColor(assessment.level || assessment.stressLevel)}`}>
                      {assessment.level || assessment.stressLevel || 'Unknown'}
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

        {/* Personalized Recommendations Section */}
        {assessmentHistory.length > 0 && recommendations && (
          <div className="card mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <SparklesIcon className="h-6 w-6 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">Personalized Recommendations</h3>
              </div>
            </div>

            <div className="space-y-4">
              {/* Immediate Actions Preview */}
              {recommendations.immediateActions && recommendations.immediateActions.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Immediate Actions</h4>
                  <p className="text-gray-700 text-sm">
                    {recommendations.immediateActions[0]}
                  </p>
                </div>
              )}

              {/* Weekly Practices Preview */}
              {recommendations.weeklyPractices && recommendations.weeklyPractices.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Weekly Practices</h4>
                  <p className="text-gray-700 text-sm">
                    {recommendations.weeklyPractices[0]}
                  </p>
                </div>
              )}

              {/* Summary */}
              {recommendations.summary && (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="text-gray-800 text-sm italic">{recommendations.summary}</p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <Link to="/recommendations" className="btn-primary w-full">
                View Full Recommendations
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default DashboardPage;
