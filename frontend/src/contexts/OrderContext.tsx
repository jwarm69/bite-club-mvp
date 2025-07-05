import React, { createContext, useContext, useState, useCallback } from 'react';

interface OrderContextType {
  activeOrderCount: number;
  refreshOrderCount: () => Promise<void>;
  updateOrderCount: (count: number) => void;
  triggerOrderUpdate: () => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeOrderCount, setActiveOrderCount] = useState(0);
  const [previousOrderCount, setPreviousOrderCount] = useState(0);

  const playNotificationSound = useCallback(() => {
    try {
      // Create a simple notification sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Pleasant notification sound: two tones
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  }, []);

  const refreshOrderCount = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/restaurant/orders/active-count', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const newCount = data.count || 0;
        
        // Play notification sound if count increased (new order received)
        if (newCount > previousOrderCount && previousOrderCount > 0) {
          playNotificationSound();
        }
        
        setPreviousOrderCount(activeOrderCount);
        setActiveOrderCount(newCount);
      }
    } catch (error) {
      console.error('Error fetching active order count:', error);
    }
  }, [previousOrderCount, activeOrderCount, playNotificationSound]);

  const updateOrderCount = useCallback((count: number) => {
    setActiveOrderCount(count);
  }, []);

  const triggerOrderUpdate = useCallback(() => {
    // Refresh the count immediately
    refreshOrderCount();
  }, [refreshOrderCount]);

  const value = {
    activeOrderCount,
    refreshOrderCount,
    updateOrderCount,
    triggerOrderUpdate
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrder = (): OrderContextType => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};