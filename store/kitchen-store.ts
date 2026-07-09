import { create } from 'zustand';
import { Order, OrderStatus } from '@/types';

export type KitchenTab = 'PENDING' | 'PREPARING' | 'READY';

interface KitchenState {
  activeTab: KitchenTab;
  setActiveTab: (tab: KitchenTab) => void;
  
  orders: Order[];
  setOrders: (orders: Order[]) => void;
  
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  
  undoLastCompletion: () => void;
  lastCompletedOrder: Order | null;
  
  // Item level checklist
  toggleItemCheck: (orderId: string, itemId: string) => void;
  checkedItems: Record<string, boolean>; // key: `${orderId}-${itemId}`
  
  // Prep Aggregator
  getPrepTotals: () => Record<string, number>;
}

export const useKitchenStore = create<KitchenState>((set, get) => ({
  activeTab: 'PENDING',
  setActiveTab: (tab) => set({ activeTab: tab }),
  
  orders: [],
  setOrders: (orders) => set({ orders }),
  
  addOrder: (order) => set((state) => {
    // Play alert sound if audio is allowed by browser
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch (e) {
      console.warn('Audio play failed', e);
    }

    // Trigger Haptic Feedback
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
    
    return { orders: [order, ...state.orders] };
  }),
  
  lastCompletedOrder: null,
  
  updateOrderStatus: (orderId, status) => set((state) => {
    const orderIndex = state.orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) return state;
    
    const order = state.orders[orderIndex];
    const updatedOrder = { ...order, status };
    
    const newOrders = [...state.orders];
    newOrders[orderIndex] = updatedOrder;
    
    let lastCompleted = state.lastCompletedOrder;
    if (status === 'READY') {
      lastCompleted = order;
      // Ideally trigger notification to waiter here
    }
    
    return { 
      orders: newOrders,
      lastCompletedOrder: lastCompleted
    };
  }),
  
  undoLastCompletion: () => set((state) => {
    if (!state.lastCompletedOrder) return state;
    
    const newOrders = state.orders.map(o => 
      o.id === state.lastCompletedOrder!.id 
        ? { ...o, status: 'PREPARING' as OrderStatus } // Put back to cooking
        : o
    );
    
    return {
      orders: newOrders,
      lastCompletedOrder: null
    };
  }),
  
  checkedItems: {},
  toggleItemCheck: (orderId, itemId) => set((state) => {
    const key = `${orderId}-${itemId}`;
    return {
      checkedItems: {
        ...state.checkedItems,
        [key]: !state.checkedItems[key]
      }
    };
  }),
  
  getPrepTotals: () => {
    const { orders } = get();
    // Only aggregate pending and preparing
    const activeOrders = orders.filter(o => o.status === 'PENDING' || o.status === 'PREPARING');
    
    const totals: Record<string, number> = {};
    activeOrders.forEach(order => {
      order.items.forEach(item => {
        if (totals[item.menuItemName]) {
          totals[item.menuItemName] += item.quantity;
        } else {
          totals[item.menuItemName] = item.quantity;
        }
      });
    });
    
    return totals;
  }
}));
