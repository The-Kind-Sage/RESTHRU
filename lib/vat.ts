export const NEPAL_VAT_RATE = 13;

export function roundMoney(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function splitVatInclusive(totalAmount: number, rate: number) {
  const vat = totalAmount * (rate / (100 + rate));
  const taxable = totalAmount - vat;
  return { taxable: Math.round(taxable * 100) / 100, vat: Math.round(vat * 100) / 100 };
}
