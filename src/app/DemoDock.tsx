import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import { ChefHat, LayoutDashboard, RotateCcw, Settings2, Tablet, WifiOff, X } from 'lucide-react'
import { Button, Toggle } from '../components/ui'
import { useToast } from '../components/Toaster'
import { setSimulatedFailureRate } from '../lib/latency'
import { useSurfacePresent } from '../store/presence'
import { useStore } from '../store/useStore'
import s from './DemoDock.module.css'

const SURFACES = [
  { path: '/', name: 'Customer iPad', hint: 'Browse, order, pay, track', icon: Tablet },
  { path: '/kitchen', name: 'Kitchen display', hint: 'Live ticket board', icon: ChefHat },
  { path: '/admin', name: 'Admin dashboard', hint: 'Menu, tables, reports', icon: LayoutDashboard },
]

/**
 * Reviewer controls, present on every surface. Kept deliberately small and
 * collapsed — it is scaffolding for the review, not part of the product.
 */
export function DemoDock() {
  const [open, setOpen] = useState(false)
  const [failures, setFailures] = useState(false)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const toast = useToast()
  const autoKitchen = useStore((state) => state.autoKitchen)
  const setAutoKitchen = useStore((state) => state.setAutoKitchen)
  const soundEnabled = useStore((state) => state.soundEnabled)
  const setSoundEnabled = useStore((state) => state.setSoundEnabled)
  const resetDemo = useStore((state) => state.resetDemo)
  const kitchenOpen = useSurfacePresent('kitchen')

  const isActive = (path: string) =>
    path === '/' ? pathname === '/' : pathname.startsWith(path)

  return (
    <div className={s.dock}>
      <AnimatePresence mode="wait" initial={false}>
        {open ? (
          <motion.div
            key="panel"
            className={s.panel}
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className={s.head}>
              <p className={s.title}>Prototype controls</p>
              <button className={s.close} onClick={() => setOpen(false)} aria-label="Close controls">
                <X size={15} />
              </button>
            </div>
            <p className={s.lede}>
              Open two surfaces in separate tabs — an order placed on the iPad appears on the kitchen
              board immediately.
            </p>

            <p className={s.sectionLabel}>Surfaces</p>
            <div className={s.surfaces}>
              {SURFACES.map((surface) => {
                const Icon = surface.icon
                const active = isActive(surface.path)
                return (
                  <button
                    key={surface.path}
                    className={[s.surface, active ? s.surfaceActive : ''].join(' ')}
                    onClick={() => {
                      navigate(surface.path)
                      setOpen(false)
                    }}
                  >
                    <span className={s.surfaceIcon}>
                      <Icon size={15} />
                    </span>
                    <span>
                      <span className={s.surfaceName}>{surface.name}</span>
                      <span className={s.surfaceHint} style={{ display: 'block' }}>
                        {surface.hint}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>

            <div className={s.controls}>
              <div className={s.row}>
                <span>
                  <span className={s.rowLabel}>Auto kitchen</span>
                  <span className={s.rowHint} style={{ display: 'block' }}>
                    {kitchenOpen
                      ? 'A kitchen tab is open — auto is standing down.'
                      : 'Advances tickets so tracking works with one tab.'}
                  </span>
                </span>
                <Toggle checked={autoKitchen} onChange={setAutoKitchen} label="Auto kitchen" />
              </div>

              <div className={s.row}>
                <span>
                  <span className={s.rowLabel}>Kitchen sound</span>
                  <span className={s.rowHint} style={{ display: 'block' }}>
                    Chime on each new ticket.
                  </span>
                </span>
                <Toggle checked={soundEnabled} onChange={setSoundEnabled} label="Kitchen sound" />
              </div>

              <div className={s.row}>
                <span>
                  <span className={s.rowLabel}>Force network errors</span>
                  <span className={s.rowHint} style={{ display: 'block' }}>
                    Makes every request fail, to show error states.
                  </span>
                </span>
                <Toggle
                  checked={failures}
                  onChange={(next) => {
                    setFailures(next)
                    setSimulatedFailureRate(next ? 1 : 0)
                    toast.info(
                      next ? 'Network failures on' : 'Network failures off',
                      next ? 'Every request will now fail until you switch this back.' : undefined,
                    )
                  }}
                  label="Force network errors"
                />
              </div>

              <Button
                variant="secondary"
                size="sm"
                block
                onClick={() => {
                  resetDemo()
                  navigate('/')
                  setOpen(false)
                  toast.success('Demo data reset', 'Menu, tables and orders are back to the seed.')
                }}
              >
                <RotateCcw size={14} /> Reset demo data
              </Button>

              <p className={s.statusLine}>
                {failures ? (
                  <>
                    <WifiOff size={11} /> simulating offline
                  </>
                ) : (
                  <>
                    <span className={s.live} /> live sync across tabs
                  </>
                )}
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="trigger"
            className={s.trigger}
            onClick={() => setOpen(true)}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.16 }}
          >
            <span className={s.dot} />
            <Settings2 size={13} />
            Prototype
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
