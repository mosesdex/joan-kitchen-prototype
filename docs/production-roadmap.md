# Production roadmap

What changes when the approved prototype becomes the real system. Written to be argued with — the
point of the review is to settle these before anyone builds them.

## Target architecture

| Piece | Technology | Why |
| --- | --- | --- |
| Customer app | Native iPadOS (Swift, SwiftUI) | Kiosk mode, guided access, offline tolerance, hardware performance on a device that lives on a table all day |
| Kitchen display | Web, full-screen on a wall screen or tablet | No app install, updates without touching the device, runs on whatever hardware the kitchen has |
| Admin dashboard | Web | Used at a desk, on a laptop |
| API | Typed HTTP API plus a realtime channel | One contract shared by all three clients |
| Database | PostgreSQL | Relational data, real reporting, transactional integrity on money |
| Realtime | Websockets or Postgres logical replication | Order events pushed to every surface |

## What carries over from the prototype

More than it looks:

- **The domain model** ([`src/types/index.ts`](../src/types/index.ts)) becomes the API contract
  almost unchanged.
- **The event vocabulary** ([`src/store/events.ts`](../src/store/events.ts)) becomes the realtime
  message set. It was written to look like what a server would emit for exactly this reason.
- **Pricing** ([`src/lib/pricing.ts`](../src/lib/pricing.ts)) moves server-side verbatim. Money must
  be computed once, authoritatively, in integer kobo — never on a client.
- **The design system** ([`src/styles/tokens.css`](../src/styles/tokens.css)) ports to SwiftUI
  colour and type definitions.
- **The kitchen and admin surfaces** are already web and can be reused as the basis for production
  builds, once they read from the API instead of the local store.

## What is thrown away

Everything under "prototype-specific machinery" in [architecture](architecture.md): simulated
latency, injected failures, the presence heartbeat, auto-kitchen, the reviewer dock, the seeded
history generator, and `BroadcastChannelAdapter`.

## The work, in order

### 1. Backend and data model

Postgres schema for restaurants, categories, items, option groups, options, tables, orders, order
items, payments, staff and settings. Orders and payments are append-only where it matters: an order
status change writes a history row rather than mutating a column, which the prototype already
models.

Money stays integer kobo end to end. Totals are computed and stored server-side at order placement,
so a repriced menu never retroactively changes a settled bill.

### 2. Authentication and authorisation

Staff accounts with proper password hashing, session tokens and refresh. The role and permission
model in the prototype is the starting point; production adds custom roles, since owners invariably
want a supervisor who can void an order but cannot see the reports.

Customer iPads authenticate as *devices*, not people — a device token bound to a table, provisioned
once by a manager. A guest never signs in.

### 3. Realtime

Order events pushed to subscribed clients. Three things the prototype does not have to solve and
production does:

- **Reconnection and replay.** A kitchen screen that loses wifi for ninety seconds must catch up on
  what it missed, not miss it. Clients track a last-seen event id and replay the gap on reconnect.
- **Conflict resolution.** Two chefs bumping the same ticket simultaneously. The server is
  authoritative and the losing client reconciles.
- **Ordering guarantees.** Events must apply in the order the server accepted them.

### 4. Payments

Integrate a Nigerian payment provider — Paystack or Flutterwave — for bank transfer. Both issue
dedicated virtual accounts per transaction, which removes the guess-and-confirm step the prototype
simulates: the webhook is authoritative and the guest's screen updates when it fires.

Pay-at-table needs a settlement record tied to the staff member who took payment, which the
prototype already models. If card terminals are in scope, that is a separate integration decision.

**Never** handle raw card details in the application. Use the provider's hosted flow.

### 5. Native iPad app

SwiftUI, portrait and landscape, guided access so a guest cannot leave the app. Offline tolerance
matters more than it sounds: a restaurant's wifi will drop, and an iPad that cannot take an order
during a drop is worse than a paper menu. Queue orders locally and reconcile on reconnect.

Device provisioning, remote configuration, and a kill switch so a manager can pull a misbehaving
iPad from service without walking to the table.

### 6. Operational hardening

Printer integration for the kitchen and the bill. Daily close and cash-up reports. Audit logging on
every money-touching action. Backups with a tested restore. Monitoring on order latency — the
number that tells you the system is failing before a customer does.

## Open questions for the review

These need a decision from the restaurant, not from us:

1. **Does a guest need to pay before the kitchen starts?** The prototype sends unpaid orders through
   immediately. That is a trust decision, not a technical one.
2. **Split bills.** Common at a large table, and it substantially changes the payment model. In or
   out of v1?
3. **Waiter-placed orders.** Should staff be able to order on a guest's behalf from a handheld?
4. **Multiple sittings on one table.** Does the system need to distinguish "the guests who were here
   at 7" from "the guests here now" for reporting?
5. **Menu scheduling.** Breakfast, lunch and dinner menus, or items that only appear at weekends.
6. **Multi-branch.** If a second Joan Kitchen is plausible, tenancy is far cheaper to build in now
   than to retrofit.
