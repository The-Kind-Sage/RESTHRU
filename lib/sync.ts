const SYNC_CHANNEL = "resthru-sync";

let bc: BroadcastChannel | null = null;
let sse: EventSource | null = null;
let listeners: Set<(event: string, data: any) => void> = new Set();

export function startSync() {
  if (typeof window === "undefined") return;

  if (!bc) {
    bc = new BroadcastChannel(SYNC_CHANNEL);
    bc.onmessage = (msg) => {
      listeners.forEach((fn) => fn("broadcast", msg.data));
    };
  }

  if (!sse) {
    sse = new EventSource("/api/sync/events");
    sse.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);
        listeners.forEach((fn) => fn("sse", data));
      } catch { /* ignore */ }
    };
    sse.onerror = () => {
      sse?.close();
      sse = null;
      setTimeout(startSync, 5_000);
    };
  }
}

export function stopSync() {
  bc?.close();
  bc = null;
  sse?.close();
  sse = null;
}

export function broadcast(event: string, data: any) {
  if (bc) bc.postMessage({ event, data });
}

export function onSyncEvent(fn: (event: string, data: any) => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getSyncStatus(): "connected" | "disconnected" {
  return sse && sse.readyState === EventSource.OPEN ? "connected" : "disconnected";
}
