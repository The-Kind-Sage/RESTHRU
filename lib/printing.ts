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

/**
 * Kitchen Order Ticket (KOT) — the docket the kitchen cooks from.
 *
 * Deliberately price-free and set in much larger type than the customer
 * receipt: it is read at a glance across a hot, busy pass, so quantity and
 * item name dominate and special instructions are called out rather than
 * tucked away.
 */
export function formatKOTHTML(data: {
  kotNumber: number | string;
  /** Omitted from the docket when the order has no table (delivery/takeaway). */
  tableLabel?: string | null;
  orderTypeLabel: string;
  waiterName: string;
  /** Pre-formatted, e.g. "29 Jul 2026 10:22 PM". */
  orderedAt: string;
  items: Array<{ name: string; qty: number; notes?: string | null }>;
  reprint?: boolean;
}) {
  const totalDishes = data.items.length;
  const totalQty = data.items.reduce((s, i) => s + i.qty, 0);

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>KOT ${escapeHtml(String(data.kotNumber))}</title>
<style>
  @page { margin: 0; size: 80mm auto; }
  body { font-family: 'Courier New', monospace; font-size: 13px; width: 72mm; margin: 0 auto; padding: 4mm 0; color: #000; }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .kot-title { font-size: 21px; font-weight: bold; }
  .table-label { font-size: 16px; font-weight: bold; margin-top: 3px; }
  .meta { margin-top: 2px; }
  .divider { border-top: 1px dashed #000; margin: 6px 0; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-weight: bold; padding-bottom: 2px; }
  td { padding: 3px 0; vertical-align: top; }
  .qty-col { text-align: right; white-space: nowrap; }
  .sn-col { width: 26px; }
  .notes { font-size: 11px; font-style: italic; padding-left: 26px; }
  .reprint { border: 2px solid #000; padding: 2px; font-weight: bold; margin-bottom: 5px; }
  .thanks { margin-top: 10px; }
</style></head><body>
  ${data.reprint ? `<div class="center reprint">*** REPRINT ***</div>` : ""}
  <div class="center kot-title">KOT ${escapeHtml(String(data.kotNumber))}</div>
  ${
    data.tableLabel
      ? `<div class="center table-label">Table: ${escapeHtml(data.tableLabel)}</div>`
      : `<div class="center table-label">${escapeHtml(data.orderTypeLabel)}</div>`
  }

  <div class="meta">Type: ${escapeHtml(data.orderTypeLabel)}</div>
  <div class="meta">Order By: ${escapeHtml(data.waiterName)}</div>
  <div class="meta">Order At: ${escapeHtml(data.orderedAt)}</div>

  <div class="divider"></div>
  <table>
    <tr><th class="sn-col">S.N</th><th>Dishes</th><th class="qty-col">QTY</th></tr>
  </table>
  <div class="divider"></div>
  <table>
    ${data.items
      .map(
        (i, idx) => `<tr>
          <td class="sn-col">${idx + 1}.</td>
          <td>${escapeHtml(i.name)}${
            i.notes ? `<div class="notes">** ${escapeHtml(i.notes)}</div>` : ""
          }</td>
          <td class="qty-col">${i.qty}</td>
        </tr>`
      )
      .join("")}
    <tr class="bold">
      <td colspan="2">Total (Dishes/QTY)</td>
      <td class="qty-col">${totalDishes}/${totalQty}</td>
    </tr>
  </table>
  <div class="divider"></div>

  <div class="center thanks">Thank You!</div>
</body></html>`;
}

/**
 * Saves a receipt/docket to a file.
 *
 * Writes the same self-contained HTML that `printReceipt` sends to the printer,
 * so the saved copy is byte-identical to the paper one — it opens in any
 * browser and can be re-printed or saved as PDF from there. Kept dependency
 * free on purpose: generating a true PDF client-side needs a library, which
 * isn't worth pulling in just to archive a bill.
 *
 * Returns false if the browser blocks the download.
 */
export function downloadReceipt(html: string, filename: string): boolean {
  if (typeof document === "undefined") return false;
  try {
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename.toLowerCase().endsWith(".html") ? filename : `${filename}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Give the browser a moment to start the download before revoking.
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sends a receipt/docket to the printer.
 *
 * Uses a hidden same-page iframe rather than `window.open`: a popup is blocked
 * by default in most browsers unless the click is trusted all the way through,
 * and a blocked popup fails *silently* — the cashier taps Print and nothing at
 * all happens. An iframe is never popup-blocked.
 *
 * Returns false only when the document itself can't be created, so callers can
 * surface a real error instead of leaving the user guessing.
 */
export function printReceipt(html: string): boolean {
  if (typeof document === "undefined") return false;

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  // Kept on-page but visually nowhere: `display:none` stops some browsers
  // rendering the document at all, which prints a blank sheet.
  iframe.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    iframe.remove();
    return false;
  }

  doc.open();
  doc.write(html);
  doc.close();

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    iframe.remove();
  };

  // onload and the fallback timer can both fire; without this the user gets
  // two print dialogs (and two dockets).
  let started = false;
  const run = () => {
    if (started) return;
    started = true;
    const win = iframe.contentWindow;
    if (!win) return cleanup();
    // Tear down once the print dialog closes; the timeout is a backstop for
    // browsers that never fire afterprint (and so would leak the iframe).
    win.addEventListener?.("afterprint", cleanup);
    setTimeout(cleanup, 60_000);
    try {
      win.focus();
      win.print();
    } catch {
      cleanup();
    }
  };

  // Wait for the written document to be laid out, or the sheet comes out blank.
  if (doc.readyState === "complete") {
    setTimeout(run, 50);
  } else {
    iframe.onload = run;
    setTimeout(run, 500); // fallback if onload doesn't fire for a written doc
  }

  return true;
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
