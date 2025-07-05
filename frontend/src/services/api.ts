import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  AuthResponse, 
  LoginRequest, 
  StudentSignupRequest, 
  RestaurantSignupRequest,
  User,
  School,
  CreditBalance,
  StripeCheckoutSession,
  PaymentIntent
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to requests if available
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle auth errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/login', data);
    return response.data;
  }

  async signupStudent(data: StudentSignupRequest): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/signup/student', data);
    return response.data;
  }

  async signupRestaurant(data: RestaurantSignupRequest): Promise<{ message: string; userId: string; restaurantId: string }> {
    const response = await this.api.post('/auth/signup/restaurant', data);
    return response.data;
  }

  async getCurrentUser(): Promise<{ user: User }> {
    const response = await this.api.get('/auth/me');
    return response.data;
  }

  async getSchools(): Promise<{ schools: School[] }> {
    const response = await this.api.get('/auth/schools');
    return response.data;
  }

  // Credits endpoints
  async getCreditBalance(): Promise<CreditBalance> {
    const response = await this.api.get('/credits/balance');
    return response.data;
  }

  async createCheckoutSession(amount: number): Promise<StripeCheckoutSession> {
    const response = await this.api.post('/credits/purchase/checkout', { amount });
    return response.data;
  }

  async createPaymentIntent(amount: number, paymentMethodId: string): Promise<PaymentIntent> {
    const response = await this.api.post('/credits/purchase/intent', { amount, paymentMethodId });
    return response.data;
  }

  async confirmPayment(paymentIntentId?: string, sessionId?: string): Promise<{
    message: string;
    newBalance: number;
    transaction: any;
  }> {
    const response = await this.api.post('/credits/purchase/confirm', { paymentIntentId, sessionId });
    return response.data;
  }

  // Restaurant endpoints
  async getRestaurantsBySchool(schoolDomain: string): Promise<{ restaurants: any[] }> {
    const response = await this.api.get(`/restaurant/by-school/${schoolDomain}`);
    return response.data;
  }

  async getRestaurantMenu(restaurantId: string): Promise<{ restaurant: any }> {
    const response = await this.api.get(`/restaurant/${restaurantId}/menu`);
    return response.data;
  }

  async getAllRestaurants(schoolId?: string): Promise<{ restaurants: any[] }> {
    const params = schoolId ? { schoolId } : {};
    const response = await this.api.get('/restaurant', { params });
    return response.data;
  }

  // Order endpoints
  async createOrder(orderData: {
    items: any[];
    restaurantId: string;
    totalAmount: number;
    customInstructions?: string;
  }): Promise<{ order: any }> {
    const response = await this.api.post('/orders', orderData);
    return response.data;
  }

  async getMyOrders(): Promise<{ orders: any[] }> {
    const response = await this.api.get('/orders/my-orders');
    return response.data;
  }

  async getRestaurantOrders(status?: string): Promise<{ orders: any[] }> {
    const params = status ? { status } : {};
    const response = await this.api.get('/orders/restaurant', { params });
    return response.data;
  }

  async updateOrderStatus(orderId: string, status: string): Promise<{ order: any }> {
    const response = await this.api.patch(`/orders/${orderId}/status`, { status });
    return response.data;
  }

  // New simplified restaurant order actions
  async acceptOrder(orderId: string): Promise<{ order: any; message: string }> {
    const response = await this.api.post(`/orders/${orderId}/accept`);
    return response.data;
  }

  async rejectOrder(orderId: string, reason?: string): Promise<{ order: any; message: string }> {
    const response = await this.api.post(`/orders/${orderId}/reject`, { reason });
    return response.data;
  }

  async closeoutOrder(orderId: string): Promise<{ order: any; message: string }> {
    const response = await this.api.post(`/orders/${orderId}/closeout`);
    return response.data;
  }

  async checkPromotions(restaurantId: string, totalAmount: number): Promise<{ promotions: any }> {
    const response = await this.api.post('/orders/check-promotions', { restaurantId, totalAmount });
    return response.data;
  }

  // Call management endpoints
  async getCallSettings(): Promise<{ restaurant: any }> {
    const response = await this.api.get('/calls/settings');
    return response.data;
  }

  async updateCallSettings(settings: {
    callEnabled: boolean;
    callPhone?: string;
    callRetries?: number;
    callTimeoutSeconds?: number;
  }): Promise<{ restaurant: any }> {
    const response = await this.api.put('/calls/settings', settings);
    return response.data;
  }

  async getCallHistory(limit = 50, offset = 0): Promise<{ 
    callLogs: any[]; 
    pagination: any; 
    stats: { totalCalls: number; totalCost: number } 
  }> {
    const response = await this.api.get('/calls/history', { params: { limit, offset } });
    return response.data;
  }

  async retryCall(orderId: string): Promise<{ success: boolean; callSid?: string }> {
    const response = await this.api.post(`/calls/retry/${orderId}`);
    return response.data;
  }

  // Admin call management endpoints
  async getAdminCallRestaurants(): Promise<{ restaurants: any[] }> {
    const response = await this.api.get('/calls/admin/restaurants');
    return response.data;
  }

  async updateAdminCallSettings(restaurantId: string, settings: {
    callEnabled: boolean;
    callPhone?: string;
    callRetries?: number;
    callTimeoutSeconds?: number;
  }): Promise<{ restaurant: any }> {
    const response = await this.api.put(`/calls/admin/restaurants/${restaurantId}`, settings);
    return response.data;
  }

  async getAdminCallAnalytics(startDate?: string, endDate?: string): Promise<{
    overall: { totalCalls: number; totalCost: number; totalDuration: number };
    responseTypes: Array<{ type: string; count: number }>;
    restaurantBreakdown: Array<{ restaurantId: string; callCount: number; totalCost: number }>;
  }> {
    const params = startDate && endDate ? { startDate, endDate } : {};
    const response = await this.api.get('/calls/admin/analytics', { params });
    return response.data;
  }

  // Admin endpoints
  async getStudentDetails(studentId: string): Promise<{ user: any }> {
    const response = await this.api.get(`/admin/students/${studentId}`);
    return response.data;
  }

  async getRestaurantDetails(restaurantId: string): Promise<{ restaurant: any }> {
    const response = await this.api.get(`/admin/restaurants/${restaurantId}`);
    return response.data;
  }

  async updateRestaurant(restaurantId: string, data: {
    name: string;
    description?: string;
    phone?: string;
    email?: string;
  }): Promise<{ restaurant: any; success: boolean }> {
    const response = await this.api.put(`/admin/restaurants/${restaurantId}`, data);
    return response.data;
  }

  // Password reset endpoints
  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await this.api.post('/auth/forgot-password', { email });
    return response.data;
  }

  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    const response = await this.api.post('/auth/reset-password', { token, password });
    return response.data;
  }

  // Menu Management endpoints
  async getMenuItems(restaurantId?: string): Promise<{ menuItems: any[] }> {
    const endpoint = restaurantId ? `/menu/restaurant/${restaurantId}` : '/menu/my-items';
    const response = await this.api.get(endpoint);
    return response.data;
  }

  async createMenuItem(menuItem: {
    name: string;
    description?: string;
    price: number;
    category: string;
    imageUrl?: string;
    available?: boolean;
    modifiers?: any[];
  }): Promise<{ menuItem: any }> {
    const response = await this.api.post('/menu/items', menuItem);
    return response.data;
  }

  async updateMenuItem(itemId: string, menuItem: {
    name?: string;
    description?: string;
    price?: number;
    category?: string;
    imageUrl?: string;
    available?: boolean;
    modifiers?: any[];
  }): Promise<{ menuItem: any }> {
    const response = await this.api.put(`/menu/items/${itemId}`, menuItem);
    return response.data;
  }

  async deleteMenuItem(itemId: string): Promise<{ success: boolean }> {
    const response = await this.api.delete(`/menu/items/${itemId}`);
    return response.data;
  }

  async toggleMenuItemAvailability(itemId: string): Promise<{ menuItem: any }> {
    const response = await this.api.patch(`/menu/items/${itemId}/toggle-availability`);
    return response.data;
  }

  // Restaurant Hours endpoints
  async getRestaurantHours(restaurantId?: string): Promise<{ hours: any }> {
    const endpoint = restaurantId ? `/restaurants/${restaurantId}/hours` : '/restaurants/my-hours';
    const response = await this.api.get(endpoint);
    return response.data;
  }

  async updateRestaurantHours(hours: {
    monday: { isOpen: boolean; openTime: string; closeTime: string };
    tuesday: { isOpen: boolean; openTime: string; closeTime: string };
    wednesday: { isOpen: boolean; openTime: string; closeTime: string };
    thursday: { isOpen: boolean; openTime: string; closeTime: string };
    friday: { isOpen: boolean; openTime: string; closeTime: string };
    saturday: { isOpen: boolean; openTime: string; closeTime: string };
    sunday: { isOpen: boolean; openTime: string; closeTime: string };
  }, restaurantId?: string): Promise<{ hours: any; success: boolean }> {
    const endpoint = restaurantId ? `/restaurants/${restaurantId}/hours` : '/restaurants/my-hours';
    const response = await this.api.put(endpoint, { hours });
    return response.data;
  }

  // Utility methods
  setAuthToken(token: string): void {
    localStorage.setItem('token', token);
  }

  removeAuthToken(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  getAuthToken(): string | null {
    return localStorage.getItem('token');
  }
}

const apiService = new ApiService();
export default apiService;