import { motion } from 'framer-motion'
import { Bell, ChefHat, Clock, HandCoins, MessageSquare } from 'lucide-react'
import { Badge, Button } from '../../components/ui'
import { elapsedPrecise } from '../../lib/time'
import type { Order, OrderStatus, RestaurantSettings } from '../../types'
import s from './kitchen.module.css'

const NEXT_STATUS: Partial<Record<OrderStatus, { status: OrderStatus; label: string }>> = {
  new: { status: 'accepted', label: 'Accept' },
  accepted: { status: 'preparing', label: 'Start cooking' },
  preparing: { status: 'ready', label: 'Mark ready' },
  ready: { status: 'served', label: 'Mark served' },
}

/**
 * A ticket ages: fresh tickets are accented, then amber past the warning
 * threshold, then red. A cook reads the left edge from across the kitchen
 * before reading a single word.
 */
export function Ticket({
  order,
  now,
  settings,
  onOpen,
  onAdvance,
}: {
  order: Order
  now: number
  settings: RestaurantSettings
  onOpen: () => void
  onAdvance: (status: OrderStatus) => void
}) {
  const minutes = (now - order.placedAt) / 60000
  const danger = minutes >= settings.ticketDangerMinutes
  const warn = !danger && minutes >= settings.ticketWarningMinutes
  const fresh = minutes < 2
  const next = NEXT_STATUS[order.status]

  return (
    <motion.article
      layout
      layoutId={`ticket-${order.id}`}
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.16 } }}
      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
      className={[
        s.ticket,
        danger ? s.ticketDanger : warn ? s.ticketWarn : fresh ? s.ticketFresh : '',
      ].join(' ')}
    >
      <button
        className={s.ticketHead}
        onClick={onOpen}
        style={{ width: '100%' }}
        aria-label={`Open ticket ${order.reference} for table ${order.tableLabel}`}
      >
        <span>
          <span className={s.ticketTable} style={{ display: 'block' }}>
            {order.tableLabel}
          </span>
          <span className={s.ticketRef}>{order.reference}</span>
        </span>
        <span
          className={[
            s.ticketTimer,
            danger ? s.ticketTimerDanger : warn ? s.ticketTimerWarn : '',
          ].join(' ')}
        >
          <Clock size={12} />
          {elapsedPrecise(order.placedAt, now)}
        </span>
      </button>

      <div className={s.ticketItems}>
        {order.items.map((line) => (
          <div className={s.ticketLine} key={line.id}>
            <span className={[s.lineQty, line.quantity > 1 ? s.lineQtyMulti : ''].join(' ')}>
              {line.quantity}
            </span>
            <div style={{ minWidth: 0 }}>
              <p className={s.lineName}>{line.name}</p>
              {line.selectedOptions.length > 0 ? (
                <p className={s.lineOptions}>
                  {line.selectedOptions.map((o) => o.optionName).join(' · ')}
                </p>
              ) : null}
              {line.notes ? (
                <p className={s.lineNote}>
                  <MessageSquare size={11} style={{ flexShrink: 0, marginTop: 2 }} />
                  {line.notes}
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {order.note ? (
        <p className={s.ticketNote}>
          <MessageSquare size={12} style={{ flexShrink: 0, marginTop: 2 }} />
          {order.note}
        </p>
      ) : null}

      {order.paymentStatus !== 'paid' || order.waiterCalledAt ? (
        <div className={s.ticketFlags}>
          {order.paymentStatus !== 'paid' ? (
            <Badge tone="warning">
              <HandCoins size={10} /> {order.paymentMethod === 'pay-at-table' ? 'Pay at table' : 'Awaiting transfer'}
            </Badge>
          ) : null}
          {order.waiterCalledAt ? (
            <Badge tone="danger">
              <Bell size={10} /> Server called
            </Badge>
          ) : null}
        </div>
      ) : null}

      {next ? (
        <div className={s.ticketFoot}>
          <Button variant="primary" size="sm" block onClick={() => onAdvance(next.status)}>
            <ChefHat size={13} /> {next.label}
          </Button>
        </div>
      ) : null}
    </motion.article>
  )
}
