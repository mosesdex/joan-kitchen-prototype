# Design system — "Suya char"

The visual direction takes its cue from what the kitchen actually does: charred meat off an open
grill, palm oil, amber and clay. It avoids the flag-colour cliché that Nigerian restaurant branding
often reaches for.

Dark for the customer iPad and the kitchen display; light for the admin dashboard. One accent family
across both.

## Why dark for guests

The iPad sits on a table under warm restaurant lighting. A dark interface lets the chrome disappear
and the food photography carry the screen — which is the entire job of a menu. The admin dashboard
inverts because it is used at a desk for long shifts on dense tables of numbers.

## Colour

Every colour is a CSS custom property in [`src/styles/tokens.css`](../src/styles/tokens.css). No
component hardcodes a hex value; that is what lets the same components render correctly in both
themes.

### Accents — identical in both themes

| Token | Value | Use |
| --- | --- | --- |
| `--amber-500` | `#E8A33D` | Primary action, live state, chef picks |
| `--clay-500` | `#C1573A` | Secondary accent, pepper level |
| `--green-500` | `#4E9F5B` | Ready, paid, available |
| `--gold-500` | `#D9A22B` | Ageing ticket, unpaid, special instruction |
| `--red-500` | `#C0453B` | Late ticket, cancelled, destructive |

### Dark theme (customer, kitchen)

| Token | Value |
| --- | --- |
| `--surface-0` page | `#12100E` |
| `--surface-1` card | `#1C1917` |
| `--surface-3` raised | `#292524` |
| `--border` | `#332E2C` |
| `--text-primary` | `#FAF7F2` |
| `--text-secondary` | `#A8A29E` |

### Light theme (admin)

| Token | Value |
| --- | --- |
| `--surface-0` page | `#FAF8F5` |
| `--surface-1` card | `#FFFFFF` |
| `--border` | `#E7E2DA` |
| `--text-primary` | `#1C1917` |

## Type

Clash Display for headings, Inter for everything else, with a system fallback stack on both.

`12 · 14 · 16 · 20 · 24 · 32 · 44 px`, exposed as `--text-2xs` through `--text-3xl`. Headings sit at
600 weight with `-0.015em` tracking. Anything numeric — prices, timers, totals, table numbers — uses
`font-variant-numeric: tabular-nums` so figures do not jitter as they update.

## Spacing, radius, motion

4 px base scale (`--space-1` … `--space-16`). Radii `4 · 8 · 12 · 20 px` plus a pill. Motion is
140/220/320 ms on `cubic-bezier(0.22, 1, 0.36, 1)`, with a global `prefers-reduced-motion` override
in [`src/styles/base.css`](../src/styles/base.css).

Motion is used to explain change, not to decorate: cart lines collapse their own height when
removed, kitchen tickets animate between columns so a cook can see what moved, and the tracking
stepper pulses only on the currently-active step.

## Components

[`src/components/ui.tsx`](../src/components/ui.tsx) holds the primitives — button (five variants,
three sizes), badge, skeleton, empty and error states, field wrapper, text input, textarea, select,
toggle, quantity stepper, spice meter. [`Toaster.tsx`](../src/components/Toaster.tsx) provides the
toast API, and [`DishImage.tsx`](../src/components/DishImage.tsx) handles photography.

Two conventions worth knowing:

- `Toggle` takes `label` for visible text beside the switch, and `ariaLabel` when the switch needs an
  accessible name but sits in a row that already names the thing.
- `DishImage` falls back to a designed tile — a warm two-stop wash keyed to the dish's `imageTone`
  with the dish's initials — whenever a photo fails to load. A failed image still looks like part of
  the menu rather than a broken page.

## Accessibility

Touch targets are at least 44 px. Contrast meets AA on both themes. Focus rings are visible
throughout and the admin dashboard is fully keyboard navigable. Icon-only controls carry
`aria-label`; status changes are announced through a polite live region.
