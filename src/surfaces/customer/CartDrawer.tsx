import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, MessageSquare, ShoppingBag, Trash2, X } from 'lucide-react'
import { DishImage } from '../../components/DishImage'
import { Button, EmptyState, Field, QuantityStepper, TextArea } from '../../components/ui'
import { useEscape, useScrollLock } from '../../lib/hooks'
import { naira } from '../../lib/money'
import { calculateTotals, lineUnitPrice } from '../../lib/pricing'
import { useStore } from '../../store/useStore'
import s from './sheets.module.css'

export function CartDrawer({ onClose, onCheckout }: { onClose: () => void; onCheckout: () => void }) {
  useScrollLock(true)
  useEscape(onClose)

  const cart = useStore((state) => state.cart)
  const cartNote = useStore((state) => state.cartNote)
  const setCartNote = useStore((state) => state.setCartNote)
  const updateCartItem = useStore((state) => state.updateCartItem)
  const removeCartItem = useStore((state) => state.removeCartItem)
  const settings = useStore((state) => state.settings)
  const tableLabel = useStore(
    (state) => state.tables.find((t) => t.id === state.activeTableId)?.label ?? '—',
  )

  const totals = calculateTotals(cart, settings)

  return (
    <>
      <motion.div
        className={s.scrim}
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
      />
      <motion.aside
        className={s.drawer}
        role="dialog"
        aria-modal="true"
        aria-label="Your order"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 38 }}
      >
        <header className={s.drawerHead}>
          <h2 className={s.drawerTitle}>Your order</h2>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Table {tableLabel}</span>
          <Button variant="ghost" size="sm" iconOnly onClick={onClose} aria-label="Close order">
            <X size={17} />
          </Button>
        </header>

        <div className={s.drawerScroll}>
          {cart.length === 0 ? (
            <EmptyState
              icon={<ShoppingBag size={24} />}
              title="Nothing added yet"
              body="Tap any dish on the menu to choose your options and add it here."
              action={
                <Button variant="secondary" onClick={onClose}>
                  Back to the menu
                </Button>
              }
            />
          ) : (
            <AnimatePresence initial={false}>
              {cart.map((line) => (
                <motion.div
                  key={line.id}
                  className={s.line}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0, marginTop: 0, paddingTop: 0, paddingBottom: 0 }}
                  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                >
                  <DishImage
                    photoKey={line.imageUrl}
                    tone={line.imageTone}
                    name={line.name}
                    width={160}
                    height={160}
                    className={s.lineImage}
                  />
                  <div className={s.lineBody}>
                    <div className={s.lineTop}>
                      <span className={s.lineName}>{line.name}</span>
                      <span className={s.linePrice}>{naira(lineUnitPrice(line) * line.quantity)}</span>
                    </div>
                    {line.selectedOptions.length > 0 ? (
                      <p className={s.lineOptions}>
                        {line.selectedOptions.map((o) => o.optionName).join(' · ')}
                      </p>
                    ) : null}
                    {line.notes ? (
                      <p className={s.lineNote}>
                        <MessageSquare size={12} style={{ flexShrink: 0, marginTop: 2 }} />
                        {line.notes}
                      </p>
                    ) : null}
                    <div className={s.lineActions}>
                      <QuantityStepper
                        value={line.quantity}
                        onChange={(quantity) => updateCartItem(line.id, { quantity })}
                        label={`Quantity of ${line.name}`}
                      />
                      <button
                        className={s.lineRemove}
                        onClick={() => removeCartItem(line.id)}
                        aria-label={`Remove ${line.name}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {cart.length > 0 ? (
          <footer className={s.drawerFooter}>
            <div className={s.noteField}>
              <Field label="Note for the whole table" htmlFor="cart-note">
                <TextArea
                  id="cart-note"
                  value={cartNote}
                  maxLength={240}
                  onChange={(event) => setCartNote(event.target.value)}
                  placeholder="Serve the soups together. We are celebrating a birthday."
                  style={{ minHeight: 64 }}
                />
              </Field>
            </div>

            <div className={s.totals}>
              <div className={s.totalRow}>
                <span>Subtotal</span>
                <span>{naira(totals.subtotal)}</span>
              </div>
              <div className={s.totalRow}>
                <span>VAT ({settings.vatRate}%)</span>
                <span>{naira(totals.vat)}</span>
              </div>
              <div className={s.totalRow}>
                <span>Service charge ({settings.serviceChargeRate}%)</span>
                <span>{naira(totals.serviceCharge)}</span>
              </div>
              <div className={[s.totalRow, s.totalRowGrand].join(' ')}>
                <span>Total</span>
                <span>{naira(totals.total)}</span>
              </div>
            </div>

            <Button variant="primary" size="lg" block onClick={onCheckout}>
              Review and pay <ArrowRight size={17} />
            </Button>
          </footer>
        ) : null}
      </motion.aside>
    </>
  )
}
