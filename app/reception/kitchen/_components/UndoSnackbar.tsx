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
          className="fixed bottom-4 left-4 right-4 z-50 bg-slate-800 text-white p-4 rounded-xl shadow-2xl border border-slate-700 flex items-center justify-between"
        >
          <div className="flex flex-col">
            <span className="font-bold">Order #{lastCompletedOrder.orderId} Ready</span>
            <span className="text-sm text-slate-400">Marked as completed</span>
          </div>
          
          <button 
            onClick={handleUndo}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg font-bold text-blue-400 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            UNDO
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
