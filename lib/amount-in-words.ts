// Converts an NPR amount to English words using the South-Asian numbering system
// (thousand / lakh / crore / arab), for the mandatory "amount in words" line on a
// Nepali tax invoice (gov.md §3, Rule 17). e.g. 123456.5 ->
// "One Lakh Twenty Three Thousand Four Hundred Fifty Six Rupees and Fifty Paisa Only".

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function twoDigits(n: number): string {
  if (n < 20) return ONES[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return TENS[t] + (o ? " " + ONES[o] : "");
}

function threeDigits(n: number): string {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  const parts: string[] = [];
  if (h) parts.push(ONES[h] + " Hundred");
  if (rest) parts.push(twoDigits(rest));
  return parts.join(" ");
}

// Convert the whole-rupee part using Nepali grouping: crore, lakh, thousand, hundreds.
function rupeesToWords(n: number): string {
  if (n === 0) return "Zero";
  const parts: string[] = [];
  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  const hundreds = n % 1000;

  if (crore) parts.push(rupeesToWords(crore) + " Crore");
  if (lakh) parts.push(twoDigits(lakh) + " Lakh");
  if (thousand) parts.push(twoDigits(thousand) + " Thousand");
  if (hundreds) parts.push(threeDigits(hundreds));
  return parts.join(" ").trim();
}

/** e.g. amountInWords(1234.5, "Rupees", "Paisa") */
export function amountInWords(amount: number, major = "Rupees", minor = "Paisa"): string {
  const safe = Math.max(0, Math.round((amount + Number.EPSILON) * 100) / 100);
  const rupees = Math.floor(safe);
  const paisa = Math.round((safe - rupees) * 100);

  let out = `${rupeesToWords(rupees)} ${major}`;
  if (paisa > 0) out += ` and ${twoDigits(paisa)} ${minor}`;
  return out + " Only";
}
