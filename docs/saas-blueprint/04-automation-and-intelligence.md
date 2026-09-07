# 04 — Automation and intelligence

The test every item here has to pass: **does this remove work a human is doing today, or make a
decision a human is currently guessing at?** If the honest answer is "it makes the pricing page look
modern," it does not ship.

## 4.1 Deterministic automation first

Most of the value labelled "AI" in this category is a rules engine. Rules are cheaper, explainable,
debuggable, and do not fail in embarrassing ways during service.

### The rules engine

A trigger–condition–action model exposed to operators in plain language:

> **When** an order has been in `ready` for more than 8 minutes
> **and** the table has not called a server
> **then** notify the floor manager on WhatsApp.

Triggers: order placed, status changed, payment received or failed, stock below par, ingredient
sold out, void or discount recorded, shift started or ended, table idle, review received, day closed.

Conditions: value thresholds, item or category, table or zone, staff member, time of day, day of
week, channel.

Actions: notify a person or a role on a channel, change a status, 86 an item, create a purchase
order draft, apply a discount, flag for approval, write to the audit log, call a webhook.

Ship it with a **library of pre-built rules** operators can switch on, because a blank rule builder
is the same failure as a blank menu:

- Ticket older than 20 minutes → alert the manager.
- Ingredient stock hits zero → 86 every dish using it, on every channel.
- Void over ₦20,000 → require manager approval before it applies.
- Payment failed → WhatsApp the guest a fresh pay link.
- Daily at close → WhatsApp the owner yesterday's four numbers.
- Weekly Monday 07:00 → email the manager the menu engineering report.
- Guest has not returned in 60 days → add to a win-back segment.

### Scheduled work

Day-close and business-day rollover; scheduled report delivery; automated stock-count reminders;
subscription renewals and dunning; data retention purges; nightly reconciliation of our order ledger
against provider settlements.

### Approval workflows

Voids, comps and discounts above a configurable threshold; price changes; menu deletions; refunds;
staff role changes. Each records requester, approver, reason and timestamp. This is loss prevention
and it is what makes the audit log worth having.

## 4.2 Where AI genuinely earns its place

Five applications, ranked by value over cost. Each replaces work that is happening today.

### 1. Menu import from a photo or PDF — **the highest-value AI in the product**

Menu entry is the single biggest onboarding wall in this category, and it is why MenuTiger leads
with "5-minute AI menu setup" and why "easy migration" is the first row of their competitive table.
An operator photographs their printed menu or uploads a PDF; we return a structured draft — 
categories, dishes, descriptions, prices, inferred modifiers, inferred allergen and dietary tags — 
for them to review and correct.

Cuts time-to-first-value from days to minutes. Directly attacks the largest cause of onboarding
abandonment. Everything downstream depends on the menu existing.

**Design rule: always a reviewable draft, never an auto-publish.** A hallucinated price is a real
loss for a real business.

### 2. Invoice and receipt capture

Photograph a supplier invoice; we extract supplier, date, line items, quantities, units and prices,
and post it against the inventory. This is the difference between recipe costing that is theoretical
and recipe costing that is live — and manual invoice entry is the reason most restaurants abandon
inventory modules.

### 3. Demand forecasting for prep and labour

Per dish, per hour, per day, from the venue's own history plus day-of-week, weather, paydays and
local events. Nigerian salary cycles are a genuinely strong signal that generic models miss.
Feeds prep lists, par levels and shift sizing. Needs roughly 8–12 weeks of the venue's own data, so
it lands in Phase 3 by necessity rather than choice.

### 4. Anomaly detection on money

Statistical, not generative. Flags a server whose void rate is three standard deviations above
peers, a till whose cash variance drifts one way, a dish whose theoretical-versus-actual gap opens
suddenly. Given that **75% of restaurant shrinkage is employee theft**, this is the highest-value
alert the platform can produce, and it is a strong reason to buy the inventory module.

### 5. Natural-language reporting

"How did jollof do last month compared to the month before?" answered against the tenant's own data.
Two hard rules: it may only *query*, never mutate; and every answer shows the underlying figures and
the query it ran, so the operator can check it. An LLM that quietly gets a revenue number wrong is
worse than no feature.

## 4.3 Deliberately not doing

- **A guest-facing chatbot ordering assistant.** Guests want a fast menu, not a conversation. This
  would add latency and failure modes to the most performance-sensitive surface we own.
- **AI-generated menu descriptions and photos as a default.** Fine as an optional draft tool.
  Terrible as a default: fake food photography is exactly the wrong signal for a restaurant, and
  the real answer is that operators should photograph their own dishes.
- **Voice AI phone ordering — for now.** Genuinely valuable in the US (two in five inbound
  restaurant calls go unanswered; 75% of diners are comfortable with AI reservations), but it needs
  accent-robust speech recognition for Nigerian English, Pidgin and code-switching. Doing it badly
  is worse than not doing it. Phase 5, and only with real evaluation data.
- **Dynamic pricing.** Technically easy, commercially radioactive. Chowdeck is currently before the
  Competition and Consumer Protection Tribunal over price transparency. Do not walk into that.
- **AI-written marketing campaigns.** Low value, high brand risk, crowded.

## 4.4 Intelligence without models

Worth saying plainly, because these often beat the model-based features on value per unit of effort:

- **Menu engineering** — margin against popularity, four quadrants, an explicit recommendation per
  dish. Pure arithmetic on data we already hold.
- **Commission recovery counter** — "₦412,000 kept this month by taking orders on your own channel
  instead of an aggregator at 25%." Arithmetic. Renews the subscription by itself.
- **Business-day-correct comparisons** — this week against the same weekday last week, not against
  a calendar month. Most competitors get this wrong.
- **Reconciliation exceptions queue** — every transfer we could not match automatically, in one
  list, with a one-tap resolution. Replaces a human staring at a bank app.
