import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginRequest, StudentSignupRequest, RestaurantSignupRequest } from '../types';
import apiService from '../services/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  signupStudent: (data: StudentSignupRequest) => Promise<void>;
  signupRestaurant: (data: RestaurantSignupRequest) => Promise<{ message: string; userId: string; restaurantId: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Check for existing token on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const token = apiService.getAuthToken();
      if (token) {
        try {
          const response = await apiService.getCurrentUser();
          setUser(response.user);
        } catch (error) {
          console.error('Failed to get current user:', error);
          apiService.removeAuthToken();
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (data: LoginRequest) => {
    try {
      console.log('[AUTH] Attempting login with:', data.email);
      const response = await apiService.login(data);
      console.log('[AUTH] Login API response:', response);
      
      if (!response.token || !response.user) {
        throw new Error('Invalid response format from server');
      }
      
      apiService.setAuthToken(response.token);
      setUser(response.user);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      console.log('[AUTH] User successfully set in context:', {
        user: response.user,
        isAuthenticated: !!response.user,
        token: response.token.substring(0, 20) + '...'
      });
      
      // Force a state update to ensure components re-render
      setTimeout(() => {
        console.log('[AUTH] State after login - user:', user, 'isAuthenticated:', !!user);
      }, 100);
      
    } catch (error: any) {
      console.error('[AUTH] Login error:', error);
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  };

  const signupStudent = async (data: StudentSignupRequest) => {
    try {
      const response = await apiService.signupStudent(data);
      apiService.setAuthToken(response.token);
      setUser(response.user);
      localStorage.setItem('user', JSON.stringify(response.user));
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Signup failed');
    }
  };

  const signupRestaurant = async (data: RestaurantSignupRequest) => {
    try {
      const response = await apiService.signupRestaurant(data);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Restaurant signup failed');
    }
  };

  const logout = () => {
    apiService.removeAuthToken();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const response = await apiService.getCurrentUser();
      setUser(response.user);
      localStorage.setItem('user', JSON.stringify(response.user));
    } catch (error) {
      console.error('Failed to refresh user:', error);
      logout();
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    signupStudent,
    signupRestaurant,
    logout,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};