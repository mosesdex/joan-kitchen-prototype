# 05 — Integrations and ecosystem

Sequenced by whether the platform is unusable without them, valuable with them, or merely tidier.

## 5.1 Tier 1 — required for the product to function (Phase 1)

### Payments

| Provider | Why | Notes |
| --- | --- | --- |
| **Paystack** | Primary | Card 1.5% + ₦100; **dedicated virtual accounts 1%, capped ₦300**; fastest settlement at 2–4 hours; Terminal and Virtual Terminal products |
| **Moniepoint** | Secondary + terminals | 1.49% + ₦100; 1–2 hour settlement; the largest agent and terminal footprint in Nigeria |
| **Flutterwave** | Alternate | 1.4% + ₦100; same-day settlement; pan-African reach for expansion |
| **Monnify** | Alternate for transfers | 1.5% capped ₦2,000, or a ₦500 flat option |
| **Stripe** | International | USD subscription billing and non-African markets |

**Build a provider-agnostic payments interface from the first commit.** One `PaymentProvider`
contract — create a charge intent, issue a dedicated virtual account, verify, refund, list
settlements, handle webhooks — with a concrete implementation per provider. Rates move, providers
have outages, and a distribution partnership may one day dictate the processor. This is the same
seam discipline the prototype already applies to `SyncAdapter`, applied to money.

**Webhook handling is where payment integrations actually fail.** Every provider webhook must be
signature-verified, idempotent by provider event id, replayable from a dead-letter queue, and
reconciled nightly against our own ledger. Assume webhooks arrive twice, out of order, or not at all.

### Messaging

- **WhatsApp Business API — the default channel in Nigeria**, not a nice-to-have. Order confirmations
  and receipts, transfer confirmation, ready-for-collection, the owner's daily summary, dunning
  notices, OTP. Via Meta directly or an aggregator (Termii, Gupshup, Sinch).
- **SMS** — Termii or Africa's Talking, as OTP fallback. Nigerian SMS deliverability is unreliable
  enough that it should be the fallback, not the primary.
- **Email** — Resend or Postmark for invoices, reports and staff invites.

### Identity

Email/password and phone/OTP in Phase 1. Google sign-in in Phase 2 for the back office. SAML and
OIDC for enterprise in Phase 4.

## 5.2 Tier 2 — materially more valuable (Phase 2–3)

| Category | Integrations | Why |
| --- | --- | --- |
| **Delivery aggregators** | Chowdeck, Glovo, Bolt Food | Injects their orders into one kitchen queue and one menu. Orda's Glovo partnership shows aggregators will *promote* a platform that reduces their onboarding cost — this is a distribution channel disguised as an integration |
| **Accounting** | QuickBooks, Xero, Sage, Zoho Books | Daily sales journal and supplier invoices. Removes the manager's Monday spreadsheet |
| **Compliance** | **FIRS Merchant-Buyer Solution** | E-invoicing. See [06](06-security-and-compliance.md). A regulatory requirement nobody else in this category sells |
| **Hardware** | ESC/POS thermal printers over LAN, cash drawers, barcode scanners, **bank-issued POS terminals** | Follow Orda: write software for the terminals banks already deploy. Never manufacture |
| **Storage** | S3-compatible (Cloudflare R2 or AWS S3) | Menu images, invoice scans, exports |
| **Maps** | Google Places | Address autocomplete and delivery zones |

## 5.3 Tier 3 — ecosystem (Phase 3–4)

Public REST API with per-tenant scoped keys and published rate limits. Outbound webhooks on every
domain event — the event vocabulary the prototype already defines is exactly the right payload
shape. Zapier and Make connectors. An OpenAPI specification with a sandbox tenant. Later, an app
directory with revenue share once third parties have a reason to build.

Also: calendar (Google, Outlook) for reservations and staff shifts; CRM (HubSpot) for larger groups;
Slack and Microsoft Teams for operational alerts in franchise settings; payroll and HR once labour
scheduling is real.

## 5.4 Integration principles

1. **Every third party gets an adapter behind our own interface.** No provider SDK types leak into
   domain code.
2. **Every integration degrades gracefully.** WhatsApp down must not stop an order. Aggregator API
   down must not stop the kitchen.
3. **Every integration is observable per tenant** — success rate, latency, last error — and visible
   to the tenant, not only to us. "Your Chowdeck connection last synced 6 minutes ago" prevents a
   support ticket.
4. **Nothing is a hard dependency at the domain layer.** A tenant with no integrations configured
   has a fully working restaurant.
