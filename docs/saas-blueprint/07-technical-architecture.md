# 07 — Technical architecture

Designed so that going from ten organisations to ten thousand is a scaling exercise rather than a
rewrite.

## 7.1 Principles

1. **Local-first at the venue.** A restaurant with no internet keeps trading. Every other decision
   bends to this one.
2. **Tenant identity at the boundary, propagated everywhere.** Database, cache, storage, jobs, logs,
   search, analytics.
3. **Events are the contract.** The prototype's `AppEvent` vocabulary becomes the server's event
   stream, the websocket payload, the webhook body and the audit source.
4. **Every provider behind an interface.** Payments, messaging, storage, aggregators. Rates change,
   providers fail, partnerships happen.
5. **Boring, operable technology.** One database engine, one language on the server, one deployment
   model. Novelty is spent on the offline sync engine and nowhere else.

## 7.2 The stack

| Layer | Choice | Why |
| --- | --- | --- |
| **Guest ordering** | React + Vite PWA, SSR for first paint | Under 300KB, no app install. Reuses the prototype |
| **Table device** | Same PWA in guided access | Web-first halves Phase 1; native iPad in Phase 3 |
| **Kitchen display** | React PWA, **LAN-first** | Talks to the venue's local node; internet optional |
| **Handheld** | Same PWA, phone layout | Staff use their own phones |
| **Back office** | React + Vite SPA | Reuses the prototype's admin surface |
| **Owner mobile** | React Native, Phase 3 | Push and biometrics are the reason to go native |
| **API** | Node 22 + TypeScript, Fastify, tRPC or REST + OpenAPI | Same language across the stack; the domain model is already TypeScript |
| **Realtime** | WebSockets per location channel; Redis pub/sub fan-out | Replaces `BroadcastChannelAdapter` behind the same interface |
| **Database** | PostgreSQL 17 — shared schema, `tenant_id`, RLS | Section [03](03-saas-platform.md) |
| **Cache and locks** | Redis, tenant-prefixed keys | Sessions, rate limits, idempotency, pub/sub |
| **Queue** | BullMQ on Redis, or SQS at scale | Webhooks, notifications, reports, reconciliation |
| **Search** | Postgres full-text first; OpenSearch only when it hurts | Do not add a search cluster for 50 tenants |
| **Analytics** | Separate OLAP store fed by CDC | **Customer-facing analytics must never run on the OLTP primary** |
| **Object storage** | S3-compatible (Cloudflare R2), tenant-prefixed | Images, invoice scans, exports |
| **Edge** | Cloudflare — CDN, WAF, rate limiting, image resizing | Image transformation matters on Nigerian mobile data |

## 7.3 The venue node — how offline actually works

The part that cannot be retrofitted.

```
                    ┌──────────── the venue, on its own LAN ───────────┐
  guest phone  ───► │  table PWA ─┐                                     │
  server phone ───► │  handheld  ─┼──►  VENUE NODE  ◄──►  kitchen PWA  │
                    │  printers  ◄┘   (authoritative local state)       │
                    └──────────────────────┬──────────────────────────┘
                                           │  event log sync
                                           ▼  (resumable, ordered)
                                    ┌─────────────┐
                                    │  CLOUD API  │──► Postgres, OLAP, integrations
                                    └─────────────┘
```

**The venue node** runs on any always-on device in the building — a mini PC, a spare tablet, or an
old laptop — and holds authoritative state for that location's current service: open orders,
today's menu, tables, staff. It serves the kitchen display and handhelds over the LAN. It requires
no internet to run a service.

**Sync** is a resumable, ordered event log in both directions. Each event carries a location-scoped
monotonic sequence number and a stable client-generated id, so replays are idempotent. On reconnect
the node replays the gap and the cloud replays what the node missed. **Never use auto-increment ids
for anything created offline** — that is the classic failure of this architecture.

**Conflicts.** In practice they are rare, because a ticket has one authoritative writer at a time
and edits are additive (add a line, change a status). The rules: additive operations always merge;
status transitions resolve by the state machine, not by timestamp — `served` beats `preparing`
regardless of clock skew — and the cloud is authoritative for money, menu and pricing while the
venue is authoritative for the live service. Genuine conflicts go to a visible exceptions queue
rather than being silently resolved.

**Degraded modes, explicitly designed:**

| Failure | Behaviour |
| --- | --- |
| Internet down, LAN up | Full service. Orders queue. Card and transfer unavailable; cash and pay-at-table work. Banner: "offline — orders will sync" |
| Venue node down, internet up | Devices fail over to the cloud API directly. Slower, still working |
| Both down | Table PWA holds orders in IndexedDB; kitchen falls back to printed tickets |
| Power out | Node and router on a small UPS; devices on battery. This is a hardware recommendation in the setup guide, and it is why we recommend it |

## 7.4 Data model

Every table carries `tenant_id` (organisation) and, where it belongs to a venue, `location_id`.
Every index leads with `tenant_id`.

```
organisations ─┬─ members ── users
               ├─ subscriptions ── invoices ── payment_methods
               ├─ locations ─┬─ tables ─ zones
               │             ├─ devices
               │             ├─ staff_assignments ── shifts
               │             ├─ orders ─┬─ order_items ── order_item_options
               │             │          ├─ order_events        (immutable status history)
               │             │          └─ payments ── refunds ── settlements
               │             ├─ inventory_items ── stock_movements ── counts
               │             └─ cash_sessions
               ├─ categories ── menu_items ── option_groups ── options
               ├─ recipes ── recipe_lines           (menu_item → inventory_item)
               ├─ guests ── loyalty_accounts
               ├─ audit_log                          (append-only)
               └─ integrations ── webhook_endpoints ── api_keys
```

**Money.** Integer minor units (kobo) everywhere, with an explicit currency column. Never floats.
The prototype's discipline here is already correct and the tests already hold it.

**Orders are append-only in the way that matters.** Status changes write an `order_events` row
rather than mutating a column. Totals are computed and *stored* at placement, so a later menu
reprice never retroactively changes a settled bill. Both properties are already true in the
prototype and both are load-bearing for audit and for tax.

**Partitioning.** `orders`, `order_items`, `order_events`, `payments` and `audit_log` are partitioned
by month from day one. Retrofitting partitioning onto a hot table is a migration nobody enjoys.

## 7.5 Scaling path

Four steps, in order, and the first three cover almost every platform:

1. **Read replicas.** Reporting and the OLAP feed move off the primary.
2. **Partition the large tables** by time. Already provisioned for above.
3. **Isolate the loudest tenants** onto dedicated databases via the tenant→connection registry.
   This is also how data residency and enterprise isolation get delivered.
4. **Shard by `tenant_id`** — genuinely a last resort, and unlikely to be needed at any scale this
   business will plausibly reach.

Alongside: horizontally scaled stateless API behind a load balancer; WebSocket fan-out through Redis
pub/sub so any node can serve any socket; queue workers scaled independently by queue depth; CDN and
edge image resizing; and per-tenant statement timeouts so one tenant's bad report cannot degrade the
platform.

## 7.6 Deployment and operations

**Environments:** local (Docker Compose), preview per pull request, staging with anonymised
production-shaped data, production.

**CI/CD:** typecheck, lint, unit tests, **automated cross-tenant isolation tests**, integration
tests against ephemeral Postgres, Playwright end-to-end on the critical path, build, migrate,
deploy. Migrations are expand-then-contract so a rollback never requires a down-migration. Feature
flags decouple deploy from release.

The cross-tenant isolation test deserves naming explicitly: a suite that creates two organisations,
then attempts every read and write path as tenant A against tenant B's identifiers and asserts a
denial. It runs on every commit. This is the single most valuable test in the codebase.

**Infrastructure:** start on a managed platform (Railway, Render or Fly.io) with managed Postgres and
Redis; move to AWS or GCP when volume or enterprise procurement demands it. Prefer regions with low
latency to Lagos, and plan for a Nigerian or South African region as an enterprise data-residency
option.

**Observability:** OpenTelemetry traces carrying tenant context; structured logs with no PII;
Sentry for errors, tagged by tenant; per-tenant dashboards for latency, error rate and queue depth;
synthetic checks that place a test order end to end every five minutes. Alerts route to an on-call
rotation with runbooks.

**Cost discipline:** track infrastructure cost per tenant from the first month. Gross margin per
tenant is the number that tells you whether the free tier is a growth engine or a leak.

## 7.7 Migrating the prototype

Genuinely reusable, not just conceptually:

- **`src/types/index.ts`** becomes the shared API contract package.
- **`src/store/events.ts`** becomes the server event vocabulary, the websocket payload and the
  webhook body.
- **`src/store/reducer.ts`** becomes the venue node's local reducer, essentially unchanged.
- **`SyncAdapter`** gains a `WebSocketAdapter` and a `VenueNodeAdapter` beside the existing
  `BroadcastChannelAdapter`. No screen changes.
- **`src/lib/pricing.ts`** moves server-side verbatim and becomes authoritative.
- **`src/styles/tokens.css`** ports to React Native and to the marketing site.
- **The three surfaces** are the basis of the production clients.

What is discarded: simulated latency, injected failures, the presence heartbeat, auto-kitchen, the
reviewer dock, the seeded history generator, and `localStorage` as the persistence layer.

**The honest estimate: roughly 40% of the prototype's code survives into production, and close to
100% of its design decisions do.** That is a good ratio, and it is the return on having built the
prototype properly.
