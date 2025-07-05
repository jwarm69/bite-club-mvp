import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useOrder } from '../contexts/OrderContext';
import RestaurantOrderManagerEmbedded from '../components/RestaurantOrderManagerEmbedded';

const RestaurantDashboard: React.FC = () => {
  const { logout } = useAuth();
  const { activeOrderCount, refreshOrderCount } = useOrder();
  const navigate = useNavigate();
  
  // Check for admin impersonation
  const adminImpersonation = localStorage.getItem('adminImpersonation');
  const isAdminView = adminImpersonation && JSON.parse(adminImpersonation).type === 'restaurant';

  const exitAdminView = () => {
    localStorage.removeItem('adminImpersonation');
    navigate('/admin');
  };

  // Initial load and periodic refresh
  useEffect(() => {
    refreshOrderCount();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(refreshOrderCount, 30000);
    
    return () => clearInterval(interval);
  }, [refreshOrderCount]);
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Impersonation Banner */}
      {isAdminView && (
        <div className="bg-purple-600 text-white px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="font-medium">Admin View: Managing Restaurant Dashboard</span>
              <span className="bg-purple-700 px-2 py-1 rounded text-sm">Full Access</span>
            </div>
            <button
              onClick={exitAdminView}
              className="flex items-center space-x-2 bg-purple-700 hover:bg-purple-800 px-3 py-1 rounded transition-colors"
            >
              <span className="text-sm">Exit Admin View</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Top Navigation */}
      <nav className="bg-white shadow-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">BC</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Bite Club</h1>
                  <p className="text-sm text-gray-500 -mt-1">Restaurant Portal</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="hidden md:flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">Campus Pizza Palace</p>
                  <p className="text-xs text-gray-500">Restaurant Manager</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="text-sm font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Secondary Navigation */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-1">
            <button className="flex items-center space-x-3 px-6 py-4 border-b-3 border-orange-500 text-orange-600 bg-orange-50 font-semibold text-sm transition-all duration-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <span>Active Orders</span>
              {activeOrderCount > 0 && (
                <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                  {activeOrderCount}
                </span>
              )}
            </button>
            <button 
              onClick={() => navigate('/restaurant/completed')}
              className="flex items-center space-x-3 px-6 py-4 border-b-3 border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50 font-medium text-sm transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              <span>Completed Orders</span>
            </button>
            <button 
              onClick={() => navigate('/restaurant/menu')}
              className="flex items-center space-x-3 px-6 py-4 border-b-3 border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50 font-medium text-sm transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span>Menu</span>
            </button>
            <button 
              onClick={() => navigate('/restaurant/promotions')}
              className="flex items-center space-x-3 px-6 py-4 border-b-3 border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50 font-medium text-sm transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <span>Promotions</span>
            </button>
            <button 
              onClick={() => navigate('/restaurant/hours')}
              className="flex items-center space-x-3 px-6 py-4 border-b-3 border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50 font-medium text-sm transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Hours</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Main Content - Show Orders by Default */}
      <RestaurantOrderManagerEmbedded />
    </div>
  );
};

export default RestaurantDashboard;