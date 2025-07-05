import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';

interface Restaurant {
  id: string;
  name: string;
  phone: string | null;
  callEnabled: boolean;
  callPhone: string | null;
  callRetries: number;
  callTimeoutSeconds: number;
  school: {
    name: string;
    domain: string;
  };
}

interface CallAnalytics {
  overall: {
    totalCalls: number;
    totalCost: number;
    totalDuration: number;
  };
  responseTypes: Array<{
    type: string;
    count: number;
  }>;
  restaurantBreakdown: Array<{
    restaurantId: string;
    callCount: number;
    totalCost: number;
  }>;
}

const AdminCallDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [analytics, setAnalytics] = useState<CallAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      navigate('/');
      return;
    }
    loadData();
  }, [user, navigate, selectedPeriod]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Calculate date range based on selected period
      const endDate = new Date();
      const startDate = new Date();
      
      switch (selectedPeriod) {
        case '1d':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
        default:
          startDate.setDate(startDate.getDate() - 7);
      }

      const [restaurantsResponse, analyticsResponse] = await Promise.all([
        apiService.getAdminCallRestaurants(),
        apiService.getAdminCallAnalytics(
          startDate.toISOString(),
          endDate.toISOString()
        )
      ]);

      setRestaurants(restaurantsResponse.restaurants);
      setAnalytics(analyticsResponse);
    } catch (error) {
      console.error('Error loading call dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = async (
    restaurantId: string,
    field: keyof Restaurant,
    value: any
  ) => {
    try {
      setSaving(restaurantId);
      
      const restaurant = restaurants.find(r => r.id === restaurantId);
      if (!restaurant) return;

      const settings = {
        callEnabled: field === 'callEnabled' ? value : restaurant.callEnabled,
        callPhone: field === 'callPhone' ? value : restaurant.callPhone,
        callRetries: field === 'callRetries' ? value : restaurant.callRetries,
        callTimeoutSeconds: field === 'callTimeoutSeconds' ? value : restaurant.callTimeoutSeconds
      };

      await apiService.updateAdminCallSettings(restaurantId, settings);
      
      // Update local state
      setRestaurants(prev => 
        prev.map(r => 
          r.id === restaurantId 
            ? { ...r, [field]: value }
            : r
        )
      );
      
    } catch (error) {
      console.error('Error updating call settings:', error);
      alert('Failed to update settings. Please try again.');
    } finally {
      setSaving(null);
    }
  };

  const bulkUpdateCalling = async (enabled: boolean) => {
    try {
      setSaving('bulk');
      
      const updatePromises = restaurants.map(restaurant =>
        apiService.updateAdminCallSettings(restaurant.id, {
          callEnabled: enabled,
          callPhone: restaurant.callPhone || undefined,
          callRetries: restaurant.callRetries,
          callTimeoutSeconds: restaurant.callTimeoutSeconds
        })
      );

      await Promise.all(updatePromises);
      
      setRestaurants(prev => 
        prev.map(r => ({ ...r, callEnabled: enabled }))
      );
      
      alert(`Successfully ${enabled ? 'enabled' : 'disabled'} calling for all restaurants`);
    } catch (error) {
      console.error('Error bulk updating call settings:', error);
      alert('Failed to update settings. Please try again.');
    } finally {
      setSaving(null);
    }
  };

  const formatResponseType = (type: string) => {
    switch (type) {
      case 'ACCEPTED': return 'Accepted';
      case 'REJECTED': return 'Rejected';
      case 'NO_ANSWER': return 'No Answer';
      case 'BUSY': return 'Busy';
      case 'FAILED': return 'Failed';
      case 'INITIATED': return 'In Progress';
      default: return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading call dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between p-4">
          <div className="flex items-center">
            <button 
              onClick={() => navigate('/admin')}
              className="text-gray-500 hover:text-gray-700 mr-4"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-bold text-gray-900">Call Management Dashboard</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Period Selector */}
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="1d">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>

            {/* Bulk Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => bulkUpdateCalling(true)}
                disabled={saving === 'bulk'}
                className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 text-sm"
              >
                Enable All
              </button>
              <button
                onClick={() => bulkUpdateCalling(false)}
                disabled={saving === 'bulk'}
                className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 text-sm"
              >
                Disable All
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Analytics Overview */}
        {analytics && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Platform Call Analytics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {analytics.overall.totalCalls}
                </div>
                <div className="text-sm text-gray-600">Total Calls</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  ${analytics.overall.totalCost.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Total Cost</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {analytics.overall.totalDuration ? Math.round(analytics.overall.totalDuration / 60) : 0}m
                </div>
                <div className="text-sm text-gray-600">Total Duration</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  ${analytics.overall.totalCalls > 0 ? (analytics.overall.totalCost / analytics.overall.totalCalls).toFixed(4) : '0.0000'}
                </div>
                <div className="text-sm text-gray-600">Avg Cost/Call</div>
              </div>
            </div>

            {/* Response Types Breakdown */}
            {analytics.responseTypes.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Call Response Breakdown</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {analytics.responseTypes.map((response, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {response.count}
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatResponseType(response.type)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Restaurant Call Settings */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Restaurant Call Settings</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Restaurant</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">School</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Phone</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Retries</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Timeout</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {restaurants.map((restaurant) => (
                  <tr key={restaurant.id} className="border-b border-gray-100">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{restaurant.name}</div>
                      <div className="text-sm text-gray-500">ID: {restaurant.id.slice(-8)}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">{restaurant.school.name}</div>
                      <div className="text-xs text-gray-500">{restaurant.school.domain}</div>
                    </td>
                    <td className="py-3 px-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={restaurant.callEnabled}
                          onChange={(e) => handleSettingChange(restaurant.id, 'callEnabled', e.target.checked)}
                          disabled={saving === restaurant.id}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <span className={`ml-2 text-sm ${restaurant.callEnabled ? 'text-green-600' : 'text-gray-500'}`}>
                          {restaurant.callEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </label>
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="tel"
                        value={restaurant.callPhone || ''}
                        onChange={(e) => handleSettingChange(restaurant.id, 'callPhone', e.target.value)}
                        placeholder={restaurant.phone || 'No phone'}
                        disabled={saving === restaurant.id}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={restaurant.callRetries}
                        onChange={(e) => handleSettingChange(restaurant.id, 'callRetries', parseInt(e.target.value))}
                        disabled={saving === restaurant.id}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                      >
                        {[0, 1, 2, 3, 4, 5].map(num => (
                          <option key={num} value={num}>{num}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={restaurant.callTimeoutSeconds}
                        onChange={(e) => handleSettingChange(restaurant.id, 'callTimeoutSeconds', parseInt(e.target.value))}
                        disabled={saving === restaurant.id}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                      >
                        {[15, 20, 30, 45, 60, 90, 120].map(seconds => (
                          <option key={seconds} value={seconds}>{seconds}s</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      {saving === restaurant.id ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500"></div>
                          <span className="ml-2 text-sm text-gray-500">Saving...</span>
                        </div>
                      ) : (
                        <span className="text-sm text-green-600">✓ Saved</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {restaurants.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-600">No restaurants found.</p>
              </div>
            )}
          </div>
        </div>

        {/* Platform Usage Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">📊 Platform Call Usage</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
            <div>
              <strong>Enabled Restaurants:</strong> {restaurants.filter(r => r.callEnabled).length} / {restaurants.length}
            </div>
            <div>
              <strong>Average Success Rate:</strong> {
                analytics && analytics.overall.totalCalls > 0 
                  ? Math.round((analytics.responseTypes.find(r => r.type === 'ACCEPTED')?.count || 0) / analytics.overall.totalCalls * 100)
                  : 0
              }%
            </div>
            <div>
              <strong>Cost Per Restaurant:</strong> ${
                analytics && restaurants.length > 0 
                  ? (analytics.overall.totalCost / restaurants.filter(r => r.callEnabled).length).toFixed(2)
                  : '0.00'
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCallDashboard;