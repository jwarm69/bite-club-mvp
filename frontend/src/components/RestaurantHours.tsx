import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';

interface DayHours {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

interface OperatingHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

interface RestaurantHoursProps {
  restaurantId?: string;
  currentHours?: OperatingHours;
  onSave?: (hours: OperatingHours) => void;
  isAdmin?: boolean;
}

const DEFAULT_HOURS: OperatingHours = {
  monday: { isOpen: true, openTime: '09:00', closeTime: '21:00' },
  tuesday: { isOpen: true, openTime: '09:00', closeTime: '21:00' },
  wednesday: { isOpen: true, openTime: '09:00', closeTime: '21:00' },
  thursday: { isOpen: true, openTime: '09:00', closeTime: '21:00' },
  friday: { isOpen: true, openTime: '09:00', closeTime: '22:00' },
  saturday: { isOpen: true, openTime: '10:00', closeTime: '22:00' },
  sunday: { isOpen: true, openTime: '10:00', closeTime: '20:00' }
};

const RestaurantHours: React.FC<RestaurantHoursProps> = ({ 
  restaurantId, 
  currentHours, 
  onSave, 
  isAdmin = false 
}) => {
  const { user } = useAuth();
  const [hours, setHours] = useState<OperatingHours>(DEFAULT_HOURS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string>('');

  // Check for admin impersonation
  const adminImpersonation = localStorage.getItem('adminImpersonation');
  const isAdminManaging = adminImpersonation && JSON.parse(adminImpersonation).type === 'restaurant-hours';
  const targetRestaurantId = isAdminManaging ? JSON.parse(adminImpersonation).id : restaurantId;

  // Load hours from API
  useEffect(() => {
    const loadHours = async () => {
      try {
        setLoading(true);
        setError('');
        
        const response = await apiService.getRestaurantHours(targetRestaurantId);
        if (response.hours) {
          setHours(response.hours);
        }
      } catch (error) {
        console.error('Error loading restaurant hours:', error);
        setError('Failed to load restaurant hours');
        // Keep default hours if API fails
      } finally {
        setLoading(false);
      }
    };

    loadHours();
  }, [targetRestaurantId]);

  // Also update if currentHours prop changes
  useEffect(() => {
    if (currentHours) {
      setHours(currentHours);
    }
  }, [currentHours]);

  const days = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
  ];

  const updateDayHours = (day: keyof OperatingHours, field: keyof DayHours, value: boolean | string) => {
    setHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const copyHours = (fromDay: keyof OperatingHours, toDay: keyof OperatingHours) => {
    setHours(prev => ({
      ...prev,
      [toDay]: { ...prev[fromDay] }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    setError('');
    
    try {
      const response = await apiService.updateRestaurantHours(hours, targetRestaurantId);
      
      if (response.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        
        // Call the onSave prop if provided
        if (onSave) {
          onSave(hours);
        }
      }
    } catch (error) {
      console.error('Error saving hours:', error);
      setError('Failed to save restaurant hours. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const isCurrentlyOpen = () => {
    const now = new Date();
    const dayName = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as keyof OperatingHours;
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    
    const todayHours = hours[dayName];
    if (!todayHours.isOpen) return false;
    
    return currentTime >= todayHours.openTime && currentTime <= todayHours.closeTime;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Operating Hours</h3>
          <p className="text-sm text-gray-500">
            {isAdminManaging ? 'Manage restaurant hours as admin' : 'Set when your restaurant is available for orders'}
          </p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          isCurrentlyOpen() 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {isCurrentlyOpen() ? 'Currently Open' : 'Currently Closed'}
        </div>
      </div>

      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          ✅ Operating hours updated successfully!
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          ❌ {error}
        </div>
      )}

      <div className="space-y-4">
        {days.map(({ key, label }) => {
          const dayHours = hours[key as keyof OperatingHours];
          return (
            <div key={key} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
              <div className="w-20">
                <label className="text-sm font-medium text-gray-700">{label}</label>
              </div>
              
              <div className="flex items-center space-x-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={dayHours.isOpen}
                    onChange={(e) => updateDayHours(key as keyof OperatingHours, 'isOpen', e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Open</span>
                </label>
                
                {dayHours.isOpen && (
                  <>
                    <input
                      type="time"
                      value={dayHours.openTime}
                      onChange={(e) => updateDayHours(key as keyof OperatingHours, 'openTime', e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                    <span className="text-gray-500">to</span>
                    <input
                      type="time"
                      value={dayHours.closeTime}
                      onChange={(e) => updateDayHours(key as keyof OperatingHours, 'closeTime', e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                  </>
                )}
                
                {!dayHours.isOpen && (
                  <span className="text-sm text-gray-500 italic">Closed</span>
                )}
              </div>

              {/* Quick copy buttons */}
              {key !== 'monday' && (
                <button
                  onClick={() => copyHours('monday', key as keyof OperatingHours)}
                  className="text-xs text-blue-600 hover:text-blue-800"
                  title="Copy Monday hours"
                >
                  Copy Mon
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex justify-between">
        <div className="flex space-x-2">
          <button
            onClick={() => {
              const weekdayHours = { isOpen: true, openTime: '09:00', closeTime: '21:00' };
              const weekendHours = { isOpen: true, openTime: '10:00', closeTime: '22:00' };
              
              setHours({
                monday: weekdayHours,
                tuesday: weekdayHours,
                wednesday: weekdayHours,
                thursday: weekdayHours,
                friday: weekdayHours,
                saturday: weekendHours,
                sunday: { isOpen: true, openTime: '10:00', closeTime: '20:00' }
              });
            }}
            className="text-sm text-gray-600 hover:text-gray-800 underline"
          >
            Set Default Hours
          </button>
          <button
            onClick={() => {
              const allDayHours = { isOpen: true, openTime: '00:00', closeTime: '23:59' };
              setHours(Object.keys(hours).reduce((acc, day) => ({
                ...acc,
                [day]: allDayHours
              }), {} as OperatingHours));
            }}
            className="text-sm text-gray-600 hover:text-gray-800 underline"
          >
            Open 24/7
          </button>
        </div>
        
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving...' : 'Save Hours'}
        </button>
      </div>
    </div>
  );
};

export default RestaurantHours;