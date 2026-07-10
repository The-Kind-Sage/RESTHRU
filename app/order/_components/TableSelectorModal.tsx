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
import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PosTable {
  id: string;
  tableNumber: number;
  status: string;
  capacity: number;
}

export default function TableSelectorModal({ tables }: { tables: PosTable[] }) {
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

    // Automatically open if no table is set when the app starts.
    // Read the store at timeout time — the persisted value only arrives
    // after rehydration, which happens later than first render.
    const timer = setTimeout(() => {
      if (!useWaiterOrderStore.getState().tableNumber) setIsOpen(true);
    }, 500);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('open-table-selector', handleOpen);
    };
  }, [tableNumber, guestCount]);

  const handleSave = () => {
    if (!localTable) return;
    setTableInfo(localTable, parseInt(localGuests, 10) || 1);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-[380px] rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-bold text-center">
            Table Details
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 pt-2 space-y-6">
          <div className="space-y-3">
            <Label className="text-gray-600 font-semibold">Select Table</Label>
            {tables.length === 0 ? (
              <p className="text-sm text-gray-500">
                No tables configured yet. Ask the owner to add tables in the dashboard.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {tables.map((t) => {
                  const isSelected = localTable === t.tableNumber.toString();
                  const isOccupied = t.status === 'OCCUPIED';
                  return (
                    <button
                      key={t.id}
                      onClick={() => setLocalTable(t.tableNumber.toString())}
                      className={cn(
                        'rounded-xl border-2 p-3 flex flex-col items-center gap-0.5 transition-colors',
                        isSelected
                          ? 'border-primary bg-primary/10'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      )}
                    >
                      <span className="font-bold text-lg text-gray-900">{t.tableNumber}</span>
                      <span
                        className={cn(
                          'text-[10px] font-semibold uppercase tracking-wide',
                          isOccupied ? 'text-amber-600' : t.status === 'AVAILABLE' ? 'text-emerald-600' : 'text-gray-500'
                        )}
                      >
                        {isOccupied ? 'Occupied' : t.status === 'AVAILABLE' ? 'Free' : t.status.toLowerCase()}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
            <p className="text-xs text-gray-400">
              Occupied tables can take additional orders for the same party.
            </p>
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
                onClick={() => setLocalGuests(Math.max(1, (parseInt(localGuests) || 1) - 1).toString())}
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
                onClick={() => setLocalGuests(((parseInt(localGuests) || 1) + 1).toString())}
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
