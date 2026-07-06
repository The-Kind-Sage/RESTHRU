// Nepal Cities
export const NEPAL_CITIES = [
  'Kathmandu',
  'Pokhara',
  'Chitwan',
  'Biratnagar',
  'Lalitpur',
  'Bhaktapur',
  'Bharatpur',
  'Butwal',
  'Birgunj',
  'Dharan',
  'Hetauda',
  'Nepalgunj',
  'Janakpur',
  'Siddharthanagar',
  'Mechinagar',
];

// Restaurant Types
export const RESTAURANT_TYPES = [
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'cafe', label: 'Cafe' },
  { value: 'bar', label: 'Bar' },
  { value: 'fast_food', label: 'Fast Food' },
  { value: 'bakery', label: 'Bakery' },
];

// Payment Methods
export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash', icon: 'Banknote' },
  { value: 'esewa', label: 'eSewa', icon: 'Wallet' },
  { value: 'khalti', label: 'Khalti', icon: 'CreditCard' },
  { value: 'fonepay', label: 'Fonepay', icon: 'Smartphone' },
];

// Spice Levels
export const SPICE_LEVELS = [
  { value: 'none', label: 'None', icon: '😊' },
  { value: 'mild', label: 'Mild', icon: '🌶️' },
  { value: 'medium', label: 'Medium', icon: '🌶️🌶️' },
  { value: 'hot', label: 'Hot', icon: '🌶️🌶️🌶️' },
  { value: 'extra_hot', label: 'Extra Hot', icon: '🌶️🌶️🌶️🌶️' },
];

// Food Types (broad category)
export const FOOD_TYPES = [
  { value: 'veg',     label: 'Veg',     color: '#22c55e' },
  { value: 'non_veg', label: 'Non-veg', color: '#ef4444' },
  { value: 'vegan',   label: 'Vegan',   color: '#eab308' },
  { value: 'fish',    label: 'Fish',    color: '#3b82f6' },
];

// Food Sub-types (meat type for non-veg items)
export const FOOD_SUB_TYPES = [
  { value: 'veg',     label: 'Veg',     color: '#22c55e', emoji: '🥦' },
  { value: 'chicken', label: 'Chicken', color: '#f97316', emoji: '🍗' },
  { value: 'buff',    label: 'Buff',    color: '#dc2626', emoji: '🐃' },
  { value: 'pork',    label: 'Pork',    color: '#ec4899', emoji: '🐷' },
  { value: 'mutton',  label: 'Mutton',  color: '#7c3aed', emoji: '🐑' },
];

// Allergens
export const ALLERGENS = [
  'Nuts',
  'Dairy',
  'Gluten',
  'Eggs',
  'Soy',
  'Shellfish',
  'Sesame',
  'Mustard',
];

// Order Statuses
export const ORDER_STATUSES = [
  { value: 'pending', label: 'Pending', color: '#f59e0b' },
  { value: 'confirmed', label: 'Confirmed', color: '#3b82f6' },
  { value: 'preparing', label: 'Preparing', color: '#8b5cf6' },
  { value: 'ready', label: 'Ready', color: '#06b6d4' },
  { value: 'delivered', label: 'Delivered', color: '#22c55e' },
  { value: 'cancelled', label: 'Cancelled', color: '#ef4444' },
];

// Table Statuses
export const TABLE_STATUSES = [
  { value: 'available', label: 'Available', color: '#22c55e' },
  { value: 'occupied', label: 'Occupied', color: '#ef4444' },
  { value: 'reserved', label: 'Reserved', color: '#f59e0b' },
  { value: 'maintenance', label: 'Maintenance', color: '#6b7280' },
];

// Staff Roles
export const STAFF_ROLES = [
  { value: 'manager', label: 'Manager', color: '#3b82f6' },
  { value: 'chef', label: 'Chef', color: '#8b5cf6' },
  { value: 'waiter', label: 'Waiter', color: '#06b6d4' },
  { value: 'cashier', label: 'Cashier', color: '#22c55e' },
  { value: 'kitchen_staff', label: 'Kitchen Staff', color: '#f59e0b' },
];

// Plan Types
export const PLAN_TYPES = [
  { value: 'free', label: 'Free', color: '#6b7280' },
  { value: 'basic', label: 'Basic', color: '#3b82f6' },
  { value: 'pro', label: 'Pro', color: '#8b5cf6' },
  { value: 'enterprise', label: 'Enterprise', color: '#ef4444' },
];

// Plans
export const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    yearlyPrice: 0,
    currency: 'NPR',
    features: [
      'Up to 5 menu items',
      'Basic table management',
      'Email support',
      '✗ Thermal printer support',
      '✗ IRD-compliant VAT billing',
      '✗ Multi-branch support',
      '✗ Real-time analytics',
    ],
    isPopular: false,
    color: '#6b7280',
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 1999,
    yearlyPrice: 23988,
    currency: 'NPR',
    features: [
      'Up to 50 menu items',
      'Advanced table management',
      'Order tracking',
      'Staff management',
      'Priority email support',
      'Thermal printer support',
      '✗ IRD-compliant VAT billing',
      '✗ Multi-branch support',
      '✗ Real-time analytics',
    ],
    isPopular: false,
    color: '#3b82f6',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 4999,
    yearlyPrice: 59988,
    currency: 'NPR',
    features: [
      'Unlimited menu items',
      'Advanced table management',
      'Real-time order tracking',
      'Staff management',
      'Analytics & reports',
      'Multiple payment methods',
      'Phone & email support',
      'API access',
      'Thermal printer support',
      'IRD-compliant VAT billing',
      'Up to 3 branches',
      'Real-time analytics',
    ],
    isPopular: true,
    color: '#8b5cf6',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: null,
    yearlyPrice: null,
    currency: 'NPR',
    features: [
      'Everything in Pro',
      'Custom integrations',
      'Dedicated account manager',
      'Training & onboarding',
      'Priority 24/7 support',
      'Custom development',
      'Unlimited branches',
      'Custom thermal printer setup',
      'Advanced analytics',
    ],
    isPopular: false,
    color: '#ef4444',
  },
];

// VAT Rate
export const VAT_RATE = 13;

// Currency
export const CURRENCY = 'NPR';
export const CURRENCY_SYMBOL = 'NPR';

// Floors
export const FLOORS = ['Ground Floor', 'First Floor', 'Terrace'];

// Table Shapes
export const TABLE_SHAPES = [
  { value: 'round', label: 'Round', capacity: 4 },
  { value: 'square', label: 'Square', capacity: 4 },
  { value: 'rectangular', label: 'Rectangular', capacity: 6 },
  { value: 'long', label: 'Long', capacity: 8 },
];

// Operating Hours Default
export const OPERATING_HOURS_DEFAULT = {
  monday: { open: '10:00', close: '22:00' },
  tuesday: { open: '10:00', close: '22:00' },
  wednesday: { open: '10:00', close: '22:00' },
  thursday: { open: '10:00', close: '22:00' },
  friday: { open: '10:00', close: '22:00' },
  saturday: { open: '10:00', close: '22:00' },
  sunday: { open: '10:00', close: '22:00' },
};
