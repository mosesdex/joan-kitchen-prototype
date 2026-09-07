# 03 — The SaaS platform

## 3.1 Tenancy model

### The hierarchy

```
Platform
└── Organisation (the tenant, the billing entity, the contract)
    ├── Members (users, each with a role)
    ├── Subscription (plan, seats, locations, status)
    ├── Branding, domain, locale
    └── Locations  ← the unit of pricing and of operations
        ├── Tables, zones, floor plan
        ├── Menu (inherited from the organisation, overridable per location)
        ├── Staff assignments and shifts
        ├── Orders, payments, inventory
        └── Devices (table PWAs, kitchen displays, handhelds, terminals)
```

Two rules that are load-bearing:

- **The organisation is the tenant.** Isolation, billing, branding, retention and deletion all bind
  to it. Nothing crosses an organisation boundary, ever, without an explicit platform-admin action
  that is audit-logged.
- **The location is the unit of pricing and of operations.** A group with four sites pays for four
  and gets consolidated reporting across them. This matches how the market prices (Square: per
  location; Flipdish: per site; StoreKit: per venue) and how restaurants think.

### Isolation strategy

**Shared schema with `tenant_id` on every table, and Postgres row-level security as a backstop.**
This is the correct default for B2B SaaS in 2026 and it is what we should ship.

Four things must be true for it to hold, and each is a hard requirement rather than a
recommendation:

1. **Tenant identity resolves at the API boundary from a non-spoofable source** — a validated JWT
   claim or an authenticated session. Never from a request body.
2. **Tenant context is transaction-scoped, not session-scoped.** Under a transaction-mode pooler
   (PgBouncer, PgCat, and every managed Postgres pooler), a session variable survives the
   transaction and the next tenant to check that connection out silently inherits it. Use
   `set_config('app.current_tenant_id', <uuid>, true)` — the `true` is the whole ballgame.
   `DISCARD ALL` is *not* a safety net here: `server_reset_query` is skipped by default in
   transaction-pooling mode.
3. **Application queries still filter explicitly by tenant.** RLS is the backstop against developer
   error, not the primary authorisation gate.
4. **Isolation extends past the database.** Cache keys, object-storage prefixes, background job
   payloads, search indexes, audit logs and the analytics pipeline all carry tenant identity. A
   Redis key without a tenant prefix is a cross-tenant leak waiting for a cache collision.

```sql
CREATE OR REPLACE FUNCTION set_current_tenant(tenant_uuid UUID)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF tenant_uuid IS NULL THEN
    RAISE EXCEPTION 'tenant_uuid must not be NULL';
  END IF;
  PERFORM set_config('app.current_tenant_id', tenant_uuid::text, true); -- transaction-local
END; $$;

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders FORCE ROW LEVEL SECURITY;   -- applies to the table owner too

CREATE POLICY tenant_isolation_select ON orders FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_insert ON orders FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
```

Slow RLS is almost always unoptimised RLS: a policy matching `current_setting` against an indexed
`tenant_id` reduces to an index lookup. Every index must lead with `tenant_id`.

**The path out, when we need it.** Hybrid tiering: enterprise and data-residency tenants move to a
dedicated database behind the same application code, addressed by a tenant→connection registry.
Because tenant identity is already resolved at the boundary and propagated, this is a routing change
rather than a rewrite. That is the whole reason to do the work in Phase 1.

**Operational isolation** matters as much as data isolation: per-tenant statement timeouts, rate
limits per organisation and per API key, background jobs pinned to their own compute, and heavy
reporting queries served from an OLAP replica rather than the OLTP primary.

## 3.2 Organisation lifecycle

| Stage | Behaviour |
| --- | --- |
| **Create** | Signup creates organisation + owner member + trial subscription + first location atomically. Slug reserved for the ordering-site subdomain |
| **Onboard** | Guided setup; menu import; QR pack generated; payment account connected |
| **Invite** | Email or WhatsApp invite with a role; accept sets a password or PIN |
| **Grow** | Add locations (billing prorates immediately), add members, upgrade plan |
| **Brand** | Logo, colour, receipt header; custom domain on Pro |
| **Suspend** | On payment failure after dunning, or on platform-admin action for abuse. **Read-only, never destructive** — the restaurant can still see its data and take orders offline; new orders through our channels stop |
| **Recover** | Pay the outstanding invoice and service resumes instantly, with no data loss |
| **Downgrade** | Features above the new plan become read-only rather than deleted. Data is never destroyed by a plan change |
| **Cancel** | Effective at period end. Export offered and prompted before the date |
| **Retain** | Data kept 90 days after cancellation, then purged. Stated in the contract, surfaced in the UI, enforced by a job |
| **Delete** | Self-service full deletion, 30-day grace with daily reminders, then hard delete including backups within the documented window. NDPA requires this to be real |

**Export is a first-class feature, not a retention obstacle.** One click produces a ZIP of CSVs —
menu, orders, payments, guests, inventory, staff — plus a JSON dump. Making it easy to leave is what
makes it safe to arrive, and it directly attacks the lock-in complaint that defines the category.

## 3.3 Subscriptions and billing

### Pricing structure

Per location. Monthly or annual. Naira primary, with USD for non-Nigerian markets.

| | **Starter** | **Growth** | **Pro** | **Enterprise** |
| --- | --- | --- | --- | --- |
| **Monthly** | ₦0 | **₦25,000** | ₦75,000 | Quoted |
| **Annual (20% off)** | ₦0 | ₦240,000 | ₦720,000 | Quoted |
| Locations | 1 | 1, add more at rate | Unlimited | Unlimited |
| Tables | 6 | Unlimited | Unlimited | Unlimited |
| Orders/month | 300 | Unlimited | Unlimited | Unlimited |
| Staff accounts | 2 | 10 | Unlimited | Unlimited |
| QR ordering + KDS | ✓ | ✓ | ✓ | ✓ |
| Transfer + cash + pay-at-table | ✓ | ✓ | ✓ | ✓ |
| Card terminal, split bills, tips | — | ✓ | ✓ | ✓ |
| Branded ordering site | — | ✓ | ✓ (custom domain) | ✓ |
| Inventory + recipe costing | — | Basic | Full + variance | Full |
| Loyalty, WhatsApp, campaigns | — | — | ✓ | ✓ |
| Reports | Daily sales | + menu engineering, staff | + custom builder, scheduled | + consolidated multi-entity |
| FIRS e-invoicing | — | — | ✓ | ✓ |
| API + webhooks | — | Read-only | Full | Full + sandbox |
| SSO / SCIM / audit export | — | — | — | ✓ |
| Support | Help centre | Chat, 24h | Chat, 4h | Named manager, SLA |
| Branding on guest menu | Ours | Removed | Removed | Removed |

**Payment processing is passed through at cost and printed on the invoice.** We do not mark it up in
Phase 1–2. This is the sharpest expression of the transparency wedge and the hardest thing for Toast
or a fintech-owned competitor to match, because matching it means giving up revenue they already
book.

### Why these numbers

- **₦25,000 is a legible Lagos price point.** Nigerian SaaS pricing research is explicit that
  "₦25,000 feels like a real price point in Lagos" while "$62 feels arbitrary," and documents a
  Lagos SaaS moving from USD tiers to ₦8,000 / ₦25,000 / ₦80,000 and lifting trial conversion from
  2% to 7%.
- **Three tiers, not five.** Two feels incomplete, four or more causes paralysis. **Growth should
  hold 60–70% of paying customers**; Starter is a lead magnet; Pro captures outsized value.
- **Annual at 20% off.** Annual billing lifts ARPU 20–40% even after the discount, and reduces churn
  by raising switching cost. Show the monthly equivalent (₦20,000) so the saving is obvious.
- **Flat per location, never per table or per order.** The per-table model is the most-criticised
  pricing unit in the category and directly punishes the customer for succeeding.
- **A free tier rather than a free trial — with a caveat.** The Africa-specific research is blunt
  that freemium often fails here: support costs explode, conversion disappoints, and payment friction
  is a separate hurdle; a 7–14 day full-access trial usually outperforms. We are recommending free
  *and* trial because our free tier is hard-capped at a size (6 tables, 300 orders) that a growing
  venue outgrows on its own, and because a free tier doubles as our distribution: every free venue's
  guest menu carries our brand. **This is the single most important pricing assumption to test in the
  first six months.** If free-tier support load exceeds free-tier-sourced revenue, convert it to a
  14-day trial.

### Money mechanics

- **Naira first.** Pricing in USD signals the product is not for this market and adds perceived
  currency risk. Non-Nigerian markets get local currency where the provider supports it, USD otherwise.
- **Provider:** Paystack for naira subscriptions (card authorisation reuse for recurring), Stripe for
  USD and international. Keep the billing layer provider-agnostic — the same discipline as the
  payments layer.
- **Proration** on location and plan changes, immediate on upgrade, at period end on downgrade.
- **Dunning built for these rails.** Involuntary churn on African recurring payments runs materially
  higher than global norms. Retry on day 0, 1, 3, 5, 7, 10, 14, and vary the *time of day* — a card
  that fails on the 1st often succeeds on the 3rd. Every retry notifies by WhatsApp first, then SMS,
  then email, and always carries a one-tap pay link. Grace period 14 days before read-only
  suspension; never suspend silently, never suspend on a weekend.
- **Invoices** are FIRS-compliant, downloadable, and emailed. If we are selling e-invoicing, our own
  invoices had better be exemplary.

### Usage limits

Enforced as **soft limits with a hard ceiling**: at 80% of an order cap the owner is notified in
product and on WhatsApp; at 100% orders keep flowing for 48 hours with an upgrade prompt; only then
does the cap bite. **A restaurant must never be unable to take money because of our billing.** That
is a support catastrophe and a refund, not a conversion.

## 3.4 The platform admin console

Our own product for operating the business. It is a separate application on a separate domain with
its own authentication, mandatory MFA, and IP allowlisting — never a hidden route inside the
customer app.

| Area | What it does | Phase |
| --- | --- | --- |
| **Organisations** | Search, inspect, health score, plan, locations, MRR, lifecycle actions | P1 |
| **Impersonation** | Enter a tenant read-only for support. **Consent-gated, time-boxed, audit-logged, and visibly banner-flagged inside the tenant.** Write access requires a second approver | P1 |
| **Subscriptions** | Plan changes, credits, refunds, manual invoices, discount codes | P1 |
| **Revenue** | MRR/ARR decomposed into new, expansion, contraction, churn; NRR; LTV:CAC by channel | P2 |
| **Activation funnel** | Signup → menu imported → first order → first paid order, with per-step drop-off | P2 |
| **Feature adoption** | Which tenants use what. Drives roadmap and upgrade prompts | P2 |
| **System health** | Uptime, p95 latency and error rate **per tenant**, queue depth, DB load | P1 |
| **Payment monitoring** | Failure rates by provider and method, reconciliation exceptions, settlement lag | P1 |
| **Usage and cost** | Storage, API calls, notification spend, infra cost per tenant → gross margin per tenant | P2 |
| **Support** | Ticket inbox linked to the tenant, with recent errors and activity attached | P2 |
| **Risk** | Anomaly flags: refund spikes, impossible volumes, chargeback patterns, shared credentials | P3 |
| **Feature flags** | Per-tenant and per-cohort rollout, kill switches | P1 |
| **Announcements** | In-product banners and maintenance notices, targeted by segment | P2 |
| **Audit** | Every platform-admin action, immutable, exportable | P1 |
| **Segmentation** | Cohort builder for campaigns and rollouts | P3 |

Beyond the obvious, operating at scale needs: a per-tenant data-export tool for support; a tenant
clone-to-staging tool for reproducing bugs; a migration runner with per-tenant progress; a billing
reconciliation report against the provider's ledger; and an on-call runbook keyed to the alerts the
console raises.

## 3.5 Enterprise

Not Phase 1, but three decisions must be taken in Phase 1 or the retrofit is expensive.

**Take now:** (1) tenancy that can be split to a dedicated database without an application rewrite;
(2) an audit log rich enough to be exported to a SIEM; (3) a permission model expressed as a
capability catalogue rather than four hard-coded roles.

**Build later:** SSO via SAML 2.0 and OIDC; SCIM provisioning and deprovisioning; custom roles;
immutable audit export; dedicated database or region for data residency; contractual uptime SLA with
credits; named account manager and priority routing; sandbox and custom integration support;
consolidated franchise reporting where a franchisor sees aggregates while each franchisee's detail
stays isolated; and the procurement pack — security questionnaire, DPA, penetration test summary,
insurance certificates, sub-processor list.

**Franchise is the specific enterprise shape in this market**, since Orda's route to scale ran
through KFC Nigeria and Eat'N'Go. The requirement is menu and price control pushed down from the
franchisor, with each franchisee's financials isolated from its peers and visible in aggregate to
the centre. That is a genuinely different data model from a multi-location group, and it is worth
designing on paper before Phase 2 closes.
