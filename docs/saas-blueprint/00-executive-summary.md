# 00 — Executive summary

## The shift being proposed

| | Today | Proposed |
| --- | --- | --- |
| What it is | An ordering system for one restaurant | A restaurant operating system many restaurants subscribe to |
| Who pays | Nobody — it is a prototype | Restaurant operators, monthly or annually, in naira |
| Unit of value | A working app | A location, running a service, with its money reconciled |
| Revenue | None | Subscription, plus a thin payments margin, plus later capital products |
| Defensibility | None | Payment reconciliation, offline resilience, compliance, and switching cost in operational history |

## The market

**Demand side.** Nigeria's foodservice market is $12.37bn in 2026, growing 11.55% a year to $21.38bn
by 2031. Quick-service holds 55.92% of it. Critically, **independent outlets are 70.62% of the
market** — these are the businesses running on paper tickets, WhatsApp orders and a cash box, and
they are the addressable base. Cloud kitchens are the fastest-growing format at 12.05% CAGR, and
they are software-native by construction.

**Supply side.** Global restaurant management software is $7.5–8.1bn in 2026, compounding at
17–18% to roughly $24–30bn by 2033. Analytics and business intelligence is the fastest-growing
segment within it at 17.25% CAGR — which says the market has finished buying order-taking and has
started buying decisions.

**The consolidation signal.** Moniepoint has acquired Orda Africa, the leading cloud restaurant OS
on the continent (~1,500 restaurants, KFC Nigeria and Eat'N'Go among them, $4m raised). Orda's own
founder describes four revenue lines: subscription, a cut of processed payments, custom integration
work, and lending. Orda also abandoned its own hardware and moved to writing software for the POS
terminals banks already issue.

Read that acquisition correctly and it tells you three things:

1. **Distribution in this market runs through fintech.** Whoever owns the merchant's payment
   relationship can put software in front of them at near-zero acquisition cost.
2. **Hardware is a trap.** The winner does not manufacture terminals.
3. **A fintech-owned restaurant OS optimises for payment volume, not for the restaurant floor.**
   That is the gap.

## Where the incumbents actually fail

The research is unusually consistent on this. Three failures repeat across every market.

**Fee opacity and lock-in.** Operator forums about Toast are dominated by the same complaints:
"they charge you for everything… you sneeze and they want money"; mid-contract processing-rate
increases; a $0.99 consumer fee added to guests' bills without operator consent; two-year
commitments. The advertised $69/month becomes $69 plus online ordering ~$75, loyalty $50, gift cards
$50, email marketing $75, KDS $25, payroll $90 + $9/employee. TouchBistro's $69 becomes $69 plus
reservations at $229 and loyalty at $99.

**Pricing units that punish growth.** MenuTiger charges per store *and per table*: 15 tables is
$17/month, 40 tables is $46/month, for identical features. Per-order fees compound the same way —
$1 per order at 600 orders a month is more than three years of a flat plan. The most-praised
pricing in the entire category is StoreKit's, and its whole virtue is that it is legible: free
pay-as-you-go, or £50/month per venue.

**QR ordering that removes hospitality instead of adding to it.** There is a documented guest
backlash — restaurants publicly ditching QR menus, research showing QR-only ordering *reduces*
felt loyalty to the venue. But usage keeps climbing, and Sunday's Order & Pay operators report
12–15% larger baskets. The resolution already exists in the market: me&u's "Flex" mode, where a
guest can order from their phone *and* a server can add to the same table's ticket. The lesson is
that the winning product treats the phone as an additional channel into one shared ticket, never as
a replacement for a server.

## The wedge

Five things we can do that the incumbents structurally will not.

### 1. Transfer-native payments

Bank transfer is the dominant rail in Nigeria, and no global platform models it properly because no
global platform needs to. Today the prototype simulates the real-world flow — show an account
number, guest transfers, someone confirms — which is exactly how it works and exactly what is
broken about it: confirmation is manual and error-prone.

Solve it properly with a **dedicated virtual account per order**, so the amount, the reference and
the payer are unambiguous and reconciliation is automatic. Paystack prices dedicated virtual
accounts at 1% capped at ₦300; Monnify at 1.5% capped at ₦2,000 or a ₦500 flat option. At a ₦25,000
ticket that is ₦250–300, versus 1.5% + ₦100 = ₦475 on card. **Transfer is both what guests use and
the cheaper rail** — and a platform that makes it frictionless is selling margin back to the
operator.

### 2. Offline-first as architecture, not as a feature

Power and connectivity are structural constraints in this market, not edge cases. A local-first
sync engine where each location holds authoritative local state, the kitchen display works over the
venue LAN with no internet at all, and everything reconciles on reconnect. Competitors bolt
"offline mode" onto a cloud-first design and it degrades badly. Designing for it from the first
commit is a two-year lead that cannot be retrofitted cheaply.

### 3. Hospitality-preserving ordering

One ticket per table, writable by the guest's phone, a server's handheld, and the back office alike.
QR augments service; it never replaces it. This directly answers the documented backlash and is the
difference between a venue that adopts and a venue that quietly stops using the iPads.

### 4. Compliance as a shipped feature

Nigeria's FIRS e-invoicing mandate (the Merchant-Buyer Solution) is rolling out in phases through
2026 and covers VAT-registered suppliers on B2B, B2G **and B2C** transactions. Every restaurant in
the addressable market will need to comply, most do not know it yet, and no restaurant platform
sells it. Build e-invoicing, correct VAT treatment and NDPA-ready data handling into the product and
compliance becomes a reason to buy rather than a reason to churn.

### 5. Pricing you can read

Published naira prices. Flat per location. No per-table tax, no per-order tax, no lock-in, payment
processing passed through at cost with the rate printed on the invoice. In a category whose loudest
complaint is opacity, legibility is a feature — and it is the one competitors find hardest to copy,
because copying it means giving up revenue they already book.

## The commercial shape

Three published tiers in naira plus a quoted enterprise tier, per location, monthly or annual with
an annual discount. Detail and rationale in [03](03-saas-platform.md).

| Tier | Price | Who it is for |
| --- | --- | --- |
| Starter | ₦0 | One small venue, up to 6 tables, capped orders. A real product, not a trial. |
| Growth | ₦25,000/location/month | The volume tier. Should hold 60–70% of paying customers. |
| Pro | ₦75,000/location/month | Multi-location, inventory and recipe costing, loyalty, e-invoicing, API. |
| Enterprise | Quoted | Franchises and groups: SSO, consolidated reporting, SLA, data residency. |

₦25,000 is not arbitrary — Nigerian SaaS pricing research puts it at a price point that "feels like
a real price" to a Lagos buyer, and a restructure from USD tiers to naira tiers at ₦8,000 / ₦25,000 /
₦80,000 took one Lagos SaaS from 2% to 7% trial conversion. Annual billing lifts ARPU 20–40% even
after a 15–20% discount.

## The four decisions that need making now

These change the architecture, so they cannot be deferred past Phase 1.

1. **Is the customer app native iPad, or a web app in kiosk mode?** Native is the better guest
   experience and the harder offline story to fake; web is one codebase and instant deployment
   across whatever hardware a venue already owns. *Recommendation: web-first PWA in guided access,
   native later for venues that want it.* It halves Phase 1 and the offline work carries over.
2. **Do we take a payments margin, or pass processing through at cost?** A margin is real revenue
   and is what Orda does; pass-through at cost is the sharpest version of the transparency wedge.
   *Recommendation: pass through at cost in Phase 1–2 and win on trust, then monetise
   reconciliation-as-a-service and capital products later.*
3. **Multi-tenancy model.** *Recommendation: shared schema with `tenant_id` and Postgres row-level
   security as a backstop, hybrid-tiered later so enterprise tenants can be isolated onto their own
   database without an application rewrite.*
4. **Do we sell against Moniepoint/Orda, or distribute through a fintech?** Competing head-on means
   winning on product against an owner of distribution. Partnering means faster reach and a
   permanent dependency. *Recommendation: build product-led and direct first; keep the payments
   layer provider-agnostic precisely so a distribution partnership stays possible without a rebuild.*

## What the prototype already gets right

Worth stating, because it shapes how much of Phase 1 is genuinely new:

- The event-sourced state model and `SyncAdapter` seam are exactly the right shape for
  multi-tenancy and offline sync. The events already look like what a server would emit.
- Money as integer kobo with VAT and service charge computed on the subtotal and rounded so printed
  lines sum to the printed total. Correct, and the tests hold it.
- Role-gated administration with a real permission matrix.
- The three-surface split — table, pass, back office — matches how restaurants actually work.

The gap to a SaaS platform is not the restaurant features. It is tenancy, identity, real money,
offline durability, and the machinery of running a subscription business.
