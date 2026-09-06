import { motion } from 'framer-motion'
import { Check, HandCoins, Plus, Radio } from 'lucide-react'
import { Badge, Button } from '../../components/ui'
import { naira } from '../../lib/money'
import type { Order } from '../../types'
import s from './flow.module.css'
import { FlowBar } from './CheckoutScreen'

export function ConfirmationScreen({
  order,
  onTrack,
  onAddMore,
}: {
  order: Order
  onTrack: () => void
  onAddMore: () => void
}) {
  const payAtTable = order.paymentMethod === 'pay-at-table'

  return (
    <div className={s.screen}>
      <FlowBar title="Order confirmed" step={3} />
      <div className={[s.content, s.contentNarrow].join(' ')}>
        <motion.div
          className={s.confirm}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            className={s.confirmMark}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.08, type: 'spring', stiffness: 320, damping: 18 }}
          >
            <Check size={38} strokeWidth={2.5} />
          </motion.div>

          <h1 className={s.confirmTitle}>The kitchen has your order</h1>
          <p className={s.confirmSub}>
            {payAtTable
              ? `Your server will bring the bill to table ${order.tableLabel} before you leave.`
              : 'Payment received. We will bring everything out as soon as it is ready.'}
          </p>

          <div className={s.confirmMeta}>
            <div className={s.metaTile}>
              <p className={s.metaTileLabel}>Order</p>
              <p className={s.metaTileValue}>{order.reference}</p>
            </div>
            <div className={s.metaTile}>
              <p className={s.metaTileLabel}>Table</p>
              <p className={s.metaTileValue}>{order.tableLabel}</p>
            </div>
            <div className={s.metaTile}>
              <p className={s.metaTileLabel}>Ready in about</p>
              <p className={s.metaTileValue}>{order.etaMinutes} min</p>
            </div>
            <div className={s.metaTile}>
              <p className={s.metaTileLabel}>Total</p>
              <p className={s.metaTileValue}>{naira(order.totals.total)}</p>
            </div>
          </div>

          {payAtTable ? (
            <Badge tone="warning" className="num">
              <HandCoins size={11} /> Unpaid — settle at the table
            </Badge>
          ) : (
            <Badge tone="success">
              <Check size={11} /> Paid by transfer
            </Badge>
          )}

          <div className={s.confirmActions} style={{ marginTop: 'var(--space-8)' }}>
            <Button variant="primary" size="lg" onClick={onTrack}>
              <Radio size={16} /> Track this order
            </Button>
            <Button variant="secondary" size="lg" onClick={onAddMore}>
              <Plus size={16} /> Add something else
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
