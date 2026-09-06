import { motion } from 'framer-motion'
import { ArrowRight, ChefHat, Info, LayoutDashboard, Tablet } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAnnouncePresence } from '../store/presence'
import { useStore } from '../store/useStore'
import s from './DemoHub.module.css'

const SURFACES = [
  {
    to: '/',
    icon: Tablet,
    title: 'Customer iPad',
    body: 'Pick a table, browse the menu, customise a dish, pay by transfer or at the table, then follow the order live.',
  },
  {
    to: '/kitchen',
    icon: ChefHat,
    title: 'Kitchen display',
    body: 'Ticket board with ageing timers, sound on every new order, and accept / cook / ready / served bumps.',
  },
  {
    to: '/admin',
    icon: LayoutDashboard,
    title: 'Admin dashboard',
    body: 'Menu and table management, order and payment records, staff permissions, sales reports and settings.',
  },
]

const STEPS = [
  {
    title: 'Open the customer iPad and place an order',
    body: 'Choose any table, add a dish or two, and check out. Bank transfer shows the full confirmation flow; pay at the table sends it through unpaid.',
  },
  {
    title: 'Open the kitchen display in a second tab',
    body: 'The order appears there within a second of being placed — no refresh. Bump it through accepted, preparing and ready, and watch the customer tracking screen follow along in the first tab.',
  },
  {
    title: 'Change something in admin and see it land',
    body: 'Mark a dish unavailable in Menu, then look at the customer iPad — it is greyed out immediately. Change the service charge in Settings and the next bill uses it.',
  },
  {
    title: 'Try the failure states',
    body: 'Open the Prototype panel in the bottom-left corner and switch on “force network errors”, then try to place an order. Reset the demo data from the same panel whenever you want a clean restaurant.',
  },
]

export function DemoHub() {
  useAnnouncePresence('hub')
  const staff = useStore((state) => state.staff.filter((user) => user.active).slice(0, 3))

  return (
    <div className={s.page}>
      <motion.div
        className={s.inner}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
      >
        <span className={s.eyebrow}>
          <Info size={11} /> Interactive prototype
        </span>
        <h1 className={s.title}>Joan Kitchen ordering system</h1>
        <p className={s.lede}>
          Three connected surfaces built as one prototype: the iPad on the table, the display on the
          pass, and the back office. Everything here is clickable and the surfaces talk to each other
          in real time — place an order in one browser tab and it appears on the kitchen board in
          another.
        </p>

        <div className={s.cards}>
          {SURFACES.map((surface) => {
            const Icon = surface.icon
            return (
              <Link className={s.card} to={surface.to} key={surface.to}>
                <span className={s.cardIcon}>
                  <Icon size={20} />
                </span>
                <span className={s.cardTitle}>{surface.title}</span>
                <span className={s.cardBody}>{surface.body}</span>
                <span className={s.cardLink}>
                  Open <ArrowRight size={13} />
                </span>
              </Link>
            )
          })}
        </div>

        <section className={s.section}>
          <h2 className={s.sectionTitle}>What to try</h2>
          <div className={s.steps}>
            {STEPS.map((step, index) => (
              <div className={s.step} key={step.title}>
                <span className={s.stepNumber}>{index + 1}</span>
                <div>
                  <p className={s.stepTitle}>{step.title}</p>
                  <p className={s.stepBody}>{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={s.section}>
          <h2 className={s.sectionTitle}>Admin sign-in</h2>
          <div className={s.credList}>
            {staff.map((user) => (
              <div className={s.cred} key={user.id}>
                <span style={{ flex: 1 }}>{user.email}</span>
                <span>PIN {user.pin}</span>
                <span style={{ textTransform: 'capitalize', color: 'var(--text-muted)' }}>{user.role}</span>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 'var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            Roles differ — the kitchen account sees far less of the back office than the owner does.
          </p>
        </section>

        <div className={s.note}>
          <Info size={17} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>
            This is a design prototype, not the production system. There is no server and no
            database: state lives in your browser and syncs between tabs on this machine only. No
            real payment is processed and no card details are ever collected.
          </span>
        </div>
      </motion.div>
    </div>
  )
}
