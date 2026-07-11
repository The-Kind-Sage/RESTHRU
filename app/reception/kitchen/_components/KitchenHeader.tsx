'use client';

import { useKitchenStore, KitchenTab } from '@/store/kitchen-store';
import { ChefHat, ListTodo, CheckCircle2, ChevronDown } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useState } from 'react';
import { OrderStatus } from '@/types';

export function KitchenHeader() {
  const { activeTab, setActiveTab, orders, getPrepTotals } = useKitchenStore();
  const [isPrepOpen, setIsPrepOpen] = useState(false);

  const pendingCount = orders.filter((o) => o.status === OrderStatus.PENDING).length;
  const cookingCount = orders.filter((o) => o.status === OrderStatus.PREPARING).length;
  const readyCount   = orders.filter((o) => o.status === OrderStatus.READY).length;

  const prepTotals = getPrepTotals();
  const prepKeys = Object.keys(prepTotals);

  const tabs: { id: KitchenTab; label: string; count?: number; icon: any }[] = [
    { id: 'PENDING' as KitchenTab, label: 'Pending', count: pendingCount, icon: ListTodo },
    { id: 'PREPARING' as KitchenTab, label: 'Cooking', count: cookingCount, icon: ChefHat },
    { id: 'READY' as KitchenTab, label: 'Ready', count: readyCount, icon: CheckCircle2 },
  ];

  return (
    <div className="sticky top-0 z-50 w-full bg-slate-900 text-white shadow-md">
      {/* Prep Aggregator Drawer */}
      <Collapsible open={isPrepOpen} onOpenChange={setIsPrepOpen}>
        <div className="bg-slate-800 px-4 py-2 flex items-center justify-between border-b border-slate-700">
          <div className="text-sm font-semibold text-slate-300">
            Prep Aggregator ({prepKeys.length} items)
          </div>
          <CollapsibleTrigger asChild>
            <button className="p-1 rounded-full hover:bg-slate-700 transition-colors">
              <ChevronDown
                className={`w-5 h-5 transition-transform duration-200 ${
                  isPrepOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className="bg-slate-800/95 border-b border-slate-700 px-4 py-3 max-h-[40vh] overflow-y-auto">
          {prepKeys.length === 0 ? (
            <p className="text-sm text-slate-400">No active items to prep.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {prepKeys.map((key) => (
                <div
                  key={key}
                  className="bg-slate-700 rounded-md p-2 flex justify-between items-center"
                >
                  <span className="text-sm font-medium truncate pr-2">
                    {key}
                  </span>
                  <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    x{prepTotals[key]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Tabs */}
      <div className="flex w-full overflow-x-auto hide-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[100px] flex flex-col items-center justify-center py-3 px-2 border-b-2 transition-colors ${
                isActive
                  ? 'border-blue-500 text-blue-400 bg-slate-800/50'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5 mb-1" />
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                    {tab.count}
                  </span>
                )}
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
