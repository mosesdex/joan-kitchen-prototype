# 06 — Security and compliance

The platform holds three things that make it a target: money in motion, personal data belonging to
people who never signed up with us (guests), and the complete operating record of somebody's
business.

## 6.1 Threat model

| Threat | Consequence | Control |
| --- | --- | --- |
| **Cross-tenant data leak** | Existential. One incident ends the company | Boundary-resolved tenant identity, transaction-scoped context, RLS backstop, tenant-scoped cache and storage keys, automated cross-tenant tests in CI |
| Compromised staff credential | Fraud, data theft | MFA for privileged roles, PIN-only for floor staff on shared devices, short sessions, device binding |
| Insider fraud by restaurant staff | Customer's money, our reputation for control | Named attribution on every void/comp/discount, approval thresholds, anomaly detection, immutable audit log |
| Payment webhook forgery | Orders marked paid that were not | Signature verification, idempotency by event id, nightly reconciliation against settlement |
| Guest data exposure | NDPA liability, reputational | Minimal collection, encryption at rest, retention limits, no card data ever |
| Compromised platform admin | Every tenant at once | Separate app, separate domain, mandatory MFA, IP allowlist, consent-gated time-boxed impersonation, dual approval for writes |
| Lost or stolen table device | Order manipulation, data access | Device tokens revocable from the back office, no back-office access from a table device, kiosk lockdown |
| DDoS or noisy neighbour | Outage during service | Per-tenant rate limits and statement timeouts, CDN, autoscaling, OLAP split for reporting |

## 6.2 Controls

**Authentication.** Argon2id password hashing. MFA — TOTP and WhatsApp/SMS OTP — mandatory for owner
and manager roles, optional for others, enforced by policy for enterprise. Staff on shared floor
devices use a 4–6 digit PIN bound to that device and location, never a password. Sessions: short
access tokens, rotating refresh tokens, revocable per device, with a visible device list and remote
sign-out. Rate limiting and lockout with exponential backoff on every auth endpoint.

**Authorisation.** RBAC over a capability catalogue rather than four hard-coded roles — this is what
makes custom roles a configuration change in Phase 4 instead of a rewrite. Every check is
server-side; client-side gating is presentation only. Location-scoped roles: a manager of two sites
in a five-site group sees two.

**Data protection.** TLS 1.3 in transit, HSTS. AES-256 at rest, with envelope encryption for
sensitive columns. **We never store card data** — tokenisation only, via the provider — which keeps
us in PCI DSS 4.0 SAQ-A territory rather than full scope. Backups encrypted, and restores tested
quarterly, because an untested backup is a hope rather than a control.

**API security.** Per-tenant scoped keys with recorded last-use, rotation, and revocation. Published
rate limits by plan. Idempotency keys required on every mutating endpoint. Strict schema validation
at the boundary. CORS locked to registered origins. No tenant identifier ever accepted from a
request body.

**Audit logging.** Immutable, append-only, capturing actor, tenant, location, action, before and
after values, IP, device and timestamp. Covers authentication, permission changes, money movement,
menu and price changes, voids and comps, exports, and every platform-admin action. Retained 7 years
for financial events, 2 years for the rest, exportable to a customer's SIEM at enterprise tier.

**Operations.** Structured logs with tenant context and no PII in messages. Per-tenant error and
latency budgets. Dependency scanning and SAST in CI, annual third-party penetration test, a
published disclosure policy, and a written incident response plan with defined severities and
notification timelines.

**Backups and recovery.** Continuous WAL archiving with point-in-time recovery to any second in the
last 30 days. Daily full snapshots retained 90 days. Cross-region replication. **RPO 5 minutes, RTO
1 hour.** Per-tenant restore is a first-class capability, not a database-wide rollback — one tenant's
mistake must never require restoring everybody.

## 6.3 Nigeria Data Protection Act 2023

The NDPA governs everything we do with Nigerian personal data — staff and guests alike.

| Obligation | What we build |
| --- | --- |
| Register with the NDPC as a data controller and processor | Legal and operational task before commercial launch. Compliance Audit Returns filed annually |
| Consent must be freely given, specific and informed — **and the burden of proof is on the controller** | Consent capture with timestamp, version and mechanism, stored as evidence. No pre-ticked boxes. Guests can order without consenting to marketing |
| Lawful basis for processing | Contract for order data; consent for marketing; legitimate interest for fraud prevention. Documented per data category in a register |
| Data subject rights — access, rectification, erasure, portability, objection | Self-service export and deletion for tenants; a guest-facing request endpoint with a 30-day SLA and audited fulfilment |
| Data protection officer | Required at scale. Appoint before we hold material volumes |
| Breach notification | Documented procedure, defined severities, NDPC and data-subject notification paths |
| Cross-border transfer | Adequacy or contractual safeguards. **Prefer keeping Nigerian personal data in-region**; make it a documented enterprise option |
| Privacy by design | Minimal collection — a guest ordering a meal does not need an account, a birthday or an address |

**Where we are a processor, not a controller.** Guest data belongs to the restaurant. Our DPA with
each tenant must say so plainly and set out sub-processors, retention, deletion and breach
obligations. This distinction matters legally and it matters commercially — it is what lets an
operator answer their own customers' questions.

## 6.4 FIRS e-invoicing — a compliance requirement that is also a feature

Nigeria's Federal Inland Revenue Service is rolling out mandatory structured e-invoicing through the
national Electronic Fiscal System and Merchant-Buyer Solution. **The mandate applies to all
VAT-registered suppliers, domestic and foreign, and covers B2B, B2G and B2C transactions.** Large
taxpayers (turnover ≥ ₦5bn) came into scope from 1 November 2025, with phased expansion to medium
and smaller taxpayers through 2026.

Every restaurant in our addressable market that is VAT-registered will be in scope. Most do not know
it yet. **No restaurant platform in this market sells e-invoicing.**

What we build: MBS integration issuing a compliant invoice per qualifying transaction; correct VAT
treatment at 7.5% with service charge excluded from the VAT base — which the prototype's pricing
model already gets right; taxpayer identification captured per organisation; invoice archival for
the statutory period; a compliance dashboard showing submission status and failures.

**Sequencing:** ship on Pro in Phase 3, aligned to the phase of the rollout that captures
medium-sized taxpayers. Announce it early. It converts a looming regulatory anxiety into a reason to
upgrade.

## 6.5 PCI DSS 4.0

We do not store, process or transmit primary account numbers. Card entry happens in the provider's
hosted flow or on a certified terminal; we hold tokens only. Tokens are not cardholder data, so
scope is dramatically reduced — but reduced is not zero, and the remaining obligations are real:
raw card data must never enter our network in any form, PANs must be unreadable anywhere they are
stored (Requirement 3.3.3), logging and monitoring obligations still apply, and an annual SAQ-A
attestation is required.

**Never ship a card input field of our own.** Not in the customer app, not in admin, not "just for
testing."

## 6.6 Other regimes as we expand

Ghana (Data Protection Act 2012), Kenya (Data Protection Act 2019, with data-localisation
expectations), South Africa (POPIA), and UK/EU (UK GDPR and GDPR — which additionally make EU
Regulation 1169/2011 allergen labelling a legal requirement on menus, and our structured allergen
tags already satisfy the data model). Each new market needs a lawful-basis review before launch, not
after.
