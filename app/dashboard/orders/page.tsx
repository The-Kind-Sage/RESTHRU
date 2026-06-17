'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  BellOff,
  Printer,
  Trash2,
  Plus,
  ChevronRight,
  Circle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/format';

type OrderStatus = 'pending' | 'preparing' | 'ready' | 'served';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  orderNumber: string;
  tableNumber: number;
  status: OrderStatus;
  items: OrderItem[];
  createdAt: Date;
  totalAmount: number;
  waiter: string;
  specialNotes: string;
}

// Mock data
const mockOrders: Order[] = [
  {
    id: '1',
    orderNumber: 'ORD-1001',
    tableNumber: 5,
    status: 'pending',
    items: [
      { id: '1a', name: 'Momo (Steamed)', quantity: 2, price: 300 },
      { id: '1b', name: 'Thakali Set', quantity: 1, price: 450 },
    ],
    createdAt: new Date(Date.now() - 14 * 60000),
    totalAmount: 1050,
    waiter: 'Rajesh',
    specialNotes: 'Extra spicy',
  },
  {
    id: '2',
    orderNumber: 'ORD-1002',
    tableNumber: 3,
    status: 'pending',
    items: [
      { id: '2a', name: 'Masala Tea', quantity: 3, price: 80 },
      { id: '2b', name: 'Samosa', quantity: 4, price: 50 },
    ],
    createdAt: new Date(Date.now() - 10 * 60000),
    totalAmount: 440,
    waiter: 'Priya',
    specialNotes: '',
  },
  {
    id: '3',
    orderNumber: 'ORD-1003',
    tableNumber: 8,
    status: 'pending',
    items: [
      { id: '3a', name: 'Chow Mein', quantity: 1, price: 350 },
      { id: '3b', name: 'Spring Rolls', quantity: 2, price: 120 },
    ],
    createdAt: new Date(Date.now() - 8 * 60000),
    totalAmount: 590,
    waiter: 'Amit',
    specialNotes: 'No onion',
  },
  {
    id: '4',
    orderNumber: 'ORD-1004',
    tableNumber: 2,
    status: 'preparing',
    items: [
      { id: '4a', name: 'Dal Bhat', quantity: 2, price: 280 },
      { id: '4b', name: 'Achar Pickle', quantity: 1, price: 100 },
    ],
    createdAt: new Date(Date.now() - 22 * 60000),
    totalAmount: 660,
    waiter: 'Sumit',
    specialNotes: '',
  },
  {
    id: '5',
    orderNumber: 'ORD-1005',
    tableNumber: 7,
    status: 'preparing',
    items: [
      { id: '5a', name: 'Biryani', quantity: 1, price: 500 },
      { id: '5b', name: 'Raita', quantity: 1, price: 100 },
      { id: '5c', name: 'Pappad', quantity: 2, price: 60 },
    ],
    createdAt: new Date(Date.now() - 18 * 60000),
    totalAmount: 720,
    waiter: 'Vikram',
    specialNotes: 'Less salt',
  },
  {
    id: '6',
    orderNumber: 'ORD-1006',
    tableNumber: 1,
    status: 'preparing',
    items: [
      { id: '6a', name: 'Momos (Fried)', quantity: 1, price: 320 },
      { id: '6b', name: 'Chiura', quantity: 1, price: 150 },
    ],
    createdAt: new Date(Date.now() - 15 * 60000),
    totalAmount: 470,
    waiter: 'Neha',
    specialNotes: '',
  },
  {
    id: '7',
    orderNumber: 'ORD-1007',
    tableNumber: 6,
    status: 'preparing',
    items: [
      { id: '7a', name: 'Tandoori Chicken', quantity: 1, price: 450 },
      { id: '7b', name: 'Naan', quantity: 2, price: 80 },
    ],
    createdAt: new Date(Date.now() - 12 * 60000),
    totalAmount: 610,
    waiter: 'Ravi',
    specialNotes: 'Mild spice',
  },
  {
    id: '8',
    orderNumber: 'ORD-1008',
    tableNumber: 4,
    status: 'ready',
    items: [
      { id: '8a', name: 'Vegetable Fried Rice', quantity: 1, price: 280 },
      { id: '8b', name: 'Egg Roll', quantity: 2, price: 100 },
    ],
    createdAt: new Date(Date.now() - 28 * 60000),
    totalAmount: 480,
    waiter: 'Deepa',
    specialNotes: '',
  },
  {
    id: '9',
    orderNumber: 'ORD-1009',
    tableNumber: 9,
    status: 'ready',
    items: [
      { id: '9a', name: 'Butter Chicken', quantity: 1, price: 520 },
      { id: '9b', name: 'Rice', quantity: 1, price: 120 },
    ],
    createdAt: new Date(Date.now() - 25 * 60000),
    totalAmount: 640,
    waiter: 'Sanjay',
    specialNotes: 'Extra gravy',
  },
  {
    id: '10',
    orderNumber: 'ORD-1010',
    tableNumber: 11,
    status: 'ready',
    items: [
      { id: '10a', name: 'Paneer Tikka', quantity: 1, price: 380 },
      { id: '10b', name: 'Salad', quantity: 1, price: 150 },
    ],
    createdAt: new Date(Date.now() - 20 * 60000),
    totalAmount: 530,
    waiter: 'Anita',
    specialNotes: '',
  },
  {
    id: '11',
    orderNumber: 'ORD-1011',
    tableNumber: 10,
    status: 'served',
    items: [
      { id: '11a', name: 'Gulab Jamun', quantity: 4, price: 60 },
    ],
    createdAt: new Date(Date.now() - 35 * 60000),
    totalAmount: 240,
    waiter: 'Harish',
    specialNotes: '',
  },
  {
    id: '12',
    orderNumber: 'ORD-1012',
    tableNumber: 12,
    status: 'served',
    items: [
      { id: '12a', name: 'Ice Cream', quantity: 3, price: 150 },
      { id: '12b', name: 'Coffee', quantity: 3, price: 100 },
    ],
    createdAt: new Date(Date.now() - 40 * 60000),
    totalAmount: 750,
    waiter: 'Maya',
    specialNotes: 'Vanilla flavor',
  },
];

const statusConfig = {
  pending: { label: 'Pending', bgColor: 'bg-amber-500', nextStatus: 'preparing' as OrderStatus },
  preparing: { label: 'Preparing', bgColor: 'bg-blue-500', nextStatus: 'ready' as OrderStatus },
  ready: { label: 'Ready', bgColor: 'bg-green-500', nextStatus: 'served' as OrderStatus },
  served: { label: 'Served', bgColor: 'bg-gray-500', nextStatus: null },
};

const staffNames = ['Rajesh', 'Priya', 'Amit', 'Sumit', 'Vikram', 'Neha', 'Ravi', 'Deepa', 'Sanjay', 'Anita'];

function getTimerMinutes(createdAt: Date): number {
  return Math.floor((Date.now() - createdAt.getTime()) / 60000);
}

function OrderCard({
  order,
  onSelect,
}: {
  order: Order;
  onSelect: (order: Order) => void;
}) {
  const minutes = getTimerMinutes(order.createdAt);
  const isOvertime = minutes > 20;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      onClick={() => onSelect(order)}
      className="cursor-pointer"
    >
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-4 space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-sm">{order.orderNumber}</h3>
              <p className="text-xs text-muted-foreground">Table {order.tableNumber}</p>
            </div>
            <Badge variant="outline" className={isOvertime ? 'bg-red-100 text-red-800' : ''}>
              <span className={isOvertime ? 'text-red-600 font-bold' : 'text-amber-600'}>
                {minutes}m
              </span>
            </Badge>
          </div>

          <div className="space-y-1">
            {order.items.map((item) => (
              <p key={item.id} className="text-xs text-foreground">
                {item.quantity}x {item.name}
              </p>
            ))}
          </div>

          <Separator className="my-2" />

          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">{order.waiter}</span>
            <span className="font-semibold">{formatCurrency(order.totalAmount)}</span>
          </div>

          {statusConfig[order.status].nextStatus && (
            <Button
              size="sm"
              variant="secondary"
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              Move to {statusConfig[statusConfig[order.status].nextStatus!].label}
              <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function OrderColumn({
  status,
  orders,
  onSelectOrder,
}: {
  status: OrderStatus;
  orders: Order[];
  onSelectOrder: (order: Order) => void;
}) {
  const config = statusConfig[status];

  return (
    <div className="flex-shrink-0 w-full sm:w-96 bg-muted/30 rounded-lg border">
      <div className={`${config.bgColor} text-white p-3 rounded-t-lg flex justify-between items-center`}>
        <h2 className="font-semibold text-sm">{config.label}</h2>
        <Badge variant="secondary" className="bg-white text-black">
          {orders.length}
        </Badge>
      </div>
      <ScrollArea className="h-[500px] p-3">
        <div className="space-y-3">
          <AnimatePresence>
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onSelect={onSelectOrder}
              />
            ))}
          </AnimatePresence>
          {orders.length === 0 && (
            <p className="text-center text-xs text-muted-foreground py-8">
              No orders
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function OrderDetailDialog({
  order,
  isOpen,
  onClose,
}: {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [assignedStaff, setAssignedStaff] = useState(order?.waiter || '');

  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{order.orderNumber}</DialogTitle>
          <DialogDescription>
            Table {order.tableNumber} - {statusConfig[order.status].label}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Items */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Order Items</h3>
            <div className="space-y-2 bg-muted/50 p-3 rounded">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                  <span>
                    {item.quantity}x {item.name}
                  </span>
                  <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
              <Separator className="my-2" />
              <div className="flex justify-between items-center font-semibold">
                <span>Total</span>
                <span className="text-lg">{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Special Notes */}
          <div>
            <h3 className="font-semibold text-sm mb-2">Special Notes</h3>
            <div className="bg-blue-50 border border-blue-200 p-3 rounded text-sm min-h-[80px]">
              {order.specialNotes ? (
                <p>{order.specialNotes}</p>
              ) : (
                <p className="text-muted-foreground italic">No special notes</p>
              )}
            </div>
          </div>

          {/* Item Status */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Item Status</h3>
            <div className="space-y-2">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded">
                  <span>{item.name}</span>
                  <Badge variant="outline" className="bg-green-100 text-green-800">
                    Ready
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Assign Staff */}
          <div>
            <h3 className="font-semibold text-sm mb-2">Assign to Staff</h3>
            <select
              value={assignedStaff}
              onChange={(e) => setAssignedStaff(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
            >
              <option value="">Select staff member</option>
              {staffNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* Order Timing */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Order Time</p>
              <p className="font-semibold">
                {new Date(order.createdAt).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Duration</p>
              <p className="font-semibold">{getTimerMinutes(order.createdAt)} minutes</p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Close
          </Button>
          <Button
            variant="outline"
            className="text-blue-600 border-blue-300"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print KOT
          </Button>
          <Button
            variant="destructive"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Cancel Order
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function LiveOrdersPage() {
  const [selectedFilter, setSelectedFilter] = useState<OrderStatus | 'all'>('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredOrders = useMemo(() => {
    if (selectedFilter === 'all') {
      return mockOrders;
    }
    return mockOrders.filter((order) => order.status === selectedFilter);
  }, [selectedFilter]);

  const ordersByStatus = useMemo(() => {
    return {
      pending: filteredOrders.filter((o) => o.status === 'pending'),
      preparing: filteredOrders.filter((o) => o.status === 'preparing'),
      ready: filteredOrders.filter((o) => o.status === 'ready'),
      served: filteredOrders.filter((o) => o.status === 'served'),
    };
  }, [filteredOrders]);

  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card sticky top-0 z-40">
        <div className="max-w-full px-4 py-4">
          <div className="flex flex-col gap-4">
            {/* Title and Badge */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">Live Orders</h1>
                <Badge className="bg-primary text-primary-foreground text-base px-3 py-1">
                  {mockOrders.length} Active Orders
                </Badge>
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-3">
                {/* Auto-refresh indicator */}
                <div className="flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-full">
                  <div className="relative w-2 h-2">
                    <div className="absolute inset-0 bg-green-500 rounded-full animate-pulse" />
                    <div className="absolute inset-0 bg-green-500 rounded-full" />
                  </div>
                  <span className="text-xs font-semibold text-green-700">Live</span>
                </div>

                {/* Sound Toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="relative"
                >
                  {soundEnabled ? (
                    <Bell className="w-5 h-5" />
                  ) : (
                    <BellOff className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              <Button
                variant={selectedFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setSelectedFilter('all')}
                className="whitespace-nowrap"
              >
                All
              </Button>
              <Button
                variant={selectedFilter === 'pending' ? 'default' : 'outline'}
                onClick={() => setSelectedFilter('pending')}
                className={`whitespace-nowrap ${
                  selectedFilter === 'pending'
                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                    : ''
                }`}
              >
                Pending
              </Button>
              <Button
                variant={selectedFilter === 'preparing' ? 'default' : 'outline'}
                onClick={() => setSelectedFilter('preparing')}
                className={`whitespace-nowrap ${
                  selectedFilter === 'preparing'
                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                    : ''
                }`}
              >
                Preparing
              </Button>
              <Button
                variant={selectedFilter === 'ready' ? 'default' : 'outline'}
                onClick={() => setSelectedFilter('ready')}
                className={`whitespace-nowrap ${
                  selectedFilter === 'ready'
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : ''
                }`}
              >
                Ready
              </Button>
              <Button
                variant={selectedFilter === 'served' ? 'default' : 'outline'}
                onClick={() => setSelectedFilter('served')}
                className={`whitespace-nowrap ${
                  selectedFilter === 'served'
                    ? 'bg-gray-500 hover:bg-gray-600 text-white'
                    : ''
                }`}
              >
                Served
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 overflow-x-auto">
        {/* Kanban Board - visible on desktop */}
        <div className="hidden sm:flex gap-4 min-w-max pb-4">
          <OrderColumn
            status="pending"
            orders={ordersByStatus.pending}
            onSelectOrder={handleSelectOrder}
          />
          <OrderColumn
            status="preparing"
            orders={ordersByStatus.preparing}
            onSelectOrder={handleSelectOrder}
          />
          <OrderColumn
            status="ready"
            orders={ordersByStatus.ready}
            onSelectOrder={handleSelectOrder}
          />
          <OrderColumn
            status="served"
            orders={ordersByStatus.served}
            onSelectOrder={handleSelectOrder}
          />
        </div>

        {/* List View - visible on mobile */}
        <div className="sm:hidden space-y-3">
          <AnimatePresence>
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onSelect={handleSelectOrder}
              />
            ))}
          </AnimatePresence>
          {filteredOrders.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No orders found
            </p>
          )}
        </div>
      </div>

      {/* Order Detail Dialog */}
      <OrderDetailDialog
        order={selectedOrder}
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedOrder(null);
        }}
      />
    </div>
  );
}
