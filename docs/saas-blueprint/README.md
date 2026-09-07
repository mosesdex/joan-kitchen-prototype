# Joan Kitchen → Kitchen OS: SaaS product blueprint

The master product specification for turning the Joan Kitchen prototype into a multi-tenant SaaS
platform that restaurants across Nigeria and Africa subscribe to.

Researched and written 7 September 2026. Every market figure is sourced; see
[09-sources.md](09-sources.md).

## Read in this order

| Document | Covers |
| --- | --- |
| [00 — Executive summary](00-executive-summary.md) | The bet, the wedge, the numbers, the decisions that need making now |
| [01 — Market and competitors](01-market-and-competitors.md) | Market sizing, 18 competitors dissected, industry standards, unsolved user problems |
| [02 — Product blueprint](02-product-blueprint.md) | Personas, the full feature map, customer journey, web/mobile strategy, analytics, customisation |
| [03 — SaaS platform](03-saas-platform.md) | Multi-tenancy, organisation lifecycle, subscriptions and billing, pricing strategy, super-admin console, enterprise |
| [04 — Automation and intelligence](04-automation-and-intelligence.md) | Rules engine, where AI genuinely earns its place, and where it does not |
| [05 — Integrations](05-integrations.md) | Payments, messaging, accounting, aggregators, hardware, the public API |
| [06 — Security and compliance](06-security-and-compliance.md) | Threat model, tenant isolation, NDPA, FIRS e-invoicing, PCI DSS 4.0 |
| [07 — Technical architecture](07-technical-architecture.md) | The stack, the data model, offline-first sync, scaling path |
| [08 — Roadmap](08-roadmap.md) | Differentiation, five phases, every feature scored on value, complexity and dependencies |
| [09 — Sources](09-sources.md) | Everything cited |

## The one-paragraph version

Nigeria's foodservice market is worth $12.37bn in 2026 and grows to $21.38bn by 2031, and 70.62% of
its outlets are independents that run on paper. The software category serving them is consolidating
around fintech distribution — Moniepoint has just acquired Orda, the leading local restaurant OS —
which means restaurant software in this market is increasingly a customer-acquisition channel for
payments and lending rather than a product built for the restaurant floor. Meanwhile the global
platforms that do build serious product (Toast, Square, Lightspeed) are architected for a card-first,
always-online, US-and-EU world, and their operators' loudest complaint is fee opacity and lock-in.
The opening is a guest-experience-led, offline-first, transfer-native restaurant operating system,
priced transparently in naira, that treats Nigerian payment rails and Nigerian compliance as
first-class product rather than as an afterthought. That is what the prototype should become.
