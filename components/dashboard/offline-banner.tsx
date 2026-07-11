"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { getQueue } from "@/lib/offline-queue";

export default function OfflineBanner() {
  const [online, setOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const updateStatus = () => {
      setOnline(navigator.onLine);
      setPendingCount(getQueue().length);
    };

    updateStatus();
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);
    const interval = setInterval(updateStatus, 3_000);

    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
      clearInterval(interval);
    };
  }, []);

  if (online && pendingCount === 0) return null;

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-[60] flex items-center justify-center gap-2 px-4 py-1.5 text-xs font-medium transition-all",
        online ? "bg-warning/10 text-warning border-b border-warning/20" : "bg-destructive/10 text-destructive border-b border-destructive/20"
      )}
    >
      {online ? (
        <>
          <RefreshCw className="w-3 h-3 animate-spin" />
          Syncing {pendingCount} pending {pendingCount === 1 ? "change" : "changes"}...
        </>
      ) : (
        <>
          <WifiOff className="w-3 h-3" />
          You are offline. Changes will sync when reconnected.
        </>
      )}
    </div>
  );
}
