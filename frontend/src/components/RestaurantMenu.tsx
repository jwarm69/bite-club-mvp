import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MenuItem, Restaurant, SelectedModifier } from '../types';
import { useCart } from '../contexts/CartContext';
import MenuItemDetail from './MenuItemDetail';
import apiService from '../services/api';

interface RestaurantMenuProps {
  restaurant?: Restaurant;
}

const RestaurantMenu: React.FC<RestaurantMenuProps> = ({ restaurant: propRestaurant }) => {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const navigate = useNavigate();
  const { cart, addToCart, getCartItemCount } = useCart();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(propRestaurant || null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(!propRestaurant);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [showItemDetail, setShowItemDetail] = useState(false);
  const [error, setError] = useState<string>('');
  const [retryCount, setRetryCount] = useState(0);

  const loadRestaurantMenu = async (isRetry = false) => {
    if (restaurantId && !restaurant) {
      setLoading(true);
      setError('');
      
      try {
        console.log('[RESTAURANT_MENU] Loading restaurant:', restaurantId, isRetry ? '(retry)' : '');
        console.log('[RESTAURANT_MENU] API base URL:', process.env.REACT_APP_API_URL);
        const response = await apiService.getRestaurantMenu(restaurantId);
        console.log('[RESTAURANT_MENU] API response:', response);
        
        if (response.restaurant) {
          setRestaurant(response.restaurant);
          setMenuItems(response.restaurant.menuItems || []);
          setRetryCount(0); // Reset retry count on success
        } else {
          setError('Restaurant not found');
        }
      } catch (error: any) {
        console.error('[RESTAURANT_MENU] Error loading restaurant:', error);
        
        // Determine error type and message
        let errorMessage = 'Failed to load restaurant menu';
        if (error.code === 'NETWORK_ERROR' || !navigator.onLine) {
          errorMessage = 'No internet connection. Please check your network and try again.';
        } else if (error.response?.status === 404) {
          errorMessage = 'Restaurant not found';
        } else if (error.response?.status >= 500) {
          errorMessage = 'Server error. Please try again in a moment.';
        } else if (error.response?.data?.error) {
          errorMessage = error.response.data.error;
        }
        
        setError(errorMessage);
        setRetryCount(prev => prev + 1);
      } finally {
        setLoading(false);
      }
    } else if (restaurant) {
      // If restaurant prop is provided, try to load its menu items
      if (restaurant.menuItems) {
        setMenuItems(restaurant.menuItems);
      } else {
        try {
          const response = await apiService.getRestaurantMenu(restaurant.id);
          setMenuItems(response.restaurant.menuItems || []);
        } catch (error) {
          console.error('[RESTAURANT_MENU] Error loading menu items:', error);
        }
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRestaurantMenu();
  }, [restaurantId, restaurant]);

  const categories: string[] = ['all', ...Array.from(new Set(menuItems.map(item => item.category).filter((cat): cat is string => Boolean(cat))))];

  const filteredItems = selectedCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory);

  const handleMenuItemClick = (item: MenuItem) => {
    setSelectedMenuItem(item);
    setShowItemDetail(true);
  };

  const goToCart = () => {
    navigate('/cart');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Restaurant</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          
          <div className="space-y-3">
            <button 
              onClick={() => loadRestaurantMenu(true)}
              className="w-full bg-primary-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-600 transition-colors"
            >
              Try Again{retryCount > 0 && ` (${retryCount})`}
            </button>
            
            <button 
              onClick={() => navigate('/')}
              className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Back to Home
            </button>
          </div>
          
          {!navigator.onLine && (
            <div className="mt-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg text-sm">
              <strong>Offline:</strong> Check your internet connection
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Restaurant Not Found</h2>
          <button 
            onClick={() => navigate('/')}
            className="btn-primary"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <button 
            onClick={() => navigate('/')}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="text-center">
            <h1 className="text-lg font-bold text-gray-900">{restaurant.name}</h1>
            <p className="text-sm text-gray-500">{restaurant.description}</p>
          </div>

          {getCartItemCount() > 0 && (
            <button 
              onClick={goToCart}
              className="relative bg-primary-500 text-white p-2 rounded-full"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H8a2 2 0 01-2-2v-6"/>
              </svg>
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {getCartItemCount()}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white px-4 py-3 border-b">
        <div className="flex space-x-4 overflow-x-auto">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category === 'all' ? 'All Items' : category}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items */}
      <div className="p-4 pb-24">
        <div className="space-y-2">
          {filteredItems.map(item => (
            <MenuItemCard 
              key={item.id} 
              item={item} 
              onAddToCart={(item, modifiers, instructions, quantity) => {
                console.log('[MENU] Adding to cart:', { item: item.name, modifiers, instructions, quantity });
                addToCart(item, modifiers, instructions, quantity);
              }}
              onClick={() => handleMenuItemClick(item)}
            />
          ))}
        </div>
      </div>

      {/* Cart Summary (Fixed Bottom) */}
      {getCartItemCount() > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 safe-area-inset-bottom">
          <button 
            onClick={goToCart}
            className="w-full bg-primary-500 text-white py-4 rounded-lg font-semibold flex items-center justify-between text-base active:bg-primary-700 transition-colors touch-manipulation"
          >
            <span>🛒 View Cart ({getCartItemCount()})</span>
            <span className="text-lg font-bold">${cart.totalAmount.toFixed(2)}</span>
          </button>
        </div>
      )}

      {/* Menu Item Detail Modal */}
      {selectedMenuItem && (
        <MenuItemDetail
          item={selectedMenuItem}
          isOpen={showItemDetail}
          onClose={() => {
            setShowItemDetail(false);
            setSelectedMenuItem(null);
          }}
          onAddToCart={(item, modifiers, instructions, quantity) => {
            console.log('[MENU_DETAIL] Adding to cart:', { item: item.name, modifiers, instructions, quantity });
            addToCart(item, modifiers, instructions, quantity);
          }}
        />
      )}
    </div>
  );
};

// Menu Item Card Component
interface MenuItemCardProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem, modifiers?: SelectedModifier[], instructions?: string, quantity?: number) => void;
  onClick: () => void;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({ item, onAddToCart, onClick }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      {/* Main content - clickable - now horizontal and compact */}
      <div 
        className="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0 pr-4">
            <h3 className="text-base font-semibold text-gray-900 truncate">{item.name}</h3>
            {item.description && (
              <p className="text-sm text-gray-600 mt-0.5 line-clamp-1">{item.description}</p>
            )}
            <div className="flex items-center mt-1 space-x-2">
              <p className="text-lg font-bold text-primary-500">${Number(item.price).toFixed(2)}</p>
              {/* Show modifier preview for complex items */}
              {item.modifiers && (Array.isArray(item.modifiers) ? item.modifiers.length > 0 : (typeof item.modifiers === 'string' && item.modifiers !== 'null')) && (
                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                  Customizable
                </span>
              )}
            </div>
          </div>

          {/* Action button - always visible on the right */}
          <div className="flex-shrink-0">
            {(!item.modifiers || (Array.isArray(item.modifiers) && item.modifiers.length === 0) || (typeof item.modifiers === 'string' && (item.modifiers === 'null' || item.modifiers === ''))) ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToCart(item);
                }}
                className="bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
              >
                Add
              </button>
            ) : (
              <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                Customize
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantMenu;