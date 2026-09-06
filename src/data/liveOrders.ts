import type { Order, OrderItem, Payment, SelectedOption } from '../types'
import { calculateTotals, estimateEta } from '../lib/pricing'
import { MINUTE } from '../lib/time'
import { MENU_ITEMS } from './menu'
import { SETTINGS } from './restaurant'

/**
 * Tickets already on the pass when a reviewer first opens the kitchen display,
 * spread across every column and every age band so the board reads like a real
 * service rather than an empty grid.
 */

interface Spec {
  ref: string
  tableId: string
  tableLabel: string
  minutesAgo: number
  status: Order['status']
  paymentMethod: Order['paymentMethod']
  paymentStatus: Order['paymentStatus']
  note: string
  waiterCalled?: boolean
  lines: { itemId: string; qty: number; options?: [string, string][]; notes?: string }[]
}

const SPECS: Spec[] = [
  {
    ref: 'JK-8841',
    tableId: 'tbl_T3',
    tableLabel: 'T3',
    minutesAgo: 1,
    status: 'new',
    paymentMethod: 'bank-transfer',
    paymentStatus: 'paid',
    note: 'Birthday table — please bring the dessert with a candle.',
    lines: [
      {
        itemId: 'itm_jollof',
        qty: 2,
        options: [
          ['Choice of protein', 'Grilled chicken'],
          ['Pepper level', 'Medium'],
          ['Portion', 'Large'],
        ],
      },
      { itemId: 'itm_beef_suya', qty: 1, options: [['Yaji (suya spice)', 'Extra yaji']] },
      { itemId: 'itm_chapman', qty: 2, options: [['Size', 'Large'], ['Ice', 'With ice']] },
    ],
  },
  {
    ref: 'JK-8839',
    tableId: 'tbl_P2',
    tableLabel: 'P2',
    minutesAgo: 4,
    status: 'new',
    paymentMethod: 'pay-at-table',
    paymentStatus: 'unpaid',
    note: '',
    lines: [
      {
        itemId: 'itm_egusi',
        qty: 1,
        options: [
          ['Choice of swallow', 'Pounded yam'],
          ['Add protein', 'Goat meat'],
          ['Pepper level', 'Hot'],
        ],
        notes: 'No ponmo at all please, allergy in the party.',
      },
      { itemId: 'itm_zobo', qty: 1, options: [['Size', 'Regular'], ['Ice', 'No ice']] },
    ],
  },
  {
    ref: 'JK-8836',
    tableId: 'tbl_T7',
    tableLabel: 'T7',
    minutesAgo: 9,
    status: 'accepted',
    paymentMethod: 'bank-transfer',
    paymentStatus: 'paid',
    note: '',
    lines: [
      {
        itemId: 'itm_ofada',
        qty: 2,
        options: [
          ['Pepper level', 'Extra hot'],
          ['Add sides', 'Dodo'],
        ],
      },
      { itemId: 'itm_asun', qty: 1, options: [['Pepper level', 'Hot']] },
      { itemId: 'itm_palmwine', qty: 1 },
    ],
  },
  {
    ref: 'JK-8832',
    tableId: 'tbl_V1',
    tableLabel: 'V1',
    minutesAgo: 14,
    status: 'preparing',
    paymentMethod: 'bank-transfer',
    paymentStatus: 'paid',
    note: 'Table of ten — serve the soups together.',
    lines: [
      {
        itemId: 'itm_afang',
        qty: 3,
        options: [
          ['Choice of swallow', 'Eba (garri)'],
          ['Add protein', 'Stockfish'],
          ['Pepper level', 'Medium'],
        ],
      },
      { itemId: 'itm_tilapia', qty: 2, options: [['Pepper level', 'Hot']] },
      { itemId: 'itm_puffpuff', qty: 2, options: [['Pack size', 'Sharing pack']] },
      { itemId: 'itm_water', qty: 6 },
    ],
  },
  {
    ref: 'JK-8829',
    tableId: 'tbl_B1',
    tableLabel: 'B1',
    minutesAgo: 22,
    status: 'preparing',
    paymentMethod: 'pay-at-table',
    paymentStatus: 'unpaid',
    note: '',
    waiterCalled: true,
    lines: [
      { itemId: 'itm_chicken_suya', qty: 1, options: [['Yaji (suya spice)', 'Yaji on the side']] },
      { itemId: 'itm_yamfries', qty: 1, options: [['Portion', 'Large']] },
      { itemId: 'itm_gingerbeer', qty: 2, options: [['Size', 'Regular'], ['Ice', 'With ice']] },
    ],
  },
  {
    ref: 'JK-8825',
    tableId: 'tbl_T1',
    tableLabel: 'T1',
    minutesAgo: 27,
    status: 'ready',
    paymentMethod: 'bank-transfer',
    paymentStatus: 'paid',
    note: '',
    lines: [
      { itemId: 'itm_fried_rice', qty: 1, options: [['Choice of protein', 'Turkey'], ['Pepper level', 'Mild']] },
      { itemId: 'itm_moimoi', qty: 1, options: [['Pepper level', 'Mild']] },
    ],
  },
]

export function buildLiveOrders(): { orders: Order[]; payments: Payment[] } {
  const now = Date.now()
  const orders: Order[] = []
  const payments: Payment[] = []

  SPECS.forEach((spec, index) => {
    const placedAt = now - spec.minutesAgo * MINUTE
    const items: OrderItem[] = spec.lines.flatMap((line, lineIndex) => {
      const menuItem = MENU_ITEMS.find((m) => m.id === line.itemId)
      if (!menuItem) return []
      const selectedOptions: SelectedOption[] = (line.options ?? []).flatMap(
        ([groupName, optionName]) => {
          const group = menuItem.optionGroups.find((g) => g.name === groupName)
          const option = group?.options.find((o) => o.name === optionName)
          if (!group || !option) return []
          return [
            {
              groupId: group.id,
              groupName: group.name,
              optionId: option.id,
              optionName: option.name,
              priceDelta: option.priceDelta,
            },
          ]
        },
      )
      return [
        {
          id: `oi_l${index}_${lineIndex}`,
          menuItemId: menuItem.id,
          name: menuItem.name,
          unitPrice: menuItem.price,
          quantity: line.qty,
          selectedOptions,
          notes: line.notes ?? '',
          imageUrl: menuItem.imageUrl,
          imageTone: menuItem.imageTone,
        },
      ]
    })

    const totals = calculateTotals(items, SETTINGS)
    const etaMinutes = estimateEta(
      items.map((i) => ({
        prepMinutes: MENU_ITEMS.find((m) => m.id === i.menuItemId)?.prepMinutes ?? 12,
        quantity: i.quantity,
      })),
    )
    const orderId = `ord_live${index}`
    const paymentId = `pay_live${index}`

    const ladder: Order['status'][] = ['new', 'accepted', 'preparing', 'ready']
    const reached = ladder.slice(0, ladder.indexOf(spec.status) + 1)
    const history = reached.map((status, i) => ({
      status,
      at: placedAt + i * 3 * MINUTE,
      by: i === 0 ? 'Guest' : i === reached.length - 1 ? 'Amaka Nwosu' : 'Ibrahim Yusuf',
    }))

    payments.push({
      id: paymentId,
      orderId,
      method: spec.paymentMethod ?? 'pay-at-table',
      status: spec.paymentStatus,
      amount: totals.total,
      reference: `JKP${(700000 + index).toString(36).toUpperCase()}`,
      createdAt: placedAt,
      settledAt: spec.paymentStatus === 'paid' ? placedAt + MINUTE : undefined,
    })

    orders.push({
      id: orderId,
      reference: spec.ref,
      tableId: spec.tableId,
      tableLabel: spec.tableLabel,
      items,
      status: spec.status,
      totals,
      note: spec.note,
      paymentId,
      paymentMethod: spec.paymentMethod,
      paymentStatus: spec.paymentStatus,
      placedAt,
      history,
      etaMinutes,
      waiterCalledAt: spec.waiterCalled ? now - 2 * MINUTE : undefined,
    })
  })

  return { orders, payments }
}
