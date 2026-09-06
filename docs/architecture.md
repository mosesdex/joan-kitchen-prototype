# Architecture

The prototype is a single Vite + React + TypeScript application serving three surfaces from one
codebase. It has no backend. This document explains how the surfaces stay consistent, and which
single seam has to change when a real backend arrives.

## Why one app, not three

The customer app, the kitchen display and the admin dashboard share a domain model, a design system
and a component library. Splitting them into three apps at prototype stage would triplicate that
shared code for no review benefit. In production the customer surface becomes a native iPad app;
the kitchen and admin surfaces stay web, and the shared model moves to the API contract.

Routing is flat:

| Route | Surface | Theme |
| --- | --- | --- |
| `/` | Customer | dark |
| `/kitchen` | Kitchen | dark |
| `/admin/*` | Admin | light |
| `/demo` | Reviewer hub | dark |

`ThemeController` in [`src/app/App.tsx`](../src/app/App.tsx) sets `data-theme` on the root element
from the current path. Both themes are defined as CSS custom properties in
[`src/styles/tokens.css`](../src/styles/tokens.css); no component hardcodes a colour.

Admin is loaded with `React.lazy`. It is the only surface that pulls in the charting library, and a
guest at a table will never open it, so it stays out of the bundle the iPad downloads.

## State: one event stream, three readers

Every mutation is expressed as an `AppEvent` — `order/placed`, `order/status-changed`,
`menu/item-upserted`, and so on. The full list is in
[`src/store/events.ts`](../src/store/events.ts).

```
        customer tab                      kitchen tab                     admin tab
             │                                 │                              │
     dispatch(event)                           │                              │
             ▼                                 │                              │
   reduce(state, event)  ──── publish ────►  SyncAdapter  ────►  applyRemote(event)
             │                                                        │
             ▼                                                        ▼
        localStorage                                          reduce(state, event)
```

- `dispatch(event)` applies the event locally through the reducer **and** publishes it.
- `applyRemote(event)` applies an event that arrived from another surface, and never re-publishes.
- Both call the identical pure reducer in [`src/store/reducer.ts`](../src/store/reducer.ts). That is
  what keeps three independently-rendered surfaces convergent.

The store itself is Zustand ([`src/store/useStore.ts`](../src/store/useStore.ts)). It holds two
kinds of state:

- **Shared** — categories, menu items, tables, staff, settings, orders, payments. Reduced from
  events, persisted to `localStorage`, broadcast to other tabs.
- **Local** — this device's table, its cart, the signed-in admin user, the reviewer toggles. Never
  broadcast; a cart on one iPad is not a cart on another.

Deriving anything from that state — today's revenue, the kitchen columns, a category's dishes —
happens in [`src/store/selectors.ts`](../src/store/selectors.ts) rather than inside components.

## The one seam that changes

```ts
export interface SyncAdapter {
  readonly name: string
  publish(event: AppEvent): void
  subscribe(handler: (event: AppEvent) => void): () => void
  close(): void
}
```

`BroadcastChannelAdapter` ships today: no server, works on GitHub Pages, syncs every tab on the same
machine in real time. Its limitation is honest and deliberate — it does not cross devices.

A `SupabaseAdapter`, or any websocket transport, implements the same three methods and drops in at
[`src/store/sync.ts`](../src/store/sync.ts) without a single screen changing. The event shapes were
chosen to look like what a server would emit, precisely so that swap stays cheap.

## Prototype-specific machinery

Three pieces exist only to make the prototype reviewable, and all three are deleted in production:

**Simulated latency** ([`src/lib/latency.ts`](../src/lib/latency.ts)) — every async action takes
300–900 ms, so loading states are real rather than theoretical. The reviewer dock can force every
request to fail, which is how the error states are demonstrated on demand.

**Presence** ([`src/store/presence.ts`](../src/store/presence.ts)) — each surface heartbeats on a
second broadcast channel, so the customer app knows whether a real kitchen display is watching.

**Auto-kitchen** ([`src/store/autoKitchen.ts`](../src/store/autoKitchen.ts)) — with no kitchen tab
open, orders placed during the review advance on a timer, so a solo reviewer still sees the full
lifecycle. It stands down the moment a kitchen tab appears, and it never touches the seeded tickets
— a reviewer opening the kitchen display should find a service in progress, not an empty board.

## Money

All money is an integer number of **kobo**. Float naira is never stored, only formatted at the edge
by [`src/lib/money.ts`](../src/lib/money.ts). VAT and service charge are each computed on the
subtotal — service charge is not itself taxed — and each is rounded half-up to whole kobo, so the
printed lines always sum to the printed total. That property is asserted in the tests.

## Testing

[`src/test/`](../src/test) covers the parts where a bug would be silent rather than visible:
pricing and rounding, the event reducer, and cart merge semantics. UI is verified by review, which
is the point of a prototype.
