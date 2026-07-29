// Owner "Orders" now reuses reception's full order-management screen
// (LiveOrdersPage) — status changes, settle, void, bill receipt — instead of
// the old read-only list. It's a self-contained client component driven by the
// shared auth store, so it targets the owner's own restaurant unchanged.
export { default } from '@/app/reception/orders/page';
