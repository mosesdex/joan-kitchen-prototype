import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Bell, Check, ChefHat, ConciergeBell, Flame, Receipt, XCircle } from 'lucide-react'
import { Badge, Button, EmptyState } from '../../components/ui'
import { useToast } from '../../components/Toaster'
import { naira } from '../../lib/money'
import { clockTime, relativeTime } from '../../lib/time'
import { useNow } from '../../lib/hooks'
import { useStore } from '../../store/useStore'
import { lineUnitPrice } from '../../lib/pricing'
import type { Order, OrderStatus } from '../../types'
import s from './flow.module.css'

const STEPS: { status: OrderStatus; name: string; blurb: string; icon: typeof Check }[] = [
  { status: 'new', name: 'Sent to the kitchen', blurb: 'Your order is on the pass waiting to be picked up.', icon: Receipt },
  { status: 'accepted', name: 'Accepted', blurb: 'A chef has taken your ticket.', icon: Check },
  { status: 'preparing', name: 'Cooking', blurb: 'Everything is being made fresh right now.', icon: Flame },
  { status: 'ready', name: 'Ready', blurb: 'Plated and waiting for a server to bring it over.', icon: ChefHat },
  { status: 'served', name: 'Served', blurb: 'Enjoy your meal.', icon: ConciergeBell },
]

export function TrackingScreen({ onBack }: { onBack: () => void }) {
  const sessionOrderIds = useStore((state) => state.sessionOrderIds)
  const orders = useStore((state) => state.orders)
  const callWaiter = useStore((state) => state.callWaiter)
  const toast = useToast()
  const now = useNow(1000)

  const mine = sessionOrderIds
    .map((id) => orders.find((order) => order.id === id))
    .filter((order): order is Order => Boolean(order))

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const order = mine.find((o) => o.id === selectedId) ?? mine[0]

  if (!order) {
    return (
      <div className={s.screen}>
        <header className={s.flowBar}>
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft size={15} /> Menu
          </Button>
          <p className={s.flowTitle}>Your orders</p>
        </header>
        <div className={[s.content, s.contentNarrow].join(' ')}>
          <EmptyState
            icon={<Receipt size={24} />}
            title="No orders yet on this table"
            body="Once you place an order you can follow it here, from the kitchen accepting it to it landing on your table."
            action={
              <Button variant="primary" onClick={onBack}>
                Browse the menu
              </Button>
            }
          />
        </div>
      </div>
    )
  }

  const currentIndex = STEPS.findIndex((step) => step.status === order.status)
  const cancelled = order.status === 'cancelled'

  return (
    <div className={s.screen}>
      <header className={s.flowBar}>
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft size={15} /> Menu
        </Button>
        <p className={s.flowTitle}>Your orders</p>
      </header>

      <div className={s.content}>
        {mine.length > 1 ? (
          <div className={s.orderTabs}>
            {mine.map((candidate) => (
              <button
                key={candidate.id}
                className={[s.orderTab, candidate.id === order.id ? s.orderTabActive : ''].join(' ')}
                onClick={() => setSelectedId(candidate.id)}
              >
                {candidate.reference}
                <Badge tone={candidate.status === 'served' ? 'success' : 'accent'}>
                  {candidate.status}
                </Badge>
              </button>
            ))}
          </div>
        ) : null}

        <div className={s.columns}>
          <section className={s.panel}>
            <div className={s.trackHead}>
              <div>
                <h1 className={s.trackTitle}>
                  {cancelled ? 'This order was cancelled' : order.status === 'served' ? 'Served' : 'On its way'}
                </h1>
                <p className={s.trackSub}>
                  Order {order.reference} · table {order.tableLabel} · placed {relativeTime(order.placedAt, now)}
                </p>
              </div>
              {!cancelled && order.status !== 'served' ? (
                <Badge tone="accent">Ready in about {order.etaMinutes} min</Badge>
              ) : null}
            </div>

            {cancelled ? (
              <div
                style={{
                  display: 'flex',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--danger-bg)',
                  color: 'var(--danger-text)',
                  fontSize: 'var(--text-sm)',
                  lineHeight: 1.55,
                }}
              >
                <XCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>
                  {order.cancelReason ?? 'The kitchen cancelled this order.'} Nothing has been charged —
                  speak to your server if you would like to reorder.
                </span>
              </div>
            ) : (
              <div className={s.stepper}>
                {STEPS.map((step, index) => {
                  const reached = order.history.find((h) => h.status === step.status)
                  const done = index < currentIndex
                  const active = index === currentIndex
                  const Icon = step.icon
                  return (
                    <div className={s.stepRow} key={step.status}>
                      <div className={s.stepRail}>
                        <motion.div
                          className={[
                            s.stepCircle,
                            done ? s.stepCircleDone : '',
                            active ? s.stepCircleActive : '',
                          ].join(' ')}
                          initial={false}
                          animate={{ scale: active ? 1.06 : 1 }}
                          transition={{ type: 'spring', stiffness: 320, damping: 20 }}
                        >
                          {done ? <Check size={15} strokeWidth={3} /> : <Icon size={15} />}
                        </motion.div>
                        {index < STEPS.length - 1 ? (
                          <span className={[s.stepConnector, done ? s.stepConnectorDone : ''].join(' ')} />
                        ) : null}
                      </div>
                      <div className={s.stepContent}>
                        <p className={[s.stepName, done || active ? s.stepNameOn : ''].join(' ')}>
                          {step.name}
                        </p>
                        {reached ? (
                          <p className={s.stepWhen}>
                            {clockTime(reached.at)} · {reached.by}
                          </p>
                        ) : null}
                        {active ? <p className={s.stepBlurb}>{step.blurb}</p> : null}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {!cancelled ? (
              <Button
                variant="secondary"
                block
                disabled={Boolean(order.waiterCalledAt)}
                onClick={() => {
                  callWaiter(order.id)
                  toast.success('A server is on the way', `Table ${order.tableLabel} has been flagged.`)
                }}
              >
                <Bell size={15} />
                {order.waiterCalledAt ? 'A server has been called' : 'Call a server'}
              </Button>
            ) : null}
          </section>

          <aside className={s.panel}>
            <h2 className={s.panelTitle}>What you ordered</h2>
            <p className={s.panelSub}>
              {order.paymentStatus === 'paid'
                ? 'Paid in full'
                : order.paymentMethod === 'pay-at-table'
                  ? 'To be settled at the table'
                  : 'Waiting for payment confirmation'}
            </p>
            {order.items.map((line) => (
              <div className={s.summaryLine} key={line.id}>
                <span className={s.summaryQty}>{line.quantity}</span>
                <div className={s.summaryBody}>
                  <p className={s.summaryName}>{line.name}</p>
                  {line.selectedOptions.length > 0 ? (
                    <p className={s.summaryOptions}>
                      {line.selectedOptions.map((o) => o.optionName).join(' · ')}
                    </p>
                  ) : null}
                  {line.notes ? <p className={s.summaryNote}>“{line.notes}”</p> : null}
                </div>
                <span className={s.summaryPrice}>{naira(lineUnitPrice(line) * line.quantity)}</span>
              </div>
            ))}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: 'var(--space-4)',
                paddingTop: 'var(--space-3)',
                borderTop: '1px solid var(--border)',
                fontSize: 'var(--text-base)',
                fontWeight: 600,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              <span>Total</span>
              <span>{naira(order.totals.total)}</span>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
