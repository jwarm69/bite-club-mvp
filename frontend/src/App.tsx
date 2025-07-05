import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider, useCart } from './contexts/CartContext';
import { OrderProvider } from './contexts/OrderContext';
import AuthForm from './components/AuthForm';
import RestaurantMenu from './components/RestaurantMenu';
import Cart from './components/Cart';
import CartTest from './components/CartTest';
import Orders from './components/Orders';
import Profile from './components/Profile';
import Credits from './components/Credits';
import RestaurantMenuManager from './components/RestaurantMenuManager';
import RestaurantOrderManager from './components/RestaurantOrderManager';
import RestaurantPromotions from './components/RestaurantPromotions';
import RestaurantCompletedOrders from './components/RestaurantCompletedOrders';
import RestaurantHours from './components/RestaurantHours';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import AdminDashboard from './pages/AdminDashboard';
import StudentDashboard from './pages/StudentDashboard';
import RestaurantDashboard from './pages/RestaurantDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';



// Restaurant Edit Modal Component


// Restaurant Hours Page Component
const RestaurantHoursPage: React.FC = () => {
  const [currentHours, setCurrentHours] = useState<any>(null);
  const [restaurantInfo, setRestaurantInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Check for admin impersonation
  const adminImpersonation = localStorage.getItem('adminImpersonation');
  const isAdminManaging = adminImpersonation && JSON.parse(adminImpersonation).type === 'restaurant-hours';
  const restaurantId = isAdminManaging ? JSON.parse(adminImpersonation).id : 'current';

  useEffect(() => {
    const fetchHours = async () => {
      try {
        const token = localStorage.getItem('token');
        const endpoint = isAdminManaging 
          ? `/api/admin/restaurants/${restaurantId}/hours`
          : '/api/restaurant/hours';
        
        const response = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setCurrentHours(data.operatingHours);
          
          // Store restaurant info when in admin mode
          if (isAdminManaging) {
            setRestaurantInfo({
              id: data.restaurantId,
              name: data.name,
              active: data.active
            });
          }
        }
      } catch (error) {
        console.error('Error fetching hours:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHours();
  }, [isAdminManaging, restaurantId]);

  const handleSaveHours = (hours: any) => {
    setCurrentHours(hours);
  };

  const exitAdminView = () => {
    localStorage.removeItem('adminImpersonation');
    window.close(); // Close the admin popup
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading hours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Impersonation Banner */}
      {isAdminManaging && (
        <div className="bg-purple-600 text-white px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">Admin View: Managing Hours for</span>
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

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary-500">Restaurant Hours</h1>
            </div>
          </div>
        </div>
      </div>
      
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <RestaurantHours
            restaurantId={restaurantId}
            currentHours={currentHours}
            onSave={handleSaveHours}
            isAdmin={!!isAdminManaging}
          />
        </div>
      </main>
    </div>
  );
};

const AuthPage: React.FC = () => {
  const [authMode, setAuthMode] = useState<'login' | 'student-signup' | 'restaurant-signup'>('login');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-500 mb-2">Bite Club</h1>
          <p className="text-gray-600">The smart way to order campus food</p>
        </div>
        <AuthForm mode={authMode} onModeChange={setAuthMode} />
      </div>
    </div>
  );
};


const DashboardRouter: React.FC = () => {
  const { user } = useAuth();

  console.log('[DASHBOARD_ROUTER] User state:', user ? { 
    id: user.id, 
    role: user.role, 
    email: user.email 
  } : null);

  if (!user) {
    console.log('[DASHBOARD_ROUTER] No user found, redirecting to /auth');
    return <Navigate to="/auth" replace />;
  }

  console.log('[DASHBOARD_ROUTER] Routing user to dashboard based on role:', user.role);

  switch (user.role) {
    case 'STUDENT':
      console.log('[DASHBOARD_ROUTER] Rendering StudentDashboard');
      return <StudentDashboard />;
    case 'RESTAURANT':
      console.log('[DASHBOARD_ROUTER] Rendering RestaurantDashboard');
      return <RestaurantDashboard />;
    case 'ADMIN':
      console.log('[DASHBOARD_ROUTER] Rendering AdminDashboard');
      return <AdminDashboard />;
    default:
      console.log('[DASHBOARD_ROUTER] Unknown role, redirecting to /auth');
      return <Navigate to="/auth" replace />;
  }
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <OrderProvider>
        <CartProvider>
          <Router>
          <div className="App">
            <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardRouter />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/*"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/restaurant/:restaurantId"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                  <RestaurantMenu />
                </ProtectedRoute>
              }
            />
            <Route
              path="/restaurant/menu"
              element={
                <ProtectedRoute allowedRoles={['RESTAURANT', 'ADMIN']}>
                  <RestaurantMenuManager />
                </ProtectedRoute>
              }
            />
            <Route
              path="/restaurant/orders"
              element={
                <ProtectedRoute allowedRoles={['RESTAURANT', 'ADMIN']}>
                  <RestaurantOrderManager />
                </ProtectedRoute>
              }
            />
            <Route
              path="/restaurant/promotions"
              element={
                <ProtectedRoute allowedRoles={['RESTAURANT', 'ADMIN']}>
                  <RestaurantPromotions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/restaurant/hours"
              element={
                <ProtectedRoute allowedRoles={['RESTAURANT', 'ADMIN']}>
                  <RestaurantHoursPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/restaurant/completed"
              element={
                <ProtectedRoute allowedRoles={['RESTAURANT', 'ADMIN']}>
                  <RestaurantCompletedOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/restaurant/*"
              element={
                <ProtectedRoute allowedRoles={['RESTAURANT', 'ADMIN']}>
                  <RestaurantDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cart"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                  <CartPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cart-test"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                  <CartTest />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                  <Orders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/credits"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                  <Credits />
                </ProtectedRoute>
              }
            />
            {/* Public routes for password reset */}
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
        </CartProvider>
      </OrderProvider>
    </AuthProvider>
  );
};

// Cart Page Component
const CartPage: React.FC = () => {
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart();
  
  console.log('[CART_PAGE] Rendering with cart:', cart);
  
  try {
    return (
      <Cart
        cart={cart}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
        onClearCart={clearCart}
      />
    );
  } catch (error) {
    console.error('[CART_PAGE] Error rendering cart:', error);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Cart Error</h2>
          <p className="text-gray-600 mb-6">There was an error loading the cart page.</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="btn-primary"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }
};

export default App;