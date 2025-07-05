import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { School } from '../types';
import apiService from '../services/api';

interface AuthFormProps {
  mode: 'login' | 'student-signup' | 'restaurant-signup';
  onModeChange: (mode: 'login' | 'student-signup' | 'restaurant-signup') => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ mode, onModeChange }) => {
  const navigate = useNavigate();
  const { login, signupStudent, signupRestaurant } = useAuth();
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form data - pre-filled for testing
  const [formData, setFormData] = useState({
    email: mode === 'login' ? 'student@fau.edu' : '',
    password: mode === 'login' ? 'student123' : '',
    firstName: '',
    lastName: '',
    restaurantName: '',
    phone: '',
    schoolDomain: 'fau.edu',
    description: ''
  });

  // Load schools when component mounts
  useEffect(() => {
    const loadSchools = async () => {
      try {
        const response = await apiService.getSchools();
        setSchools(response.schools);
      } catch (error) {
        console.error('Failed to load schools:', error);
      }
    };
    loadSchools();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[AUTH_FORM] Form submitted!', { mode, email: formData.email });
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (mode === 'login') {
        console.log('[AUTH_FORM] Attempting login...');
        await login({
          email: formData.email,
          password: formData.password
        });
        console.log('[AUTH_FORM] Login completed successfully! Navigating to dashboard...');
        
        // Navigate to the main app after successful login
        navigate('/', { replace: true });
        
      } else if (mode === 'student-signup') {
        await signupStudent({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          schoolDomain: formData.schoolDomain
        });
        console.log('[AUTH_FORM] Student signup completed successfully! Navigating to dashboard...');
        navigate('/', { replace: true });
      } else if (mode === 'restaurant-signup') {
        const response = await signupRestaurant({
          email: formData.email,
          password: formData.password,
          restaurantName: formData.restaurantName,
          phone: formData.phone,
          schoolDomain: formData.schoolDomain,
          description: formData.description
        });
        setSuccess(response.message);
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      restaurantName: '',
      phone: '',
      schoolDomain: '',
      description: ''
    });
    setError('');
    setSuccess('');
  };

  const handleModeChange = (newMode: 'login' | 'student-signup' | 'restaurant-signup') => {
    resetForm();
    onModeChange(newMode);
  };

  return (
    <div className="max-w-md mx-auto card p-6">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {mode === 'login' ? 'Welcome Back' : 'Join Bite Club'}
        </h1>
        <p className="text-gray-600">
          {mode === 'login' 
            ? 'Sign in to your account' 
            : mode === 'student-signup'
            ? 'Create your student account'
            : 'Register your restaurant'
          }
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* School Selection - for signup modes */}
        {mode !== 'login' && (
          <div>
            <label htmlFor="schoolDomain" className="block text-sm font-medium text-gray-700 mb-1">
              School/Organization
            </label>
            <select
              id="schoolDomain"
              name="schoolDomain"
              value={formData.schoolDomain}
              onChange={handleInputChange}
              className="input-field"
              required
            >
              <option value="">Select your school</option>
              {schools.map(school => (
                <option key={school.id} value={school.domain}>
                  {school.name} ({school.domain})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Student-specific fields */}
        {mode === 'student-signup' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="input-field"
                  required
                />
              </div>
            </div>
          </>
        )}

        {/* Restaurant-specific fields */}
        {mode === 'restaurant-signup' && (
          <>
            <div>
              <label htmlFor="restaurantName" className="block text-sm font-medium text-gray-700 mb-1">
                Restaurant Name
              </label>
              <input
                type="text"
                id="restaurantName"
                name="restaurantName"
                value={formData.restaurantName}
                onChange={handleInputChange}
                className="input-field"
                required
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="input-field"
                required
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="input-field"
                rows={3}
                placeholder="Brief description of your restaurant..."
              />
            </div>
          </>
        )}

        {/* Email field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="input-field"
            required
            placeholder="Enter your email address"
          />
        </div>

        {/* Password field */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            className="input-field"
            required
            minLength={6}
          />
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : 
           mode === 'login' ? 'Sign In' :
           mode === 'student-signup' ? 'Create Student Account' :
           'Submit Restaurant Application'}
        </button>
        
        {/* Forgot Password Link - only show in login mode */}
        {mode === 'login' && (
          <div className="mt-4 text-center">
            <a 
              href="/forgot-password" 
              className="text-sm text-purple-600 hover:text-purple-500"
            >
              Forgot your password?
            </a>
          </div>
        )}
      </form>

      {/* Mode switching */}
      <div className="mt-6 text-center space-y-2">
        {mode === 'login' ? (
          <>
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <button
                onClick={() => handleModeChange('student-signup')}
                className="text-primary-500 hover:text-primary-600 font-medium"
              >
                Sign up as Student
              </button>
            </p>
            <p className="text-sm text-gray-600">
              Restaurant owner?{' '}
              <button
                onClick={() => handleModeChange('restaurant-signup')}
                className="text-primary-500 hover:text-primary-600 font-medium"
              >
                Register Restaurant
              </button>
            </p>
          </>
        ) : (
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <button
              onClick={() => handleModeChange('login')}
              className="text-primary-500 hover:text-primary-600 font-medium"
            >
              Sign In
            </button>
          </p>
        )}
      </div>
    </div>
  );
};

export default AuthForm;