"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { RefreshCw, Wifi, WifiOff } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function SyncIndicator() {
  const [status, setStatus] = useState<"connected" | "disconnected" | "checking">("checking");
  const [lastSync, setLastSync] = useState<Date>(new Date());

  useEffect(() => {
    const check = () => {
      if (!navigator.onLine) {
        setStatus("disconnected");
        return;
      }
      setStatus("connected");
      setLastSync(new Date());
    };

    check();
    const interval = setInterval(check, 10_000);
    window.addEventListener("online", check);
    window.addEventListener("offline", () => setStatus("disconnected"));

    return () => {
      clearInterval(interval);
      window.removeEventListener("online", check);
      window.removeEventListener("offline", () => {});
    };
  }, []);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1 text-xs text-muted-foreground cursor-default">
            {status === "connected" ? (
              <Wifi className="w-3 h-3 text-success" />
            ) : status === "disconnected" ? (
              <WifiOff className="w-3 h-3 text-destructive" />
            ) : (
              <RefreshCw className="w-3 h-3 animate-spin" />
            )}
            <span className="hidden sm:inline">
              {status === "connected"
                ? "Live"
                : status === "disconnected"
                ? "Offline"
                : "Connecting..."}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {status === "connected"
            ? `Last sync: ${lastSync.toLocaleTimeString()}`
            : "No connection"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
