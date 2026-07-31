// Reception reuses the owner's Dishes screen. Both are client components driven
// by the shared auth store, so they resolve the same restaurant either way —
// re-exporting keeps one implementation instead of two that drift.
export { default } from '@/app/owner/menu/page';
