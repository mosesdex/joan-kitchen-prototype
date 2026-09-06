import type { OptionGroup, Option } from '../types'

/**
 * Option groups are defined once and cloned per menu item, so the admin
 * "option group editor" can diverge them per dish without shared-reference bugs.
 */

const opt = (id: string, name: string, priceDelta = 0, available = true): Option => ({
  id,
  name,
  priceDelta,
  available,
})

const N = (naira: number) => naira * 100

export const SWALLOW: OptionGroup = {
  id: 'og_swallow',
  name: 'Choice of swallow',
  type: 'single',
  required: true,
  options: [
    opt('sw_pounded', 'Pounded yam'),
    opt('sw_eba', 'Eba (garri)', N(-200)),
    opt('sw_amala', 'Amala'),
    opt('sw_semo', 'Semovita'),
    opt('sw_fufu', 'Fufu'),
    opt('sw_wheat', 'Wheat', N(300)),
    opt('sw_none', 'No swallow', N(-800)),
  ],
}

export const SOUP_PROTEIN: OptionGroup = {
  id: 'og_soup_protein',
  name: 'Add protein',
  type: 'multi',
  required: false,
  maxSelections: 4,
  options: [
    opt('sp_assorted', 'Assorted meat', N(1500)),
    opt('sp_goat', 'Goat meat', N(2000)),
    opt('sp_ponmo', 'Ponmo', N(800)),
    opt('sp_stockfish', 'Stockfish', N(2500)),
    opt('sp_driedfish', 'Dried fish', N(1800)),
    opt('sp_snail', 'Snail', N(3000), false),
  ],
}

export const SPICE: OptionGroup = {
  id: 'og_spice',
  name: 'Pepper level',
  type: 'single',
  required: true,
  options: [
    opt('sl_mild', 'Mild'),
    opt('sl_medium', 'Medium'),
    opt('sl_hot', 'Hot'),
    opt('sl_extra', 'Extra hot'),
  ],
}

export const PORTION: OptionGroup = {
  id: 'og_portion',
  name: 'Portion',
  type: 'single',
  required: true,
  options: [opt('pt_regular', 'Regular'), opt('pt_large', 'Large', N(1500))],
}

export const RICE_PROTEIN: OptionGroup = {
  id: 'og_rice_protein',
  name: 'Choice of protein',
  type: 'single',
  required: true,
  options: [
    opt('rp_none', 'No protein'),
    opt('rp_chicken', 'Grilled chicken', N(2500)),
    opt('rp_beef', 'Beef', N(2000)),
    opt('rp_turkey', 'Turkey', N(3000)),
    opt('rp_fish', 'Fried fish', N(3500)),
  ],
}

export const RICE_SIDES: OptionGroup = {
  id: 'og_rice_sides',
  name: 'Add sides',
  type: 'multi',
  required: false,
  maxSelections: 3,
  options: [
    opt('rs_dodo', 'Dodo', N(1000)),
    opt('rs_moimoi', 'Moi moi', N(1200)),
    opt('rs_coleslaw', 'Coleslaw', N(900)),
    opt('rs_salad', 'Garden salad', N(1500)),
  ],
}

export const YAJI: OptionGroup = {
  id: 'og_yaji',
  name: 'Yaji (suya spice)',
  type: 'single',
  required: true,
  options: [
    opt('yj_regular', 'Regular yaji'),
    opt('yj_extra', 'Extra yaji'),
    opt('yj_side', 'Yaji on the side'),
    opt('yj_none', 'No pepper'),
  ],
}

export const GRILL_SIDES: OptionGroup = {
  id: 'og_grill_sides',
  name: 'Add sides',
  type: 'multi',
  required: false,
  maxSelections: 2,
  options: [
    opt('gs_onion', 'Extra onion and tomato'),
    opt('gs_dodo', 'Dodo', N(1000)),
    opt('gs_yamfries', 'Yam fries', N(1500)),
  ],
}

export const DRINK_SIZE: OptionGroup = {
  id: 'og_drink_size',
  name: 'Size',
  type: 'single',
  required: true,
  options: [opt('ds_regular', 'Regular'), opt('ds_large', 'Large', N(700))],
}

export const ICE: OptionGroup = {
  id: 'og_ice',
  name: 'Ice',
  type: 'single',
  required: true,
  options: [opt('ic_with', 'With ice'), opt('ic_without', 'No ice')],
}

export const CHOPS_QTY: OptionGroup = {
  id: 'og_chops_qty',
  name: 'Pack size',
  type: 'single',
  required: true,
  options: [
    opt('cq_small', 'Small pack'),
    opt('cq_sharing', 'Sharing pack', N(2500)),
    opt('cq_party', 'Party tray', N(6500)),
  ],
}

/** Deep clone so per-item edits in admin never mutate the shared template. */
export function cloneGroups(...groups: OptionGroup[]): OptionGroup[] {
  return groups.map((g) => ({
    ...g,
    options: g.options.map((o) => ({ ...o })),
  }))
}
