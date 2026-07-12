'use client';

import { create } from 'zustand';
import type { LimitReached } from '@/lib/plan-limits';

// Drives the global UpgradePlanModal. Any page can trigger the popup on a
// plan-limit error without prop-drilling:
//
//   if (result.limitReached) {
//     useUpgradeStore.getState().show(result.limitReached);
//     return;
//   }
//
// The modal itself is mounted once per authenticated shell.

interface UpgradeStoreState {
  open: boolean;
  info: LimitReached | null;
  show: (info: LimitReached) => void;
  close: () => void;
}

export const useUpgradeStore = create<UpgradeStoreState>((set) => ({
  open: false,
  info: null,
  show: (info) => set({ open: true, info }),
  close: () => set({ open: false }),
}));
