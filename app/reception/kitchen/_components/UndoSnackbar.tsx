'use client';

import { useKitchenStore } from '@/store/kitchen-store';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { RotateCcw } from 'lucide-react';

export function UndoSnackbar() {
  const { lastCompletedOrder, undoLastCompletion } = useKitchenStore();
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    if (lastCompletedOrder) {
      setIsVisible(true);
      
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [lastCompletedOrder]);
  
  const handleUndo = () => {
    undoLastCompletion();
    setIsVisible(false);
  };
  
  return (
    <AnimatePresence>
      {isVisible && lastCompletedOrder && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-4 left-4 right-4 z-50 bg-card text-foreground p-4 rounded-xl shadow-2xl border border-border flex items-center justify-between"
        >
          <div className="flex flex-col">
            <span className="font-bold">Order #{lastCompletedOrder.orderId} Ready</span>
            <span className="text-sm text-muted-foreground">Marked as completed</span>
          </div>
          
          <button 
            onClick={handleUndo}
            className="flex items-center gap-2 bg-muted hover:bg-muted/80 px-4 py-2 rounded-lg font-bold text-primary transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            UNDO
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
