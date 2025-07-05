import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { clearCart } = useCart();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    clearCart();
    logout();
    navigate('/auth');
  };

  const menuItems = [
    {
      id: 'credits',
      title: 'Manage Credits',
      description: 'Add credits or view transaction history',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
        </svg>
      ),
      action: () => navigate('/credits'),
      showArrow: true
    },
    {
      id: 'orders',
      title: 'Order History',
      description: 'View your past and active orders',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
        </svg>
      ),
      action: () => navigate('/orders'),
      showArrow: true
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Manage your notification preferences',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      ),
      action: () => console.log('Notifications'),
      showArrow: true
    },
    {
      id: 'help',
      title: 'Help & Support',
      description: 'Get help or contact support',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      ),
      action: () => console.log('Help'),
      showArrow: true
    },
    {
      id: 'about',
      title: 'About Bite Club',
      description: 'App version and information',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      ),
      action: () => console.log('About'),
      showArrow: true
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="flex items-center justify-between p-4">
          <button 
            onClick={() => navigate('/')}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h1 className="text-lg font-bold text-gray-900">Profile</h1>
          
          <div className="w-6"></div> {/* Spacer */}
        </div>
      </div>

      {/* Profile Header */}
      <div className="bg-white border-b">
        <div className="p-6">
          <div className="flex items-center">
            {/* Profile Avatar */}
            <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {user?.firstName ? user.firstName[0].toUpperCase() : user?.email[0].toUpperCase()}
              </span>
            </div>
            
            <div className="ml-4 flex-1">
              <h2 className="text-xl font-bold text-gray-900">
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}` 
                  : user?.email
                }
              </h2>
              <p className="text-gray-600">{user?.email}</p>
              <p className="text-sm text-gray-500">{user?.school?.name || 'Student'}</p>
            </div>
          </div>
          
          {/* Credit Balance */}
          <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-green-800">Credit Balance</h3>
                <p className="text-sm text-green-600">Available for orders</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">${Number(user?.creditBalance || 0).toFixed(2)}</p>
                <button 
                  onClick={() => navigate('/credits')}
                  className="text-sm text-green-600 hover:text-green-700 font-medium"
                >
                  Add Credits →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="p-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={item.action}
            className="w-full bg-white rounded-lg border p-4 flex items-center hover:bg-gray-50 transition-colors"
          >
            <div className="text-gray-600 mr-4">
              {item.icon}
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-gray-900">{item.title}</h3>
              <p className="text-sm text-gray-600">{item.description}</p>
            </div>
            {item.showArrow && (
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
              </svg>
            )}
          </button>
        ))}
      </div>

      {/* Logout Section */}
      <div className="p-4 mt-6">
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full bg-white border border-red-300 text-red-600 rounded-lg p-4 flex items-center justify-center hover:bg-red-50 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
          Sign Out
        </button>
      </div>

      {/* App Info */}
      <div className="p-4 text-center text-gray-500">
        <p className="text-sm">Bite Club v1.0.0</p>
        <p className="text-xs mt-1">Made with 🧡 for FAU students</p>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Sign Out</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to sign out? Your cart will be cleared.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom padding for navigation */}
      <div className="h-20"></div>
    </div>
  );
};

export default Profile;