# Joan Kitchen — ordering system prototype

An interactive, high-fidelity prototype of a complete restaurant ordering system for
**Joan Kitchen**, a Nigerian restaurant in Victoria Island, Lagos.

It covers three connected surfaces:

| Surface | Route | Who uses it |
| --- | --- | --- |
| Customer app | `/` | Guests, on an iPad at the table |
| Kitchen display | `/kitchen` | Chefs, on a screen at the pass |
| Admin dashboard | `/admin` | Owner and managers, on a desktop |
| Reviewer hub | `/demo` | Anyone reviewing this prototype |

**This is a design prototype, not the production system.** There is no server and no database:
state lives in the browser and synchronises between tabs on the same machine. No real payment is
processed and no card details are ever collected. See
[docs/production-roadmap.md](docs/production-roadmap.md) for what production adds.

---

## Try it

```bash
npm install
npm run dev
```

Then open <http://localhost:5173/joan-kitchen-prototype/demo> for the guided tour, or go straight to
a surface.

The single thing worth doing first: **open the customer app and the kitchen display in two browser
tabs side by side.** Place an order in one and it appears on the kitchen board in the other within a
second, with no refresh. Bump it through the kitchen columns and the customer's tracking screen
follows along.

### Reviewer controls

Every surface has a small **Prototype** button in the bottom-left corner. It switches surfaces and
exposes four controls:

- **Auto kitchen** — with no kitchen tab open, advances orders you place on a timer, so tracking
  works even if you are reviewing alone. It stands down automatically when a real kitchen tab
  appears. It never touches the seeded tickets already on the board.
- **Kitchen sound** — the chime on each new ticket.
- **Force network errors** — makes every simulated request fail, so the error states are
  demonstrable on demand.
- **Reset demo data** — restores the seeded restaurant.

### Admin sign-in

Accounts are listed on the login screen; tap one to fill the form. Roles genuinely differ — the
kitchen account sees far less of the back office than the owner does.

| Email | PIN | Role |
| --- | --- | --- |
| `joan@joankitchen.ng` | 1234 | Owner |
| `tunde@joankitchen.ng` | 2345 | Manager |
| `amaka@joankitchen.ng` | 3456 | Kitchen |
| `chidi@joankitchen.ng` | 5678 | Waiter |

Credentials are printed on screen because this is a prototype. Production replaces this with a real
session and never ships a PIN to the client.

---

## What is built

**Customer app** — idle attract screen and table selection; category rail, search and dietary
filters; dish detail with option groups, pepper level, quantity and a note to the kitchen; cart with
live VAT and service charge; checkout; bank transfer with account details, a reference and a
confirmation step, or pay at the table; order confirmation; and a live tracking stepper with a call-
a-server button.

**Kitchen display** — a four-column ticket board (new, accepted, preparing, ready) with ageing
timers that escalate from accent to amber to red, item customisations and special instructions
called out, unpaid and server-called flags, a chime and toast on every new ticket, ticket detail
with cancel-and-reason, and completed and cancelled tabs.

**Admin dashboard** — dashboard with today's revenue, orders, average ticket and a live order feed;
menu management with category reorder, dish CRUD, a photo picker, availability toggles and an
option-group editor; table management with zones, seats, pairing codes and status; order records
with filters, detail and status override; payments with method breakdown and pay-at-table
settlement; staff with roles and a permission matrix; reports with revenue trend, category
breakdown, an hour-of-day heatmap, payment mix, best and worst sellers, and CSV export; and
settings for charges, bank details, kitchen thresholds and opening hours.

**Throughout** — empty, loading, error and success states; skeletons that match the final layout
rather than spinners; simulated 300–900 ms latency on every async action; motion that respects
`prefers-reduced-motion`; 44 px touch targets; keyboard navigation and focus rings.

## Sample data

52 Nigerian dishes across 8 categories with real prices in naira, allergen and pepper-level tags,
and option groups (choice of swallow, added protein, pepper level, portion, yaji). 24 tables across
four zones. Six staff across four roles. Six tickets already in progress on the kitchen board, and
roughly two weeks of historical orders generated from a fixed seed so every reviewer sees the same
reports.

Dish photography is stand-in stock — see [docs/credits.md](docs/credits.md).

---

## Project structure

```
src/
├── app/            router, theme controller, reviewer hub and dock
├── components/     shared UI primitives (button, badge, field, toggle, toast, dish image)
├── data/           seed menu, tables, staff, settings, photos, generated history
├── lib/            money, pricing, ids, time, simulated latency, sound, hooks
├── store/          domain state, event reducer, sync adapters, presence, auto-kitchen
├── styles/         design tokens and base stylesheet
├── surfaces/
│   ├── customer/   iPad ordering experience
│   ├── kitchen/    ticket board and detail
│   └── admin/      back office and its pages
├── test/           unit tests
└── types/          the domain model
```

## Commands

```bash
npm run dev        # dev server
npm run build      # typecheck and production build
npm run preview    # serve the production build
npm test           # unit tests
npm run typecheck  # types only
npm run lint       # oxlint
```

## Documentation

- [Architecture](docs/architecture.md) — how the three surfaces share state, and the one seam that
  swaps for a real backend.
- [Prototype guide](docs/prototype-guide.md) — a walkthrough of every screen and what to look for
  when reviewing.
- [Design system](docs/design-system.md) — the Suya char palette, type scale, spacing and motion.
- [Production roadmap](docs/production-roadmap.md) — what changes when this becomes the real system.
- [Credits](docs/credits.md) — photography.

## Deployment

Pushing to `main` typechecks, tests, builds and publishes to GitHub Pages via
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). The build sets a base path of
`/joan-kitchen-prototype/`; build with `BASE_PATH=/ npm run build` to host at a domain root.

## Licence

Prototype code for Joan Kitchen. Dish photography is licensed separately by its photographers under
the Unsplash licence.
