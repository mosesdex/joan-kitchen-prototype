# 08 — Differentiation, prioritisation and roadmap

## 8.1 Why anyone would choose us

The question a founder must be able to answer in one sentence to a restaurant owner who already has
options. Ours:

> **Because it keeps working when the light goes, it gets your transfers reconciled without anyone
> staring at a bank app, and you can read the price on the website.**

Six positions, ranked by how hard they are to copy.

### 1. Offline-first architecture — **hardest to copy, deepest moat**

Not a feature; a foundation. A competitor with a cloud-first system cannot bolt this on without
rebuilding their data layer. Given Nigerian power and connectivity, it is also the difference
between software a restaurant relies on and software it works around. **This is the moat. Build it
in Phase 1 or never.**

### 2. Transfer-native payments with automatic reconciliation

Global platforms will not build this because their markets do not need it. Local fintech-owned
platforms could, but their incentive is to route volume onto their own rails and margins, not to
make the cheapest rail frictionless. A dedicated virtual account per order at 1% capped ₦300 is both
better UX and cheaper than card at 1.5% + ₦100 — we would be handing the operator margin, which is
an awkward thing for a payments company to copy.

### 3. Radical pricing transparency

Published naira prices, flat per location, no per-table or per-order tax, processing passed through
at cost with the rate printed. Copyable in principle; extremely hard in practice, because copying it
means an incumbent giving up revenue it already books. The category's loudest complaint is fee
opacity and its most-praised competitor (StoreKit) is praised precisely for legibility.

### 4. Hospitality-preserving Flex ordering

One ticket writable by guest, server and back office. Answers the documented QR backlash instead of
ignoring it. me&u has proven the model at 6,000+ venues; nobody has brought it to this market.

### 5. Compliance as a product

FIRS e-invoicing, correct VAT treatment, NDPA-ready data handling. Every VAT-registered restaurant
will need it, most do not know yet, and no restaurant platform here sells it. Converts a looming
anxiety into a reason to upgrade.

### 6. Loss prevention as the ROI story

**75% of restaurant shrinkage is employee theft.** Named attribution on every void and comp,
theoretical-versus-actual variance, anomaly alerts. This is the argument that justifies ₦75,000 a
month to an owner who is unsure about ₦25,000 — because the number it protects is bigger than both.

### And the commercial argument that closes deals

**Commission recovery.** Chowdeck and its peers take 15–30% per order. Every order moved to the
venue's own table or own channel returns that margin. Put a running naira counter for it on the
dashboard. Owner.com built a business on this pitch in a market where commissions are *lower* than
Nigeria's.

### Where we will not win, and should not pretend to

Hardware breadth, US and EU market presence, payroll and workforce depth, an established app
marketplace, and enterprise chain relationships. Ceding these clearly is what makes the six above
credible.

## 8.2 Phase 1 — MVP

**Goal:** one paying restaurant runs its entire service on this for a month without calling us.
**Target: 10 paying locations. 4–5 months.**

| Feature | What it does | Why it matters | Who | Value | Complexity | Deps |
| --- | --- | --- | --- | --- | --- | --- |
| Multi-tenant foundation | Organisations, members, RLS, tenant-scoped everything | Nothing else can be built until this is right; retrofitting is a rewrite | All | Critical | High | — |
| Authentication and roles | Email/phone + OTP, PIN for floor staff, RBAC over a capability catalogue | Table stakes; capability model avoids a Phase 4 rewrite | All | Critical | Medium | Tenancy |
| **Venue node + offline sync** | Local-first state, LAN kitchen, resumable event log | **The moat.** Cannot be added later | All | Critical | **Very high** | Tenancy |
| Menu management | Categories, dishes, modifiers, allergens, availability | *Prototype has this* | Owner | Critical | Low | Tenancy |
| **Menu import from photo/PDF** | AI extraction to a reviewable draft | Removes the biggest onboarding wall in the category | Owner | **High** | Medium | Menu |
| Guest ordering (QR, no app) | Browse, customise, order | *Prototype has this* | Guest | Critical | Low | Menu |
| **Flex ordering** | One ticket, guest + server + back office | Differentiator; needs ticket concurrency from day one | Guest, server | High | Medium | Orders |
| Kitchen display | Ticket board, ageing, bump | *Prototype has this*, needs LAN transport | Chef | Critical | Low | Node |
| **Transfer payment + DVA + reconciliation** | Virtual account per order, automatic matching, exceptions queue | **The payments wedge** | Guest, owner | **Critical** | High | Paystack |
| Cash and pay-at-table | Drawer, cash-up, named settlement | Cash is still a majority rail for many venues | Server | Critical | Medium | Orders |
| Voids, comps, discounts with reason + user | Named attribution on every adjustment | Loss-prevention foundation. Cheap now, impossible later | Manager | High | Low | Orders, audit |
| Audit log | Immutable record of privileged actions | Same argument | Owner | High | Low | Tenancy |
| Daily reports + cash-up | Sales, items, payment mix, business-day correct | Minimum viable back office | Owner | Critical | Low | Orders |
| Subscriptions and billing | Plans, Paystack recurring, dunning, suspension | No revenue without it | Us | Critical | High | Tenancy |
| Platform admin v1 | Organisations, impersonation, flags, health | Cannot support customers blind | Us | High | Medium | Tenancy |
| Onboarding wizard | Signup to first order in under 30 minutes | Activation is the whole funnel | Owner | Critical | Medium | Menu import |
| WhatsApp notifications | OTP, receipts, transfer confirmation, daily summary | The default channel here | All | High | Medium | WhatsApp API |
| Data export | One-click full export | NDPA requirement; defuses lock-in fear | Owner | Medium | Low | — |

**Explicitly deferred from Phase 1:** inventory, loyalty, reservations, aggregator integration,
native apps, custom domains, scheduling, the public API. Every one is defensible to defer; none of
them is why the first ten restaurants sign.

## 8.3 Phase 2 — Professional

**Goal:** competitive with anything in the market for an independent full-service restaurant.
**Target: 100 paying locations. 4–5 months.**

Multi-location under one organisation with consolidated reporting · floor plan and table management ·
tabs, transfers, merge and split · split bills and partial payment · tips and tip attribution · card
via bank-issued terminals · receipt and kitchen printing · course firing and multi-station routing ·
server handheld ordering · inventory with recipe costing and variance · waste log · auto-86 · guest
records and loyalty · branded ordering site for takeaway and delivery · **commission recovery
counter** · review prompt after payment · menu engineering, hour-of-day and staff performance
reports · custom branding · read-only API · clock in/out · rules engine v1 with the pre-built library.

The three that matter most: **inventory with variance** (unlocks the loss-prevention story and the
Pro tier), **the branded ordering site** (the commission-recovery pitch), and **multi-location**
(the first real expansion revenue).

## 8.4 Phase 3 — Advanced

**Goal:** the platform gets smarter and reaches beyond the venue. **Target: 400 locations. 5–6 months.**

Demand forecasting for prep and labour · shift scheduling with labour cost against sales · purchase
orders, par levels, auto-reorder drafts · **invoice capture from a photo** · anomaly detection on
voids, discounts, waste and cash · custom report builder with scheduled delivery · **FIRS
e-invoicing** · accounting integration (QuickBooks, Xero, Sage, Zoho) · aggregator integration
(Chowdeck, Glovo, Bolt) · reservations and waitlist · SMS and email campaigns · **native owner
mobile app** · custom domains · full public API, webhooks and OpenAPI · approval workflows · rules
engine v2 · **natural-language reporting** · French and Swahili localisation.

## 8.5 Phase 4 — Enterprise

**Goal:** win a franchise group. **Target: 1,000+ locations including two franchise networks. 4–5 months.**

SSO (SAML 2.0, OIDC) and SCIM · custom roles from the capability catalogue · immutable audit export
to SIEM · **franchise architecture** — franchisor-controlled menus and prices, franchisee financial
isolation, aggregate reporting to the centre · dedicated database and data residency per tenant ·
contractual SLA with credits · named account management and priority routing · consolidated
multi-entity reporting · procurement pack (security questionnaire, DPA, pen test summary, insurance,
sub-processor list) · sandbox tenants and developer portal · advanced rate limits and quotas.

Franchise is the specific enterprise shape that matters here, because it is how Orda reached scale.

## 8.6 Phase 5 — Future

Deliberately speculative; each needs its own validation before it earns a quarter.

**Embedded finance.** Revenue-based working capital underwritten on observed order flow. Orda does
this and it is plausibly their most profitable line. Requires a lending licence or a partner, and it
changes the company. High value, high complexity, real regulatory weight.

**Supplier marketplace.** Restaurants order from suppliers inside the platform. Purchase order data
already exists after Phase 3; group buying is the value.

**Voice AI ordering** — only with speech recognition genuinely evaluated on Nigerian English, Pidgin
and code-switching. Doing it badly is worse than not doing it.

**Guest-facing app with a wallet** across all venues on the platform — a network effect, and a very
different product with very different economics.

**Kitchen vision** for prep timing and portion consistency. Interesting, expensive, unproven.

**Pan-African expansion** — Ghana, Kenya, South Africa, francophone West Africa. The payment rails
differ per market; the provider-agnostic interface is what makes this a configuration exercise
rather than a fork.

**Benchmarking.** Anonymised, aggregated cross-tenant comparisons — "your food cost is 4 points
above similar venues in Lagos." Only credible once the tenant base is large enough for genuine
anonymity, and it must be opt-in.

## 8.7 Sequencing rationale

Four things are in Phase 1 that a conventional MVP would defer, and each is there for the same
reason — **retrofit cost**:

1. **Offline sync.** Rebuilding the data layer later is a year lost.
2. **Multi-tenancy with RLS.** Retrofitting tenancy onto single-tenant code is the classic SaaS
   death march.
3. **Audit log and named attribution on voids.** Historical data cannot be reconstructed. Ship it
   from the first order or lose the record forever.
4. **The capability-based permission model.** Four hard-coded roles today is a rewrite when the
   first enterprise buyer asks for a custom one.

Everything else is genuinely sequenceable by customer demand.

## 8.8 Monetisation beyond subscription

In rough order of when they become plausible:

| Stream | Phase | Note |
| --- | --- | --- |
| Subscription | 1 | The core. Should be the majority of revenue indefinitely |
| Setup and menu digitisation service | 1 | A one-off fee for doing onboarding for them. Owner.com charges $499 for exactly this and it also improves activation |
| Payment margin | 3 | A thin margin *above* pass-through, introduced only once trust is established and always disclosed. Introducing it early forfeits the transparency wedge |
| Hardware resale | 2 | Printers, terminals, tablets at a small margin. Resell; never manufacture |
| Branded guest app | 3 | Per-venue add-on |
| Marketing services | 3 | Campaign management for venues without a marketer |
| Working capital lending | 5 | Highest margin, highest regulatory weight |
| Supplier marketplace take | 5 | Requires supply-side density |
| Data and benchmarking products | 5 | Opt-in, aggregated, anonymised — or not at all |

## 8.9 The metrics that decide whether this is working

| Metric | Phase 1 target | Why |
| --- | --- | --- |
| Time to first live order | < 30 min | Activation predicts everything downstream |
| Activation (live order within 7 days) | > 70% | The single best early indicator |
| Logo churn, monthly | < 3% | Restaurants close; some churn is structural |
| Net revenue retention | > 100% by Phase 2 | Expansion via locations and tier |
| Free → paid conversion | > 5% | Nigerian SaaS freemium conversion runs ~4.2%; below that the free tier is a cost centre |
| Support tickets per tenant per month | < 2 | Above this the product is unfinished |
| Uptime, venue-node service | 99.9% | Offline design should make this achievable |
| Reconciliation exception rate | < 2% of transfers | The core promise of the payments wedge |
| Gross margin per tenant | > 80% | Watch the free tier and notification spend |
