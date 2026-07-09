'use client';

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWaiterOrderStore } from '@/store/waiter-order-store';
import { Users, Hash } from 'lucide-react';

export default function TableSelectorModal() {
  const [isOpen, setIsOpen] = useState(false);
  const { tableNumber, guestCount, setTableInfo } = useWaiterOrderStore();
  
  const [localTable, setLocalTable] = useState(tableNumber || '');
  const [localGuests, setLocalGuests] = useState(guestCount.toString());

  useEffect(() => {
    const handleOpen = () => {
      setLocalTable(tableNumber || '');
      setLocalGuests(guestCount.toString());
      setIsOpen(true);
    };
    
    window.addEventListener('open-table-selector', handleOpen);
    
    // Automatically open if no table is set when the app starts
    if (!tableNumber) {
      setTimeout(() => setIsOpen(true), 500);
    }
    
    return () => window.removeEventListener('open-table-selector', handleOpen);
  }, [tableNumber, guestCount]);

  const handleSave = () => {
    if (!localTable) return;
    setTableInfo(localTable, parseInt(localGuests, 10) || 1);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-[340px] rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-bold text-center">
            Table Details
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 pt-2 space-y-6">
          <div className="space-y-3">
            <Label htmlFor="table" className="text-gray-600 font-semibold flex items-center gap-2">
              <Hash size={16} />
              Table Number
            </Label>
            <Input
              id="table"
              type="text"
              inputMode="numeric"
              placeholder="e.g. 12"
              value={localTable}
              onChange={(e) => setLocalTable(e.target.value)}
              className="h-14 text-2xl text-center font-bold rounded-xl"
              autoFocus
            />
          </div>
          
          <div className="space-y-3">
            <Label htmlFor="guests" className="text-gray-600 font-semibold flex items-center gap-2">
              <Users size={16} />
              Number of Guests
            </Label>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-12 w-12 rounded-xl text-xl font-bold"
                onClick={() => setLocalGuests(Math.max(1, parseInt(localGuests) - 1).toString())}
              >
                -
              </Button>
              <Input
                id="guests"
                type="number"
                inputMode="numeric"
                min="1"
                value={localGuests}
                onChange={(e) => setLocalGuests(e.target.value)}
                className="h-12 text-xl text-center font-bold rounded-xl flex-1"
              />
              <Button 
                variant="outline" 
                size="icon" 
                className="h-12 w-12 rounded-xl text-xl font-bold"
                onClick={() => setLocalGuests((parseInt(localGuests) + 1).toString())}
              >
                +
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 border-t border-gray-100 bg-gray-50">
          <Button 
            className="w-full h-12 text-lg font-bold rounded-xl" 
            onClick={handleSave}
            disabled={!localTable}
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
