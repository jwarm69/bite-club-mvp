import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface RestaurantEditModalProps {
  restaurant: any;
  onClose: () => void;
  onSave: (data: { name: string; description?: string; phone?: string; email?: string }) => void;
}

const RestaurantEditModal: React.FC<RestaurantEditModalProps> = ({ restaurant, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: restaurant.name || '',
    description: restaurant.description || '',
    phone: restaurant.phone || '',
    email: restaurant.email || ''
  });

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Restaurant name is required');
      return;
    }

    setSaving(true);
    try {
      await onSave(formData);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Edit Restaurant</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600"
            disabled={saving}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Restaurant Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter restaurant name"
              required
              disabled={saving}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter restaurant description"
              disabled={saving}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="(555) 123-4567"
              disabled={saving}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="restaurant@school.edu"
              disabled={saving}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'restaurants' | 'students' | 'analytics'>('overview');
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const navigate = useNavigate();

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const headers = { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        if (activeTab === 'restaurants') {
          const response = await fetch('/api/admin/restaurants', { headers });
          if (response.ok) {
            const data = await response.json();
            setRestaurants(data);
          } else {
            // Fallback to mock data
            setRestaurants([
              { id: '1', name: 'Paper Bag Deli', status: 'active', revenue: 2450.75, school: 'University of Florida' },
              { id: '2', name: 'Primo Hoagies', status: 'active', revenue: 1890.25, school: 'University of Florida' },
              { id: '3', name: 'Campus Pizza Palace', status: 'pending', revenue: 0, school: 'University of Florida' }
            ]);
          }
        } else if (activeTab === 'students') {
          const response = await fetch('/api/admin/students', { headers });
          if (response.ok) {
            const data = await response.json();
            setStudents(data);
          } else {
            // Fallback to mock data
            setStudents([
              { id: '1', name: 'John Doe', email: 'john@ufl.edu', creditBalance: '125.50', totalOrders: 15 },
              { id: '2', name: 'Jane Smith', email: 'jane@ufl.edu', creditBalance: '89.25', totalOrders: 8 },
              { id: '3', name: 'Mike Johnson', email: 'mike@ufl.edu', creditBalance: '200.00', totalOrders: 22 }
            ]);
          }
        } else if (activeTab === 'analytics') {
          const response = await fetch('/api/admin/analytics/revenue', { headers });
          if (response.ok) {
            const data = await response.json();
            setRevenueData(data);
          } else {
            // Fallback to mock data
            setRevenueData({
              totalRevenue: 15750.50,
              totalOrders: 135,
              byRestaurant: [
                { name: 'Paper Bag Deli', revenue: 2450.75, orders: 45 },
                { name: 'Primo Hoagies', revenue: 1890.25, orders: 32 },
                { name: 'Campus Pizza Palace', revenue: 3210.50, orders: 58 }
              ],
              bySchool: [
                { name: 'University of Florida', revenue: 12850.75, uniqueStudents: 450 }
              ]
            });
          }
        }
      } catch (error) {
        console.error('Error fetching admin data:', error);
        // Use fallback mock data on error
      } finally {
        setLoading(false);
      }
    };

    if (activeTab !== 'overview') {
      fetchData();
    }
  }, [activeTab]);

  const impersonateRestaurant = (restaurantId: string) => {
    // Store admin context and navigate to restaurant view
    localStorage.setItem('adminImpersonation', JSON.stringify({ type: 'restaurant', id: restaurantId }));
    navigate('/restaurant');
  };

  const impersonateStudent = (studentId: string) => {
    // Store admin context and navigate to student view
    localStorage.setItem('adminImpersonation', JSON.stringify({ type: 'student', id: studentId }));
    navigate('/student');
  };

  const exitImpersonation = () => {
    localStorage.removeItem('adminImpersonation');
    navigate('/admin');
  };

  const addCreditsToStudent = async (studentId: string, amount: number, reason: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/students/${studentId}/credits`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount, reason })
      });

      if (response.ok) {
        // Refresh student data
        setActiveTab('students');
        alert(`Successfully added $${amount} to student account`);
      } else {
        alert('Failed to add credits');
      }
    } catch (error) {
      console.error('Error adding credits:', error);
      alert('Error adding credits');
    }
  };

  const updateRestaurantStatus = async (restaurantId: string, active: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/restaurants/${restaurantId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ active })
      });

      if (response.ok) {
        // Refresh restaurant data by updating the specific restaurant in the list
        setRestaurants(prev => prev.map(restaurant => 
          restaurant.id === restaurantId 
            ? { ...restaurant, status: active ? 'active' : 'inactive' }
            : restaurant
        ));
        alert(`Restaurant ${active ? 'approved' : 'deactivated'} successfully`);
      } else {
        alert('Failed to update restaurant status');
      }
    } catch (error) {
      console.error('Error updating restaurant status:', error);
      alert('Error updating restaurant status');
    }
  };

  const openEditModal = async (restaurantId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/restaurants/${restaurantId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setEditingRestaurant(data.restaurant);
        setShowEditModal(true);
      } else {
        alert('Failed to load restaurant details');
      }
    } catch (error) {
      console.error('Error loading restaurant:', error);
      alert('Error loading restaurant details');
    }
  };

  const updateRestaurantDetails = async (restaurantData: {
    name: string;
    description?: string;
    phone?: string;
    email?: string;
  }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/restaurants/${editingRestaurant.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(restaurantData)
      });

      if (response.ok) {
        // Update the restaurant in the list
        setRestaurants(prev => prev.map(restaurant => 
          restaurant.id === editingRestaurant.id 
            ? { ...restaurant, name: restaurantData.name }
            : restaurant
        ));
        setShowEditModal(false);
        setEditingRestaurant(null);
        alert('Restaurant updated successfully!');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to update restaurant');
      }
    } catch (error) {
      console.error('Error updating restaurant:', error);
      alert('Error updating restaurant');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Navigation Bar */}
      <nav className="bg-white shadow-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">BC</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Bite Club</h1>
                  <p className="text-sm text-purple-600 -mt-1">Admin Portal</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="hidden md:flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">System Administrator</p>
                  <p className="text-xs text-gray-500">Full Access</p>
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

      {/* Admin Tab Navigation */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-1">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'restaurants', label: 'Restaurants', icon: '🏪' },
              { id: 'students', label: 'Students', icon: '👥' },
              { id: 'analytics', label: 'Revenue Analytics', icon: '💰' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-3 px-6 py-4 border-b-3 font-semibold text-sm transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600 bg-purple-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Admin Dashboard Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">$15,750.50</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 text-xl">💰</span>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Active Restaurants</p>
                    <p className="text-2xl font-bold text-gray-900">8</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 text-xl">🏪</span>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Total Students</p>
                    <p className="text-2xl font-bold text-gray-900">450</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-purple-600 text-xl">👥</span>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Total Orders</p>
                    <p className="text-2xl font-bold text-gray-900">1,234</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <span className="text-orange-600 text-xl">📦</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div 
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setActiveTab('restaurants')}
              >
                <h3 className="text-lg font-semibold mb-2 text-center">🏪 Restaurant Management</h3>
                <p className="text-gray-600 text-center">View, manage, and impersonate restaurant accounts</p>
              </div>
              <div 
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setActiveTab('students')}
              >
                <h3 className="text-lg font-semibold mb-2 text-center">👥 Student Management</h3>
                <p className="text-gray-600 text-center">View student accounts and impersonate student views</p>
              </div>
              <div 
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setActiveTab('analytics')}
              >
                <h3 className="text-lg font-semibold mb-2 text-center">📊 Revenue Analytics</h3>
                <p className="text-gray-600 text-center">Daily revenue by restaurant and school</p>
              </div>
            </div>
          </div>
        )}

        {/* Restaurants Tab */}
        {activeTab === 'restaurants' && (
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Restaurant Management</h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">All Restaurants</h3>
                <p className="text-sm text-gray-500">Click "Manage" to access restaurant dashboard as admin</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Restaurant</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">School</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {restaurants.map((restaurant) => (
                      <tr key={restaurant.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{restaurant.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{restaurant.school}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            restaurant.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {restaurant.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">${restaurant.revenue.toFixed(2)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => openEditModal(restaurant.id)}
                              className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                // Navigate to admin menu management for this restaurant
                                localStorage.setItem('adminImpersonation', JSON.stringify({ type: 'restaurant-menu', id: restaurant.id }));
                                window.open(`/restaurant/menu`, '_blank');
                              }}
                              className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors"
                            >
                              Menu
                            </button>
                            <button
                              onClick={() => {
                                // Navigate to admin hours management for this restaurant
                                const adminImpersonation = localStorage.getItem('adminImpersonation');
                                localStorage.setItem('adminImpersonation', JSON.stringify({ type: 'restaurant-hours', id: restaurant.id }));
                                window.open(`/restaurant/hours`, '_blank');
                              }}
                              className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors"
                            >
                              Hours
                            </button>
                            {restaurant.status === 'active' ? (
                              <button
                                onClick={() => {
                                  if (window.confirm(`Are you sure you want to deactivate ${restaurant.name}?`)) {
                                    updateRestaurantStatus(restaurant.id, false);
                                  }
                                }}
                                className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 transition-colors"
                              >
                                Deactivate
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  if (window.confirm(`Are you sure you want to approve ${restaurant.name}?`)) {
                                    updateRestaurantStatus(restaurant.id, true);
                                  }
                                }}
                                className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 transition-colors"
                              >
                                Approve
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Student Management</h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">All Students</h3>
                <p className="text-sm text-gray-500">Click "View As Student" to see their interface</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credit Balance</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Orders</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.map((student) => (
                      <tr key={student.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{student.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{student.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">${Number(student.creditBalance || student.credits || 0).toFixed(2)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{student.totalOrders || student.orders || 0}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => impersonateStudent(student.id)}
                            className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors"
                          >
                            View As Student
                          </button>
                          <button 
                            onClick={() => {
                              const amount = prompt('Enter credit amount:');
                              const reason = prompt('Enter reason:');
                              if (amount && reason) {
                                addCreditsToStudent(student.id, parseFloat(amount), reason);
                              }
                            }}
                            className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 transition-colors"
                          >
                            Add Credits
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && revenueData && (
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Revenue Analytics</h2>
            
            {/* Total Revenue Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Total Revenue</h3>
              <div className="text-4xl font-bold text-green-600">${(revenueData.totalRevenue || 0).toFixed(2)}</div>
              <p className="text-sm text-gray-500 mt-2">Across all restaurants and schools ({revenueData.totalOrders || 0} orders)</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue by Restaurant */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Revenue by Restaurant</h3>
                <div className="space-y-4">
                  {revenueData.byRestaurant.map((restaurant: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{restaurant.name}</div>
                        <div className="text-sm text-gray-500">{restaurant.orders} orders</div>
                      </div>
                      <div className="text-lg font-semibold text-green-600">
                        ${restaurant.revenue.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Revenue by School */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Revenue by School</h3>
                <div className="space-y-4">
                  {revenueData.bySchool.map((school: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{school.name}</div>
                        <div className="text-sm text-gray-500">{school.uniqueStudents || school.students} students</div>
                      </div>
                      <div className="text-lg font-semibold text-blue-600">
                        ${school.revenue.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Restaurant Edit Modal */}
      {showEditModal && editingRestaurant && (
        <RestaurantEditModal
          restaurant={editingRestaurant}
          onClose={() => {
            setShowEditModal(false);
            setEditingRestaurant(null);
          }}
          onSave={updateRestaurantDetails}
        />
      )}
    </div>
  );
};

export default AdminDashboard;