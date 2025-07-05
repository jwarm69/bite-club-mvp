import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Order } from '../types';

type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';

interface CompletedOrdersState {
  orders: Order[];
  selectedStatus: 'ALL' | 'COMPLETED' | 'CANCELLED';
  searchQuery: string;
  selectedOrder: Order | null;
  showOrderDetail: boolean;
  loading: boolean;
}

const RestaurantCompletedOrders: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [state, setState] = useState<CompletedOrdersState>({
    orders: [],
    selectedStatus: 'ALL',
    searchQuery: '',
    selectedOrder: null,
    showOrderDetail: false,
    loading: true
  });

  // Mock completed orders for development
  const mockCompletedOrders: Order[] = [
    {
      id: 'order_101',
      userId: 'user_123',
      restaurantId: user?.id || 'rest_1',
      totalAmount: 32.50,
      discountAmount: 0,
      finalAmount: 32.50,
      status: 'COMPLETED',
      specialInstructions: '',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      updatedAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(), // Completed 1.5 hours ago
      restaurant: {
        id: user?.id || 'rest_1',
        name: 'Campus Pizza Palace',
        phone: '+1-561-555-0123',
        email: 'pizza@fau.edu',
        schoolId: 'school_1',
        description: 'Authentic Italian pizza',
        callEnabled: true,
        active: true
      },
      orderItems: [
        {
          id: 'item_101',
          orderId: 'order_101',
          menuItemId: 'pizza_001',
          quantity: 2,
          unitPrice: 15.99,
          totalPrice: 31.98,
          menuItem: {
            id: 'pizza_001',
            restaurantId: user?.id || 'rest_1',
            name: 'Margherita Pizza',
            description: 'Fresh mozzarella, tomato sauce, basil',
            price: 15.99,
            category: 'Pizza',
            imageUrl: '',
            available: true
          }
        }
      ]
    },
    {
      id: 'order_102',
      userId: 'user_456',
      restaurantId: user?.id || 'rest_1',
      totalAmount: 18.99,
      discountAmount: 3.80,
      finalAmount: 15.19,
      status: 'COMPLETED',
      specialInstructions: 'Thanks for the great service!',
      promotionApplied: 'FIRST_TIME',
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
      updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // Completed 3 hours ago
      restaurant: {
        id: user?.id || 'rest_1',
        name: 'Campus Pizza Palace',
        phone: '+1-561-555-0123',
        email: 'pizza@fau.edu',
        schoolId: 'school_1',
        description: 'Authentic Italian pizza',
        callEnabled: true,
        active: true
      },
      orderItems: [
        {
          id: 'item_102',
          orderId: 'order_102',
          menuItemId: 'salad_001',
          quantity: 1,
          unitPrice: 12.50,
          totalPrice: 12.50,
          modifiersSelected: [
            { groupId: 'protein', modifierId: 'chicken', name: 'Grilled Chicken', price: 4.00 }
          ],
          menuItem: {
            id: 'salad_001',
            restaurantId: user?.id || 'rest_1',
            name: 'Caesar Salad',
            description: 'Romaine lettuce, parmesan, croutons',
            price: 8.50,
            category: 'Salads',
            imageUrl: '',
            available: true
          }
        },
        {
          id: 'item_103',
          orderId: 'order_102',
          menuItemId: 'drink_001',
          quantity: 2,
          unitPrice: 3.00,
          totalPrice: 6.00,
          menuItem: {
            id: 'drink_001',
            restaurantId: user?.id || 'rest_1',
            name: 'Coca Cola',
            description: 'Classic soft drink',
            price: 3.00,
            category: 'Beverages',
            imageUrl: '',
            available: true
          }
        }
      ]
    },
    {
      id: 'order_103',
      userId: 'user_789',
      restaurantId: user?.id || 'rest_1',
      totalAmount: 22.50,
      discountAmount: 0,
      finalAmount: 22.50,
      status: 'CANCELLED',
      specialInstructions: 'Customer changed mind',
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
      updatedAt: new Date(Date.now() - 5.5 * 60 * 60 * 1000).toISOString(), // Cancelled 5.5 hours ago
      restaurant: {
        id: user?.id || 'rest_1',
        name: 'Campus Pizza Palace',
        phone: '+1-561-555-0123',
        email: 'pizza@fau.edu',
        schoolId: 'school_1',
        description: 'Authentic Italian pizza',
        callEnabled: true,
        active: true
      },
      orderItems: [
        {
          id: 'item_104',
          orderId: 'order_103',
          menuItemId: 'pizza_002',
          quantity: 1,
          unitPrice: 19.50,
          totalPrice: 19.50,
          menuItem: {
            id: 'pizza_002',
            restaurantId: user?.id || 'rest_1',
            name: 'Pepperoni Pizza',
            description: 'Classic pepperoni with mozzarella',
            price: 19.50,
            category: 'Pizza',
            imageUrl: '',
            available: true
          }
        }
      ]
    }
  ];

  useEffect(() => {
    // Simulate API call to load completed orders
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        orders: mockCompletedOrders,
        loading: false
      }));
    }, 500);
  }, []);

  // Only show completed and cancelled orders
  const completedOrders = state.orders.filter(o => o.status === 'COMPLETED' || o.status === 'CANCELLED');
  
  const statusOptions: { value: 'ALL' | 'COMPLETED' | 'CANCELLED'; label: string; count?: number }[] = [
    { value: 'ALL', label: 'All Finished', count: completedOrders.length },
    { value: 'COMPLETED', label: 'Completed', count: completedOrders.filter(o => o.status === 'COMPLETED').length },
    { value: 'CANCELLED', label: 'Cancelled', count: completedOrders.filter(o => o.status === 'CANCELLED').length }
  ];

  const filteredOrders = completedOrders.filter(order => {
    const matchesStatus = state.selectedStatus === 'ALL' || order.status === state.selectedStatus;
    const matchesSearch = order.id.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
                         order.orderItems.some(item => 
                           item.menuItem.name.toLowerCase().includes(state.searchQuery.toLowerCase())
                         );
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'COMPLETED': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (state.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading completed orders...</p>
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
            <button 
              onClick={() => navigate('/restaurant')}
              className="flex items-center space-x-3 px-6 py-4 border-b-3 border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50 font-medium text-sm transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <span>Active Orders</span>
            </button>
            <button className="flex items-center space-x-3 px-6 py-4 border-b-3 border-orange-500 text-orange-600 bg-orange-50 font-semibold text-sm transition-all duration-200">
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
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border-b border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
            {/* Left side - History info */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">Order History</span>
                </div>
                <div className="h-4 w-px bg-gray-300"></div>
                <span className="text-sm text-gray-600">{completedOrders.length} finished orders</span>
              </div>
            </div>

            {/* Right side - Search and filters */}
            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto lg:min-w-[500px]">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                  </svg>
                  <input
                    type="text"
                    placeholder="Search completed orders..."
                    value={state.searchQuery}
                    onChange={(e) => setState(prev => ({ ...prev, searchQuery: e.target.value }))}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50 focus:bg-white transition-all duration-200"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="relative">
                <select
                  value={state.selectedStatus}
                  onChange={(e) => setState(prev => ({ ...prev, selectedStatus: e.target.value as 'ALL' | 'COMPLETED' | 'CANCELLED' }))}
                  className="appearance-none bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:bg-white transition-all duration-200 text-sm font-medium min-w-[160px]"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label} ({option.count})
                    </option>
                  ))}
                </select>
                <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="max-w-7xl mx-auto p-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No completed orders found</h3>
            <p className="text-gray-600">
              {state.searchQuery || state.selectedStatus !== 'ALL' 
                ? 'Try adjusting your search or filter criteria.' 
                : 'Completed orders will appear here after customers finish their orders.'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map(order => (
              <CompletedOrderCard
                key={order.id}
                order={order}
                onViewDetails={() => setState(prev => ({ 
                  ...prev, 
                  selectedOrder: order, 
                  showOrderDetail: true 
                }))}
                getStatusColor={getStatusColor}
                getTimeAgo={getTimeAgo}
              />
            ))}
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {state.selectedOrder && (
        <CompletedOrderDetailModal
          order={state.selectedOrder}
          isOpen={state.showOrderDetail}
          onClose={() => setState(prev => ({ 
            ...prev, 
            selectedOrder: null, 
            showOrderDetail: false 
          }))}
          getStatusColor={getStatusColor}
          getTimeAgo={getTimeAgo}
        />
      )}
    </div>
  );
};

// Completed Order Card Component
interface CompletedOrderCardProps {
  order: Order;
  onViewDetails: () => void;
  getStatusColor: (status: OrderStatus) => string;
  getTimeAgo: (dateString: string) => string;
}

const CompletedOrderCard: React.FC<CompletedOrderCardProps> = ({
  order,
  onViewDetails,
  getStatusColor,
  getTimeAgo
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Order #{order.id.slice(-6)}</h3>
            <p className="text-sm text-gray-600">{getTimeAgo(order.updatedAt)}</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
            {order.status}
          </div>
        </div>

        {/* Order Items Summary */}
        <div className="mb-3">
          <p className="text-sm text-gray-600 mb-1">
            {order.orderItems.length} item{order.orderItems.length !== 1 ? 's' : ''}
          </p>
          <div className="space-y-1">
            {order.orderItems.slice(0, 2).map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>{item.quantity}x {item.menuItem.name}</span>
                <span className="text-gray-600">${item.totalPrice.toFixed(2)}</span>
              </div>
            ))}
            {order.orderItems.length > 2 && (
              <p className="text-sm text-gray-500">
                +{order.orderItems.length - 2} more item{order.orderItems.length - 2 !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        {/* Special Instructions */}
        {order.specialInstructions && (
          <div className="mb-3 p-2 bg-gray-50 border border-gray-200 rounded">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Note: </span>
              {order.specialInstructions}
            </p>
          </div>
        )}

        {/* Total */}
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-bold text-gray-900">
            Total: ${order.finalAmount.toFixed(2)}
          </span>
          {order.discountAmount > 0 && (
            <span className="text-sm text-green-600">
              -{order.promotionApplied} (${order.discountAmount.toFixed(2)})
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onViewDetails}
            className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
          >
            View Details
          </button>
          {order.status === 'COMPLETED' && (
            <button className="bg-green-100 text-green-700 py-2 px-4 rounded-lg font-medium">
              ✓ Completed
            </button>
          )}
          {order.status === 'CANCELLED' && (
            <button className="bg-red-100 text-red-700 py-2 px-4 rounded-lg font-medium">
              ✗ Cancelled
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Completed Order Detail Modal Component
interface CompletedOrderDetailModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  getStatusColor: (status: OrderStatus) => string;
  getTimeAgo: (dateString: string) => string;
}

const CompletedOrderDetailModal: React.FC<CompletedOrderDetailModalProps> = ({
  order,
  isOpen,
  onClose,
  getStatusColor,
  getTimeAgo
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Order #{order.id.slice(-6)}</h2>
            <p className="text-gray-600">{order.status} {getTimeAgo(order.updatedAt)}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {/* Status */}
          <div className="mb-6">
            <div className={`inline-flex px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
              {order.status}
            </div>
          </div>

          {/* Order Items */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
            <div className="space-y-4">
              {order.orderItems.map(item => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900">{item.menuItem.name}</h4>
                      <p className="text-sm text-gray-600">{item.menuItem.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">Qty: {item.quantity}</p>
                      <p className="text-sm text-gray-600">${item.unitPrice.toFixed(2)} each</p>
                    </div>
                  </div>
                  
                  {/* Modifiers */}
                  {item.modifiersSelected && item.modifiersSelected.length > 0 && (
                    <div className="mb-2">
                      <p className="text-sm font-medium text-gray-700 mb-1">Modifiers:</p>
                      <div className="space-y-1">
                        {item.modifiersSelected.map(modifier => (
                          <div key={`${modifier.groupId}-${modifier.modifierId}`} className="flex justify-between text-sm">
                            <span className="text-gray-600">• {modifier.name}</span>
                            <span className="text-gray-600">
                              {modifier.price > 0 ? `+$${modifier.price.toFixed(2)}` : 'Free'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <span className="font-bold text-gray-900">${item.totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Special Instructions */}
          {order.specialInstructions && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Special Instructions</h3>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-gray-700">{order.specialInstructions}</p>
              </div>
            </div>
          )}

          {/* Order Summary */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${order.totalAmount.toFixed(2)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({order.promotionApplied}):</span>
                  <span>-${order.discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-2">
                <span>Total:</span>
                <span>${order.finalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-4 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default RestaurantCompletedOrders;