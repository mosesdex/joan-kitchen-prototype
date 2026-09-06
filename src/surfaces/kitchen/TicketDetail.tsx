import { useState } from 'react'
import { motion } from 'framer-motion'
import { Ban, Check, MessageSquare, X } from 'lucide-react'
import { Badge, Button } from '../../components/ui'
import { useEscape } from '../../lib/hooks'
import { naira } from '../../lib/money'
import { lineUnitPrice } from '../../lib/pricing'
import { clockTime, elapsedPrecise } from '../../lib/time'
import type { Order, OrderStatus } from '../../types'
import s from './kitchen.module.css'

const CANCEL_REASONS = [
  'Item out of stock',
  'Guest changed their mind',
  'Duplicate order from the same table',
  'Kitchen cannot make it tonight',
]

const NEXT: Partial<Record<OrderStatus, { status: OrderStatus; label: string }>> = {
  new: { status: 'accepted', label: 'Accept ticket' },
  accepted: { status: 'preparing', label: 'Start cooking' },
  preparing: { status: 'ready', label: 'Mark ready' },
  ready: { status: 'served', label: 'Mark served' },
}

export function TicketDetail({
  order,
  now,
  onClose,
  onAdvance,
  onCancel,
}: {
  order: Order
  now: number
  onClose: () => void
  onAdvance: (status: OrderStatus) => void
  onCancel: (reason: string) => void
}) {
  useEscape(onClose)
  const [cancelling, setCancelling] = useState(false)
  const next = NEXT[order.status]

  return (
    <>
      <motion.div
        className={s.detailScrim}
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.16 }}
      />
      <motion.aside
        className={s.detail}
        role="dialog"
        aria-modal="true"
        aria-label={`Ticket ${order.reference}`}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 400, damping: 38 }}
      >
        <header className={s.detailHead}>
          <div style={{ flex: 1 }}>
            <p className={s.ticketTable}>Table {order.tableLabel}</p>
            <p className={s.ticketRef}>
              {order.reference} · {elapsedPrecise(order.placedAt, now)} on the pass
            </p>
          </div>
          <Badge tone={order.status === 'cancelled' ? 'danger' : 'accent'}>{order.status}</Badge>
          <Button variant="ghost" size="sm" iconOnly onClick={onClose} aria-label="Close ticket">
            <X size={17} />
          </Button>
        </header>

        <div className={s.detailBody}>
          <div className={s.ticketItems} style={{ padding: 0 }}>
            {order.items.map((line) => (
              <div className={s.ticketLine} key={line.id}>
                <span className={[s.lineQty, line.quantity > 1 ? s.lineQtyMulti : ''].join(' ')}>
                  {line.quantity}
                </span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p className={s.lineName}>{line.name}</p>
                  {line.selectedOptions.length > 0 ? (
                    <p className={s.lineOptions}>
                      {line.selectedOptions
                        .map((o) => `${o.groupName}: ${o.optionName}`)
                        .join(' · ')}
                    </p>
                  ) : null}
                  {line.notes ? (
                    <p className={s.lineNote}>
                      <MessageSquare size={11} style={{ flexShrink: 0, marginTop: 2 }} />
                      {line.notes}
                    </p>
                  ) : null}
                </div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                  {naira(lineUnitPrice(line) * line.quantity)}
                </span>
              </div>
            ))}
          </div>

          {order.note ? (
            <p className={s.ticketNote} style={{ margin: 'var(--space-4) 0 0' }}>
              <MessageSquare size={12} style={{ flexShrink: 0, marginTop: 2 }} />
              {order.note}
            </p>
          ) : null}

          <p className={s.sectionLabel}>Ticket history</p>
          {order.history.map((entry, index) => (
            <div className={s.historyRow} key={`${entry.status}-${index}`}>
              <span className={s.historyDot} />
              <span style={{ fontWeight: 600 }}>{entry.status}</span>
              <span style={{ color: 'var(--text-secondary)' }}>{entry.by}</span>
              <span className={s.historyWhen}>{clockTime(entry.at)}</span>
            </div>
          ))}

          {cancelling ? (
            <>
              <p className={s.sectionLabel}>Why is it being cancelled?</p>
              <div className={s.reasons}>
                {CANCEL_REASONS.map((reason) => (
                  <button key={reason} className={s.reason} onClick={() => onCancel(reason)}>
                    {reason}
                  </button>
                ))}
              </div>
            </>
          ) : null}
        </div>

        <footer className={s.detailFoot}>
          {next ? (
            <Button variant="primary" size="lg" block onClick={() => onAdvance(next.status)}>
              <Check size={16} /> {next.label}
            </Button>
          ) : null}
          {order.status !== 'cancelled' && order.status !== 'served' ? (
            <Button
              variant={cancelling ? 'secondary' : 'dangerQuiet'}
              block
              onClick={() => setCancelling((value) => !value)}
            >
              <Ban size={15} /> {cancelling ? 'Keep this ticket' : 'Cancel order'}
            </Button>
          ) : null}
        </footer>
      </motion.aside>
    </>
  )
}
