# 02 — Product blueprint

## 2.1 Product vision

> **The operating system for African restaurants that works when the power goes out, gets paid the
> way Nigerians actually pay, and never puts a screen between a guest and a host.**

Three commitments encoded in that sentence, each of which is a design constraint rather than a
slogan:

- **Works when the power goes out** — the venue keeps trading with no internet. Everything else is
  built on top of local-first state.
- **Gets paid the way Nigerians pay** — bank transfer is a first-class rail with automatic
  reconciliation, not a workaround printed on a card machine.
- **Never puts a screen between guest and host** — the phone adds a channel into a shared ticket. It
  never replaces the server.

## 2.2 Target customers

| Segment | Definition | Size signal | Priority |
| --- | --- | --- | --- |
| **Independent full-service** | 1 site, 8–40 tables, ₦15–80m/yr | 70.62% of Nigerian outlets are independents | **Phase 1 — the beachhead** |
| **Independent QSR / fast casual** | Counter service, high volume, low ticket | QSR is 55.92% of the market | Phase 1–2 |
| **Small groups** | 2–6 sites under one owner | Chained outlets growing 12.96% CAGR | Phase 2 |
| **Cloud kitchens** | Delivery-only, multi-brand from one kitchen | Fastest-growing format, 12.05% CAGR | Phase 2–3 |
| **Bars, lounges, hotels** | Drinks-led, tab-based, roaming service | Adjacent, high ticket | Phase 3 |
| **Franchises and chains** | 10+ sites, central menu control | Orda already holds KFC, Eat'N'Go | Phase 4 |

**Explicitly not the beachhead:** enterprise chains (already served, long sales cycles) and street
food vendors (below the price floor at which a subscription makes sense).

## 2.3 Personas

**Bisi — owner-operator, 34, one restaurant in Lekki.**
Runs the floor herself. Checks the day's takings on her phone between covers. Her real fear is not
knowing where money went — a supplier who overcharged, a bartender who did not ring in a round.
Bought a POS once, abandoned it because setup took three weeks and nobody trained her staff.
*Wins with: five-minute menu import, phone-first owner view, variance and void alerts, a price she
can read.*

**Tunde — general manager, 41, three sites for an absentee owner.**
Judged on food cost percentage and covers. Spends Monday mornings rebuilding the weekend's numbers
in a spreadsheet because the system exports the wrong shapes.
*Wins with: consolidated multi-site reporting, scheduled reports to his inbox, correct business-day
handling, clean accounting export.*

**Amaka — head chef, 29.**
Cares about one thing during service: is the pass clear. Will abandon any system that makes her
look at a screen twice. Suspicious of tablets because the last one died mid-service.
*Wins with: a KDS that runs on the LAN with no internet, tickets legible from three metres, one tap
to bump, allergy notes impossible to miss.*

**Chidi — server, 24, high turnover role.**
Learns the system in one shift or does not learn it. Cares about tips and about not being blamed for
a wrong order.
*Wins with: handheld ordering into the same ticket the guest is using, tip attribution, a bill that
splits without arithmetic.*

**The guest — 28, Lagos, data-conscious.**
Will scan a code if it is faster than waiting. Will not download an app. Will not create an account.
Notices when a menu page is slow or heavy.
*Wins with: no app, no login, a page under 300KB, images that load on a weak connection, transfer
payment that confirms itself.*

**Us — the platform operator.**
Needs to see MRR, churn, activation, per-tenant health and support load without asking an engineer.
*Wins with: the super-admin console in [03](03-saas-platform.md).*

## 2.4 Feature map

Legend: **P1** MVP · **P2** professional · **P3** advanced · **P4** enterprise · **P5** future.
Full scoring — value, complexity, dependencies — in [08](08-roadmap.md).

### Core — the restaurant runs on this

| Feature | Phase | Notes |
| --- | --- | --- |
| Menu, categories, modifiers, option groups | P1 | *Exists in prototype* |
| Menu import from photo or PDF | P1 | The onboarding wall. Highest-leverage AI use in the product |
| Per-channel menus and pricing | P2 | Dine-in vs delivery pricing is how operators absorb commission |
| Menu scheduling (breakfast/lunch, weekends) | P2 | Repeatedly requested across the category |
| Guest ordering — QR, no app, no login | P1 | *Exists* |
| **Flex ordering: one ticket, guest + server** | **P1** | The differentiator. Requires ticket-level concurrency from day one |
| Server handheld ordering | P2 | Same ticket model |
| Kitchen display, LAN-capable | P1 | *Exists, needs LAN transport* |
| Course firing and hold-and-fire | P2 | Full-service requirement |
| Multi-station routing (grill, bar, cold) | P2 | One ticket, several stations |
| Order lifecycle and status history | P1 | *Exists* |
| Table management and floor plan | P2 | *Tables exist; visual plan does not* |
| Tabs, transfers, table merge and split | P2 | Bar and pub requirement |
| Split bills and partial payment | P2 | Sunday's core value; expected at full service |
| Discounts, comps, voids — reason + named user | P1 | Loss-prevention foundation. Cheap now, impossible to retrofit |
| Receipt and kitchen printing | P2 | Non-negotiable for many venues |
| Cash drawer, cash-up, shift reconciliation | P1 | Cash is still a majority rail for many venues |
| Offline order capture and reconcile | P1 | Architecture, not a feature |
| Search, filter, sort across every record | P1 | *Partly exists* |

### Payments

| Feature | Phase | Notes |
| --- | --- | --- |
| Bank transfer with **dedicated virtual account per order** | P1 | The wedge. Paystack DVA at 1% capped ₦300 |
| Automatic reconciliation + exceptions queue | P1 | Solves the manual-matching problem |
| Pay at table, settled by named staff | P1 | *Exists in prototype* |
| Cash with drawer reconciliation | P1 | |
| Card via terminal (Paystack/Moniepoint) | P2 | Software on bank-issued terminals, not our hardware |
| USSD | P2 | Still material for some demographics |
| Split payment across methods | P2 | |
| Tips, service charge, tip attribution | P2 | Sunday reports meaningful tip uplift on phone payment |
| Refunds and partial refunds with audit | P2 | |
| Payouts and settlement reconciliation | P2 | Match provider settlement to our order ledger |

### Inventory and cost control

| Feature | Phase | Notes |
| --- | --- | --- |
| Ingredients, units, suppliers | P2 | |
| Recipe costing against live prices | P2 | Category table stakes |
| Stock counts and theoretical vs actual variance | P2 | **The shrinkage story: 75% of loss is staff theft** |
| Purchase orders and goods-received | P3 | |
| Par levels and low-stock alerts | P3 | |
| Waste log with reasons | P2 | Both a cost tool and a theft signal |
| Auto-86: sell out an ingredient, dishes go off the menu | P2 | Small feature, disproportionate delight |
| Invoice capture from a photo | P3 | Document intelligence that pays for itself |

### Guests, marketing and channels

| Feature | Phase | Notes |
| --- | --- | --- |
| Guest records from orders | P2 | Only channel-owned data has value |
| Loyalty — points or visit-based | P2 | |
| WhatsApp order updates and receipts | P2 | The default channel in Nigeria |
| SMS and email campaigns | P3 | |
| Branded ordering site for takeaway and delivery | P2 | **The 15–30% commission-recovery pitch** |
| Aggregator integration (Chowdeck, Glovo, Bolt) | P3 | Orda's Glovo partnership shows this is also distribution |
| Reservations and waitlist | P3 | OpenTable charges $149–499 + per cover; a bundled version is compelling |
| Reviews prompt after payment | P2 | Cheap, and Sunday's data shows it lifts ratings reliably |

### Staff

| Feature | Phase | Notes |
| --- | --- | --- |
| Staff accounts, roles, PIN sign-in | P1 | *Exists* |
| Clock in/out and worked hours | P2 | |
| Shift scheduling | P3 | |
| Labour cost against sales, by hour | P3 | Pairs with the hour-of-day heatmap |
| Custom roles and granular permissions | P4 | |

### Reporting

Detailed in §2.7. P1: daily sales, cash-up, item sales, payment mix, order history.
P2: menu engineering, hour-of-day, staff performance, void and discount analysis.
P3: custom report builder, scheduled delivery, cohort and retention.
P4: consolidated multi-entity and franchise reporting.

### Administration

| Feature | Phase | Notes |
| --- | --- | --- |
| Organisation settings, VAT, service charge, hours | P1 | *Exists at single-tenant scope* |
| Multi-location under one organisation | P2 | |
| Custom branding — logo, colours, receipt | P2 | |
| Custom domain for the ordering site | P3 | |
| Audit log of every privileged action | P1 | Cheap now; a rebuild later |
| Activity monitoring and session management | P2 | |
| Approval workflows (voids over ₦X, price changes) | P3 | |
| Data export, retention policy, deletion | P1 | NDPA requires it and it defuses lock-in fear |

## 2.5 Customer journey

```
Discover → Sign up → Verify → Onboard → Configure → First live service → Habit → Expand → Renew
```

| Stage | What happens | The risk | The design answer |
| --- | --- | --- | --- |
| **Discover** | Word of mouth (Orda's own number-one channel), search, aggregator fatigue | Not credible | Published pricing, a real free tier, a public demo — the prototype itself is the best sales asset we have |
| **Sign up** | Email or phone + password. No card. | Friction | Under 60 seconds. Phone-number signup, since email is not universal |
| **Verify** | OTP by SMS or WhatsApp | SMS deliverability in Nigeria is poor | WhatsApp OTP as primary, SMS as fallback |
| **Onboard** | Restaurant name, type, table count | Blank slate | 4 questions, then a working demo restaurant they can edit rather than an empty one |
| **Configure** | **Menu import from photo or PDF**, tables, staff invites, payment account | **This is where 60% of churn happens** | AI import produces a reviewable draft in minutes. Never make anyone type 50 dishes |
| **First live service** | First real guest order | Fear of failing during service | A guided dry-run mode; a printed QR pack posted or downloadable; live chat during their first service |
| **Habit** | Daily use | Silent disengagement | Daily WhatsApp summary of yesterday's numbers. The habit lives outside the app |
| **Expand** | Second location, inventory, loyalty | Unknown value | In-product prompts tied to observed usage, never to the calendar |
| **Renew** | Annual or monthly | Payment failure | Dunning designed for Nigerian rails — see [03](03-saas-platform.md) |

**Time to first value target: under 30 minutes from signup to a real order on a real table.**
Everything in Phase 1 onboarding is judged against that number.

Supporting: onboarding checklist with progress; contextual product tours, not a modal carousel;
empty states that teach rather than apologise (*already the standard set in the prototype*);
searchable help centre; in-app chat with WhatsApp fallback; changelog; in-product feedback capture
tied to the tenant so we know who asked.

## 2.6 Web, mobile and responsive strategy

| Surface | Platform | Rationale |
| --- | --- | --- |
| **Guest ordering** | Mobile web, no app | Guests will not install anything. Budget: **under 300KB initial payload, interactive in under 2.5s on 3G** |
| **Table device** | PWA in guided access on iPad or cheap Android | Web-first halves Phase 1. Native iPad in Phase 3 for venues that want it |
| **Kitchen display** | Web app, LAN-first, full screen | Runs on any browser on any screen the kitchen already has |
| **Server handheld** | PWA, phone-sized | Staff use their own phones. Do not require hardware |
| **Owner mobile** | Native iOS + Android, Phase 3 | Push notifications and biometric sign-in are the reason to go native |
| **Back office** | Desktop web, fully responsive | Owners check it on a phone; managers work on a laptop |

**What differs by surface, deliberately:** the owner mobile app is read-plus-approve — today's
numbers, live orders, approve a void, 86 a dish — not a shrunken back office. Menu editing, staff
administration and settings stay on a real screen. Trying to fit everything on a phone is how
competitors produce mobile experiences nobody uses.

## 2.7 Analytics strategy

### For the customer

**Tier 1 — the four numbers an owner checks daily:** revenue today vs the same weekday last week;
covers and average ticket; food cost percentage (once inventory is live); voids and discounts as a
percentage of sales. Available on the phone in one screen.

**Tier 2 — weekly management:** menu engineering (margin × popularity, four quadrants, with an
explicit "promote / re-price / re-cost / remove" call per dish); hour-of-day demand against labour
cost; payment mix and reconciliation exceptions; staff performance — sales per hour, average ticket,
void rate; waste and variance.

**Tier 3 — strategic:** cohort retention of guests; channel profitability (own channel vs aggregator,
with commission recovery stated in naira); price elasticity after a change; forecast versus actual.

**Non-negotiable properties.** Every report exportable to CSV and PDF. Every report scheduleable to
email or WhatsApp. Every currency figure reconcilable to a settlement. **Business day, not calendar
day** — a service that ends at 02:00 belongs to the previous trading day, and this is where most
competitors quietly get it wrong.

### For us

Activation (did they take a live order within 7 days), feature adoption per tenant, MRR/ARR
movement decomposed into new, expansion, contraction and churn, net revenue retention, cohort
retention by acquisition month, per-tenant infrastructure cost, support volume per tenant, error and
latency budgets per tenant, and payment failure rates by provider and method. Detailed in
[03](03-saas-platform.md).

## 2.8 Customisation

The rule: **flexible where a restaurant's identity or operation genuinely differs; opinionated
everywhere else.** Configuration surface is a permanent support cost, so each knob must earn its
place.

| Area | What customers control | Phase |
| --- | --- | --- |
| Brand | Logo, accent colour, receipt header/footer, ordering-site hero | P2 |
| Domain | Custom domain for the ordering site | P3 |
| Menu | Categories, modifiers, dietary and allergen tags, per-channel pricing and availability, scheduling | P1–P2 |
| Operations | VAT rate, service charge, tipping policy, table zones, KDS ageing thresholds, business-day cutover | P1 |
| Workflow | Order status names, void and discount reason lists, approval thresholds | P3 |
| Roles | Custom roles built from a permission catalogue | P4 |
| Notifications | Which events notify whom, on which channel | P2 |
| Reports | Custom report builder, saved views, scheduled delivery | P3 |
| Locale | Currency, language (English first; French for West Africa, Swahili for East, Arabic for North), time zone, date format, number format | P2–P3 |

**Deliberately not customisable:** the guest ordering flow's information architecture, the kitchen
display's layout, and the money model. These are where our opinion is the product. Venues that want
to redesign the kitchen screen are venues that will not be happy on any platform.
