// Bikram Sambat (BS) date formatting for tax invoices (gov.md §8). Nepali invoices
// are expected to carry the BS date alongside the AD date. Uses the already-installed
// `nepali-date-converter`. Server-side only (keeps the converter out of client bundles).

import NepaliDate from "nepali-date-converter";

const BS_MONTHS = [
  "Baishakh", "Jestha", "Ashadh", "Shrawan", "Bhadra", "Ashwin",
  "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra",
];

/** BS date as "YYYY-MM-DD" (numeric), or "" if conversion fails. */
export function toBsNumeric(d: Date): string {
  try {
    return new NepaliDate(d).format("YYYY-MM-DD");
  } catch {
    return "";
  }
}

/** BS date as "Shrawan 6, 2083 BS", or "" if conversion fails. */
export function toBsReadable(d: Date): string {
  try {
    const nd = new NepaliDate(d);
    return `${BS_MONTHS[nd.getMonth()] ?? ""} ${nd.getDate()}, ${nd.getYear()} BS`;
  } catch {
    return "";
  }
}

/**
 * Nepali fiscal year (Shrawan 1 → Ashadh end) for a date, e.g. "2082/83".
 * Used to scope gap-free invoice / credit-note numbering. Falls back to the AD
 * year if BS conversion fails.
 */
export function fiscalYearBs(d: Date): string {
  try {
    const nd = new NepaliDate(d);
    const y = nd.getYear();
    const m = nd.getMonth() + 1; // 1 = Baishakh … 4 = Shrawan
    const startYear = m >= 4 ? y : y - 1;
    return `${startYear}/${String((startYear + 1) % 100).padStart(2, "0")}`;
  } catch {
    return String(d.getFullYear());
  }
}
