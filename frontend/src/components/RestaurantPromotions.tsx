import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { RestaurantPromotions as PromotionsType } from '../types';

interface PromotionsState {
  promotions: PromotionsType | null;
  loading: boolean;
  saving: boolean;
  hasChanges: boolean;
}

interface PromotionStats {
  totalFirstTimeDiscounts: number;
  totalLoyaltyRewards: number;
  activeCustomers: number;
  revenueGenerated: number;
  costToRestaurant: number;
}

const RestaurantPromotions: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [state, setState] = useState<PromotionsState>({
    promotions: null,
    loading: true,
    saving: false,
    hasChanges: false
  });

  // Mock promotions data
  const mockPromotions: PromotionsType = {
    id: 'promo_001',
    restaurantId: user?.id || 'rest_1',
    firstTimeEnabled: true,
    firstTimePercent: 20.00,
    loyaltyEnabled: true,
    loyaltySpendThreshold: 50.00,
    loyaltyRewardAmount: 10.00
  };

  // Mock analytics data
  const mockStats: PromotionStats = {
    totalFirstTimeDiscounts: 47,
    totalLoyaltyRewards: 23,
    activeCustomers: 156,
    revenueGenerated: 2840.50,
    costToRestaurant: 485.75
  };

  useEffect(() => {
    // Simulate API call to load promotions
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        promotions: mockPromotions,
        loading: false
      }));
    }, 500);
  }, []);

  const handlePromotionChange = <K extends keyof PromotionsType>(
    field: K,
    value: PromotionsType[K]
  ) => {
    setState(prev => ({
      ...prev,
      promotions: prev.promotions ? {
        ...prev.promotions,
        [field]: value
      } : null,
      hasChanges: true
    }));
  };

  const handleSave = async () => {
    if (!state.promotions) return;

    setState(prev => ({ ...prev, saving: true }));

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setState(prev => ({ 
        ...prev, 
        saving: false, 
        hasChanges: false 
      }));

      // Show success message (in a real app, you'd use a toast notification)
      alert('Promotion settings saved successfully!');
    } catch (error) {
      setState(prev => ({ ...prev, saving: false }));
      alert('Failed to save promotion settings. Please try again.');
    }
  };

  const calculateFirstTimeROI = () => {
    if (!state.promotions) return 0;
    const avgOrderValue = 15.50; // Mock average order value
    const totalRevenue = mockStats.totalFirstTimeDiscounts * avgOrderValue;
    const totalCost = mockStats.totalFirstTimeDiscounts * avgOrderValue * (state.promotions.firstTimePercent / 100);
    return ((totalRevenue - totalCost) / totalCost * 100);
  };

  const calculateLoyaltyROI = () => {
    if (!state.promotions) return 0;
    const avgRepeatOrders = 4.2; // Average repeat orders after loyalty reward
    const avgOrderValue = 15.50;
    const totalRevenue = mockStats.totalLoyaltyRewards * avgRepeatOrders * avgOrderValue;
    const totalCost = mockStats.totalLoyaltyRewards * state.promotions.loyaltyRewardAmount;
    return ((totalRevenue - totalCost) / totalCost * 100);
  };

  if (state.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading promotions...</p>
        </div>
      </div>
    );
  }

  if (!state.promotions) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Promotions Not Found</h2>
          <button onClick={() => navigate(-1)} className="btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
                onClick={() => {
                  // Get logout function from auth context
                  const authContext = { logout: () => window.location.href = '/auth' };
                  authContext.logout();
                }}
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
            <button 
              onClick={() => navigate('/restaurant')}
              className="flex items-center space-x-3 px-6 py-4 border-b-3 border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50 font-medium text-sm transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <span>Active Orders</span>
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
            <button className="flex items-center space-x-3 px-6 py-4 border-b-3 border-orange-500 text-orange-600 bg-orange-50 font-semibold text-sm transition-all duration-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <span>Promotions</span>
            </button>
            <button 
              onClick={() => navigate('/restaurant/call-settings')}
              className="flex items-center space-x-3 px-6 py-4 border-b-3 border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50 font-medium text-sm transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>Call Settings</span>
            </button>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between p-4">
          <h1 className="text-lg font-bold text-gray-900">Promotions & Discounts</h1>
          
          <button
            onClick={handleSave}
            disabled={!state.hasChanges || state.saving}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              state.hasChanges && !state.saving
                ? 'bg-primary-500 text-white hover:bg-primary-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {state.saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Analytics Overview */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Promotion Analytics</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {mockStats.totalFirstTimeDiscounts}
              </div>
              <div className="text-sm text-gray-600">First-Time Discounts</div>
              <div className="text-xs text-green-600 mt-1">
                ROI: +{calculateFirstTimeROI().toFixed(0)}%
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {mockStats.totalLoyaltyRewards}
              </div>
              <div className="text-sm text-gray-600">Loyalty Rewards</div>
              <div className="text-xs text-green-600 mt-1">
                ROI: +{calculateLoyaltyROI().toFixed(0)}%
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {mockStats.activeCustomers}
              </div>
              <div className="text-sm text-gray-600">Active Customers</div>
              <div className="text-xs text-blue-600 mt-1">
                +12% this month
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                ${mockStats.revenueGenerated.toFixed(0)}
              </div>
              <div className="text-sm text-gray-600">Revenue Generated</div>
              <div className="text-xs text-gray-500 mt-1">
                Cost: ${mockStats.costToRestaurant.toFixed(0)}
              </div>
            </div>
          </div>
        </div>

        {/* First-Time Customer Discount */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">First-Time Customer Discount</h2>
              <p className="text-gray-600">Attract new customers with a percentage discount on their first order</p>
            </div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={state.promotions.firstTimeEnabled}
                onChange={(e) => handlePromotionChange('firstTimeEnabled', e.target.checked)}
                className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                {state.promotions.firstTimeEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </label>
          </div>

          {state.promotions.firstTimeEnabled && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Percentage
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="5"
                    value={state.promotions.firstTimePercent}
                    onChange={(e) => handlePromotionChange('firstTimePercent', parseFloat(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="5"
                      max="50"
                      step="5"
                      value={state.promotions.firstTimePercent}
                      onChange={(e) => handlePromotionChange('firstTimePercent', parseFloat(e.target.value) || 5)}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <span className="text-gray-600">%</span>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Recommended: 15-25% for optimal conversion and retention
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">How it works:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Automatically applied to first-time customers</li>
                  <li>• Discount appears at checkout</li>
                  <li>• You pay the promotion cost, customers pay the discounted amount</li>
                  <li>• Example: $20 order → Customer pays ${(20 * (1 - state.promotions.firstTimePercent / 100)).toFixed(2)}, You receive ${(20 * (1 - state.promotions.firstTimePercent / 100)).toFixed(2)}</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Loyalty Program */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Loyalty Rewards Program</h2>
              <p className="text-gray-600">Reward repeat customers with credits after they reach a spending threshold</p>
            </div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={state.promotions.loyaltyEnabled}
                onChange={(e) => handlePromotionChange('loyaltyEnabled', e.target.checked)}
                className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                {state.promotions.loyaltyEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </label>
          </div>

          {state.promotions.loyaltyEnabled && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Spending Threshold
                  </label>
                  <div className="flex items-center">
                    <span className="text-gray-500 mr-2">$</span>
                    <input
                      type="number"
                      min="10"
                      max="200"
                      step="5"
                      value={state.promotions.loyaltySpendThreshold}
                      onChange={(e) => handlePromotionChange('loyaltySpendThreshold', parseFloat(e.target.value) || 10)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Customer must spend this amount to earn a reward
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reward Amount
                  </label>
                  <div className="flex items-center">
                    <span className="text-gray-500 mr-2">$</span>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      step="1"
                      value={state.promotions.loyaltyRewardAmount}
                      onChange={(e) => handlePromotionChange('loyaltyRewardAmount', parseFloat(e.target.value) || 1)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Credit amount given to customer as reward
                  </p>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">Loyalty Program Details:</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Customer earns ${state.promotions.loyaltyRewardAmount.toFixed(2)} credit after spending ${state.promotions.loyaltySpendThreshold.toFixed(2)}</li>
                  <li>• Credits can be used for future orders at your restaurant</li>
                  <li>• Spending progress resets after earning each reward</li>
                  <li>• Reward percentage: {((state.promotions.loyaltyRewardAmount / state.promotions.loyaltySpendThreshold) * 100).toFixed(1)}% of spending threshold</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-2">💡 Optimization Tips:</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• Sweet spot: 15-25% reward ratio (e.g., $10 reward for $50 spent)</li>
                  <li>• Lower thresholds encourage more frequent orders</li>
                  <li>• Higher rewards increase customer lifetime value</li>
                  <li>• Monitor ROI and adjust based on customer behavior</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Preview Section */}
        {(state.promotions.firstTimeEnabled || state.promotions.loyaltyEnabled) && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Customer Experience Preview</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {state.promotions.firstTimeEnabled && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">First-Time Customer View</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <div className="flex items-center mb-2">
                      <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium text-blue-900">Welcome Discount Applied!</span>
                    </div>
                    <p className="text-sm text-blue-800">
                      Get {state.promotions.firstTimePercent}% off your first order. 
                      Discount automatically applied at checkout.
                    </p>
                  </div>
                </div>
              )}

              {state.promotions.loyaltyEnabled && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Loyalty Progress View</h3>
                  <div className="bg-green-50 border border-green-200 rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-green-900">Loyalty Progress</span>
                      <span className="text-sm text-green-700">$35.50 / ${state.promotions.loyaltySpendThreshold.toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-green-200 rounded-full h-2 mb-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '71%' }}></div>
                    </div>
                    <p className="text-xs text-green-800">
                      Spend ${(state.promotions.loyaltySpendThreshold - 35.5).toFixed(2)} more to earn ${state.promotions.loyaltyRewardAmount.toFixed(2)} credit!
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Save Changes Reminder */}
        {state.hasChanges && (
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

export default RestaurantPromotions;