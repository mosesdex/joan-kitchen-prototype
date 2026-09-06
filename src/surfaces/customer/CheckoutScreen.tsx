import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Banknote, Check, HandCoins, MessageSquare, ShieldCheck } from 'lucide-react'
import { Button, ErrorState } from '../../components/ui'
import { useToast } from '../../components/Toaster'
import { fakeRequest } from '../../lib/latency'
import { naira } from '../../lib/money'
import { calculateTotals, lineUnitPrice } from '../../lib/pricing'
import { useStore } from '../../store/useStore'
import type { Order, PaymentMethod } from '../../types'
import s from './flow.module.css'

const METHODS: {
  id: PaymentMethod
  name: string
  description: string
  icon: typeof Banknote
}[] = [
  {
    id: 'bank-transfer',
    name: 'Bank transfer',
    description:
      'We show you an account number and the exact amount. Transfer from your bank app and we confirm it here.',
    icon: Banknote,
  },
  {
    id: 'pay-at-table',
    name: 'Pay at the table',
    description:
      'Your order goes to the kitchen now and your server settles the bill with you before you leave.',
    icon: HandCoins,
  },
]

export function CheckoutScreen({
  onBack,
  onPlaced,
}: {
  onBack: () => void
  onPlaced: (order: Order, method: PaymentMethod) => void
}) {
  const cart = useStore((state) => state.cart)
  const cartNote = useStore((state) => state.cartNote)
  const settings = useStore((state) => state.settings)
  const placeOrder = useStore((state) => state.placeOrder)
  const tableLabel = useStore(
    (state) => state.tables.find((t) => t.id === state.activeTableId)?.label ?? '—',
  )
  const toast = useToast()

  const [method, setMethod] = useState<PaymentMethod>('bank-transfer')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totals = calculateTotals(cart, settings)

  const submit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      await fakeRequest(null, { min: 500, max: 1100 })
      const order = placeOrder(method)
      onPlaced(order, method)
    } catch {
      setError('We could not reach the kitchen. Your order has not been sent.')
      toast.error('Order not sent', 'Check the connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (error) {
    return (
      <div className={s.screen}>
        <FlowBar title="Checkout" step={1} onBack={onBack} />
        <div className={[s.content, s.contentNarrow].join(' ')}>
          <ErrorState
            title="Your order did not go through"
            body={error}
            onRetry={submit}
            retryLabel="Send it again"
          />
        </div>
      </div>
    )
  }

  return (
    <div className={s.screen}>
      <FlowBar title="Checkout" step={1} onBack={onBack} />
      <motion.div
        className={s.content}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className={s.columns}>
          <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
            <section className={s.panel}>
              <h2 className={s.panelTitle}>How would you like to pay?</h2>
              <p className={s.panelSub}>Either way, the kitchen starts as soon as you place the order.</p>
              <div className={s.methods}>
                {METHODS.map((option) => {
                  const Icon = option.icon
                  const on = option.id === method
                  return (
                    <button
                      key={option.id}
                      className={[s.method, on ? s.methodOn : ''].join(' ')}
                      onClick={() => setMethod(option.id)}
                      role="radio"
                      aria-checked={on}
                    >
                      <span className={s.methodIcon}>
                        <Icon size={18} />
                      </span>
                      <span style={{ flex: 1 }}>
                        <span className={s.methodName} style={{ display: 'block' }}>
                          {option.name}
                        </span>
                        <span className={s.methodDesc} style={{ display: 'block' }}>
                          {option.description}
                        </span>
                      </span>
                      <span className={s.methodMark}>{on ? <Check size={12} strokeWidth={3} /> : null}</span>
                    </button>
                  )
                })}
              </div>
            </section>

            <section className={s.panel}>
              <h2 className={s.panelTitle}>Your order</h2>
              <p className={s.panelSub}>Table {tableLabel}</p>
              {cart.map((line) => (
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
              {cartNote ? (
                <p
                  style={{
                    display: 'flex',
                    gap: 7,
                    marginTop: 'var(--space-4)',
                    padding: 'var(--space-3)',
                    borderRadius: 'var(--radius)',
                    background: 'var(--warning-bg)',
                    color: 'var(--warning-text)',
                    fontSize: 'var(--text-xs)',
                    lineHeight: 1.5,
                  }}
                >
                  <MessageSquare size={13} style={{ flexShrink: 0, marginTop: 2 }} />
                  {cartNote}
                </p>
              ) : null}
            </section>
          </div>

          <aside className={s.panel} style={{ position: 'sticky', top: 88 }}>
            <h2 className={s.panelTitle}>Bill</h2>
            <p className={s.panelSub}>Prices include everything below.</p>
            <div style={{ display: 'grid', gap: 8, marginBottom: 'var(--space-5)' }}>
              <Row label="Subtotal" value={naira(totals.subtotal)} />
              <Row label={`VAT (${settings.vatRate}%)`} value={naira(totals.vat)} />
              <Row label={`Service charge (${settings.serviceChargeRate}%)`} value={naira(totals.serviceCharge)} />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: 'var(--space-3)',
                  borderTop: '1px solid var(--border)',
                  fontSize: 'var(--text-lg)',
                  fontWeight: 600,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                <span>Total</span>
                <span>{naira(totals.total)}</span>
              </div>
            </div>

            <Button variant="primary" size="lg" block loading={submitting} onClick={submit}>
              {submitting
                ? 'Sending to the kitchen…'
                : method === 'bank-transfer'
                  ? 'Place order and pay'
                  : 'Send to the kitchen'}
            </Button>

            <p
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginTop: 'var(--space-4)',
                fontSize: 'var(--text-2xs)',
                color: 'var(--text-muted)',
                lineHeight: 1.5,
              }}
            >
              <ShieldCheck size={13} style={{ flexShrink: 0 }} />
              Prototype only — no real payment is taken and no card details are ever collected.
            </p>
          </aside>
        </div>
      </motion.div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 'var(--text-sm)',
        color: 'var(--text-secondary)',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}

export function FlowBar({
  title,
  step,
  onBack,
  backLabel = 'Back',
}: {
  title: string
  step: 1 | 2 | 3
  onBack?: () => void
  backLabel?: string
}) {
  const steps = ['Review', 'Pay', 'Confirmed']
  return (
    <header className={s.flowBar}>
      {onBack ? (
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft size={15} /> {backLabel}
        </Button>
      ) : null}
      <p className={s.flowTitle}>{title}</p>
      <div className={s.steps}>
        {steps.map((name, index) => {
          const position = index + 1
          const done = position < step
          const current = position === step
          return (
            <div
              key={name}
              className={[s.step, done ? s.stepDone : '', current ? s.stepCurrent : ''].join(' ')}
            >
              <span className={s.stepDot}>{done ? <Check size={11} strokeWidth={3} /> : position}</span>
              {name}
              {position < steps.length ? <span className={s.stepBar} /> : null}
            </div>
          )
        })}
      </div>
    </header>
  )
}
