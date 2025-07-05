import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Order } from '../types';
import apiService from '../services/api';

type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';

interface OrderManagerState {
  orders: Order[];
  selectedStatus: OrderStatus | 'ALL';
  searchQuery: string;
  selectedOrder: Order | null;
  showOrderDetail: boolean;
  loading: boolean;
}

const RestaurantOrderManager: React.FC = () => {
  const navigate = useNavigate();
  const [state, setState] = useState<OrderManagerState>({
    orders: [],
    selectedStatus: 'ALL',
    searchQuery: '',
    selectedOrder: null,
    showOrderDetail: false,
    loading: true
  });

  // Component uses real API data - mock data removed

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      // Load all restaurant orders
      const response = await apiService.getRestaurantOrders();
      
      setState(prev => ({
        ...prev,
        orders: response.orders,
        loading: false
      }));
    } catch (error) {
      console.error('Error loading orders:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const statusOptions: { value: OrderStatus | 'ALL'; label: string; count?: number }[] = [
    { value: 'ALL', label: 'All Orders', count: state.orders.length },
    { value: 'PENDING', label: 'Pending', count: state.orders.filter(o => o.status === 'PENDING').length },
    { value: 'CONFIRMED', label: 'Confirmed', count: state.orders.filter(o => o.status === 'CONFIRMED').length },
    { value: 'PREPARING', label: 'Preparing', count: state.orders.filter(o => o.status === 'PREPARING').length },
    { value: 'READY', label: 'Ready', count: state.orders.filter(o => o.status === 'READY').length },
    { value: 'COMPLETED', label: 'Completed', count: state.orders.filter(o => o.status === 'COMPLETED').length }
  ];

  const filteredOrders = state.orders.filter(order => {
    const matchesStatus = state.selectedStatus === 'ALL' || order.status === state.selectedStatus;
    const matchesSearch = order.id.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
                         order.orderItems.some(item => 
                           item.menuItem.name.toLowerCase().includes(state.searchQuery.toLowerCase())
                         );
    return matchesStatus && matchesSearch;
  });

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setState(prev => ({
      ...prev,
      orders: prev.orders.map(order =>
        order.id === orderId 
          ? { ...order, status: newStatus, updatedAt: new Date().toISOString() }
          : order
      )
    }));
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PREPARING': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'READY': return 'bg-green-100 text-green-800 border-green-200';
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
          <p className="mt-4 text-gray-600">Loading orders...</p>
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
          
          <h1 className="text-lg font-bold text-gray-900">Order Management</h1>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Auto-refresh</span>
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <input
                  type="text"
                  placeholder="Search orders by ID or item..."
                  value={state.searchQuery}
                  onChange={(e) => setState(prev => ({ ...prev, searchQuery: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <select
              value={state.selectedStatus}
              onChange={(e) => setState(prev => ({ ...prev, selectedStatus: e.target.value as OrderStatus | 'ALL' }))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label} ({option.count})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="p-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-600">
              {state.searchQuery || state.selectedStatus !== 'ALL' 
                ? 'Try adjusting your search or filter criteria.' 
                : 'New orders will appear here when customers place them.'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                onStatusUpdate={updateOrderStatus}
                onViewDetails={() => setState(prev => ({ 
                  ...prev, 
                  selectedOrder: order, 
                  showOrderDetail: true 
                }))}
                getStatusColor={getStatusColor}
                getTimeAgo={getTimeAgo}
                onRefresh={loadOrders}
              />
            ))}
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {state.selectedOrder && (
        <OrderDetailModal
          order={state.selectedOrder}
          isOpen={state.showOrderDetail}
          onClose={() => setState(prev => ({ 
            ...prev, 
            selectedOrder: null, 
            showOrderDetail: false 
          }))}
          onStatusUpdate={updateOrderStatus}
          getStatusColor={getStatusColor}
          getTimeAgo={getTimeAgo}
        />
      )}
    </div>
  );
};

// Order Card Component
interface OrderCardProps {
  order: Order;
  onStatusUpdate: (orderId: string, status: OrderStatus) => void;
  onViewDetails: () => void;
  getStatusColor: (status: OrderStatus) => string;
  getTimeAgo: (dateString: string) => string;
  onRefresh: () => void;
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onStatusUpdate,
  onViewDetails,
  getStatusColor,
  getTimeAgo,
  onRefresh
}) => {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleOrderAction = async (action: 'accept' | 'reject' | 'closeout', reason?: string) => {
    setActionLoading(action);
    try {
      switch (action) {
        case 'accept':
          await apiService.acceptOrder(order.id);
          alert(`✅ Order accepted! Student charged $${Number(order.finalAmount).toFixed(2)}`);
          break;
        case 'reject':
          await apiService.rejectOrder(order.id, reason);
          alert('❌ Order rejected. Student was not charged.');
          break;
        case 'closeout':
          await apiService.closeoutOrder(order.id);
          alert('🏁 Order completed!');
          break;
      }
      
      // Trigger refresh to show updated orders
      onRefresh();
    } catch (error) {
      console.error(`Error ${action}ing order:`, error);
      alert(`Failed to ${action} order. Please try again.`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="p-4">
        {/* Header with Order Info and Status */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Order #{order.id.slice(-6)}</h3>
            <p className="text-sm text-gray-600">{getTimeAgo(order.createdAt)}</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
            {order.status}
          </div>
        </div>

        {/* Customer Contact Info - PROMINENT */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">📞 Customer Contact</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div>
              <span className="font-medium text-blue-800">Name: </span>
              <span className="text-blue-700">
                {order.user?.firstName || ''} {order.user?.lastName || ''} 
                {(!order.user?.firstName && !order.user?.lastName) && 'Not provided'}
              </span>
            </div>
            <div>
              <span className="font-medium text-blue-800">Phone: </span>
              <span className="text-blue-700">
                {order.user?.phone || 'Not provided'}
              </span>
            </div>
            <div className="sm:col-span-2">
              <span className="font-medium text-blue-800">Email: </span>
              <span className="text-blue-700">{order.user?.email || 'Not provided'}</span>
            </div>
          </div>
        </div>

        {/* Order Items with Modifiers */}
        <div className="mb-4">
          <h4 className="font-semibold text-gray-900 mb-2">Order Items</h4>
          <div className="space-y-3">
            {order.orderItems.map(item => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-medium text-gray-900">
                      {item.quantity}x {item.menuItem.name}
                    </span>
                    {item.customInstructions && (
                      <p className="text-sm text-gray-600 italic mt-1">
                        Special: {item.customInstructions}
                      </p>
                    )}
                  </div>
                  <span className="font-medium text-gray-900">
                    ${Number(item.totalPrice).toFixed(2)}
                  </span>
                </div>
                
                {/* Display Modifiers Clearly */}
                {item.modifiersSelected && item.modifiersSelected.length > 0 && (
                  <div className="mt-2 p-2 bg-gray-50 rounded border-l-4 border-gray-300">
                    <p className="text-xs font-medium text-gray-700 mb-1">Modifiers:</p>
                    <div className="space-y-1">
                      {item.modifiersSelected.map((modifier: any, index: number) => (
                        <div key={`${modifier.groupId}-${modifier.modifierId}`} className="flex justify-between text-sm">
                          <span className="text-gray-600">• {modifier.name}</span>
                          <span className="text-gray-500">
                            {modifier.price > 0 ? `+$${Number(modifier.price).toFixed(2)}` : 'Free'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Special Instructions */}
        {order.specialInstructions && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-semibold text-yellow-800 mb-1">📝 Special Instructions</h4>
            <p className="text-sm text-yellow-700">{order.specialInstructions}</p>
          </div>
        )}

        {/* Total */}
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-green-900">
              Total: ${Number(order.finalAmount).toFixed(2)}
            </span>
            {order.discountAmount > 0 && (
              <span className="text-sm text-green-600 font-medium">
                Discount: -${Number(order.discountAmount).toFixed(2)} ({order.promotionApplied})
              </span>
            )}
          </div>
        </div>

        {/* Simplified Action Buttons */}
        <div className="space-y-2">
          {order.status === 'PENDING' && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleOrderAction('accept')}
                disabled={actionLoading === 'accept'}
                className="bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 transition-colors font-medium disabled:opacity-50"
              >
                {actionLoading === 'accept' ? 'Processing...' : '✅ ACCEPT & CHARGE'}
              </button>
              <button
                onClick={() => {
                  const reason = prompt('Reason for rejection (optional):');
                  handleOrderAction('reject', reason || undefined);
                }}
                disabled={actionLoading === 'reject'}
                className="bg-red-500 text-white py-3 px-4 rounded-lg hover:bg-red-600 transition-colors font-medium disabled:opacity-50"
              >
                {actionLoading === 'reject' ? 'Processing...' : '❌ REJECT'}
              </button>
            </div>
          )}
          
          {order.status === 'CONFIRMED' && (
            <button
              onClick={() => handleOrderAction('closeout')}
              disabled={actionLoading === 'closeout'}
              className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50"
            >
              {actionLoading === 'closeout' ? 'Processing...' : '🏁 CLOSEOUT (Order Complete)'}
            </button>
          )}

          {(order.status === 'COMPLETED' || order.status === 'CANCELLED') && (
            <div className="text-center py-2">
              <span className="text-gray-500 font-medium">
                {order.status === 'COMPLETED' ? '✅ Order Completed' : '❌ Order Cancelled'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Order Detail Modal Component
interface OrderDetailModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: (orderId: string, status: OrderStatus) => void;
  getStatusColor: (status: OrderStatus) => string;
  getTimeAgo: (dateString: string) => string;
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  isOpen,
  onClose,
  onStatusUpdate,
  getStatusColor,
  getTimeAgo
}) => {
  if (!isOpen) return null;

  const statusFlow: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED'];
  const currentIndex = statusFlow.indexOf(order.status);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Order #{order.id.slice(-6)}</h2>
            <p className="text-gray-600">{getTimeAgo(order.createdAt)}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {/* Status Timeline */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status</h3>
            <div className="flex items-center justify-between">
              {statusFlow.map((status, index) => (
                <div key={status} className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    index <= currentIndex 
                      ? 'bg-primary-500 text-white' 
                      : 'bg-gray-200 text-gray-400'
                  }`}>
                    {index < currentIndex ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <span className="text-xs font-bold">{index + 1}</span>
                    )}
                  </div>
                  <span className="text-xs mt-1 text-center">{status}</span>
                  {index < statusFlow.length - 1 && (
                    <div className={`w-16 h-0.5 mt-2 ${
                      index < currentIndex ? 'bg-primary-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
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
                      <p className="text-sm text-gray-600">${Number(item.unitPrice).toFixed(2)} each</p>
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
                              {modifier.price > 0 ? `+$${Number(modifier.price).toFixed(2)}` : 'Free'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Custom Instructions */}
                  {item.customInstructions && (
                    <div className="mb-2">
                      <p className="text-sm font-medium text-gray-700">Instructions:</p>
                      <p className="text-sm text-gray-600">{item.customInstructions}</p>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <span className="font-bold text-gray-900">${Number(item.totalPrice).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Special Instructions */}
          {order.specialInstructions && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Special Instructions</h3>
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800">{order.specialInstructions}</p>
              </div>
            </div>
          )}

          {/* Order Summary */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${Number(order.totalAmount).toFixed(2)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({order.promotionApplied}):</span>
                  <span>-${Number(order.discountAmount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-2">
                <span>Total:</span>
                <span>${Number(order.finalAmount).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-4 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
            <div className="flex gap-2">
              {order.status === 'PENDING' && (
                <button
                  onClick={() => {
                    onStatusUpdate(order.id, 'CANCELLED');
                    onClose();
                  }}
                  className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Cancel Order
                </button>
              )}
              {statusFlow[currentIndex + 1] && (
                <button
                  onClick={() => {
                    onStatusUpdate(order.id, statusFlow[currentIndex + 1]);
                    onClose();
                  }}
                  className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                  Mark as {statusFlow[currentIndex + 1]}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RestaurantOrderManager;