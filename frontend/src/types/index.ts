// User types
export interface User {
  id: string;
  email: string;
  role: 'STUDENT' | 'RESTAURANT' | 'ADMIN';
  firstName?: string;
  lastName?: string;
  phone?: string;
  creditBalance: number;
  school?: School;
  createdAt: string;
  updatedAt: string;
}

export interface School {
  id: string;
  name: string;
  domain: string;
  location?: string;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface StudentSignupRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  schoolDomain: string;
}

export interface RestaurantSignupRequest {
  email: string;
  password: string;
  restaurantName: string;
  phone: string;
  schoolDomain: string;
  description?: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

// Restaurant types
export interface Restaurant {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  schoolId?: string;
  description?: string;
  logoUrl?: string;
  menuSchema?: any;
  operatingHours?: any;
  callEnabled?: boolean;
  active?: boolean;
  menuItems?: MenuItem[];
}

export interface RestaurantPromotions {
  id: string;
  restaurantId: string;
  firstTimeEnabled: boolean;
  firstTimePercent: number;
  loyaltyEnabled: boolean;
  loyaltySpendThreshold: number;
  loyaltyRewardAmount: number;
}

// Menu types
export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  imageUrl?: string;
  available: boolean;
  modifiers?: ModifierGroup[];
}

export interface ModifierGroup {
  id: string;
  name: string;
  required: boolean;
  multiSelect: boolean;
  minSelections?: number;
  maxSelections?: number;
  modifiers: Modifier[];
}

export interface Modifier {
  id: string;
  name: string;
  price: number;
  available: boolean;
}

export interface SelectedModifier {
  groupId: string;
  modifierId: string;
  name: string;
  price: number;
}

// Order types
export interface Order {
  id: string;
  userId: string;
  restaurantId: string;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
  specialInstructions?: string;
  promotionApplied?: string;
  createdAt: string;
  updatedAt: string;
  restaurant: Restaurant;
  orderItems: OrderItem[];
  user?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
    phone?: string;
  };
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  modifiersSelected?: SelectedModifier[];
  customInstructions?: string;
  menuItem: MenuItem;
}

// Cart types
export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  selectedModifiers: SelectedModifier[];
  customInstructions?: string;
  totalPrice: number;
}

export interface Cart {
  items: CartItem[];
  totalAmount: number;
  restaurantId?: string;
}

// Credit types
export interface CreditTransaction {
  id: string;
  amount: number;
  type: 'PURCHASE' | 'SPEND' | 'REFUND' | 'LOYALTY_REWARD' | 'ADMIN_ADD';
  description?: string;
  createdAt: string;
}

export interface CreditBalance {
  balance: number;
  transactions: CreditTransaction[];
}

// API response types
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
}

// Stripe types
export interface StripeCheckoutSession {
  sessionId: string;
  url: string;
}

export interface PaymentIntent {
  paymentIntentId: string;
  clientSecret: string;
  status: string;
}