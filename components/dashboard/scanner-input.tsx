"use client";

import { useEffect, useRef, useCallback } from "react";

interface Props {
  onScan: (barcode: string) => void;
  enabled?: boolean;
}

export default function ScannerInput({ onScan, enabled = true }: Props) {
  const buffer = useRef("");
  const lastTime = useRef(0);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      const now = Date.now();
      if (now - lastTime.current > 100) {
        buffer.current = "";
      }
      lastTime.current = now;

      if (e.key === "Enter") {
        const code = buffer.current.trim();
        if (code.length >= 3) {
          onScan(code);
        }
        buffer.current = "";
        return;
      }

      if (e.key.length === 1) {
        buffer.current += e.key;
      }
    },
    [enabled, onScan]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return null;
}
