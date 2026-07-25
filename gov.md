# Nepal Government Compliance — Gap Analysis (RESTHRU)

**Purpose:** Before commercialising RESTHRU as a restaurant management / billing system for Nepal, this document compares what the app currently does against what the Government of Nepal (primarily the **Inland Revenue Department, IRD**) legally requires of a billing/POS system. It lists what is **present**, what is **partial**, and what is **missing but mandatory**.

> ⚠️ **Disclaimer:** This is an engineering gap analysis compiled from IRD publications and reputable secondary sources (see **Sources**). It is **not legal/tax advice**. Rules, thresholds and CBMS deadlines change frequently. Before selling to VAT‑registered clients, confirm the current position with the IRD and a Nepali tax practitioner, and ideally get the billing software **registered/approved by the IRD**.

**Legend:** ✅ Present · 🟡 Partial / infra exists but not wired · ❌ Missing (mandatory or important)

---

## Executive summary — verdict

RESTHRU today is a solid **operations** system (orders, tables, KPIs, audit logs, owner/menu management). As a **statutory billing system for Nepal it is not yet compliant** and should **not** be marketed as "IRD‑compliant VAT billing" until the items below are built. The biggest blockers:

1. **No VAT on the tax invoice** — `taxAmount` is hard‑set to `0` in the billing flow; the printed bill has no VAT line.
2. **No PAN/VAT registration number** stored or printed — there is no field for it in the schema (the Settings page references `panNumber`/`vatNumber` that don't exist).
3. **The receipt is not a legal Tax Invoice** — missing the "Tax Invoice / कर बीजक" title, seller PAN, buyer PAN, VAT breakdown, amount‑in‑words, and signature/seal.
4. **No IRD CBMS e‑billing** — no real‑time transmission, no QR + digital signature, no invoice immutability lock, no credit notes.
5. **No Bikram Sambat (BS) date** on invoices.

These are must‑haves for any **VAT‑registered** restaurant (which, for this sector, is effectively most commercial restaurants — see §2). A "PAN‑bill‑only" mode is enough for the smallest businesses, but even that needs the PAN number and proper invoice format.

---

## ✅ Implemented in this iteration (Steps 1–3 of the roadmap)

Delivered & verified (tsc + runtime test on a real bill: total 3960 → taxable 3504.42 + VAT 455.58 @13%, BS date 2083‑04‑05, amount in words):

1. **PAN / VAT registration fields** — `Restaurant.panNumber`, `vatNumber`, `vatRegistered` added; the owner **Settings → General** PAN/VAT/registered inputs now actually persist (§2).
2. **VAT‑inclusive 13% engine** (`lib/vat.ts`) — VAT is back‑calculated from the menu‑inclusive total and stored on each bill (`Bill.taxableAmount` + `taxAmount`) at draft/settle and recomputed on discount/coupon (§4).
3. **Legal invoice template** (`formatTaxInvoiceHTML` + `getInvoicePrintData`) — VAT‑registered → **"Tax Invoice / कर बीजक"** with seller PAN/VAT, buyer name/PAN, itemised lines, taxable + VAT(13%), grand total, **amount in words**, **BS + AD date**, signature line; unregistered → a **PAN‑bill "Invoice"** with the same fields minus VAT. Wired into reception **Checkout** print and **Invoice History** reprint (§3, §8).

**Step 4 (§5–§6) — invoice immutability + credit notes + fiscal‑year numbering** (verified on real data: locked invoice B‑00018 → credit note CN‑208384‑00001, FY 2083/84):

4. **Hard‑lock on issue** — a bill is locked (`Bill.isLocked`) the moment it's fully paid (`recordPayment`, `settleOrder`). Locked invoices reject further payments, discounts, coupons, **and voids** (existing PAID bills are also protected via a `status === "PAID"` guard).
5. **Credit notes** (`CreditNote` model + `lib/actions/credit-notes.ts` + `formatCreditNoteHTML`) — the only way to reverse an issued invoice. Supports full or partial credit, splits the credited amount into taxable + VAT, accumulates `Bill.creditNoteTotal`, is **numbered gap‑free per BS fiscal year** (`CN-<FY>-00001`), logs `CREDIT_NOTE_ISSUE`, and prints a credit‑note document. Wired into **Invoice History** (locked bills show "Credit Note" instead of "Void").
6. **Fiscal year** stamped on every bill (`Bill.fiscalYear`, BS) at creation/settlement.

**Still outstanding:** **CBMS real‑time e‑billing + Ed25519‑signed QR** (§5, needs IRD onboarding — external), documented retention policy (§7), data‑privacy consent (§10), and a checkout buyer‑PAN input for B2B / ≥ NPR 10,000 sales.

> ⚠️ Invoice *format*, *immutability*, and *credit‑note* reversal are now compliant. Do **not** advertise fully "IRD‑compliant" until **CBMS transmission + signed QR** land (that step needs IRD software approval, a business/onboarding step).

---

## 1. Business registration & sector licences (context — operator's duty, not the software's)

These are obligations of the **restaurant owner**, not the software, but the app should *capture and surface* the identifiers so bills/reports are valid.

| Requirement | Gov mandate | In RESTHRU | Gap / action |
|---|---|---|---|
| Company / firm registration (OCR / Ward / Cottage & Small Industries) | Required to operate | ❌ not captured | Add optional "Registration No." field to restaurant profile |
| PAN registration (income tax) | Every business needs a PAN | ❌ no field | **Add `panNumber`** (see §2) |
| VAT registration | Mandatory for the restaurant sector (see §2) | ❌ no field | **Add `vatNumber` + `isVatRegistered`** |
| Food business licence (DFTQC — Dept. of Food Technology & Quality Control) | Required for food service | ❌ not captured | Optional field + expiry reminder (nice‑to‑have) |
| Liquor/excise licence (if serving alcohol — `BarTab` exists) | Required for bars | ❌ not captured | Optional field (nice‑to‑have) |
| Tourism registration (hotels/large restaurants) | Nepal Tourism Board / local body | ❌ | Optional field (nice‑to‑have) |

---

## 2. PAN / VAT registration & identifiers — ❌ MISSING (mandatory)

- **VAT rate is a flat 13%** (unchanged since 1997).
- **Restaurant/hotel VAT threshold:** the hospitality sector is treated as a *specified/mixed* sector. Restaurants generally must register for VAT — **from the first transaction** if in a designated category/area (e.g. with a bar, air‑conditioning, or in a metropolitan/sub‑metropolitan city), otherwise once turnover crosses the services/mixed threshold (~**NPR 30 lakh/yr**). *Confirm each client's category with IRD.*
- Businesses **below** the VAT threshold still need a **PAN** and must issue **PAN bills** (income‑tax invoices).

**Current state:** `Restaurant` has `taxPercentage` (13), `serviceCharge` (10), and `enableGST`/`gstNumber`. **`gstNumber`/GST is Indian terminology and is wrong for Nepal.** There is **no PAN or VAT number** field. The owner Settings page reads `r.panNumber`, `r.vatRegistered`, `r.vatNumber` — **none of which exist in the schema**, so they are never saved.

**Action (must‑have):** add to `Restaurant`:
```
panNumber        String?   // income‑tax PAN — printed on every PAN bill
vatNumber        String?   // VAT reg. no. — printed on every Tax Invoice
isVatRegistered  Boolean @default(false)
// (retire/repurpose enableGST/gstNumber — GST is not a Nepali concept)
```

---

## 3. Tax‑invoice format — ❌ MISSING (mandatory for VAT‑registered)

**Mandatory contents of a Tax Invoice (Rule 17, VAT Rules 2053 / Schedule 5).** Status = what RESTHRU's printed receipt (`lib/printing.ts`) contains today.

| # | Required field | In receipt today |
|---|---|---|
| 1 | Title **"Tax Invoice" (कर बीजक)** at the top | ❌ (says "Bill") |
| 2 | Seller **name, address, PAN** | 🟡 name+address+phone; **no PAN** |
| 3 | **Sequential invoice serial number** (no gaps) | 🟡 `B‑00001`, unique per restaurant, but **not fiscal‑year‑reset and not gap‑audited** |
| 4 | **Date** (AD; **BS strongly expected**) | 🟡 AD only, **no BS** |
| 5 | **Buyer name, address, PAN** (required if buyer is registered or txn ≥ NPR 10,000) | ❌ no customer block on bill |
| 6 | Itemised description | ✅ |
| 7 | Quantity, unit, rate | ✅ (qty, price) |
| 8 | Discount shown separately | ✅ |
| 9 | **Taxable value** (subtotal before VAT) | 🟡 shows subtotal, but VAT logic absent |
| 10 | **VAT rate stated (13%)** | ❌ |
| 11 | **VAT amount, calculated separately** | ❌ (`taxAmount` = 0) |
| 12 | **Grand total in words** | ❌ |
| 13 | Authorised **signature + company seal** | ❌ |
| — | **Copies:** original→buyer, duplicate→IRD, triplicate→books | ❌ single copy |

**Action (must‑have):** build a proper **Tax‑Invoice template** (a `VAT`/tax‑invoice variant of `formatReceiptHTML`) driven by `isVatRegistered`. If VAT‑registered → render full Tax Invoice; else → render a **PAN bill** (still needs PAN, serial no., BS date). Add an optional customer PAN capture at checkout for B2B / ≥ NPR 10,000 bills.

---

## 4. VAT computation & pricing rules — ❌ MISSING + ⚠️ pricing caveat

- **VAT is not computed.** `bills.ts` and `orders.ts` deliberately set `taxAmount: 0` ("No VAT — recompute the total from menu prices"). For a VAT‑registered restaurant the invoice **must** break out 13% VAT.
- **Court rulings:** Kathmandu courts have ruled that restaurants **cannot add VAT or service charge *on top* of the listed menu price** — the menu price is what the customer pays. The compliant pattern is therefore **VAT‑inclusive**: treat the menu total as gross, then **back‑calculate** the VAT component for the invoice:
  - `taxable = total / 1.13`, `vat = total − taxable` (when 13% applies).
- The current "menu‑price‑inclusive, no VAT shown" approach is half‑right (inclusive pricing) but **omits the mandatory VAT breakdown line** that a registered seller must display.

**Action (must‑have for VAT clients):** add a VAT‑inclusive engine that derives and displays the 13% component on the invoice, without adding it on top of menu prices. Keep a non‑VAT (PAN‑bill) path for unregistered clients.

---

## 5. Electronic billing & the CBMS (Central Billing Monitoring System) — ❌ MISSING

The IRD requires computerised billing used by (larger) VAT‑registered businesses to be **IRD‑approved** and, above turnover thresholds, connected to the **CBMS** for **real‑time** invoice transmission.

| Requirement | Detail | In RESTHRU |
|---|---|---|
| **IRD software approval/registration** | Submit business reg., PAN/VAT cert., software purchase invoice, provider agreement, user manual, (datacenter agreement if cloud) | ❌ not obtained |
| **Real‑time transmission to CBMS** | Each issued bill is sent to CBMS at the moment of issue | ❌ |
| **QR code on invoice, signed (Ed25519)** | Issued invoices carry a cryptographically signed QR | ❌ |
| **Invoice immutability** | Once issued, figures cannot be edited and the bill cannot be deleted; corrections via **credit note** only | 🟡 bills are currently *mutable* (payments/discounts update the row); void exists but is not an append‑only lock |
| **Gap‑free sequential numbering** | Numbers run without gaps within the fiscal year; any cancellation must be explained | 🟡 sequential per restaurant, not FY‑scoped, gaps not enforced/explained |
| **Running sales register** | Every document held in order | 🟡 `Bill` table + indexes exist |
| **Audit trail** (who created/printed/voided & when) | Required | ✅ `ActivityLog` + `voidedBy/voidReason/voidedAt` + `createdBy` (strong foundation) |
| **Network‑resilient queue/retry** | If CBMS link drops, queue and retry (don't lose the bill) | 🟡 `lib/offline-queue.ts` (localStorage queue) is a good starting point |

**CBMS turnover thresholds (verify — these have been dropping):**
- General VAT‑registered businesses that e‑bill: linked to CBMS above ~**NPR 10 crore** (was NPR 20 crore).
- **Hospitality (hotels/canteens/restaurants): lower threshold — ~NPR 5 crore** requires IRD approval to generate e‑bills.

**Action (must‑have to advertise "IRD‑compliant"):** design an **e‑billing module** = immutable issued‑invoice records + FY sequential numbering + signed QR + CBMS submit API with offline queue/retry + credit notes. This is the largest workstream and should gate the marketing claim.

---

## 6. Invoice integrity, credit notes & audit — 🟡 PARTIAL

- ✅ Good: full activity logging, void with reason/actor/time, `createdBy`, unique bill numbers, indexed sales table.
- ❌ **No credit notes / debit notes** — the only correction path is *void*, but VAT law requires **credit notes** for returns/adjustments on already‑issued invoices (you can't edit or delete an issued invoice).
- 🟡 **Mutability:** `recordPayment`, `applyDiscountToBill`, `applyCouponToBill` mutate a bill after creation. For compliance, once a bill is *issued/finalised* it must be locked; further changes happen via credit/debit note.

**Action:** add a `CreditNote` model + "issued/locked" state on `Bill`; block edits after issue.

---

## 7. Records retention — 🟡 PARTIAL

- **Requirement:** accounting records/invoices must be retained **6 years**.
- **Current:** data lives in Postgres indefinitely, which satisfies retention in practice, but there is **no explicit immutability/retention policy**, no export/archival of statutory invoices, and issued bills are still editable (§6).

**Action:** document a 6‑year retention + immutability policy; provide a statutory invoice export (VAT sales book / annexes).

---

## 8. Bikram Sambat (BS) calendar on invoices — ❌ MISSING on bills

- BS dates are **expected** on Nepali tax invoices (AD + BS).
- **Current:** a "Nepali Date" *display toggle* exists only in **owner reports**; the marketing site claims "Automatic dates in Nepal's BS calendar", but the **actual printed bill/receipt uses AD only**.

**Action:** add an AD↔BS date library and print **both** on invoices.

---

## 9. Service charge (10%) — ✅ present, ⚠️ legal caveat

- The app applies a configurable **service charge (default 10%)** on top of subtotal.
- **Legal position is contested:** the 2007 mandatory service charge (distributed to staff — historically ~72% staff / 23% management / 2% HAN under the Labour Act 2017 §87) was later made **optional** by the Restaurant & Bar Association, and courts have barred adding **any** charge *above the menu price*.
- **Implication:** service charge should be **off by default / clearly opt‑in**, and if charged must be shown transparently and (where applicable) be distributable to staff.

**Action:** default service charge to 0/opt‑in per client; keep it a separate, labelled line (already done). Optional: a service‑charge pool/distribution report for staff.

---

## 10. Customer data protection — 🟡 PARTIAL

- The **Individual Privacy Act, 2075 (2018)** governs personal data. RESTHRU's CRM stores customer **name, phone, loyalty, corporate accounts** and owner **KYC/identity documents** (recently added).
- **Current:** no consent capture, no privacy policy surface in‑app for restaurant customers, no data‑subject deletion/export, identity‑doc images stored on Cloudinary without a documented handling policy.

**Action:** add consent language at data capture, a documented retention/deletion policy, and access controls around KYC images (they are sensitive).

---

## 11. Other

| Area | Note | Status |
|---|---|---|
| Digital payments (eSewa/Khalti/FonePay/QR) | NRB‑licensed wallets; app already integrates QR + wallet verify | ✅ present |
| Excise on alcohol (bar) | Operator's excise duty/licence; invoice may need excise line | ❌ not modelled |
| Rounding | NPR invoices commonly round to paisa/rupee; ensure consistent rounding on VAT split | 🟡 verify |

---

## Priority roadmap

**MUST‑HAVE before commercialising to VAT‑registered restaurants (blocks the "IRD‑compliant" claim):**
1. PAN/VAT number fields (§2) + fix Settings to actually save them.
2. VAT‑inclusive 13% engine + mandatory VAT line (§4).
3. Legal **Tax Invoice / PAN bill** template with all Rule 17 fields + BS date (§3, §8).
4. Invoice **immutability lock** + **credit notes** + FY gap‑free numbering (§5, §6).
5. **CBMS e‑billing**: IRD software approval + real‑time submit + signed QR + offline retry (§5). *(Largest effort; can be a premium tier.)*

**SHOULD‑HAVE:**
6. 6‑year retention/immutability policy + VAT sales‑book export (§7).
7. Service charge off‑by‑default + transparency (§9).
8. Customer‑data consent + KYC image access controls (§10).

**NICE‑TO‑HAVE:**
9. Capture business/food/liquor/tourism licence numbers + expiry reminders (§1).
10. Excise line for bars (§11).

---

## ⚠️ Marketing‑vs‑reality risk

`lib/constants.ts` lists **"IRD‑compliant VAT billing"** as a paid‑plan feature, and `app/blog` / `app/about` advertise IRD compliance. **The system does not currently produce an IRD‑compliant VAT invoice.** Advertising a compliance capability that isn't implemented is a legal/reputational risk for a commercial product. Either (a) gate the claim behind the delivered MUST‑HAVE items above, or (b) soften the copy until they ship.

---

## Suggested first code changes (low‑risk, unblocks §2–§4)

- **Schema:** add `panNumber`, `vatNumber`, `isVatRegistered` to `Restaurant`; add `taxableAmount`, `vatAmount`, `customerPan`, `isVatInvoice`, `issuedAt`/`isLocked` to `Bill`.
- **Settings:** wire the already‑referenced PAN/VAT fields to real columns and save them.
- **Billing:** add a VAT‑inclusive calculator; populate `bill.taxAmount` (13% back‑calculated) when `isVatRegistered`.
- **Printing:** new `formatTaxInvoiceHTML` with title, seller PAN/VAT, buyer block, VAT breakdown, amount‑in‑words, BS date; keep `formatReceiptHTML` for non‑tax printouts.

---

## Sources

- Inland Revenue Department — Value Added Tax Rules, 2053 (invoice format, Rule 17 / Schedule 5): [ird.gov.np VAT Rules 2053 (PDF)](https://ird.gov.np/public/pdf/1670853212.pdf)
- VAT in Nepal 2026 — rates, bill format, thresholds, retention: [notarynepal.com](https://notarynepal.com/blog/vat-in-nepal-2026-rules-registration-filing-returns)
- Electronic Billing / CBMS compliance guide (immutability, sequential numbering, QR + Ed25519, audit trail, retry): [mis.ac](https://mis.ac/articles/blog/electronic-billing-cbms-nepal.php)
- Mandatory CBMS compliance notice & thresholds: [cangaassociates.com](https://cangaassociates.com/news/mandatory-cbms-compliance-notice-for-businesses), [Fiscal Nepal](https://www.fiscalnepal.com/2023/12/21/14830/ird-expands-central-billing-monitoring-system-mandate-for-high-turnover-businesses/)
- Lowered e‑billing turnover threshold (NPR 10 crore): [clickmandu](https://english.clickmandu.com/2026/05/9187/)
- IRD‑approved billing software requirements & documents: [busysoftwarenepal.com](https://busysoftwarenepal.com/ird-verified-computer-billing-software/), [Voxel Group – Nepal e‑invoicing guide](https://www.voxelgroup.net/compliance/guides/nepal/)
- VAT vs PAN bill, thresholds & penalties: [estartupnepal.com](https://estartupnepal.com/article/vat-and-pan-bill-in-nepal), [unionnepal.com](https://www.unionnepal.com/pan-bill-in-nepal)
- Restaurant service charge — mandatory origin, staff distribution & court rulings: [Kathmandu Post (2023, SC ruling)](https://kathmandupost.com/money/2023/01/27/no-more-service-charge-anywhere-top-court-says), [Kathmandu Post (VAT/service charge on menu price illegal)](https://kathmandupost.com/money/2022/09/28/vat-service-charge-added-to-food-bill-deemed-illegal)
- Hospitality registration overview: [companykhata.com](https://companykhata.com/library/blogs/hospitality-registration-in-nepal-step-by-step-guide/)

*Compiled July 2026. Verify all thresholds/deadlines directly with the IRD (ird.gov.np) before relying on them commercially.*
