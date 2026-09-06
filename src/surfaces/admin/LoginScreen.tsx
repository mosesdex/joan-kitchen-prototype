import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, LockKeyhole, ShieldAlert } from 'lucide-react'
import { Button, Field, TextInput } from '../../components/ui'
import { dishImage } from '../../data/images'
import { fakeRequest } from '../../lib/latency'
import { useStore } from '../../store/useStore'
import s from './admin.module.css'

const initials = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')

/**
 * Mock authentication. Credentials are listed on screen because this is a
 * prototype — production replaces this with a real session and never ships a
 * PIN in the client.
 */
export function LoginScreen() {
  const staff = useStore((state) => state.staff)
  const settings = useStore((state) => state.settings)
  const signIn = useStore((state) => state.signIn)

  const [email, setEmail] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (event?: React.FormEvent) => {
    event?.preventDefault()
    setError(null)
    const user = staff.find((candidate) => candidate.email.toLowerCase() === email.trim().toLowerCase())

    if (!user) {
      setError('No account with that email address.')
      return
    }
    if (!user.active) {
      setError('That account has been deactivated. Ask the owner to reactivate it.')
      return
    }
    if (user.pin !== pin.trim()) {
      setError('That PIN is not right.')
      return
    }

    setBusy(true)
    try {
      await fakeRequest(null, { min: 500, max: 900 })
      signIn(user.id)
    } catch {
      setError('We could not reach the server. Try again.')
    } finally {
      setBusy(false)
    }
  }

  const quickSignIn = (userEmail: string, userPin: string) => {
    setEmail(userEmail)
    setPin(userPin)
    setError(null)
  }

  return (
    <div className={s.login}>
      <div className={s.loginArt}>
        <img src={dishImage('restaurant', 1200)} alt="" />
        <div className={s.loginVeil}>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className={s.loginArtTitle}>{settings.name} back office</h1>
            <p className={s.loginArtBody}>
              Menu, tables, orders, payments, people and reports — everything behind the pass, in one
              place.
            </p>
          </motion.div>
        </div>
      </div>

      <div className={s.loginPanel}>
        <div className={s.loginHead}>
          <h2 className={s.loginTitle}>Sign in</h2>
          <p className={s.loginSub}>Use your staff email and the PIN the owner gave you.</p>
        </div>

        <form className={s.loginForm} onSubmit={submit}>
          <Field label="Email" error={error ?? undefined} htmlFor="admin-email">
            <TextInput
              id="admin-email"
              type="email"
              autoComplete="username"
              value={email}
              invalid={Boolean(error)}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="joan@joankitchen.ng"
            />
          </Field>

          <Field label="PIN" htmlFor="admin-pin">
            <TextInput
              id="admin-pin"
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              value={pin}
              invalid={Boolean(error)}
              onChange={(event) => setPin(event.target.value)}
              placeholder="4 digits"
              maxLength={4}
            />
          </Field>

          <Button variant="primary" size="lg" type="submit" loading={busy} block>
            <LockKeyhole size={16} /> Sign in <ArrowRight size={16} />
          </Button>
        </form>

        <div className={s.demoAccounts}>
          <p
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: 'var(--space-3)',
            }}
          >
            <ShieldAlert size={13} /> Prototype accounts — tap one to fill the form
          </p>
          {staff
            .filter((user) => user.active)
            .slice(0, 4)
            .map((user) => (
              <button
                key={user.id}
                className={s.demoAccount}
                type="button"
                onClick={() => quickSignIn(user.email, user.pin)}
              >
                <span className={s.avatar}>{initials(user.name)}</span>
                <span style={{ flex: 1 }}>
                  <span className={s.userName} style={{ display: 'block' }}>
                    {user.name}
                  </span>
                  <span className={s.userRole}>
                    {user.role} · {user.email}
                  </span>
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                  {user.pin}
                </span>
              </button>
            ))}
        </div>
      </div>
    </div>
  )
}
