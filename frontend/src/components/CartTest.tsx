import React from 'react';
import { useCart } from '../contexts/CartContext';
import { useNavigate } from 'react-router-dom';

const CartTest: React.FC = () => {
  const { cart, getCartItemCount, getCartTotal } = useCart();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Cart Test</h1>
        
        <div className="space-y-3">
          <div>
            <strong>Cart Items Count:</strong> {getCartItemCount()}
          </div>
          <div>
            <strong>Cart Total:</strong> ${getCartTotal().toFixed(2)}
          </div>
          <div>
            <strong>Restaurant ID:</strong> {cart.restaurantId || 'None'}
          </div>
          <div>
            <strong>Items:</strong>
            <pre className="text-xs bg-gray-100 p-2 rounded mt-2">
              {JSON.stringify(cart.items, null, 2)}
            </pre>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <button 
            onClick={() => navigate('/')}
            className="w-full bg-primary-500 text-white py-2 px-4 rounded-lg"
          >
            Back to Home
          </button>
          <button 
            onClick={() => navigate('/cart')}
            className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg"
          >
            Go to Real Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartTest;