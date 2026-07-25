// Nepal VAT helpers. See gov.md §4: Nepal courts require menu-INCLUSIVE pricing
// (VAT / service charge can't be added on top of the listed price), so the
// customer-facing total is treated as the gross and the 13% VAT component is
// back-calculated from it for the tax invoice.

export const NEPAL_VAT_RATE = 13;

export function roundMoney(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Split a VAT-inclusive gross amount into its taxable base and VAT at `rate`%.
 *   taxable = gross / (1 + rate/100),  vat = gross - taxable
 * Returns { taxable: gross, vat: 0 } when the rate is 0 / amount non-positive.
 */
export function splitVatInclusive(
  gross: number,
  rate: number = NEPAL_VAT_RATE
): { taxable: number; vat: number } {
  if (!(gross > 0) || !(rate > 0)) return { taxable: roundMoney(Math.max(0, gross)), vat: 0 };
  const taxable = roundMoney(gross / (1 + rate / 100));
  const vat = roundMoney(gross - taxable);
  return { taxable, vat };
}
