import React, { useState } from 'react';
import { useAuth } from '../../App';
import { Navigate } from 'react-router-dom';
import AnalyticsCharts from '../../components/admin/AnalyticsCharts';
import UserManagement from '../../components/admin/UserManagement';
import {
  ChartBarIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  CogIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('analytics');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Check if user is admin
  if (!user || user.role !== 'admin') {
    return <Navigate to="/admin/login" replace />;
  }

  const navigation = [
    {
      name: 'Analytics Overview',
      id: 'analytics',
      icon: ChartBarIcon,
      description: 'Platform metrics and user insights'
    },
    {
      name: 'User Management',
      id: 'users',
      icon: UsersIcon,
      description: 'Manage user accounts and permissions'
    },
    {
      name: 'Assessment Data',
      id: 'assessments',
      icon: ClipboardDocumentListIcon,
      description: 'View and export assessment data'
    },
    {
      name: 'System Monitoring',
      id: 'system',
      icon: CogIcon,
      description: 'Platform health and performance'
    }
  ];

  const handleLogout = () => {
    logout();
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'analytics':
        return <AnalyticsCharts />;
      case 'users':
        return <UserManagement />;
      case 'assessments':
        return <AssessmentData />;
      case 'system':
        return <SystemMonitoring />;
      default:
        return <AnalyticsCharts />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex flex-col w-64 bg-white shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Admin Panel</h2>
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
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <ChartBarIcon className="h-5 w-5 text-white" />
              </div>
              <div className="ml-3">
                <h2 className="text-lg font-semibold text-gray-900">MStress Admin</h2>
                <p className="text-xs text-gray-500">Dashboard</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-start px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === item.id
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className="mr-3 h-5 w-5 mt-0.5 flex-shrink-0" />
                <div className="text-left">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{item.description}</div>
                </div>
              </button>
            ))}
          </nav>

          {/* User info and logout */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center mb-3">
              <div className="h-8 w-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user.name?.charAt(0)?.toUpperCase() || 'A'}
                </span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <ArrowLeftOnRectangleIcon className="mr-3 h-5 w-5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
              <div className="ml-4 lg:ml-0">
                <h1 className="text-2xl font-semibold text-gray-900">
                  {navigation.find(item => item.id === activeTab)?.name || 'Dashboard'}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {navigation.find(item => item.id === activeTab)?.description || 'Admin dashboard overview'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-500">
                <span>Welcome back,</span>
                <span className="font-medium text-gray-900">{user.name}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

// Placeholder components for other tabs
const AssessmentData = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-xl font-semibold text-gray-900 mb-4">Assessment Data</h2>
    <p className="text-gray-600">Assessment data management functionality will be implemented here.</p>
    <div className="mt-4 p-4 bg-green-50 rounded-lg">
      <p className="text-green-800 text-sm">
        <strong>Coming Soon:</strong> View user assessment history, export data to CSV/PDF, generate reports, and analyze assessment trends.
      </p>
    </div>
  </div>
);

const SystemMonitoring = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-xl font-semibold text-gray-900 mb-4">System Monitoring</h2>
    <p className="text-gray-600">System monitoring functionality will be implemented here.</p>
    <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
      <p className="text-yellow-800 text-sm">
        <strong>Coming Soon:</strong> Platform usage statistics, error logs, performance metrics, and system health monitoring.
      </p>
    </div>
  </div>
);

export default AdminDashboard;
