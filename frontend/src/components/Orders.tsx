import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { Order } from '../types';
import apiService from '../services/api';

const Orders: React.FC = () => {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const { addToCart, clearCart } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'active' | 'completed'>('active');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [impersonatedUser, setImpersonatedUser] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [orderStatusNotification, setOrderStatusNotification] = useState<string>('');

  // Check for admin impersonation
  const adminImpersonation = localStorage.getItem('adminImpersonation');
  const isAdminView = adminImpersonation && JSON.parse(adminImpersonation).type === 'student';
  const studentId = isAdminView ? JSON.parse(adminImpersonation).id : null;

  // Load impersonated student data if in admin view
  useEffect(() => {
    const loadImpersonatedStudent = async () => {
      if (isAdminView && studentId) {
        try {
          console.log('[ORDERS] Loading impersonated student data:', studentId);
          const response = await apiService.getStudentDetails(studentId);
          console.log('[ORDERS] Impersonated student loaded:', response.user);
          setImpersonatedUser(response.user);
        } catch (error) {
          console.error('[ORDERS] Error loading impersonated student:', error);
        }
      }
    };

    loadImpersonatedStudent();
  }, [isAdminView, studentId]);
  
  // Use impersonated user data if available, otherwise use auth user
  const user = impersonatedUser || authUser;


  const [error, setError] = useState<string>('');

  const loadOrders = async (isManualRefresh = false) => {
    try {
      console.log('[STUDENT_ORDERS] Loading orders...');
      console.log('[STUDENT_ORDERS] User for orders:', user?.id, isAdminView ? '(impersonated)' : '(normal)');
      
      // If we're in admin view but haven't loaded the impersonated user yet, wait
      if (isAdminView && !impersonatedUser) {
        console.log('[STUDENT_ORDERS] Waiting for impersonated user to load...');
        return;
      }
      
      if (isManualRefresh) {
        setIsRefreshing(true);
      }
      
      setError('');
      const response = await apiService.getMyOrders();
      console.log('[STUDENT_ORDERS] Orders loaded:', response.orders);
      
      const newOrders = response.orders || [];
      
      // Check for status changes if we have existing orders
      if (orders.length > 0 && !loading) {
        for (const newOrder of newOrders) {
          const existingOrder = orders.find(o => o.id === newOrder.id);
          if (existingOrder && existingOrder.status !== newOrder.status) {
            // Status changed - show notification
            if (newOrder.status === 'READY') {
              setOrderStatusNotification(`🎉 Your order from ${newOrder.restaurant.name} is ready for pickup!`);
            } else if (newOrder.status === 'PREPARING') {
              setOrderStatusNotification(`👨‍🍳 Your order from ${newOrder.restaurant.name} is being prepared`);
            } else if (newOrder.status === 'CONFIRMED') {
              setOrderStatusNotification(`✅ Your order from ${newOrder.restaurant.name} has been confirmed`);
            }
            
            // Auto-hide notification after 5 seconds
            setTimeout(() => setOrderStatusNotification(''), 5000);
            break;
          }
        }
      }
      
      setOrders(newOrders);
      setLastUpdated(new Date());
      setLoading(false);
    } catch (error: any) {
      console.error('[STUDENT_ORDERS] Error loading orders:', error);
      setError(error.response?.data?.error || 'Failed to load orders');
      setOrders([]);
      setLoading(false);
    } finally {
      if (isManualRefresh) {
        setIsRefreshing(false);
      }
    }
  };

  useEffect(() => {
    loadOrders();
    
    // Poll for order updates every 30 seconds
    const interval = setInterval(() => loadOrders(), 30000);
    
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, impersonatedUser]);

  const activeOrders = orders.filter(order => 
    ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'].includes(order.status)
  );
  
  const completedOrders = orders.filter(order => 
    ['COMPLETED', 'CANCELLED'].includes(order.status)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'CONFIRMED': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'PREPARING': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'READY': return 'text-green-600 bg-green-50 border-green-200';
      case 'COMPLETED': return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'CANCELLED': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Order Placed';
      case 'CONFIRMED': return 'Confirmed';
      case 'PREPARING': return 'Preparing';
      case 'READY': return 'Ready for Pickup!';
      case 'COMPLETED': return 'Completed';
      case 'CANCELLED': return 'Cancelled';
      default: return status;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 24 * 60) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / (24 * 60))}d ago`;
    }
  };

  const reorderItems = async (order: Order) => {
    try {
      console.log('[REORDER] Reordering items from order:', order.id);
      
      // Clear current cart first and confirm with user
      const confirmReorder = window.confirm(
        'Adding items from this order will replace your current cart. Continue?'
      );
      
      if (!confirmReorder) {
        return;
      }
      
      clearCart();
      
      // Add each item from the order to the cart
      for (const orderItem of order.orderItems) {
        console.log('[REORDER] Adding item to cart:', orderItem.menuItem.name);
        
        // Convert order item modifiers to cart format
        const modifiers = orderItem.modifiersSelected || [];
        
        addToCart(
          orderItem.menuItem,
          modifiers,
          orderItem.customInstructions || '',
          orderItem.quantity
        );
      }
      
      console.log('[REORDER] Successfully added all items to cart');
      
      // Navigate to cart
      navigate('/cart');
      
    } catch (error) {
      console.error('[REORDER] Error reordering items:', error);
      alert('Failed to reorder items. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Orders</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Try Again
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
          
          <h1 className="text-lg font-bold text-gray-900">Your Orders</h1>
          
          <button 
            onClick={() => loadOrders(true)}
            disabled={isRefreshing}
            className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            <svg className={`w-6 h-6 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* Live Updates Indicator */}
        {(lastUpdated || isRefreshing) && (
          <div className={`px-4 py-2 border-b ${isRefreshing ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'}`}>
            <div className="flex items-center justify-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isRefreshing ? 'bg-blue-400 animate-spin' : 'bg-green-400 animate-pulse'}`}></div>
              <span className={`text-sm font-medium ${isRefreshing ? 'text-blue-700' : 'text-green-700'}`}>
                {isRefreshing ? 'Refreshing...' : 'Live Updates'}
              </span>
              {lastUpdated && !isRefreshing && (
                <span className="text-xs text-green-600">
                  Last updated {formatTime(lastUpdated.toISOString())}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Status Change Notification */}
        {orderStatusNotification && (
          <div className="px-4 py-3 bg-blue-100 border-b border-blue-300">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-800">{orderStatusNotification}</span>
              <button
                onClick={() => setOrderStatusNotification('')}
                className="text-blue-600 hover:text-blue-800"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setSelectedTab('active')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              selectedTab === 'active'
                ? 'text-primary-500 border-b-2 border-primary-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Active ({activeOrders.length})
          </button>
          <button
            onClick={() => setSelectedTab('completed')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              selectedTab === 'completed'
                ? 'text-primary-500 border-b-2 border-primary-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Past Orders ({completedOrders.length})
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div className="p-4 pb-24">
        {selectedTab === 'active' ? (
          activeOrders.length > 0 ? (
            <div className="space-y-4">
              {activeOrders.map(order => (
                <OrderCard 
                  key={order.id} 
                  order={order} 
                  getStatusColor={getStatusColor}
                  getStatusText={getStatusText}
                  formatTime={formatTime}
                  onReorder={reorderItems}
                  showReorder={false}
                />
              ))}
            </div>
          ) : (
            <EmptyState 
              title="No Active Orders"
              description="You don't have any active orders right now."
              buttonText="Browse Restaurants"
              onButtonClick={() => navigate('/')}
            />
          )
        ) : (
          completedOrders.length > 0 ? (
            <div className="space-y-4">
              {completedOrders.map(order => (
                <OrderCard 
                  key={order.id} 
                  order={order} 
                  getStatusColor={getStatusColor}
                  getStatusText={getStatusText}
                  formatTime={formatTime}
                  onReorder={reorderItems}
                  showReorder={true}
                />
              ))}
            </div>
          ) : (
            <EmptyState 
              title="No Past Orders"
              description="Your completed orders will appear here."
              buttonText="Place Your First Order"
              onButtonClick={() => navigate('/')}
            />
          )
        )}
      </div>
    </div>
  );
};

// Order Card Component
interface OrderCardProps {
  order: Order;
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
  formatTime: (dateString: string) => string;
  onReorder: (order: Order) => void;
  showReorder: boolean;
}

const OrderCard: React.FC<OrderCardProps> = ({ 
  order, 
  getStatusColor, 
  getStatusText, 
  formatTime, 
  onReorder, 
  showReorder 
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      {/* Order Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{order.restaurant.name}</h3>
          <p className="text-sm text-gray-500">Order #{order.id.slice(-6)}</p>
          <p className="text-sm text-gray-500">{formatTime(order.createdAt)}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
          {getStatusText(order.status)}
        </div>
      </div>

      {/* Order Items */}
      <div className="space-y-2 mb-3">
        {order.orderItems.map(item => (
          <div key={item.id} className="flex justify-between text-sm">
            <span className="text-gray-600">
              {item.quantity}x {item.menuItem.name}
              {item.modifiersSelected && item.modifiersSelected.length > 0 && (
                <span className="text-gray-400">
                  {' '}({item.modifiersSelected.map(m => m.name).join(', ')})
                </span>
              )}
            </span>
            <span className="font-medium">${Number(item.totalPrice).toFixed(2)}</span>
          </div>
        ))}
      </div>

      {/* Special Instructions */}
      {order.specialInstructions && (
        <div className="mb-3 p-2 bg-gray-50 rounded text-sm">
          <span className="font-medium text-gray-700">Special Instructions: </span>
          <span className="text-gray-600">{order.specialInstructions}</span>
        </div>
      )}

      {/* Order Total */}
      <div className="border-t pt-3">
        <div className="flex justify-between items-center">
          <div>
            {Number(order.discountAmount) > 0 && (
              <div className="text-sm text-green-600 mb-1">
                Discount: -${Number(order.discountAmount).toFixed(2)}
              </div>
            )}
            <div className="text-lg font-bold text-gray-900">
              Total: ${Number(order.finalAmount).toFixed(2)}
            </div>
          </div>
          
          {showReorder && (
            <button
              onClick={() => onReorder(order)}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              Reorder
            </button>
          )}
        </div>
      </div>

      {/* Status-specific actions */}
      {order.status === 'READY' && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center text-green-800">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Your order is ready for pickup!</span>
          </div>
          <p className="text-sm text-green-700 mt-1">Call {order.restaurant.phone} if you need assistance.</p>
        </div>
      )}
    </div>
  );
};

// Empty State Component
interface EmptyStateProps {
  title: string;
  description: string;
  buttonText: string;
  onButtonClick: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ title, description, buttonText, onButtonClick }) => {
  return (
    <div className="text-center py-12">
      <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6">{description}</p>
      <button 
        onClick={onButtonClick}
        className="btn-primary"
      >
        {buttonText}
      </button>
    </div>
  );
};

export default Orders;