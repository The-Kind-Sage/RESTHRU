export function formatReceiptHTML(data: {
  restaurantName: string;
  address?: string;
  phone?: string;
  billNumber: string;
  items: Array<{ name: string; qty: number; price: number; total: number }>;
  subtotal: number;
  taxAmount: number;
  serviceCharge?: number;
  discountAmount?: number;
  totalAmount: number;
  amountPaid: number;
  change: number;
  paymentMethod: string;
  date: string;
  footer?: string;
}) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Receipt</title>
<style>
  @page { margin: 0; size: 80mm auto; }
  body { font-family: 'Courier New', monospace; font-size: 12px; width: 72mm; margin: 0 auto; padding: 4mm 0; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 1px 0; }
  .center { text-align: center; }
  .right { text-align: right; }
  .bold { font-weight: bold; }
  .divider { border-top: 1px dashed #000; margin: 4px 0; }
  .header { font-size: 16px; font-weight: bold; margin-bottom: 2px; }
</style></head><body>
  <div class="center header">${escapeHtml(data.restaurantName)}</div>
  ${data.address ? `<div class="center">${escapeHtml(data.address)}</div>` : ""}
  ${data.phone ? `<div class="center">${escapeHtml(data.phone)}</div>` : ""}
  <div class="center" style="margin: 4px 0;">Bill: ${escapeHtml(data.billNumber)}</div>
  <div class="center" style="margin-bottom: 6px;">${escapeHtml(data.date)}</div>
  <div class="divider"></div>
  <table>
    <tr><td class="bold">Item</td><td class="right bold">Qty</td><td class="right bold">Price</td><td class="right bold">Total</td></tr>
    ${data.items.map(i => `<tr><td>${escapeHtml(i.name)}</td><td class="right">${i.qty}</td><td class="right">${formatNum(i.price)}</td><td class="right">${formatNum(i.total)}</td></tr>`).join("")}
  </table>
  <div class="divider"></div>
  <table>
    <tr><td>Subtotal</td><td class="right">${formatNum(data.subtotal)}</td></tr>
    ${data.serviceCharge ? `<tr><td>Service Charge</td><td class="right">${formatNum(data.serviceCharge)}</td></tr>` : ""}
    ${data.discountAmount ? `<tr><td>Discount</td><td class="right">-${formatNum(data.discountAmount)}</td></tr>` : ""}
    <tr class="bold"><td>Total</td><td class="right">${formatNum(data.totalAmount)}</td></tr>
    <tr><td>Paid (${data.paymentMethod})</td><td class="right">${formatNum(data.amountPaid)}</td></tr>
    <tr><td>Change</td><td class="right">${formatNum(data.change)}</td></tr>
  </table>
  <div class="divider"></div>
  <div class="center" style="margin-top: 4px;">Thank you for your visit!</div>
  ${data.footer ? `<div class="center">${escapeHtml(data.footer)}</div>` : ""}
  <div style="margin-top: 8px; text-align: center;">---</div>
</body></html>`;
}

export function printReceipt(html: string) {
  const w = window.open("", "", "width=300,height=600");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => { w.print(); }, 500);
}

export function generateESCPOS(data: {
  restaurantName: string;
  billNumber: string;
  items: Array<{ name: string; qty: number; price: number }>;
  total: number;
  paid: number;
  change: number;
}): Uint8Array {
  const lines: string[] = [
    `\x1b\x61\x01${data.restaurantName}\x0a`,
    `\x1b\x61\x00Bill: ${data.billNumber}\x0a`,
    "-".repeat(32) + "\x0a",
    ...data.items.map(
      (i) => `${i.name} x${i.qty} ${(i.price * i.qty).toFixed(2)}\x0a`
    ),
    "-".repeat(32) + "\x0a",
    `TOTAL: ${data.total.toFixed(2)}\x0a`,
    `PAID: ${data.paid.toFixed(2)}\x0a`,
    `CHANGE: ${data.change.toFixed(2)}\x0a`,
    "\x0a\x1b\x61\x01Thank you!\x0a",
    "\x0a\x0a\x0a\x0a\x0a\x1d\x56\x00",
  ];
  const encoder = new TextEncoder();
  return encoder.encode(lines.join(""));
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatNum(n: number) {
  return n.toFixed(2);
}
