const STORAGE_KEY = "resthru_offline_queue";

export interface QueuedMutation {
  id: string;
  action: string;
  payload: any;
  createdAt: number;
}

export function getQueue(): QueuedMutation[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function addToQueue(action: string, payload: any) {
  const queue = getQueue();
  queue.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    action,
    payload,
    createdAt: Date.now(),
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

export function removeFromQueue(id: string) {
  const queue = getQueue().filter((m) => m.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

export function clearQueue() {
  localStorage.removeItem(STORAGE_KEY);
}

export function isOnline() {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}
