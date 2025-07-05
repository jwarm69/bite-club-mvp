import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MenuItem } from '../types';
import MenuItemEditor from './MenuItemEditor';
import apiService from '../services/api';

interface MenuManagerState {
  menuItems: MenuItem[];
  categories: string[];
  selectedCategory: string;
  searchQuery: string;
  showAddItem: boolean;
  editingItem: MenuItem | null;
  loading: boolean;
}

const RestaurantMenuManager: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Check for admin impersonation
  const adminImpersonation = localStorage.getItem('adminImpersonation');
  const isAdminManaging = adminImpersonation && JSON.parse(adminImpersonation).type === 'restaurant-menu';
  const restaurantId = isAdminManaging ? JSON.parse(adminImpersonation).id : user?.id;

  const [restaurantInfo, setRestaurantInfo] = useState<any>(null);

  const [state, setState] = useState<MenuManagerState>({
    menuItems: [],
    categories: ['All Items'],
    selectedCategory: 'All Items',
    searchQuery: '',
    showAddItem: false,
    editingItem: null,
    loading: true
  });


  useEffect(() => {
    const loadMenuItems = async () => {
      try {
        setState(prev => ({ ...prev, loading: true }));
        
        // Use appropriate restaurant ID (admin impersonation or current user)
        const targetRestaurantId = isAdminManaging ? restaurantId : undefined;
        const response = await apiService.getMenuItems(targetRestaurantId);
        
        const menuItems = response.menuItems || [];
        const categories = ['All Items', ...Array.from(new Set(menuItems.map(item => item.category).filter((cat): cat is string => Boolean(cat))))];
        
        setState(prev => ({
          ...prev,
          menuItems,
          categories,
          loading: false
        }));
      } catch (error) {
        console.error('Error loading menu items:', error);
        // Fall back to empty state on error
        setState(prev => ({
          ...prev,
          menuItems: [],
          categories: ['All Items'],
          loading: false
        }));
      }
    };
    
    loadMenuItems();
  }, [isAdminManaging, restaurantId]);

  // Fetch restaurant info when in admin mode
  useEffect(() => {
    const fetchRestaurantInfo = async () => {
      if (isAdminManaging && restaurantId) {
        try {
          const response = await apiService.getRestaurantDetails(restaurantId);
          setRestaurantInfo(response.restaurant);
        } catch (error) {
          console.error('Error fetching restaurant info:', error);
        }
      }
    };

    fetchRestaurantInfo();
  }, [isAdminManaging, restaurantId]);

  const filteredItems = state.menuItems.filter(item => {
    const matchesCategory = state.selectedCategory === 'All Items' || item.category === state.selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
                         item.description?.toLowerCase().includes(state.searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleItemAvailability = async (itemId: string) => {
    try {
      const response = await apiService.toggleMenuItemAvailability(itemId);
      setState(prev => ({
        ...prev,
        menuItems: prev.menuItems.map(item =>
          item.id === itemId ? response.menuItem : item
        )
      }));
    } catch (error) {
      console.error('Error toggling item availability:', error);
      alert('Failed to update item availability. Please try again.');
    }
  };

  const deleteItem = async (itemId: string) => {
    if (window.confirm('Are you sure you want to delete this menu item?')) {
      try {
        await apiService.deleteMenuItem(itemId);
        setState(prev => ({
          ...prev,
          menuItems: prev.menuItems.filter(item => item.id !== itemId)
        }));
      } catch (error) {
        console.error('Error deleting menu item:', error);
        alert('Failed to delete menu item. Please try again.');
      }
    }
  };

  const handleSaveMenuItem = async (item: MenuItem) => {
    try {
      const isEditing = !!item.id && item.id !== '';
      let savedItem: MenuItem;

      if (isEditing) {
        // Update existing item
        const response = await apiService.updateMenuItem(item.id, {
          name: item.name,
          description: item.description,
          price: item.price,
          category: item.category,
          imageUrl: item.imageUrl,
          available: item.available,
          modifiers: item.modifiers
        });
        savedItem = response.menuItem;
      } else {
        // Create new item
        const response = await apiService.createMenuItem({
          name: item.name,
          description: item.description || '',
          price: item.price,
          category: item.category || 'General',
          imageUrl: item.imageUrl || '',
          available: item.available ?? true,
          modifiers: item.modifiers || []
        });
        savedItem = response.menuItem;
      }

      setState(prev => {
        let updatedItems;
        
        if (isEditing) {
          updatedItems = prev.menuItems.map(existing => 
            existing.id === item.id ? savedItem : existing
          );
        } else {
          updatedItems = [...prev.menuItems, savedItem];
        }

        // Update categories if needed
        const categories = ['All Items', ...Array.from(new Set(updatedItems.map(item => item.category).filter((cat): cat is string => Boolean(cat))))];

        return {
          ...prev,
          menuItems: updatedItems,
          categories,
          showAddItem: false,
          editingItem: null
        };
      });
    } catch (error) {
      console.error('Error saving menu item:', error);
      alert('Failed to save menu item. Please try again.');
    }
  };

  const getItemStatusColor = (available: boolean) => {
    return available ? 'text-green-600 bg-green-50 border-green-200' : 'text-red-600 bg-red-50 border-red-200';
  };

  const exitAdminView = () => {
    localStorage.removeItem('adminImpersonation');
    window.close(); // Close the admin popup
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Impersonation Banner */}
      {isAdminManaging && (
        <div className="bg-purple-600 text-white px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span className="font-medium">Admin View: Managing Menu for</span>
              {restaurantInfo ? (
                <div className="flex items-center space-x-2">
                  <span className="bg-purple-700 px-3 py-1 rounded text-sm font-semibold">
                    {restaurantInfo.name}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    restaurantInfo.active ? 'bg-green-500' : 'bg-yellow-500'
                  }`}>
                    {restaurantInfo.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ) : (
                <span className="bg-purple-700 px-2 py-1 rounded text-sm">Loading...</span>
              )}
            </div>
            <button
              onClick={exitAdminView}
              className="flex items-center space-x-2 bg-purple-700 hover:bg-purple-800 px-3 py-1 rounded transition-colors"
            >
              <span className="text-sm">Exit Admin View</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

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
            <div className="flex items-center space-x-8">
              <div className="hidden md:flex items-center space-x-4">
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
            <button className="flex items-center space-x-3 px-6 py-4 border-b-3 border-orange-500 text-orange-600 bg-orange-50 font-semibold text-sm transition-all duration-200">
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
          <h1 className="text-lg font-bold text-gray-900">Menu Management</h1>
          
          <button
            onClick={() => setState(prev => ({ ...prev, showAddItem: true }))}
            className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
          >
            + Add Item
          </button>
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
                  placeholder="Search menu items..."
                  value={state.searchQuery}
                  onChange={(e) => setState(prev => ({ ...prev, searchQuery: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>

            {/* Category Filter */}
            <select
              value={state.selectedCategory}
              onChange={(e) => setState(prev => ({ ...prev, selectedCategory: e.target.value }))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
            >
              {state.categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Menu Items Grid */}
      <div className="p-4">
        {state.loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading menu items...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No menu items found</h3>
            <p className="text-gray-600 mb-6">
              {state.searchQuery || state.selectedCategory !== 'All Items' 
                ? 'Try adjusting your search or filter criteria.' 
                : 'Get started by adding your first menu item.'
              }
            </p>
            <button
              onClick={() => setState(prev => ({ ...prev, showAddItem: true }))}
              className="btn-primary"
            >
              Add First Menu Item
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map(item => (
              <MenuItemCard
                key={item.id}
                item={item}
                onToggleAvailability={() => toggleItemAvailability(item.id)}
                onEdit={() => setState(prev => ({ ...prev, editingItem: item }))}
                onDelete={() => deleteItem(item.id)}
                getStatusColor={getItemStatusColor}
              />
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="fixed bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg border p-4">
        <div className="flex justify-around text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900">{state.menuItems.length}</p>
            <p className="text-sm text-gray-600">Total Items</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">
              {state.menuItems.filter(item => item.available).length}
            </p>
            <p className="text-sm text-gray-600">Available</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-600">
              {state.menuItems.filter(item => !item.available).length}
            </p>
            <p className="text-sm text-gray-600">Unavailable</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-600">{state.categories.length - 1}</p>
            <p className="text-sm text-gray-600">Categories</p>
          </div>
        </div>
      </div>

      {/* Spacing for fixed stats */}
      <div className="h-24"></div>

      {/* Menu Item Editor Modal */}
      <MenuItemEditor
        item={state.showAddItem ? null : state.editingItem}
        isOpen={state.showAddItem || state.editingItem !== null}
        onClose={() => setState(prev => ({ ...prev, showAddItem: false, editingItem: null }))}
        onSave={handleSaveMenuItem}
      />
    </div>
  );
};

// Menu Item Card Component
interface MenuItemCardProps {
  item: MenuItem;
  onToggleAvailability: () => void;
  onEdit: () => void;
  onDelete: () => void;
  getStatusColor: (available: boolean) => string;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({
  item,
  onToggleAvailability,
  onEdit,
  onDelete,
  getStatusColor
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      {/* Image placeholder */}
      <div className="h-48 bg-gray-200 flex items-center justify-center relative">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
            <p className="text-sm text-gray-500">No image</p>
          </div>
        )}
        
        {/* Status badge */}
        <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(item.available)}`}>
          {item.available ? 'Available' : 'Unavailable'}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{item.name}</h3>
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{item.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-primary-500">${item.price.toFixed(2)}</span>
              <span className="text-sm text-gray-500">{item.category}</span>
            </div>
          </div>
        </div>

        {/* Modifiers info */}
        {item.modifiers && item.modifiers.length > 0 && (
          <div className="mb-3 p-2 bg-gray-50 rounded text-sm">
            <span className="font-medium text-gray-700">Modifiers: </span>
            <span className="text-gray-600">
              {item.modifiers.map(group => group.name).join(', ')}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onToggleAvailability}
            className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
              item.available
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {item.available ? 'Disable' : 'Enable'}
          </button>
          <button
            onClick={onEdit}
            className="flex-1 py-2 px-3 bg-blue-100 text-blue-700 rounded text-sm font-medium hover:bg-blue-200 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="py-2 px-3 bg-gray-100 text-gray-700 rounded text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RestaurantMenuManager;