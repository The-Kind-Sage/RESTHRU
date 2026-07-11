// Nepali rupee formatting with lakh-style grouping (Rs. 1,24,500), matching
// how prices are shown across the rest of the app (e.g. nepal-section.tsx).
export function formatPrice(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  const options: Intl.NumberFormatOptions = Number.isInteger(rounded)
    ? {}
    : { minimumFractionDigits: 2, maximumFractionDigits: 2 };
  return `Rs. ${rounded.toLocaleString("en-IN", options)}`;
}
