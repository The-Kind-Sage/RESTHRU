/**
 * Comprehensive TypeScript Type Definitions for Resthru
 * Restaurant Management SaaS Platform
 */

// ============================================================================
// USER & AUTHENTICATION TYPES
// ============================================================================

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  profileImage?: string;
  role: 'SUPER_ADMIN' | 'RESTAURANT_OWNER' | 'MANAGER' | 'STAFF';
  restaurantId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  expiresIn: number | null;
  error: string | null;
}

// ============================================================================
// RESTAURANT TYPES
// ============================================================================

export enum RestaurantType {
  CASUAL_DINING = 'CASUAL_DINING',
  FINE_DINING = 'FINE_DINING',
  FAST_CASUAL = 'FAST_CASUAL',
  FAST_FOOD = 'FAST_FOOD',
  CAFE = 'CAFE',
  BAKERY = 'BAKERY',
  CLOUD_KITCHEN = 'CLOUD_KITCHEN',
  BAR = 'BAR',
}

export interface OperatingHours {
  dayOfWeek: number; // 0-6, Monday-Sunday
  isOpen: boolean;
  openTime: string; // HH:mm format
  closeTime: string; // HH:mm format
}

export interface RestaurantSettings {
  timezone: string;
  currency: string;
  language: string;
  taxPercentage: number;
  serviceChargePercentage: number;
  enableGST: boolean;
  gstNumber?: string;
  enableOnlineOrdering: boolean;
  enableTableReservation: boolean;
  enableQRMenu: boolean;
}

export interface Restaurant {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  type: RestaurantType;
  email: string;
  phoneNumber: string;
  websiteUrl?: string;
  logoUrl?: string;
  bannerImageUrl?: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    latitude?: number;
    longitude?: number;
  };
  operatingHours: OperatingHours[];
  settings: RestaurantSettings;
  totalTables: number;
  totalStaff: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// PLAN & SUBSCRIPTION TYPES
// ============================================================================

export enum PlanType {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE',
}

export interface Plan {
  id: string;
  type: PlanType;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  maxRestaurants: number;
  maxTables: number;
  maxStaff: number;
  maxMenuItems: number;
  features: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  SUSPENDED = 'SUSPENDED',
}

export interface Subscription {
  id: string;
  userId: string;
  restaurantId: string;
  planId: string;
  status: SubscriptionStatus;
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  billingCycle: 'MONTHLY' | 'ANNUAL';
  lastPaymentDate?: Date;
  nextPaymentDate?: Date;
  paymentMethod?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// STAFF TYPES
// ============================================================================

export enum StaffRole {
  WAITER = 'WAITER',
  KITCHEN = 'KITCHEN',
  CASHIER = 'CASHIER',
  MANAGER = 'MANAGER',
}

export enum StaffStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ON_LEAVE = 'ON_LEAVE',
  TERMINATED = 'TERMINATED',
}

export interface Staff {
  id: string;
  restaurantId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  profileImage?: string;
  role: StaffRole;
  status: StaffStatus;
  salary: number;
  joinDate: Date;
  dateOfBirth?: Date;
  address?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// TABLE TYPES
// ============================================================================

export enum TableStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  BILL_REQUESTED = 'BILL_REQUESTED',
  RESERVED = 'RESERVED',
  CLEANING = 'CLEANING',
}

export enum TableShape {
  SQUARE = 'SQUARE',
  ROUND = 'ROUND',
  LARGE = 'LARGE',
}

export interface RestaurantTable {
  id: string;
  restaurantId: string;
  tableNumber: number;
  qrCode: string;
  capacity: number;
  shape: TableShape;
  location?: string;
  status: TableStatus;
  currentOrderId?: string;
  occupiedSince?: Date;
  assignedWaiterId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// CATEGORY TYPES
// ============================================================================

export interface Category {
  id: string;
  restaurantId: string;
  name: string;
  description?: string;
  imageUrl?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// MENU TYPES
// ============================================================================

export enum FoodType {
  VEG = 'VEG',
  NON_VEG = 'NON_VEG',
  VEGAN = 'VEGAN',
  FISH = 'FISH',
}

export enum SpiceLevel {
  NONE = 'NONE',
  MILD = 'MILD',
  MEDIUM = 'MEDIUM',
  HOT = 'HOT',
  EXTRA_HOT = 'EXTRA_HOT',
}

export enum Allergen {
  PEANUTS = 'PEANUTS',
  TREE_NUTS = 'TREE_NUTS',
  MILK = 'MILK',
  EGGS = 'EGGS',
  SHELLFISH = 'SHELLFISH',
  FISH = 'FISH',
  SOY = 'SOY',
  WHEAT = 'WHEAT',
  SESAME = 'SESAME',
  MUSTARD = 'MUSTARD',
}

export interface AddOn {
  id: string;
  menuItemId: string;
  name: string;
  description?: string;
  price: number;
  isAvailable: boolean;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  description?: string;
  imageUrl?: string;
  price: number;
  discountPrice?: number;
  foodType: FoodType;
  spiceLevel: SpiceLevel;
  allergens: Allergen[];
  prepTime: number; // in minutes
  calories?: number;
  ingredients?: string[];
  addOns: AddOn[];
  isAvailable: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// ORDER TYPES
// ============================================================================

export enum OrderStatus {
  PENDING = 'PENDING',
  PREPARING = 'PREPARING',
  READY = 'READY',
  SERVED = 'SERVED',
  CANCELLED = 'CANCELLED',
}

export enum OrderItemStatus {
  PENDING = 'PENDING',
  PREPARING = 'PREPARING',
  READY = 'READY',
  SERVED = 'SERVED',
  CANCELLED = 'CANCELLED',
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  pricePerUnit: number;
  specialInstructions?: string;
  selectedAddOns: {
    addOnId: string;
    name: string;
    price: number;
  }[];
  status: OrderItemStatus;
  preparedAt?: Date;
  servedAt?: Date;
}

export interface Order {
  id: string;
  restaurantId: string;
  tableId?: string;
  table?: { tableNumber: number } | null; // included by kitchen/waiter queries
  bills?: { id: string }[]; // included by waiter active-orders query
  orderId: string; // user-friendly order number
  orderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  taxAmount: number;
  serviceChargeAmount: number;
  discountAmount: number;
  discountReason?: string;
  totalAmount: number;
  assignedWaiterId?: string;
  customerName?: string;
  customerPhoneNumber?: string;
  specialRequests?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

// ============================================================================
// INVENTORY TYPES
// ============================================================================

export enum InventoryMovementType {
  ADDED = 'ADDED',
  USED = 'USED',
  WASTED = 'WASTED',
}

export enum StockStatus {
  HEALTHY = 'HEALTHY',
  LOW = 'LOW',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
}

export interface InventoryHistoryEntry {
  id: string;
  inventoryItemId: string;
  movementType: InventoryMovementType;
  quantity: number;
  reason?: string;
  recordedBy: string;
  createdAt: Date;
}

export interface InventoryItem {
  id: string;
  restaurantId: string;
  name: string;
  description?: string;
  unit: string; // kg, liter, pieces, etc.
  currentQuantity: number;
  reorderLevel: number;
  reorderQuantity: number;
  unitCost: number;
  supplier?: string;
  status: StockStatus;
  lastRestockDate?: Date;
  expiryDate?: Date;
  history: InventoryHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// BILL TYPES
// ============================================================================

export enum PaymentMethod {
  CASH = 'CASH',
  ESEWA = 'ESEWA',
  KHALTI = 'KHALTI',
  FONEPAY = 'FONEPAY',
}

export interface Bill {
  id: string;
  restaurantId: string;
  orderId: string;
  billNumber: string;
  subtotal: number;
  taxAmount: number;
  serviceChargeAmount: number;
  discountAmount: number;
  totalAmount: number;
  amountPaid: number;
  change: number;
  paymentMethod: PaymentMethod;
  paymentReferenceNumber?: string;
  billDate: Date;
  settledAt?: Date;
  createdBy: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export type NotificationType =
  | 'ORDER_RECEIVED'
  | 'ORDER_READY'
  | 'BILL_REQUESTED'
  | 'PAYMENT_RECEIVED'
  | 'TABLE_RESERVED'
  | 'LOW_INVENTORY'
  | 'STAFF_ALERT'
  | 'SYSTEM_ALERT'
  | 'CUSTOM';

export interface Notification {
  id: string;
  recipientUserId: string;
  restaurantId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
  isRead: boolean;
  readAt?: Date;
  actionUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// ACTIVITY LOG TYPES
// ============================================================================

export interface ActivityLog {
  id: string;
  restaurantId: string;
  userId: string;
  actionType: string;
  entityType: string;
  entityId: string;
  changesBefore?: Record<string, unknown>;
  changesAfter?: Record<string, unknown>;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

// ============================================================================
// CART TYPES (FOR QR MENU ORDERING)
// ============================================================================

export interface CartItem {
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  pricePerUnit: number;
  selectedAddOns: {
    addOnId: string;
    name: string;
    price: number;
  }[];
  specialInstructions?: string;
  subtotal: number;
}

export interface Cart {
  id: string;
  restaurantId: string;
  tableId: string;
  items: CartItem[];
  subtotal: number;
  taxAmount: number;
  serviceChargeAmount: number;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}

// ============================================================================
// REPORT TYPES
// ============================================================================

export interface SalesReport {
  id: string;
  restaurantId: string;
  period: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  startDate: Date;
  endDate: Date;
  totalOrders: number;
  totalRevenue: number;
  totalDiscount: number;
  totalTax: number;
  totalServiceCharge: number;
  averageOrderValue: number;
  paymentMethodBreakdown: Record<PaymentMethod, number>;
  orderTypeBreakdown: Record<string, number>;
  topSellingItems: Array<{
    menuItemId: string;
    menuItemName: string;
    quantitySold: number;
    revenue: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ItemReport {
  id: string;
  restaurantId: string;
  menuItemId: string;
  menuItemName: string;
  period: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  startDate: Date;
  endDate: Date;
  quantitySold: number;
  revenue: number;
  averageRating?: number;
  totalOrders: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface StaffReport {
  id: string;
  restaurantId: string;
  staffId: string;
  staffName: string;
  period: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  startDate: Date;
  endDate: Date;
  totalOrdersHandled: number;
  totalTables: number;
  averageRating?: number;
  performanceScore: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaxReport {
  id: string;
  restaurantId: string;
  period: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  startDate: Date;
  endDate: Date;
  totalTaxCollected: number;
  totalGSTCollected?: number;
  taxableAmount: number;
  totalOrders: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// KPI TYPES
// ============================================================================

export interface KpiCard {
  id: string;
  restaurantId: string;
  title: string;
  value: number | string;
  unit?: string;
  trend?: 'UP' | 'DOWN' | 'STABLE';
  percentageChange?: number;
  icon?: string;
  color?: string;
  lastUpdated: Date;
}

// ============================================================================
// AGGREGATE TYPES & UTILITY TYPES
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface FilterOptions {
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  filters?: Record<string, unknown>;
}
