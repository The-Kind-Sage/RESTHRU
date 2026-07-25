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

// Nepal IRD-format invoice (gov.md §3, Rule 17). Renders a full "Tax Invoice /
// कर बीजक" with seller PAN/VAT, buyer, VAT breakdown, amount in words, BS+AD date
// and signature line when the restaurant is VAT-registered; otherwise a PAN-bill
// "Invoice" (same fields minus the VAT lines). Fed by getInvoicePrintData().
import type { InvoicePrintData } from "@/lib/actions/invoice";

export function formatTaxInvoiceHTML(d: InvoicePrintData) {
  const row = (label: string, value: string, bold = false) =>
    `<tr${bold ? ' class="bold"' : ""}><td>${escapeHtml(label)}</td><td class="right">${escapeHtml(value)}</td></tr>`;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${escapeHtml(d.title)} ${escapeHtml(d.billNumber)}</title>
<style>
  @page { margin: 0; size: 80mm auto; }
  body { font-family: 'Courier New', monospace; font-size: 12px; width: 72mm; margin: 0 auto; padding: 4mm 0; color:#000; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 1px 0; vertical-align: top; }
  .center { text-align: center; }
  .right { text-align: right; }
  .bold { font-weight: bold; }
  .divider { border-top: 1px dashed #000; margin: 4px 0; }
  .header { font-size: 15px; font-weight: bold; }
  .title { font-weight: bold; margin: 4px 0; letter-spacing: 1px; }
  .void { color:#000; border:2px solid #000; text-align:center; font-weight:bold; padding:2px; margin:4px 0; }
  .small { font-size: 10px; }
</style></head><body>
  <div class="center header">${escapeHtml(d.seller.name)}</div>
  ${d.seller.address ? `<div class="center">${escapeHtml(d.seller.address)}</div>` : ""}
  ${d.seller.phone ? `<div class="center">Tel: ${escapeHtml(d.seller.phone)}</div>` : ""}
  ${d.seller.pan ? `<div class="center">PAN: ${escapeHtml(d.seller.pan)}</div>` : ""}
  ${d.seller.vat ? `<div class="center">VAT No: ${escapeHtml(d.seller.vat)}</div>` : ""}
  <div class="divider"></div>
  <div class="center title">${escapeHtml(d.title)}</div>
  ${d.voided ? `<div class="void">*** VOID ***</div>` : ""}
  <table>
    <tr><td>Invoice No</td><td class="right">${escapeHtml(d.billNumber)}</td></tr>
    <tr><td>Date (AD)</td><td class="right">${escapeHtml(d.dateAd)}</td></tr>
    ${d.dateBs ? `<tr><td>Date (BS)</td><td class="right">${escapeHtml(d.dateBs)}</td></tr>` : ""}
    ${d.buyer.name ? `<tr><td>Bill To</td><td class="right">${escapeHtml(d.buyer.name)}</td></tr>` : ""}
    ${d.buyer.pan ? `<tr><td>Buyer PAN</td><td class="right">${escapeHtml(d.buyer.pan)}</td></tr>` : ""}
    ${d.buyer.table ? `<tr><td>${escapeHtml(d.buyer.table)}</td><td class="right"></td></tr>` : ""}
  </table>
  <div class="divider"></div>
  <table>
    <tr class="bold"><td>Item</td><td class="right">Qty</td><td class="right">Rate</td><td class="right">Amount</td></tr>
    ${d.items.map(i => `<tr><td>${escapeHtml(i.name)}</td><td class="right">${i.qty}</td><td class="right">${formatNum(i.price)}</td><td class="right">${formatNum(i.total)}</td></tr>`).join("")}
  </table>
  <div class="divider"></div>
  <table>
    ${row("Subtotal", formatNum(d.subtotal))}
    ${d.serviceCharge ? row("Service Charge", formatNum(d.serviceCharge)) : ""}
    ${d.discountAmount ? row("Discount", "-" + formatNum(d.discountAmount)) : ""}
    ${d.isVatInvoice ? row("Taxable Amount", formatNum(d.taxableAmount)) : ""}
    ${d.isVatInvoice ? row(`VAT (${d.vatRate}%)`, formatNum(d.vatAmount)) : ""}
    ${row("TOTAL", formatNum(d.totalAmount), true)}
  </table>
  <div class="divider"></div>
  <div class="small">In words: ${escapeHtml(d.amountInWords)}</div>
  <div class="divider"></div>
  <table>
    ${row(`Paid (${d.paymentMethod})`, formatNum(d.amountPaid))}
    ${row("Change", formatNum(d.change))}
  </table>
  <div class="divider"></div>
  <div style="margin-top:14px;">Authorised Signature: __________</div>
  <div class="center small" style="margin-top:8px;">This is a computer-generated invoice.</div>
  <div class="center" style="margin-top:2px;">Thank you for your visit!</div>
  <div style="margin-top: 8px; text-align: center;">---</div>
</body></html>`;
}

// Credit note printout (gov.md §6) — references the original invoice, states the
// reason, and shows the credited taxable + VAT amounts. Fed by getCreditNotePrintData().
import type { CreditNotePrintData } from "@/lib/actions/credit-notes";

export function formatCreditNoteHTML(d: CreditNotePrintData) {
  const row = (label: string, value: string, bold = false) =>
    `<tr${bold ? ' class="bold"' : ""}><td>${escapeHtml(label)}</td><td class="right">${escapeHtml(value)}</td></tr>`;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Credit Note ${escapeHtml(d.creditNoteNumber)}</title>
<style>
  @page { margin: 0; size: 80mm auto; }
  body { font-family: 'Courier New', monospace; font-size: 12px; width: 72mm; margin: 0 auto; padding: 4mm 0; color:#000; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 1px 0; vertical-align: top; }
  .center { text-align: center; }
  .right { text-align: right; }
  .bold { font-weight: bold; }
  .divider { border-top: 1px dashed #000; margin: 4px 0; }
  .header { font-size: 15px; font-weight: bold; }
  .title { font-weight: bold; margin: 4px 0; letter-spacing: 1px; }
  .small { font-size: 10px; }
</style></head><body>
  <div class="center header">${escapeHtml(d.seller.name)}</div>
  ${d.seller.address ? `<div class="center">${escapeHtml(d.seller.address)}</div>` : ""}
  ${d.seller.phone ? `<div class="center">Tel: ${escapeHtml(d.seller.phone)}</div>` : ""}
  ${d.seller.pan ? `<div class="center">PAN: ${escapeHtml(d.seller.pan)}</div>` : ""}
  ${d.seller.vat ? `<div class="center">VAT No: ${escapeHtml(d.seller.vat)}</div>` : ""}
  <div class="divider"></div>
  <div class="center title">${escapeHtml(d.title)}</div>
  <table>
    <tr><td>Credit Note No</td><td class="right">${escapeHtml(d.creditNoteNumber)}</td></tr>
    <tr><td>Against Invoice</td><td class="right">${escapeHtml(d.originalInvoice)}</td></tr>
    <tr><td>Date (AD)</td><td class="right">${escapeHtml(d.dateAd)}</td></tr>
    ${d.dateBs ? `<tr><td>Date (BS)</td><td class="right">${escapeHtml(d.dateBs)}</td></tr>` : ""}
    ${d.buyer.name ? `<tr><td>Customer</td><td class="right">${escapeHtml(d.buyer.name)}</td></tr>` : ""}
    ${d.buyer.pan ? `<tr><td>Buyer PAN</td><td class="right">${escapeHtml(d.buyer.pan)}</td></tr>` : ""}
  </table>
  <div class="divider"></div>
  <div class="small">Reason: ${escapeHtml(d.reason)}</div>
  <div class="divider"></div>
  <table>
    ${d.isVat ? row("Taxable Amount", formatNum(d.taxableAmount)) : ""}
    ${d.isVat ? row("VAT (13%)", formatNum(d.vatAmount)) : ""}
    ${row("Total Credited", formatNum(d.amount), true)}
  </table>
  <div class="divider"></div>
  <div class="small">In words: ${escapeHtml(d.amountInWords)}</div>
  <div class="divider"></div>
  <div style="margin-top:14px;">Authorised Signature: __________</div>
  <div class="center small" style="margin-top:8px;">This is a computer-generated credit note.</div>
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
