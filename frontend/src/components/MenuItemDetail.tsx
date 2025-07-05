import React, { useState, useEffect } from 'react';
import { MenuItem, ModifierGroup, SelectedModifier } from '../types';

interface MenuItemDetailProps {
  item: MenuItem;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: MenuItem, modifiers: SelectedModifier[], instructions: string, quantity: number) => void;
}

const MenuItemDetail: React.FC<MenuItemDetailProps> = ({ 
  item, 
  isOpen, 
  onClose, 
  onAddToCart 
}) => {
  const [selectedModifiers, setSelectedModifiers] = useState<SelectedModifier[]>([]);
  const [customInstructions, setCustomInstructions] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [errors, setErrors] = useState<string[]>([]);

  // Parse modifiers safely
  const getModifiers = () => {
    if (!item.modifiers) return [];
    
    // If it's already an array, return it
    if (Array.isArray(item.modifiers)) return item.modifiers;
    
    // If it's a JSON string, try to parse it
    if (typeof item.modifiers === 'string') {
      try {
        const parsed = JSON.parse(item.modifiers);
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        console.error('[MENU_ITEM_DETAIL] Error parsing modifiers:', error);
        return [];
      }
    }
    
    return [];
  };

  const modifiers = getModifiers();

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedModifiers([]);
      setCustomInstructions('');
      setQuantity(1);
      setErrors([]);
    }
  }, [isOpen]);

  const handleModifierChange = (group: ModifierGroup, modifierId: string, modifierName: string, modifierPrice: number) => {
    setSelectedModifiers(prev => {
      let newModifiers = [...prev];
      
      if (group.multiSelect) {
        // Multi-select: toggle the modifier
        const existingIndex = newModifiers.findIndex(m => m.groupId === group.id && m.modifierId === modifierId);
        if (existingIndex >= 0) {
          newModifiers.splice(existingIndex, 1);
        } else {
          // Check max selections
          const groupSelections = newModifiers.filter(m => m.groupId === group.id);
          if (!group.maxSelections || groupSelections.length < group.maxSelections) {
            newModifiers.push({
              groupId: group.id,
              modifierId,
              name: modifierName,
              price: modifierPrice
            });
          }
        }
      } else {
        // Single-select: replace any existing selection for this group
        newModifiers = newModifiers.filter(m => m.groupId !== group.id);
        newModifiers.push({
          groupId: group.id,
          modifierId,
          name: modifierName,
          price: modifierPrice
        });
      }
      
      return newModifiers;
    });
  };

  const validateSelections = (): boolean => {
    const newErrors: string[] = [];
    
    if (!modifiers || modifiers.length === 0) return true;
    
    for (const group of modifiers) {
      const groupSelections = selectedModifiers.filter(m => m.groupId === group.id);
      
      if (group.required && groupSelections.length === 0) {
        newErrors.push(`Please select an option for ${group.name}`);
      }
      
      if (group.minSelections && groupSelections.length < group.minSelections) {
        newErrors.push(`Please select at least ${group.minSelections} option(s) for ${group.name}`);
      }
    }
    
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const calculateTotalPrice = (): number => {
    const modifierTotal = selectedModifiers.reduce((total, mod) => total + mod.price, 0);
    return (Number(item.price) + modifierTotal) * quantity;
  };

  const handleAddToCart = () => {
    if (validateSelections()) {
      onAddToCart(item, selectedModifiers, customInstructions, quantity);
      onClose();
    }
  };

  const isModifierSelected = (groupId: string, modifierId: string): boolean => {
    return selectedModifiers.some(m => m.groupId === groupId && m.modifierId === modifierId);
  };

  const getGroupSelectionCount = (groupId: string): number => {
    return selectedModifiers.filter(m => m.groupId === groupId).length;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-20">
      <div className="bg-white w-full max-h-[90vh] rounded-t-2xl overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">{item.name}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[70vh] p-4">
          {/* Item Description */}
          {item.description && (
            <p className="text-gray-600 mb-4">{item.description}</p>
          )}

          {/* Base Price */}
          <div className="bg-gray-50 rounded-lg p-3 mb-6">
            <div className="flex justify-between items-center">
              <span className="font-medium">Base Price</span>
              <span className="font-bold text-primary-500">${Number(item.price).toFixed(2)}</span>
            </div>
          </div>

          {/* Modifier Groups */}
          {modifiers && modifiers.length > 0 && modifiers.map((group) => (
            <div key={group.id} className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  {group.name}
                  {group.required && <span className="text-red-500 ml-1">*</span>}
                </h3>
                {group.multiSelect && group.maxSelections && (
                  <span className="text-sm text-gray-500">
                    Max {group.maxSelections}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {group.modifiers.map((modifier: any) => {
                  const isSelected = isModifierSelected(group.id, modifier.id);
                  const groupCount = getGroupSelectionCount(group.id);
                  const isDisabled = !modifier.available || 
                    (group.maxSelections ? (!isSelected && groupCount >= group.maxSelections) : false);

                  return (
                    <button
                      key={modifier.id}
                      onClick={() => !isDisabled && handleModifierChange(group, modifier.id, modifier.name, modifier.price)}
                      disabled={isDisabled}
                      className={`w-full p-3 rounded-lg border text-left transition-colors ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50'
                          : isDisabled
                          ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                            isSelected
                              ? 'border-primary-500 bg-primary-500'
                              : 'border-gray-300'
                          }`}>
                            {isSelected && (
                              <div className="w-full h-full rounded-full bg-white border border-primary-500"></div>
                            )}
                          </div>
                          <span className={`font-medium ${isDisabled ? 'text-gray-400' : 'text-gray-900'}`}>
                            {modifier.name}
                          </span>
                        </div>
                        <span className={`font-medium ${
                          modifier.price > 0 
                            ? (isDisabled ? 'text-gray-400' : 'text-primary-500') 
                            : 'text-gray-500'
                        }`}>
                          {modifier.price > 0 ? `+$${modifier.price.toFixed(2)}` : 'Free'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Custom Instructions */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Special Instructions</h3>
            <textarea
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="Any special requests or modifications..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:border-primary-500"
              rows={3}
            />
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              {errors.map((error, index) => (
                <p key={index} className="text-red-600 text-sm">{error}</p>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
          {/* Quantity Selector */}
          <div className="flex items-center justify-center mb-4">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <span className="mx-6 text-lg font-semibold">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            className="w-full bg-primary-500 text-white py-3 rounded-lg font-semibold hover:bg-primary-600 transition-colors flex items-center justify-between"
          >
            <span>Add to Cart</span>
            <span>${calculateTotalPrice().toFixed(2)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuItemDetail;