import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import apiService from '../services/api';

interface Restaurant {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  description?: string;
  logoUrl?: string;
  operatingHours?: any;
  callEnabled?: boolean;
  active?: boolean;
  restaurantPromotions?: {
    firstTimeEnabled: boolean;
    firstTimePercent: number;
    loyaltyEnabled: boolean;
  };
}

const StudentHome: React.FC = () => {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const { getCartItemCount } = useCart();
  const [showCredits, setShowCredits] = useState(false);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [impersonatedUser, setImpersonatedUser] = useState<any>(null);

  // Check for admin impersonation
  const adminImpersonation = localStorage.getItem('adminImpersonation');
  const isAdminView = adminImpersonation && JSON.parse(adminImpersonation).type === 'student';
  const studentId = isAdminView ? JSON.parse(adminImpersonation).id : null;
  
  // Use impersonated user data if available, otherwise use auth user
  const user = impersonatedUser || authUser;

  // Load impersonated student data if in admin view
  useEffect(() => {
    const loadImpersonatedStudent = async () => {
      if (isAdminView && studentId && authUser?.role === 'ADMIN') {
        try {
          console.log('[STUDENT_HOME] Loading impersonated student data:', studentId);
          const response = await apiService.getStudentDetails(studentId);
          console.log('[STUDENT_HOME] Impersonated student loaded:', response.user);
          setImpersonatedUser(response.user);
        } catch (error) {
          console.error('[STUDENT_HOME] Error loading impersonated student:', error);
        }
      }
    };

    loadImpersonatedStudent();
  }, [isAdminView, studentId, authUser?.role]);

  // Load restaurants for the user's school
  useEffect(() => {
    const loadRestaurants = async () => {
      if (!user?.school?.domain) {
        console.log('[STUDENT_HOME] No school domain found for user');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('[STUDENT_HOME] Loading restaurants for school:', user.school.domain);
        
        const response = await apiService.getRestaurantsBySchool(user.school.domain);
        console.log('[STUDENT_HOME] Restaurants loaded:', response.restaurants);
        
        setRestaurants(response.restaurants || []);
        setError('');
      } catch (error: any) {
        console.error('[STUDENT_HOME] Error loading restaurants:', error);
        setError(error.response?.data?.error || 'Failed to load restaurants');
      } finally {
        setLoading(false);
      }
    };

    loadRestaurants();
  }, [user?.school?.domain]);

  const handleRestaurantClick = (restaurant: Restaurant) => {
    console.log('[STUDENT_HOME] Selected restaurant:', restaurant);
    console.log('[STUDENT_HOME] Navigating to:', `/restaurant/${restaurant.id}`);
    try {
      navigate(`/restaurant/${restaurant.id}`, { 
        state: { restaurant } 
      });
    } catch (error) {
      console.error('[STUDENT_HOME] Navigation error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Snake Logo */}
      <div className="relative">
        {/* Colorful background similar to your image */}
        <div className="h-64 bg-gradient-to-r from-blue-400 via-orange-400 to-green-400 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-blue-500 opacity-70"></div>
          
          {/* Snake Logo Card */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="bg-white bg-opacity-90 rounded-lg p-6 shadow-lg" style={{backgroundColor: '#f5e6d3'}}>
              {/* Snake head with fangs */}
              <div className="text-center mb-4">
                <div className="inline-block relative">
                  <div className="w-20 h-12 bg-green-500 rounded-full relative">
                    {/* Eyes */}
                    <div className="absolute top-2 left-3 w-3 h-3 bg-black rounded-full"></div>
                    <div className="absolute top-2 right-3 w-3 h-3 bg-black rounded-full"></div>
                    {/* Fangs */}
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
                      <div className="flex space-x-2">
                        <div className="w-0 h-0 border-l-2 border-r-2 border-t-4 border-transparent border-t-white"></div>
                        <div className="w-0 h-0 border-l-2 border-r-2 border-t-4 border-transparent border-t-white"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Logo Text */}
              <div className="text-center">
                <div className="text-2xl font-bold">
                  <span className="text-orange-500">B</span>
                  <span className="text-orange-500">I</span>
                  <span className="text-orange-500">T</span>
                  <span className="text-orange-500">E</span>
                </div>
                <div className="text-2xl font-bold text-black mt-1">CLUB</div>
                {/* Credit card chip */}
                <div className="absolute top-6 right-6 w-4 h-3 bg-yellow-400 rounded-sm"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        </div>
      </div>

      {/* Welcome Section */}
      <div className="px-6 py-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Welcome to Bite Club!</h1>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <button 
            onClick={() => setShowCredits(!showCredits)}
            className="flex-1 bg-green-500 text-white px-6 py-4 rounded-lg font-semibold hover:bg-green-600 active:bg-green-700 transition-colors text-base touch-manipulation"
          >
            💳 View Credits
          </button>
          <button className="flex-1 border-2 border-green-500 text-green-500 px-6 py-4 rounded-lg font-semibold hover:bg-green-500 hover:text-white active:bg-green-600 transition-colors text-base touch-manipulation">
            ❓ Need Help?
          </button>
        </div>

        {/* Credits Display */}
        {showCredits && (
          <div className="bg-white p-4 rounded-lg shadow-md mb-6 border-l-4 border-green-500">
            <h3 className="font-semibold text-lg mb-2">Your Credit Balance</h3>
            <p className="text-2xl font-bold text-green-600">${Number(user?.creditBalance || 0).toFixed(2)}</p>
            <p className="text-sm text-gray-600 mt-1">Credit refills are reflected within 24 hours.</p>
          </div>
        )}

        {/* Restaurant Selection */}
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Pick your restaurant:</h2>
        
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading restaurants...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {!loading && !error && restaurants.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-600">No restaurants available for your school yet.</p>
            <p className="text-sm text-gray-500 mt-1">Check back soon!</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {restaurants.map((restaurant) => (
            <div 
              key={restaurant.id}
              onClick={() => handleRestaurantClick(restaurant)}
              className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg active:shadow-xl transition-all border active:bg-gray-50 touch-manipulation"
            >
              {/* Restaurant Logo */}
              <div className="w-full h-32 sm:h-24 bg-gray-200 rounded-lg mb-4 flex items-center justify-center relative">
                {restaurant.logoUrl ? (
                  <img 
                    src={restaurant.logoUrl} 
                    alt={restaurant.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="text-center px-2">
                    <div className="text-sm font-bold text-gray-700 truncate">{restaurant.name}</div>
                    {restaurant.description && (
                      <div className="text-xs text-gray-500 mt-1 line-clamp-2">{restaurant.description}</div>
                    )}
                  </div>
                )}
                
                {/* Promotional badges could be added here based on restaurant data */}
                {restaurant.callEnabled && (
                  <div className="absolute top-1 left-1 bg-green-500 text-white text-xs px-1 py-0.5 rounded">
                    📞
                  </div>
                )}
              </div>
              
              {/* Restaurant Name */}
              <h3 className="font-semibold text-lg sm:text-base text-gray-900 truncate">
                {restaurant.name}
              </h3>
              
              {/* Description */}
              {restaurant.description && (
                <p className="text-sm sm:text-xs text-gray-600 mt-2 sm:mt-1 line-clamp-2">
                  {restaurant.description}
                </p>
              )}
              
              {/* Phone for calling */}
              {restaurant.phone && (
                <p className="text-sm sm:text-xs text-blue-600 mt-2 sm:mt-1">
                  📞 {restaurant.phone}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 shadow-lg">
        <div className="flex justify-between items-center max-w-sm mx-auto">
          <button className="flex flex-col items-center p-3 rounded-xl bg-green-50 min-w-0 flex-1 mx-1">
            <div className="w-7 h-7 mb-1 flex items-center justify-center">
              <svg className="w-7 h-7 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
              </svg>
            </div>
            <span className="text-xs text-green-500 font-semibold">Home</span>
          </button>
          
          <button 
            onClick={() => navigate('/orders')}
            className="flex flex-col items-center p-3 rounded-xl hover:bg-gray-50 transition-colors min-w-0 flex-1 mx-1"
          >
            <div className="w-7 h-7 mb-1 flex items-center justify-center">
              <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
            </div>
            <span className="text-xs text-gray-400 font-medium">Orders</span>
          </button>
          
          <button 
            onClick={() => navigate('/cart')}
            className="flex flex-col items-center p-3 rounded-xl hover:bg-gray-50 transition-colors min-w-0 flex-1 mx-1 relative"
          >
            <div className="w-7 h-7 mb-1 flex items-center justify-center relative">
              <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H8a2 0 01-2-2v-6"/>
              </svg>
              {getCartItemCount() > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {getCartItemCount()}
                </span>
              )}
            </div>
            <span className="text-xs text-gray-400 font-medium">Cart</span>
          </button>
          
          <button 
            onClick={() => navigate('/profile')}
            className="flex flex-col items-center p-3 rounded-xl hover:bg-gray-50 transition-colors min-w-0 flex-1 mx-1"
          >
            <div className="w-7 h-7 mb-1 flex items-center justify-center">
              <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
            </div>
            <span className="text-xs text-gray-400 font-medium">Profile</span>
          </button>
        </div>
      </div>

      {/* Bottom padding to account for fixed navigation */}
      <div className="h-20"></div>
    </div>
  );
};

export default StudentHome;