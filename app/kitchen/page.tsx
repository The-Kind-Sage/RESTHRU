'use client';

import { KitchenHeader } from './_components/KitchenHeader';
import { OrderCard } from './_components/OrderCard';
import { UndoSnackbar } from './_components/UndoSnackbar';
import { useKitchenStore } from '@/store/kitchen-store';
import { useEffect, useState } from 'react';
import { Order, OrderStatus } from '@/types';
import { AnimatePresence } from 'framer-motion';

// Mock initial data for demonstration
const mockOrders: Order[] = [
  {
    id: 'o1',
    restaurantId: 'r1',
    tableId: '5',
    orderId: '1024',
    orderType: 'DINE_IN',
    status: 'PENDING',
    items: [
      { id: 'i1', orderId: 'o1', menuItemId: 'm1', menuItemName: 'Classic Burger', quantity: 2, pricePerUnit: 12, specialInstructions: 'No Onions', selectedAddOns: [], status: 'PENDING' },
      { id: 'i2', orderId: 'o1', menuItemId: 'm2', menuItemName: 'French Fries', quantity: 1, pricePerUnit: 4, selectedAddOns: [], status: 'PENDING' }
    ],
    subtotal: 28, taxAmount: 2.8, serviceChargeAmount: 2.8, discountAmount: 0, totalAmount: 33.6,
    createdAt: new Date(Date.now() - 1000 * 60 * 5), // 5 mins ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 5)
  },
  {
    id: 'o2',
    restaurantId: 'r1',
    tableId: '12',
    orderId: '1025',
    orderType: 'DINE_IN',
    status: 'PREPARING',
    items: [
      { id: 'i3', orderId: 'o2', menuItemId: 'm3', menuItemName: 'Margherita Pizza', quantity: 1, pricePerUnit: 15, selectedAddOns: [{ addOnId: 'a1', name: 'Extra Cheese', price: 2 }], status: 'PREPARING' }
    ],
    subtotal: 17, taxAmount: 1.7, serviceChargeAmount: 1.7, discountAmount: 0, totalAmount: 20.4,
    createdAt: new Date(Date.now() - 1000 * 60 * 15), // 15 mins ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 15)
  }
];

export default function KitchenPage() {
  const { activeTab, orders, setOrders, addOrder } = useKitchenStore();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setOrders(mockOrders);

    // Development only: Simulate a new incoming order after 10 seconds to test sound/haptic
    const timer = setTimeout(() => {
      const newOrder: Order = {
        id: `o${Date.now()}`,
        restaurantId: 'r1',
        tableId: '8',
        orderId: Math.floor(1000 + Math.random() * 9000).toString(),
        orderType: 'DINE_IN',
        status: 'PENDING',
        items: [
          { id: `i${Date.now()}`, orderId: `o${Date.now()}`, menuItemId: 'm4', menuItemName: 'Spicy Wings', quantity: 1, pricePerUnit: 10, selectedAddOns: [], status: 'PENDING' }
        ],
        subtotal: 10, taxAmount: 1, serviceChargeAmount: 1, discountAmount: 0, totalAmount: 12,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      addOrder(newOrder);
    }, 10000);

    return () => clearTimeout(timer);
  }, [setOrders, addOrder]);

  if (!isClient) return null; // Avoid hydration mismatch

  const displayedOrders = orders.filter(o => o.status === activeTab);

  return (
    <div className="flex flex-col h-screen bg-slate-100 dark:bg-black font-sans overflow-hidden">
      <KitchenHeader />
      
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-24 scroll-smooth">
        <AnimatePresence>
          {displayedOrders.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-70">
              <span className="text-6xl mb-4">🍳</span>
              <p className="text-lg font-medium">No orders in {activeTab.toLowerCase()}</p>
            </div>
          ) : (
            displayedOrders.map(order => (
              <OrderCard key={order.id} order={order} />
            ))
          )}
        </AnimatePresence>
      </div>
      
      <UndoSnackbar />
    </div>
  );
}
