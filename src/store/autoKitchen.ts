import { useEffect } from 'react'
import type { OrderStatus } from '../types'
import { useStore } from './useStore'
import { useSurfacePresent } from './presence'

/**
 * With no kitchen display open, tickets would sit at "new" forever and the
 * customer tracking screen would look broken. This advances them on a timer so
 * a single reviewer sees the full lifecycle — and stands down the moment a real
 * kitchen tab appears, so the two never fight over the same ticket.
 */

/**
 * Seeded tickets keep their staged positions on the board — a reviewer who opens
 * the kitchen display expects to find a service already in progress, not an
 * empty grid because the simulator quietly served everything while they were
 * reading the customer menu. Only orders placed during the review advance.
 */
function isSeeded(orderId: string): boolean {
  return orderId.startsWith('ord_live') || orderId.startsWith('ord_h')
}

const NEXT: Partial<Record<OrderStatus, { status: OrderStatus; afterSeconds: number }>> = {
  new: { status: 'accepted', afterSeconds: 12 },
  accepted: { status: 'preparing', afterSeconds: 15 },
  preparing: { status: 'ready', afterSeconds: 32 },
  ready: { status: 'served', afterSeconds: 45 },
}

export function useAutoKitchen(enabled: boolean) {
  const kitchenOpen = useSurfacePresent('kitchen')
  const autoKitchen = useStore((s) => s.autoKitchen)
  const active = enabled && autoKitchen && !kitchenOpen

  useEffect(() => {
    if (!active) return
    const id = setInterval(() => {
      const state = useStore.getState()
      const now = Date.now()
      for (const order of state.orders) {
        if (isSeeded(order.id)) continue
        const step = NEXT[order.status]
        if (!step) continue
        const enteredAt = [...order.history].reverse().find((h) => h.status === order.status)?.at
        if (!enteredAt) continue
        if (now - enteredAt < step.afterSeconds * 1000) continue
        // Re-read status right before dispatching: a real kitchen tab may have
        // bumped this ticket between the scan and this line.
        if (useStore.getState().orders.find((o) => o.id === order.id)?.status !== order.status) continue
        state.advanceOrder(order.id, step.status, 'Auto kitchen')
      }
    }, 3000)
    return () => clearInterval(id)
  }, [active])

  return { simulating: active, kitchenOpen }
}
