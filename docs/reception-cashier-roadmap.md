# Reception & Cash Counter — Roadmap

Source: 29-feature spec provided 2026-07-11 (7 categories: Auth/Shift, Table Management,
Order/KOT, Billing/Checkout, Discounts/Loyalty/CRM, Daily Ops, System/Hardware).

This doc maps each feature against what already exists in the codebase, lists the schema
work everything else depends on, and sequences the rest into phases. Nothing here is
implemented yet — this is the planning pass. Once a phase is picked, it gets written up
in `TASKS.md` for Opencode with Context / Files to change / Acceptance criteria.

## Current state (verified against code)

| # | Feature | Status |
|---|---------|--------|
| 4 | Real-time interactive floor plan | **Exists** — `app/dashboard/tables/page.tsx` already renders a color-coded grid (`getStatusColors`, statuses: available/occupied/reserved/bill_requested) |
| 6 | Walk-in table assignment | **Partial** — table status model supports it; need to verify the "assign in 3 clicks" flow with pax + server |
| 9 | Omni-channel order view | **Partial** — `app/dashboard/orders/page.tsx` (356 lines) exists; dine-in/takeaway covered via `Order.orderType`, no third-party delivery integration |
| 10 | Digital KOT / KDS | **Exists** — `app/kitchen/page.tsx` + `OrderCard.tsx`, `UndoSnackbar.tsx` |
| 12 | Live order status tracker | **Exists** — `OrderItem.status` (PENDING/PREPARED/SERVED) with `preparedAt`/`servedAt` timestamps |
| 17 | Tax & service charge engine | **Exists** — `Order.taxAmount`, `Order.serviceCharge` fields already computed into `totalAmount` |
| 26 | Reprint / void invoice history | **Partial** — `Bill` records exist and are queryable; no dedicated searchable UI yet |

Everything else in the 29-feature list has **no corresponding model or page** today.

## Schema gaps (blocks most of Phase 1+)

The current `Bill` model has a single `paymentMethod` + `amountPaid` field — it cannot
represent split-tender (#14) or multiple simultaneous payment types. New models needed:

- **`Shift`** — cashier/receptionist ID, opening float, closing declared cash, computed
  expected vs. actual, discrepancy, status (OPEN/CLOSED), timestamps. Needed for #2, #3.
- **`Payment`** — child of `Bill`, one row per tender (method, amount, reference). Replaces
  the single `paymentMethod`/`amountPaid` fields on `Bill`. Needed for #13, #14, #15, #16.
- **`Reservation`** — customer name/phone, party size, time, table assignment, status
  (BOOKED/CHECKED_IN/NO_SHOW/CANCELLED). Needed for #5.
- **`WaitlistEntry`** — customer name/phone, party size, quoted wait, status, notified-at.
  Needed for #8.
- **`Customer`** — phone/name-keyed profile, dietary notes, order history relation, loyalty
  points balance. Needed for #19, #20.
- **`Coupon`** — code, discount type/value, validity window, usage limits. Needed for #21.
- **`CorporateAccount`** — pre-approved billing entity, linked to `Bill` for #22.
- **Audit fields** for void/comp approval (`approvedBy`, `approvalReason`) on `Order`/`OrderItem`/`Bill` — needed for #11, #22, #25 (cash drawer pop logged for auditing).

## Phases

### Phase 0 — Schema foundation
Add the models above via Prisma migration. No UI yet. Everything downstream depends on
this, so it should land first regardless of which feature phase comes next.

### Phase 1 — Cashier core loop (highest daily value, builds on existing Orders/Tables/Bill)
- #16 Currency & change calculator
- #13 Bill splitting (equal / by item / custom)
- #14 Multi-mode payment processing (needs `Payment` model from Phase 0)
- #18 Dual-mode receipt generation (print / SMS / email)
- #23 Hold/park bill
- #24 Express takeaway quick-keys (top-10 grid)
- #25 Cash drawer pop trigger (logged)

This turns the existing Orders → Bill flow into an actual checkout counter.

### Phase 2 — Shift & accountability
- #1 Secure login + role-based access + idle timeout
- #2 Shift open/close + float declaration + drawer reconciliation
- #3 Shift analytics snapshot
- #26 Reprint & void invoice history (searchable)
- #11 Order modification / item voiding with manager approval

### Phase 3 — Reception / floor operations
- #5 Reservation lookup & check-in
- #6 Walk-in table assignment (finish the 3-click flow)
- #7 Table merge/split
- #8 Waitlist + SMS notify

### Phase 4 — CRM, discounts, loyalty
- #19 Customer lookup & profiles
- #20 Loyalty points redemption
- #21 Coupon/promo validation
- #22 Comp & corporate billing

### Phase 5 — Payments & tax polish
- #15 QR/digital wallet payments with auto-verify (needs a payment gateway webhook)
- #17 already exists — extend if multi-jurisdiction tax rules are needed

### Phase 6 — Infra / hardware (largest unknowns, do last)
- #27 Offline mode / local sync
- #28 Multi-terminal real-time sync
- #29 Peripheral hardware integration (printers, scanners, card terminals)

These three are architecturally the riskiest (offline queue + conflict resolution,
websocket/polling sync across terminals, browser hardware APIs or a local bridge
service for thermal printers/scanners) and should be scoped separately once the core
flows above are stable.

## Open questions for whoever picks the next phase

- Is there an existing payment gateway integration anywhere in the codebase (Stripe,
  Razorpay, etc.)? Needed to size #14/#15 realistically.
- Is SMS/email already wired up anywhere (e.g. for #8, #18, #22)? Check for a
  notifications provider before assuming it needs to be built from scratch.
- Hardware integration (#29) — is this web-only (WebUSB/WebSerial, browser print) or is
  a local bridge/agent app in scope?
