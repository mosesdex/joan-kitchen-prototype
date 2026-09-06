# Prototype guide

A walkthrough of every screen, and what is worth looking at when you review it. Roughly 15 minutes
end to end.

Start at `/demo` for the short version, or follow this document for the full pass.

> Open the customer app and the kitchen display in two browser tabs before you begin. Most of what
> makes this system work is only visible when you can see both at once.

---

## 1. Customer iPad — `/`

### Idle screen

What an iPad shows between guests. Tables are grouped by zone; a table being cleared is disabled
rather than hidden, so a guest is not left wondering where their number went.

**Look at:** the table you pick binds this device for the sitting. Tapping the table pill in the
header afterwards releases it — that is the "new guests sat down" gesture.

### Menu

Category rail, search across the whole menu, and three filters. Dishes that have run out stay
visible under a veil rather than disappearing, because a guest who came for the white soup should
find out it is off, not silently fail to find it.

**Look at:** search for "jollof" or "suya" — it searches descriptions as well as names. Turn on
"Vegetarian" and watch the grid re-flow rather than jump.

### Dish detail

Options are grouped and priced: choice of swallow, added protein, pepper level, portion. Required
single-choice groups pre-select their first option, so the add button is never blocked by a
requirement further down the sheet. Unavailable options are shown struck out with "finished" rather
than removed, and a free-text note goes to the kitchen.

**Look at:** the running total in the footer updates as you change options. Add "Goat meat" to a
soup and the price moves before you commit.

### Cart

Identical dishes with identical options merge into one line; change one option and it stays a
separate line. VAT at 7.5% and a 5% service charge are itemised — both configurable in admin.

**Look at:** a table-level note, separate from per-item notes. This is where "we are celebrating a
birthday" goes.

### Checkout and payment

Two rails, both realistic for a Lagos restaurant:

- **Bank transfer** — a fixed amount, the restaurant's account, a unique reference and a hold
  window, with the guest confirming once they have sent it. The order reaches the kitchen
  immediately, flagged as awaiting payment.
- **Pay at the table** — straight through, flagged unpaid for the server to settle.

**Look at:** nothing is charged and no card details are ever requested. The transfer screen is the
whole payment surface.

### Confirmation and tracking

Order reference, table, an ETA computed from the dishes ordered, and the amount. Tracking is a live
stepper: sent, accepted, cooking, ready, served, with the time and the staff member on each step,
plus a call-a-server button.

**Look at:** this is the screen to watch while you bump the order on the kitchen tab.

---

## 2. Kitchen display — `/kitchen`

A four-column board. Six tickets are already in progress when you open it.

**Ageing.** The left edge of each ticket is the signal: accent when fresh, amber past the warning
threshold, red past the danger threshold. Both thresholds are set in admin settings. A cook reads the
edge from across the kitchen before reading a word.

**Reading a ticket.** Quantities above one are highlighted. Customisations are listed under each
dish. A guest's note is called out in amber, and a table-level note in blue — the two are different
kinds of instruction and should not look the same.

**Flags.** Unpaid orders and tables that have called a server are badged, so the pass knows before
plating.

**Look at:** place an order from the customer tab and watch it arrive here with a chime and a toast.
Then bump it through the columns and watch the customer's tracking screen follow.

**Ticket detail** carries the full history and a cancel flow that requires a reason — cancellations
without reasons are how a manager loses track of what went wrong. Completed and cancelled tabs hold
today's closed tickets.

---

## 3. Admin dashboard — `/admin`

Sign in with an account from the login screen. Roles genuinely differ: sign in as `amaka@` (kitchen)
and most of the navigation disappears.

**Dashboard** — today's revenue, orders, average ticket and median time to ready, each against
yesterday; a 14-day revenue trend; a live order feed; today's best sellers.

**Menu** — categories reorder with the arrows; dishes have a photo picker, price, prep time, pepper
level, dietary tags and an option-group editor. The availability toggle is the one to try: turn a
dish off here and it is veiled on the customer iPad immediately.

**Tables** — zones, seats, status and a pairing code per table, with live order counts.

**Orders** — every order with date, status and search filters, a detail drawer with the full
history, a status override, and CSV export.

**Payments** — settled and outstanding split by method, with a settle button for pay-at-table bills.
This is the reconciliation screen a manager uses at close.

**Staff** — people, roles and a permission matrix showing exactly what each role can reach.

**Reports** — revenue and orders by day, revenue by category, an hour-of-day heatmap, payment mix,
best sellers and slowest movers, with CSV export. Roughly two weeks of history is generated from a
fixed seed, so these numbers are the same for every reviewer.

**Settings** — VAT and service charge, bank transfer details, kitchen ageing thresholds and opening
hours. Change the service charge and the next bill on the customer iPad uses it.

---

## 4. States worth checking

- **Empty** — an empty cart, a search with no matches, a category with nothing in it, a kitchen
  board with no tickets, a period with no sales.
- **Loading** — the menu's first paint uses skeletons shaped like the final cards, not spinners.
  Every async action takes 300–900 ms deliberately.
- **Error** — open the Prototype dock, switch on "force network errors", then try to place an order
  or confirm a transfer. Both fail cleanly and offer a retry, and neither loses the order.
- **Success** — toasts on add, save and settle; the confirmation screen; the ready state on a
  ticket.

## 5. What to tell us

The useful feedback at this stage is about flow and priority, not pixels:

- Is anything missing that the restaurant does every day?
- Is anything here that the restaurant would never use?
- Does the kitchen board work at a glance, from across a kitchen?
- Is the payment flow right for how guests actually pay?
- What should a guest be able to do that they currently cannot?

## Known limits

These are deliberate for a prototype, not oversights:

- Sync is between tabs on one machine. Two devices do not see each other. See
  [architecture](architecture.md) for the seam that changes.
- No real authentication, payment processing or database.
- Dish photography is stand-in stock — see [credits](credits.md).
- Roles are fixed; custom roles come in production.
