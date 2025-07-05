import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Cart, CartItem, MenuItem, SelectedModifier } from '../types';

interface CartContextType {
  cart: Cart;
  addToCart: (item: MenuItem, modifiers?: SelectedModifier[], instructions?: string, quantity?: number) => void;
  removeFromCart: (itemIndex: number) => void;
  updateQuantity: (itemIndex: number, newQuantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartItemCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cart, setCart] = useState<Cart>({
    items: [],
    totalAmount: 0,
    restaurantId: undefined
  });

  const addToCart = (
    menuItem: MenuItem, 
    selectedModifiers: SelectedModifier[] = [], 
    customInstructions = '', 
    quantity = 1
  ) => {
    console.log('[CART_CONTEXT] Adding to cart:', { menuItem: menuItem.name, quantity, modifiers: selectedModifiers.length });
    
    const modifierTotal = selectedModifiers.reduce((total, mod) => total + mod.price, 0);
    const itemTotal = (Number(menuItem.price) + modifierTotal) * quantity;

    const cartItem: CartItem = {
      menuItem,
      quantity,
      selectedModifiers,
      customInstructions,
      totalPrice: itemTotal
    };

    setCart(prevCart => {
      console.log('[CART_CONTEXT] Previous cart:', prevCart);
      
      // If adding from a different restaurant, clear the cart first
      if (prevCart.restaurantId && prevCart.restaurantId !== menuItem.restaurantId) {
        if (window.confirm('Adding items from a different restaurant will clear your current cart. Continue?')) {
          const newCart = {
            items: [cartItem],
            totalAmount: itemTotal,
            restaurantId: menuItem.restaurantId
          };
          console.log('[CART_CONTEXT] New restaurant cart:', newCart);
          return newCart;
        } else {
          return prevCart; // Don't add the item
        }
      }

      const newCart = {
        items: [...prevCart.items, cartItem],
        totalAmount: prevCart.totalAmount + itemTotal,
        restaurantId: menuItem.restaurantId
      };
      
      console.log('[CART_CONTEXT] Updated cart:', newCart);
      return newCart;
    });
  };

  const removeFromCart = (itemIndex: number) => {
    setCart(prevCart => {
      const newItems = [...prevCart.items];
      const removedItem = newItems.splice(itemIndex, 1)[0];
      const newTotal = prevCart.totalAmount - removedItem.totalPrice;

      return {
        items: newItems,
        totalAmount: Math.max(0, newTotal),
        restaurantId: newItems.length > 0 ? prevCart.restaurantId : undefined
      };
    });
  };

  const updateQuantity = (itemIndex: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemIndex);
      return;
    }

    setCart(prevCart => {
      const newItems = [...prevCart.items];
      const item = newItems[itemIndex];
      
      if (!item) return prevCart;

      const oldTotal = item.totalPrice;
      const unitPrice = item.totalPrice / item.quantity;
      const newTotal = unitPrice * newQuantity;

      newItems[itemIndex] = {
        ...item,
        quantity: newQuantity,
        totalPrice: newTotal
      };

      return {
        items: newItems,
        totalAmount: prevCart.totalAmount - oldTotal + newTotal,
        restaurantId: prevCart.restaurantId
      };
    });
  };

  const clearCart = () => {
    setCart({
      items: [],
      totalAmount: 0,
      restaurantId: undefined
    });
  };

  const getCartTotal = () => {
    return cart.totalAmount;
  };

  const getCartItemCount = () => {
    return cart.items.reduce((total, item) => total + item.quantity, 0);
  };

  const value: CartContextType = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartItemCount
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};