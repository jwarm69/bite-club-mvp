import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Cart as CartType, CartItem, Restaurant } from '../types';
import apiService from '../services/api';

interface CartProps {
  cart: CartType;
  restaurant?: Restaurant;
  onUpdateQuantity: (itemIndex: number, newQuantity: number) => void;
  onRemoveItem: (itemIndex: number) => void;
  onClearCart: () => void;
}

const Cart: React.FC<CartProps> = ({ 
  cart, 
  restaurant, 
  onUpdateQuantity, 
  onRemoveItem, 
  onClearCart 
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [promotions, setPromotions] = useState<any>(null);

  // Check for promotions when cart changes - MOVED TO TOP to avoid hooks after early return
  React.useEffect(() => {
    const checkCartPromotions = async () => {
      if (cart?.items.length > 0 && cart?.restaurantId) {
        try {
          const response = await apiService.checkPromotions(cart.restaurantId, cart.totalAmount);
          setPromotions(response.promotions);
          console.log('[CART] Promotions checked:', response.promotions);
        } catch (error) {
          console.error('[CART] Error checking promotions:', error);
          setPromotions(null);
        }
      } else {
        setPromotions(null);
      }
    };

    checkCartPromotions();
  }, [cart?.items.length, cart?.restaurantId, cart?.totalAmount]);

  // Safety check for cart
  if (!cart) {
    console.error('[CART] Cart is null or undefined');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Cart Error</h2>
          <p className="text-gray-600 mb-6">There was an issue loading your cart.</p>
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

  // Use restaurant prop - no mock data needed
  const getRestaurantData = (): Restaurant | null => {
    if (restaurant) {
      return restaurant;
    }
    
    // If no restaurant prop provided, return null - parent should handle this
    console.warn('[CART] No restaurant data provided via props');
    return null;
  };

  const currentRestaurant = getRestaurantData();

  const userBalance = Number(user?.creditBalance) || 0;
  const finalAmount = promotions?.finalAmount || cart.totalAmount;
  const canAfford = userBalance >= finalAmount;

  // Promotions check moved to top of component

  // Debug logging
  console.log('[CART] Cart data:', {
    cart,
    userBalance,
    canAfford,
    currentRestaurant: currentRestaurant?.name || 'Unknown Restaurant'
  });

  const handleCheckout = async () => {
    if (!canAfford) {
      alert('Insufficient credits. Please add more credits to your account.');
      return;
    }

    if (!cart.restaurantId) {
      alert('No restaurant selected for this order.');
      return;
    }

    setIsProcessing(true);
    
    try {
      console.log('[CART_CHECKOUT] Creating order:', {
        items: cart.items,
        restaurantId: cart.restaurantId,
        totalAmount: cart.totalAmount
      });

      // Create order via API
      const response = await apiService.createOrder({
        items: cart.items,
        restaurantId: cart.restaurantId,
        totalAmount: cart.totalAmount
      });

      console.log('[CART_CHECKOUT] Order created successfully:', response.order);
      
      // Clear cart and show success
      onClearCart();
      setOrderSuccess(true);
      setShowCheckout(false);
      
      // Show loyalty reward if earned
      if ((response as any).promotions?.loyaltyRewardEarned > 0) {
        setTimeout(() => {
          alert(`🎉 Congratulations! You earned $${Number((response as any).promotions.loyaltyRewardEarned).toFixed(2)} in loyalty rewards!`);
        }, 1000);
      }
      
    } catch (error: any) {
      console.error('[CART_CHECKOUT] Checkout failed:', error);
      const errorMessage = error.response?.data?.error || 'Order failed. Please try again.';
      alert(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H8a2 2 0 01-2-2v-6"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Add some delicious items to get started!</p>
          <button 
            onClick={() => navigate('/')}
            className="btn-primary"
          >
            Browse Restaurants
          </button>
        </div>
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Placed!</h2>
          <p className="text-gray-600 mb-4">
            Your order has been sent to {currentRestaurant?.name || 'the restaurant'}. 
            They will call you when it's ready for pickup.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Credits have been deducted from your account.
          </p>
          <div className="space-y-3">
            <button 
              onClick={() => navigate('/')}
              className="w-full btn-primary"
            >
              Back to Home
            </button>
            <button 
              onClick={() => {
                setOrderSuccess(false);
                navigate('/orders');
              }}
              className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50"
            >
              View Orders
            </button>
          </div>
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
            onClick={() => navigate(-1)}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="text-center">
            <h1 className="text-lg font-bold text-gray-900">Your Cart</h1>
            <p className="text-sm text-gray-500">{currentRestaurant?.name || 'Restaurant'}</p>
          </div>

          <button 
            onClick={onClearCart}
            className="text-red-500 hover:text-red-700 text-sm font-medium"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Cart Items */}
      <div className="p-4 pb-32">
        <div className="space-y-4">
          {cart.items.map((item, index) => (
            <CartItemCard
              key={index}
              item={item}
              onUpdateQuantity={(newQuantity) => onUpdateQuantity(index, newQuantity)}
              onRemove={() => onRemoveItem(index)}
            />
          ))}
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Summary</h3>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">${Number(cart.totalAmount).toFixed(2)}</span>
            </div>
            
            {/* First-time discount */}
            {promotions?.firstTimeDiscount && (
              <div className="flex justify-between text-green-600">
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  First-time discount ({promotions.firstTimeDiscount.percentage}%)
                </span>
                <span className="font-medium">-${Number(promotions.firstTimeDiscount.discountAmount).toFixed(2)}</span>
              </div>
            )}
            
            <div className="flex justify-between">
              <span className="text-gray-600">Taxes & Fees</span>
              <span className="font-medium">$0.00</span>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-lg font-bold text-primary-500">${Number(finalAmount).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Promotions Section */}
        {(promotions?.firstTimeDiscount || promotions?.loyaltyReward || promotions?.loyaltyProgress) && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 mt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732L14.146 12.8l-1.179 4.456a1 1 0 01-1.934 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732L9.854 7.2l1.179-4.456A1 1 0 0112 2z" clipRule="evenodd" />
              </svg>
              Special Offers
            </h3>
            
            {promotions.firstTimeDiscount && (
              <div className="bg-white rounded-lg p-3 mb-3 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-green-900">🎉 Welcome Discount!</h4>
                    <p className="text-sm text-green-700">{promotions.firstTimeDiscount.description}</p>
                  </div>
                  <span className="text-lg font-bold text-green-600">
                    -${Number(promotions.firstTimeDiscount.discountAmount).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
            
            {promotions.loyaltyReward && (
              <div className="bg-white rounded-lg p-3 mb-3 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-blue-900">🏆 Loyalty Reward!</h4>
                    <p className="text-sm text-blue-700">{promotions.loyaltyReward.description}</p>
                  </div>
                  <span className="text-lg font-bold text-blue-600">
                    +${Number(promotions.loyaltyReward.rewardAmount).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
            
            {promotions.loyaltyProgress && (
              <div className="bg-white rounded-lg p-3 border-l-4 border-yellow-500">
                <div>
                  <h4 className="font-medium text-yellow-900">⭐ Loyalty Progress</h4>
                  <p className="text-sm text-yellow-700 mb-2">{promotions.loyaltyProgress.description}</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full transition-all duration-300" 
                      style={{ 
                        width: `${(promotions.loyaltyProgress.current / promotions.loyaltyProgress.threshold) * 100}%` 
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    ${Number(promotions.loyaltyProgress.current).toFixed(2)} / ${Number(promotions.loyaltyProgress.threshold).toFixed(2)}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Credit Balance */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Credit Balance</h3>
              <p className="text-sm text-gray-500">Available for orders</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600">${Number(userBalance).toFixed(2)}</p>
              {!canAfford && (
                <p className="text-sm text-red-600">Insufficient credits</p>
              )}
            </div>
          </div>
          
          {!canAfford && (
            <button 
              onClick={() => navigate('/credits')}
              className="w-full mt-3 bg-green-500 text-white py-2 rounded-lg font-medium hover:bg-green-600"
            >
              Add Credits
            </button>
          )}
        </div>
      </div>

      {/* Checkout Button (Fixed Bottom) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 safe-area-inset-bottom">
        <button
          onClick={() => setShowCheckout(true)}
          disabled={!canAfford || isProcessing}
          className={`w-full py-4 rounded-lg font-semibold text-base transition-colors touch-manipulation ${
            canAfford && !isProcessing
              ? 'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isProcessing ? 'Processing...' : `🛒 Place Order - $${Number(finalAmount).toFixed(2)}`}
        </button>
      </div>

      {/* Checkout Confirmation Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Confirm Your Order</h2>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Restaurant:</span>
                <span className="font-medium">{currentRestaurant?.name || 'Unknown Restaurant'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Items:</span>
                <span className="font-medium">{cart.items.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total:</span>
                <span className="font-bold text-primary-500">${Number(finalAmount).toFixed(2)}</span>
              </div>
              {promotions?.firstTimeDiscount && (
                <div className="flex justify-between text-green-600 text-sm">
                  <span>Discount Applied:</span>
                  <span>-${Number(promotions.firstTimeDiscount.discountAmount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Payment:</span>
                <span className="font-medium">Bite Club Credits</span>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-6">
              The restaurant will call you when your order is ready for pickup.
            </p>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowCheckout(false)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCheckout}
                disabled={isProcessing}
                className="flex-1 bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : 'Confirm Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Cart Item Card Component
interface CartItemCardProps {
  item: CartItem;
  onUpdateQuantity: (newQuantity: number) => void;
  onRemove: () => void;
}

const CartItemCard: React.FC<CartItemCardProps> = ({ item, onUpdateQuantity, onRemove }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{item.menuItem.name}</h3>
          {item.menuItem.description && (
            <p className="text-sm text-gray-600 mt-1">{item.menuItem.description}</p>
          )}
        </div>
        <button
          onClick={onRemove}
          className="text-red-500 hover:text-red-700 ml-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
        </button>
      </div>

      {/* Selected Modifiers */}
      {item.selectedModifiers.length > 0 && (
        <div className="mb-3">
          <h4 className="text-sm font-medium text-gray-700 mb-1">Modifications:</h4>
          <div className="text-sm text-gray-600 space-y-1">
            {item.selectedModifiers.map((modifier, index) => (
              <div key={index} className="flex justify-between">
                <span>• {modifier.name}</span>
                {modifier.price > 0 && <span>+${modifier.price.toFixed(2)}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom Instructions */}
      {item.customInstructions && (
        <div className="mb-3">
          <h4 className="text-sm font-medium text-gray-700 mb-1">Special Instructions:</h4>
          <p className="text-sm text-gray-600 italic">"{item.customInstructions}"</p>
        </div>
      )}

      {/* Quantity and Price */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => onUpdateQuantity(Math.max(1, item.quantity - 1))}
            className="w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <span className="font-semibold text-xl min-w-[2rem] text-center">{item.quantity}</span>
          <button
            onClick={() => onUpdateQuantity(item.quantity + 1)}
            className="w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        <div className="text-right">
          <p className="text-xl font-bold text-primary-500">${item.totalPrice.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
};

export default Cart;