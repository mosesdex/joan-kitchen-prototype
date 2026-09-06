import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Copy, Timer } from 'lucide-react'
import { Button, ErrorState } from '../../components/ui'
import { useToast } from '../../components/Toaster'
import { fakeRequest } from '../../lib/latency'
import { naira } from '../../lib/money'
import { playSoftPing } from '../../lib/sound'
import { useStore } from '../../store/useStore'
import type { Order } from '../../types'
import { FlowBar } from './CheckoutScreen'
import s from './flow.module.css'

type Stage = 'instructions' | 'verifying' | 'failed'

const WINDOW_SECONDS = 15 * 60

/**
 * Bank transfer is the dominant rail for this kind of restaurant, so the
 * prototype models it properly: fixed amount, unique reference, a window, and a
 * confirmation step the guest triggers once they have sent the money.
 */
export function PaymentScreen({ order, onPaid }: { order: Order; onPaid: () => void }) {
  const settings = useStore((state) => state.settings)
  const payment = useStore((state) => state.payments.find((p) => p.id === order.paymentId))
  const setPaymentStatus = useStore((state) => state.setPaymentStatus)
  const soundEnabled = useStore((state) => state.soundEnabled)
  const toast = useToast()

  const [stage, setStage] = useState<Stage>('instructions')
  const [remaining, setRemaining] = useState(WINDOW_SECONDS)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    const id = setInterval(() => setRemaining((value) => Math.max(0, value - 1)), 1000)
    return () => clearInterval(id)
  }, [])

  const copy = async (value: string, field: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(field)
      setTimeout(() => setCopied(null), 1600)
    } catch {
      toast.error('Could not copy', 'Copy it manually from the screen.')
    }
  }

  const confirm = async () => {
    setStage('verifying')
    try {
      await fakeRequest(null, { min: 1800, max: 3000 })
      if (payment) setPaymentStatus(payment.id, 'paid')
      if (soundEnabled) playSoftPing()
      toast.success('Payment confirmed', `${naira(order.totals.total)} received.`)
      onPaid()
    } catch {
      setStage('failed')
    }
  }

  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60

  return (
    <div className={s.screen}>
      <FlowBar title="Pay by transfer" step={2} />
      <motion.div
        className={[s.content, s.contentNarrow].join(' ')}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        {stage === 'failed' ? (
          <ErrorState
            title="We could not confirm that transfer"
            body="Nothing has been taken. Your order is already with the kitchen — try confirming again, or ask your server to settle it at the table."
            onRetry={confirm}
            retryLabel="Check again"
          />
        ) : stage === 'verifying' ? (
          <div className={s.verifying}>
            <div className={s.verifyRing} />
            <div>
              <h2 className={s.panelTitle}>Checking with the bank</h2>
              <p className={s.panelSub} style={{ marginBottom: 0 }}>
                This usually takes a few seconds. Do not close this screen.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className={s.transferCard}>
              <div className={s.transferAmount}>
                <p className={s.transferAmountLabel}>Transfer exactly</p>
                <p className={s.transferAmountValue}>{naira(order.totals.total)}</p>
              </div>
              <TransferRow label="Bank" value={settings.bankName} />
              <TransferRow
                label="Account number"
                value={settings.bankAccountNumber}
                onCopy={() => copy(settings.bankAccountNumber, 'account')}
                copied={copied === 'account'}
              />
              <TransferRow label="Account name" value={settings.bankAccountName} />
              <TransferRow
                label="Reference"
                value={payment?.reference ?? order.reference}
                onCopy={() => copy(payment?.reference ?? order.reference, 'reference')}
                copied={copied === 'reference'}
              />
            </div>

            <p className={s.countdown}>
              <Timer size={13} />
              {remaining > 0
                ? `Hold this table for ${minutes}:${seconds.toString().padStart(2, '0')}`
                : 'The transfer window has passed — your server can settle it instead'}
            </p>

            <div style={{ marginTop: 'var(--space-6)', display: 'grid', gap: 'var(--space-3)' }}>
              <Button variant="primary" size="lg" block onClick={confirm}>
                I have sent the transfer
              </Button>
              <p
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-muted)',
                  textAlign: 'center',
                  lineHeight: 1.55,
                }}
              >
                Order {order.reference} is already with the kitchen. Nothing is charged in this
                prototype — pressing the button simulates a confirmed transfer.
              </p>
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}

function TransferRow({
  label,
  value,
  onCopy,
  copied,
}: {
  label: string
  value: string
  onCopy?: () => void
  copied?: boolean
}) {
  return (
    <div className={s.transferRow}>
      <span className={s.transferLabel}>{label}</span>
      <span className={s.transferValue}>{value}</span>
      {onCopy ? (
        <button className={s.copyBtn} onClick={onCopy} aria-label={`Copy ${label.toLowerCase()}`}>
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      ) : null}
    </div>
  )
}
