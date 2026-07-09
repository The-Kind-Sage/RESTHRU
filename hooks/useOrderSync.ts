import { useEffect } from 'react';
import { useWaiterOrderStore } from '@/store/waiter-order-store';
import { toast } from 'sonner';

export const useOrderSync = () => {
  const { isOffline, setIsOffline, orderState, setOrderState } = useWaiterOrderStore();

  useEffect(() => {
    // Network status listeners
    const handleOnline = () => {
      setIsOffline(false);
      toast.success('Back Online. Syncing orders...', { duration: 3000 });
      // TODO: Here we would process any queued actions from localStorage
    };

    const handleOffline = () => {
      setIsOffline(true);
      toast.error('Offline - Syncing Locally', {
        description: 'Changes will be sent when connection returns.',
        duration: 5000,
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial check
    if (!navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setIsOffline]);

  // Mock WebSocket listener for order state updates
  useEffect(() => {
    if (orderState === 'CONFIRMED') {
      // Simulate kitchen picking up the order after 5 seconds
      const timeout = setTimeout(() => {
        setOrderState('LIVE_TRACKING');
        toast.info('Kitchen started preparing your order.');
      }, 5000);

      return () => clearTimeout(timeout);
    }
  }, [orderState, setOrderState]);
};
