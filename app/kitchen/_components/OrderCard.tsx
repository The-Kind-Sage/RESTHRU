'use client';

import { Order, OrderStatus } from '@/types';
import { useKitchenStore } from '@/store/kitchen-store';
import { motion, useAnimation, PanInfo } from 'framer-motion';
import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrderCardProps {
  order: Order;
}

export function OrderCard({ order }: OrderCardProps) {
  const { updateOrderStatus, toggleItemCheck, checkedItems } = useKitchenStore();
  const [isExpanded, setIsExpanded] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const controls = useAnimation();

  // Timer logic
  useEffect(() => {
    const start = new Date(order.createdAt).getTime();

    // READY/SERVED orders show the final cook time, frozen
    if (order.status === OrderStatus.READY || order.status === OrderStatus.SERVED) {
      const end = new Date(order.updatedAt).getTime();
      setElapsedSeconds(Math.max(0, Math.floor((end - start) / 1000)));
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      setElapsedSeconds(Math.floor((now - start) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [order.createdAt, order.updatedAt, order.status]);

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Badge colors based on time (e.g., > 10 mins = warning, > 20 mins = danger)
  let badgeColor = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
  let isFlashing = false;
  if (elapsedSeconds > 1200) { // 20 mins
    badgeColor = 'bg-red-500 text-white border-red-600';
    isFlashing = true;
  } else if (elapsedSeconds > 600) { // 10 mins
    badgeColor = 'bg-amber-500/10 text-amber-500 border-amber-500/20';
  }

  const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
    [OrderStatus.PENDING]: OrderStatus.PREPARING,
    [OrderStatus.PREPARING]: OrderStatus.READY,
    [OrderStatus.READY]: OrderStatus.SERVED,
  };

  const handleDragEnd = async (event: any, info: PanInfo) => {
    const threshold = 100; // swipe threshold in px
    const next = NEXT_STATUS[order.status];
    if (info.offset.x > threshold && next) {
      updateOrderStatus(order.id, next);
    } else {
      // Return to original position
      controls.start({ x: 0 });
    }
  };

  const nextActionText =
    order.status === OrderStatus.PENDING ? 'Tap to Cook'
    : order.status === OrderStatus.PREPARING ? 'Tap to Complete'
    : order.status === OrderStatus.READY ? 'Mark Served / Picked Up'
    : 'Done';

  const handleActionTap = () => {
    const next = NEXT_STATUS[order.status];
    if (next) updateOrderStatus(order.id, next);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="relative mb-4 w-full"
    >
      <motion.div
        drag={NEXT_STATUS[order.status] ? 'x' : false}
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={handleDragEnd}
        animate={controls}
        className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden"
      >
        {/* Header */}
        <div
          className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {order.table?.tableNumber ? `Table ${order.table.tableNumber}` : order.orderType}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              #{order.orderId}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className={cn("px-2 py-1 rounded-md border text-xs font-bold flex items-center gap-1", badgeColor, isFlashing && "animate-pulse")}>
              <Clock className="w-3 h-3" />
              {formatTime(elapsedSeconds)}
            </div>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </div>
        </div>

        {/* Body */}
        {isExpanded && (
          <div className="p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50">
            {order.items.map((item, idx) => {
              const isChecked = checkedItems[`${order.id}-${item.id}`];
              
              return (
                <div 
                  key={item.id || idx} 
                  className={cn(
                    "flex gap-3 transition-opacity",
                    isChecked ? "opacity-50" : "opacity-100"
                  )}
                  onClick={() => toggleItemCheck(order.id, item.id)}
                >
                  <div className="mt-1">
                    {isChecked ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    ) : (
                      <Circle className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-start gap-2">
                      <span className={cn(
                        "text-lg font-bold min-w-[24px]",
                        isChecked ? "text-slate-400" : "text-blue-600 dark:text-blue-400"
                      )}>
                        {item.quantity}x
                      </span>
                      <span className={cn(
                        "text-lg font-semibold text-slate-800 dark:text-slate-200",
                        isChecked && "line-through text-slate-500 dark:text-slate-500"
                      )}>
                        {item.menuItemName}
                      </span>
                    </div>
                    
                    {/* Modifiers */}
                    {(item.specialInstructions || (item.selectedAddOns && item.selectedAddOns.length > 0)) && (
                      <div className="mt-2 pl-8 flex flex-col gap-1">
                        {item.specialInstructions && (
                          <div className="bg-yellow-100 dark:bg-yellow-500/20 text-yellow-800 dark:text-yellow-500 text-sm font-bold px-2 py-1 rounded inline-block w-fit uppercase">
                            "{item.specialInstructions}"
                          </div>
                        )}
                        {item.selectedAddOns?.map(addon => (
                          <span key={addon.addOnId} className="text-sm text-slate-600 dark:text-slate-400">
                            + {addon.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom Action Bar */}
        {NEXT_STATUS[order.status] && (
          <button
            onClick={handleActionTap}
            className={cn(
              "w-full py-4 text-center font-bold text-white transition-colors uppercase tracking-widest active:scale-95",
              order.status === OrderStatus.PENDING ? 'bg-blue-600 hover:bg-blue-700'
              : order.status === OrderStatus.PREPARING ? 'bg-emerald-600 hover:bg-emerald-700'
              : 'bg-slate-600 hover:bg-slate-700'
            )}
          >
            {nextActionText}
          </button>
        )}
      </motion.div>

      {/* Swipe Indicator Background (hidden under the card, revealed during drag) */}
      {NEXT_STATUS[order.status] && (
        <div className="absolute inset-0 bg-emerald-500 rounded-xl -z-10 flex items-center px-6">
          <span className="text-white font-bold text-lg">
            {order.status === OrderStatus.PENDING ? 'Cook' : order.status === OrderStatus.PREPARING ? 'Complete' : 'Serve'}
          </span>
        </div>
      )}
    </motion.div>
  );
}
