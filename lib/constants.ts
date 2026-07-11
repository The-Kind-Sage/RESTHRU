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

// Bill Status Colors
export const BILL_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-warning/10 text-warning',
  HELD: 'bg-info/10 text-info',
  PAID: 'bg-success/10 text-success',
  VOID: 'bg-destructive/10 text-destructive',
};

// Superadmin badge tone classes (G5). Every superadmin page used to
// re-declare its own `Record<string, string>` mapping a status label to the
// exact same handful of Tailwind combos (bg-primary/10 text-primary
// border-primary/30, etc). This is the one shared source for those combos —
// pages still define which *label* maps to which tone (their vocabulary
// differs: "Compliant" vs "Published" vs "ACTIVE"), but the actual color
// values live here once.
export const ADMIN_TONE_CLASSES = {
  positive: 'bg-primary/10 text-primary border-primary/30',
  warning: 'bg-accent/10 text-accent border-accent/30',
  negative: 'bg-destructive/10 text-destructive border-destructive/30',
  info: 'bg-info/10 text-info border-info/30',
  neutral: 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/30',
} as const;

export type AdminTone = keyof typeof ADMIN_TONE_CLASSES;

/**
 * Shared badge-variant map for recurring status labels across superadmin pages.
 * Every page used to re-declare its own `Record<string, string>` mapping
 * "Compliant"/"Active"/"Published" etc. to the same three tone classes —
 * now they all reference this one map.  Pages that need additional labels
 * (e.g. "Running" → "positive") extend it locally.
 */
export const STATUS_BADGE_VARIANTS: Record<string, keyof typeof ADMIN_TONE_CLASSES> = {
  Compliant: 'positive',
  Active: 'positive',
  Published: 'positive',
  Running: 'positive',
  Complete: 'info',
  Analyzing: 'warning',
  'Action Required': 'warning',
  Pending: 'warning',
  Draft: 'warning',
  'Non-Compliant': 'negative',
};

// Dashboard routes that render without the authenticated shell (sidebar/header) — the single
// source of truth so middleware.ts and app/dashboard/shell.tsx can't drift out of sync.
export const DASHBOARD_AUTH_ROUTES = [
  '/dashboard/login',
  '/dashboard/forgot-password',
  '/dashboard/password-reset',
] as const;

// Superadmin routes that render without the authenticated admin shell — kept
// here (next to DASHBOARD_AUTH_ROUTES) so middleware.ts and the superadmin
// layout share one source of truth instead of an inline list.
export const SUPERADMIN_AUTH_ROUTES = ['/superadmin/login'] as const;

// Canonical landing route for each role. Legacy STAFF maps to the owner
// dashboard. Kept edge-safe (no server-only imports) so middleware.ts can
// import it too. Used to bounce an authenticated-but-wrong-role user back to
// their own area instead of leaking a cross-role screen.
export const ROLE_HOME: Record<string, string> = {
  SUPER_ADMIN: '/superadmin',
  ADMIN: '/superadmin',
  RESTAURANT_OWNER: '/dashboard',
  STAFF: '/dashboard',
  RECEPTIONIST: '/reception',
  WAITER: '/order',
};

export function homeForRole(role: string | null | undefined): string {
  return (role && ROLE_HOME[role]) || '/dashboard';
}

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
