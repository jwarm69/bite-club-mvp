import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Credits: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const creditOptions = [
    { amount: 10, bonus: 0, popular: false },
    { amount: 25, bonus: 2, popular: true },
    { amount: 50, bonus: 7, popular: false },
    { amount: 100, bonus: 20, popular: false }
  ];

  const handleAddCredits = async () => {
    if (!selectedAmount) return;
    
    setIsProcessing(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock success - in real app, this would integrate with Stripe
      alert(`Successfully added $${selectedAmount} to your account!`);
      navigate('/profile');
      
    } catch (error) {
      alert('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const mockTransactions = [
    {
      id: '1',
      type: 'PURCHASE',
      amount: 25.00,
      description: 'Credit purchase',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '2',
      type: 'SPEND',
      amount: -21.23,
      description: 'Order at Paper Bag Deli',
      date: new Date(Date.now() - 30 * 60 * 1000).toISOString()
    },
    {
      id: '3',
      type: 'LOYALTY_REWARD',
      amount: 5.00,
      description: 'Loyalty reward bonus',
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <button 
            onClick={() => navigate('/profile')}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h1 className="text-lg font-bold text-gray-900">Manage Credits</h1>
          
          <div className="w-6"></div>
        </div>
      </div>

      <div className="p-4">
        {/* Current Balance */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white mb-6">
          <h2 className="text-lg font-semibold mb-2">Current Balance</h2>
          <p className="text-3xl font-bold">${Number(user?.creditBalance || 0).toFixed(2)}</p>
          <p className="text-green-100 text-sm mt-1">Available for orders</p>
        </div>

        {/* Add Credits Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Credits</h3>
          
          {/* Test Deployment Notice */}
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
              </svg>
              <p className="text-sm text-yellow-800">
                <strong>Demo Mode:</strong> Payment processing temporarily disabled for testing. Credits can be added manually by admin.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-6">
            {creditOptions.map((option) => (
              <button
                key={option.amount}
                onClick={() => setSelectedAmount(option.amount + option.bonus)}
                className={`relative p-4 rounded-lg border-2 transition-colors ${
                  selectedAmount === option.amount + option.bonus
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {option.popular && (
                  <div className="absolute -top-2 -right-2 bg-primary-500 text-white text-xs px-2 py-1 rounded-full">
                    Popular
                  </div>
                )}
                
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">${option.amount}</p>
                  {option.bonus > 0 && (
                    <p className="text-sm text-green-600 font-medium">
                      +${option.bonus} bonus
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Total: ${option.amount + option.bonus}
                  </p>
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={handleAddCredits}
            disabled={true}
            className="w-full py-3 rounded-lg font-semibold transition-colors bg-gray-300 text-gray-500 cursor-not-allowed"
          >
            Payment Processing Disabled (Demo Mode)
          </button>
          
          <p className="text-xs text-gray-500 text-center mt-2">
            Demo mode - contact admin to add test credits
          </p>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
          
          <div className="space-y-3">
            {mockTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                    transaction.type === 'PURCHASE' || transaction.type === 'LOYALTY_REWARD'
                      ? 'bg-green-100'
                      : 'bg-red-100'
                  }`}>
                    {transaction.type === 'PURCHASE' || transaction.type === 'LOYALTY_REWARD' ? (
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4"/>
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{transaction.description}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(transaction.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <p className={`font-semibold ${
                  transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
          
          <button 
            onClick={() => console.log('View all transactions')}
            className="w-full mt-4 text-primary-500 font-medium hover:text-primary-600"
          >
            View All Transactions
          </button>
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">How Bite Club Credits Work</p>
              <ul className="space-y-1 text-blue-700">
                <li>• Credits never expire</li>
                <li>• Get bonus credits on larger purchases</li>
                <li>• Earn loyalty rewards from participating restaurants</li>
                <li>• Credits are reflected within 24 hours</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom padding */}
      <div className="h-20"></div>
    </div>
  );
};

export default Credits;