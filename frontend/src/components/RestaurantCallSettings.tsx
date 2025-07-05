import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';

interface CallSettings {
  id: string;
  name: string;
  phone: string | null;
  callEnabled: boolean;
  callPhone: string | null;
  callRetries: number;
  callTimeoutSeconds: number;
}

interface CallLog {
  id: string;
  orderId: string;
  callTime: string;
  success: boolean;
  duration: number | null;
  cost: number | null;
  responseType: string | null;
  keypadResponse: string | null;
  order: {
    id: string;
    finalAmount: number;
    user: {
      firstName: string | null;
      lastName: string | null;
      email: string;
    };
  };
}

const RestaurantCallSettings: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [settings, setSettings] = useState<CallSettings | null>(null);
  const [callHistory, setCallHistory] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [stats, setStats] = useState({ totalCalls: 0, totalCost: 0 });

  useEffect(() => {
    loadCallSettings();
    loadCallHistory();
  }, []);

  const loadCallSettings = async () => {
    try {
      const response = await apiService.getCallSettings();
      setSettings(response.restaurant);
    } catch (error) {
      console.error('Error loading call settings:', error);
    }
  };

  const loadCallHistory = async () => {
    try {
      const response = await apiService.getCallHistory();
      setCallHistory(response.callLogs);
      setStats(response.stats);
    } catch (error) {
      console.error('Error loading call history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = <K extends keyof CallSettings>(
    field: K,
    value: CallSettings[K]
  ) => {
    if (settings) {
      setSettings({ ...settings, [field]: value });
      setHasChanges(true);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const response = await apiService.updateCallSettings({
        callEnabled: settings.callEnabled,
        callPhone: settings.callPhone || undefined,
        callRetries: settings.callRetries,
        callTimeoutSeconds: settings.callTimeoutSeconds
      });
      
      setSettings(response.restaurant);
      setHasChanges(false);
      alert('Call settings saved successfully!');
    } catch (error) {
      console.error('Error saving call settings:', error);
      alert('Failed to save call settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const retryCall = async (orderId: string) => {
    try {
      await apiService.retryCall(orderId);
      alert('Call retry initiated successfully!');
      loadCallHistory(); // Refresh history
    } catch (error) {
      console.error('Error retrying call:', error);
      alert('Failed to retry call. Please try again.');
    }
  };

  const formatResponseType = (responseType: string | null) => {
    switch (responseType) {
      case 'ACCEPTED': return '✅ Accepted';
      case 'REJECTED': return '❌ Rejected';
      case 'NO_ANSWER': return '📞 No Answer';
      case 'BUSY': return '📵 Busy';
      case 'FAILED': return '⚠️ Failed';
      case 'INITIATED': return '🔄 In Progress';
      default: return '❓ Unknown';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading call settings...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Settings Not Found</h2>
          <button onClick={() => navigate(-1)} className="btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between p-4">
          <div className="flex items-center">
            <button 
              onClick={() => navigate(-1)}
              className="text-gray-500 hover:text-gray-700 mr-4"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-bold text-gray-900">Call Settings</h1>
          </div>
          
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              hasChanges && !saving
                ? 'bg-primary-500 text-white hover:bg-primary-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Call Statistics */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Call Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{stats.totalCalls}</div>
              <div className="text-sm text-gray-600">Total Calls</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">${stats.totalCost.toFixed(4)}</div>
              <div className="text-sm text-gray-600">Total Cost</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                ${stats.totalCalls > 0 ? (stats.totalCost / stats.totalCalls).toFixed(4) : '0.0000'}
              </div>
              <div className="text-sm text-gray-600">Avg Cost/Call</div>
            </div>
          </div>
        </div>

        {/* Call Settings */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Automatic Order Calling</h2>
          
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Enable Automatic Calling</h3>
              <p className="text-gray-600">Automatically call when new orders are received</p>
            </div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.callEnabled}
                onChange={(e) => handleSettingChange('callEnabled', e.target.checked)}
                className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                {settings.callEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </label>
          </div>

          {settings.callEnabled && (
            <div className="space-y-6">
              {/* Phone Number Settings */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order Call Phone Number
                </label>
                <input
                  type="tel"
                  value={settings.callPhone || ''}
                  onChange={(e) => handleSettingChange('callPhone', e.target.value)}
                  placeholder={settings.phone || 'Enter phone number for order calls'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Leave blank to use your main restaurant phone: {settings.phone || 'Not set'}
                </p>
              </div>

              {/* Retry Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Retry Attempts
                  </label>
                  <select
                    value={settings.callRetries}
                    onChange={(e) => handleSettingChange('callRetries', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value={0}>No retries</option>
                    <option value={1}>1 retry</option>
                    <option value={2}>2 retries</option>
                    <option value={3}>3 retries</option>
                    <option value={4}>4 retries</option>
                    <option value={5}>5 retries</option>
                  </select>
                  <p className="text-sm text-gray-500 mt-1">
                    How many times to retry if call fails
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Call Timeout (seconds)
                  </label>
                  <select
                    value={settings.callTimeoutSeconds}
                    onChange={(e) => handleSettingChange('callTimeoutSeconds', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value={15}>15 seconds</option>
                    <option value={20}>20 seconds</option>
                    <option value={30}>30 seconds</option>
                    <option value={45}>45 seconds</option>
                    <option value={60}>60 seconds</option>
                    <option value={90}>90 seconds</option>
                    <option value={120}>120 seconds</option>
                  </select>
                  <p className="text-sm text-gray-500 mt-1">
                    How long to wait for answer before hanging up
                  </p>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">📞 How It Works:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• When a new order arrives, we'll automatically call your restaurant</li>
                  <li>• Press <strong>1</strong> to accept the order (customer will be notified)</li>
                  <li>• Press <strong>2</strong> to reject the order (customer will be refunded)</li>
                  <li>• Press <strong>3</strong> to hear the order details again</li>
                  <li>• Press <strong>0</strong> to connect with support</li>
                  <li>• If no response, the order remains pending in your dashboard</li>
                </ul>
              </div>

              {/* Cost Information */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-2">💰 Call Costs:</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• Each call costs approximately $0.01-0.02 per call</li>
                  <li>• You'll only be charged for completed calls</li>
                  <li>• Failed or unanswered calls have minimal/no cost</li>
                  <li>• All costs are tracked and displayed in your dashboard</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Call History */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Call History</h2>
          
          {callHistory.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No calls made yet.</p>
              <p className="text-sm text-gray-500 mt-1">Call history will appear here once orders start coming in.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Order</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Customer</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Call Time</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Response</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Cost</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {callHistory.map((call) => (
                    <tr key={call.id} className="border-b border-gray-100">
                      <td className="py-3 px-4">
                        <span className="font-mono text-sm">#{call.order.id.slice(-6)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">
                            {call.order.user.firstName} {call.order.user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{call.order.user.email}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium">${call.order.finalAmount.toFixed(2)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          {new Date(call.callTime).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(call.callTime).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm">{formatResponseType(call.responseType)}</span>
                        {call.duration && (
                          <div className="text-xs text-gray-500">{call.duration}s</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm font-mono">
                          {call.cost ? `$${call.cost.toFixed(4)}` : '$0.0000'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {(call.responseType === 'FAILED' || call.responseType === 'NO_ANSWER') && (
                          <button
                            onClick={() => retryCall(call.order.id)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Retry
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Save Changes Reminder */}
        {hasChanges && (
          <div className="fixed bottom-4 right-4 bg-primary-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span>You have unsaved changes</span>
            <button
              onClick={handleSave}
              className="bg-white text-primary-500 px-3 py-1 rounded font-medium hover:bg-gray-100 transition-colors"
            >
              Save Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantCallSettings;