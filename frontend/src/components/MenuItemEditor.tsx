import React, { useState, useEffect } from 'react';
import { MenuItem, ModifierGroup, Modifier } from '../types';

interface MenuItemEditorProps {
  item?: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: MenuItem) => void;
}

interface FormData {
  name: string;
  description: string;
  price: string;
  category: string;
  imageUrl: string;
  available: boolean;
  modifiers: ModifierGroup[];
}

interface FormErrors {
  name?: string;
  price?: string;
  category?: string;
  modifiers?: string;
}

const MenuItemEditor: React.FC<MenuItemEditorProps> = ({
  item,
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    price: '',
    category: '',
    imageUrl: '',
    available: true,
    modifiers: []
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string>('');
  const [saveSuccess, setSaveSuccess] = useState<string>('');
  const [showModifierBuilder, setShowModifierBuilder] = useState(false);
  const [editingModifierGroup, setEditingModifierGroup] = useState<ModifierGroup | null>(null);

  // Common categories for quick selection
  const commonCategories = [
    'Appetizers', 'Salads', 'Sandwiches', 'Burgers', 'Pizza', 'Pasta',
    'Entrees', 'Sides', 'Desserts', 'Beverages', 'Specials'
  ];

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        description: item.description || '',
        price: item.price.toString(),
        category: item.category || '',
        imageUrl: item.imageUrl || '',
        available: item.available,
        modifiers: item.modifiers || []
      });
    } else {
      setFormData({
        name: '',
        description: '',
        price: '',
        category: '',
        imageUrl: '',
        available: true,
        modifiers: []
      });
    }
    setErrors({});
    setSaveError('');
    setSaveSuccess('');
  }, [item, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Item name is required';
    }

    if (!formData.price || isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Valid price is required';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }

    // Validate modifier groups
    for (const group of formData.modifiers) {
      if (!group.name.trim()) {
        newErrors.modifiers = 'All modifier groups must have names';
        break;
      }
      if (group.modifiers.length === 0) {
        newErrors.modifiers = 'All modifier groups must have at least one option';
        break;
      }
      for (const modifier of group.modifiers) {
        if (!modifier.name.trim()) {
          newErrors.modifiers = 'All modifier options must have names';
          break;
        }
        if (isNaN(modifier.price) || modifier.price < 0) {
          newErrors.modifiers = 'All modifier prices must be valid numbers';
          break;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSaveError('');
    setSaveSuccess('');

    try {
      const menuItem: MenuItem = {
        id: item?.id || `temp_${Date.now()}`,
        restaurantId: item?.restaurantId || 'current_restaurant',
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        category: formData.category.trim(),
        imageUrl: formData.imageUrl.trim(),
        available: formData.available,
        modifiers: formData.modifiers
      };

      await onSave(menuItem);
      setSaveSuccess(item ? 'Menu item updated successfully!' : 'Menu item created successfully!');
      
      // Auto-close after success with delay to show success message
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error: any) {
      console.error('Error saving menu item:', error);
      setSaveError(
        error.response?.data?.error || 
        error.message || 
        'Failed to save menu item. Please check your connection and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddModifierGroup = () => {
    const newGroup: ModifierGroup = {
      id: `group_${Date.now()}`,
      name: '',
      required: false,
      multiSelect: false,
      modifiers: []
    };
    setEditingModifierGroup(newGroup);
    setShowModifierBuilder(true);
  };

  const handleEditModifierGroup = (group: ModifierGroup) => {
    setEditingModifierGroup(group);
    setShowModifierBuilder(true);
  };

  const handleSaveModifierGroup = (group: ModifierGroup) => {
    setFormData(prev => ({
      ...prev,
      modifiers: editingModifierGroup?.id && prev.modifiers.find(g => g.id === editingModifierGroup.id)
        ? prev.modifiers.map(g => g.id === group.id ? group : g)
        : [...prev.modifiers, group]
    }));
    setShowModifierBuilder(false);
    setEditingModifierGroup(null);
  };

  const handleDeleteModifierGroup = (groupId: string) => {
    if (window.confirm('Are you sure you want to delete this modifier group?')) {
      setFormData(prev => ({
        ...prev,
        modifiers: prev.modifiers.filter(g => g.id !== groupId)
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg sm:text-2xl font-bold text-gray-900">
            {item ? 'Edit Menu Item' : 'Add New Menu Item'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 -m-2 touch-manipulation"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Success/Error Messages */}
          {(saveSuccess || saveError) && (
            <div className="px-6 pt-6">
              {saveSuccess && (
                <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                  ✅ {saveSuccess}
                </div>
              )}
              {saveError && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                  ❌ {saveError}
                </div>
              )}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* Item Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Item Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-base ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter item name"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              {/* Price */}
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                  Price ($) *
                </label>
                <input
                  type="number"
                  id="price"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-base ${
                    errors.price ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
                {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Describe your menu item..."
              />
            </div>

            {/* Category and Availability */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.category ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter or select category"
                  />
                  <div className="flex flex-wrap gap-2">
                    {commonCategories.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, category: cat }))}
                        className={`px-3 py-2 text-sm rounded-full border transition-colors touch-manipulation ${
                          formData.category === cat
                            ? 'bg-primary-500 text-white border-primary-500'
                            : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 active:bg-gray-300'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
              </div>

              {/* Availability */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Availability
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.available}
                      onChange={(e) => setFormData(prev => ({ ...prev, available: e.target.checked }))}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Item is available for ordering</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Image URL */}
            <div>
              <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-2">
                Image URL
              </label>
              <input
                type="url"
                id="imageUrl"
                value={formData.imageUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            {/* Modifiers Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Modifiers & Options</h3>
                <button
                  type="button"
                  onClick={handleAddModifierGroup}
                  className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors text-sm"
                >
                  + Add Modifier Group
                </button>
              </div>

              {errors.modifiers && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{errors.modifiers}</p>
                </div>
              )}

              {/* Modifier Groups List */}
              <div className="space-y-4">
                {formData.modifiers.map((group, index) => (
                  <div key={group.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{group.name || `Modifier Group ${index + 1}`}</h4>
                        <p className="text-sm text-gray-600">
                          {group.required ? 'Required' : 'Optional'} • 
                          {group.multiSelect ? ' Multiple selections' : ' Single selection'} • 
                          {group.modifiers.length} option{group.modifiers.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditModifierGroup(group)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteModifierGroup(group.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {group.modifiers.map(modifier => (
                        <div key={modifier.id} className="text-xs bg-gray-50 rounded p-2">
                          <div className="font-medium">{modifier.name}</div>
                          <div className="text-gray-600">
                            {modifier.price > 0 ? `+$${modifier.price.toFixed(2)}` : 'Free'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {formData.modifiers.length === 0 && (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                    </svg>
                    <p className="text-gray-600 mb-4">No modifier groups added yet</p>
                    <button
                      type="button"
                      onClick={handleAddModifierGroup}
                      className="text-primary-600 hover:text-primary-800 font-medium"
                    >
                      Add your first modifier group
                    </button>
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 p-4 sm:p-6 border-t border-gray-200 safe-area-inset-bottom">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors font-medium touch-manipulation"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 active:bg-primary-700 transition-colors disabled:opacity-50 font-medium touch-manipulation"
          >
            {isSubmitting ? 'Saving...' : item ? 'Update Item' : 'Add Item'}
          </button>
        </div>
      </div>

      {/* Modifier Builder Modal */}
      {showModifierBuilder && (
        <ModifierBuilder
          group={editingModifierGroup}
          onSave={handleSaveModifierGroup}
          onCancel={() => {
            setShowModifierBuilder(false);
            setEditingModifierGroup(null);
          }}
        />
      )}
    </div>
  );
};

// Modifier Builder Component
interface ModifierBuilderProps {
  group: ModifierGroup | null;
  onSave: (group: ModifierGroup) => void;
  onCancel: () => void;
}

const ModifierBuilder: React.FC<ModifierBuilderProps> = ({ group, onSave, onCancel }) => {
  const [formData, setFormData] = useState<ModifierGroup>({
    id: '',
    name: '',
    required: false,
    multiSelect: false,
    modifiers: []
  });

  const [newModifier, setNewModifier] = useState<Partial<Modifier>>({
    name: '',
    price: 0,
    available: true
  });

  useEffect(() => {
    if (group) {
      setFormData(group);
    }
  }, [group]);

  const handleAddModifier = () => {
    if (!newModifier.name?.trim()) return;

    const modifier: Modifier = {
      id: `mod_${Date.now()}`,
      name: newModifier.name.trim(),
      price: Number(newModifier.price) || 0,
      available: newModifier.available ?? true
    };

    setFormData(prev => ({
      ...prev,
      modifiers: [...prev.modifiers, modifier]
    }));

    setNewModifier({ name: '', price: 0, available: true });
  };

  const handleRemoveModifier = (modifierId: string) => {
    setFormData(prev => ({
      ...prev,
      modifiers: prev.modifiers.filter(m => m.id !== modifierId)
    }));
  };

  const handleSave = () => {
    if (!formData.name.trim() || formData.modifiers.length === 0) return;

    const groupToSave: ModifierGroup = {
      ...formData,
      id: formData.id || `group_${Date.now()}`,
      name: formData.name.trim()
    };

    onSave(groupToSave);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] sm:max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">
            {group?.id ? 'Edit Modifier Group' : 'Add Modifier Group'}
          </h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Group Settings */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Group Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., Size, Toppings, Add-ons"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.required}
                  onChange={(e) => setFormData(prev => ({ ...prev, required: e.target.checked }))}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">Required selection</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.multiSelect}
                  onChange={(e) => setFormData(prev => ({ ...prev, multiSelect: e.target.checked }))}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">Allow multiple selections</span>
              </label>
            </div>

            {formData.multiSelect && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min Selections
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minSelections || 0}
                    onChange={(e) => setFormData(prev => ({ ...prev, minSelections: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Selections
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxSelections || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxSelections: parseInt(e.target.value) || undefined }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Add New Modifier */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Modifier Options</h4>
            
            <div className="grid grid-cols-12 gap-3 mb-4">
              <div className="col-span-6">
                <input
                  type="text"
                  value={newModifier.name}
                  onChange={(e) => setNewModifier(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Option name"
                />
              </div>
              <div className="col-span-3">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newModifier.price}
                  onChange={(e) => setNewModifier(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Price"
                />
              </div>
              <div className="col-span-3">
                <button
                  type="button"
                  onClick={handleAddModifier}
                  className="w-full bg-primary-500 text-white py-2 rounded-lg hover:bg-primary-600 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Modifier List */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {formData.modifiers.map(modifier => (
                <div key={modifier.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium">{modifier.name}</span>
                    <span className="ml-2 text-gray-600">
                      {modifier.price > 0 ? `+$${modifier.price.toFixed(2)}` : 'Free'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveModifier(modifier.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}

              {formData.modifiers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No options added yet</p>
                  <p className="text-sm">Add options above to get started</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 p-6 border-t border-gray-200">
          <button
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!formData.name.trim() || formData.modifiers.length === 0}
            className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
          >
            Save Group
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuItemEditor;