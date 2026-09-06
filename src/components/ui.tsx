import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { AlertTriangle, Minus, Plus } from 'lucide-react'
import s from './ui.module.css'

const cx = (...parts: (string | false | undefined | null)[]) => parts.filter(Boolean).join(' ')

/* ---------------- button ---------------- */

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dangerQuiet'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  block?: boolean
  loading?: boolean
  iconOnly?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', block, loading, iconOnly, children, className, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cx(
        s.button,
        s[variant],
        size !== 'md' && s[size],
        block && s.block,
        iconOnly && s.iconOnly,
        className,
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <span className={s.spinner} aria-hidden="true" /> : null}
      {children}
    </button>
  )
})

/* ---------------- badge ---------------- */

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info'

const BADGE_TONE: Record<BadgeTone, string> = {
  neutral: s.badgeNeutral,
  accent: s.badgeAccent,
  success: s.badgeSuccess,
  warning: s.badgeWarning,
  danger: s.badgeDanger,
  info: s.badgeInfo,
}

export function Badge({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: BadgeTone
  children: ReactNode
  className?: string
}) {
  return <span className={cx(s.badge, BADGE_TONE[tone], className)}>{children}</span>
}

/* ---------------- skeleton ---------------- */

export function Skeleton({
  width,
  height = 16,
  radius,
  className,
}: {
  width?: number | string
  height?: number | string
  radius?: number | string
  className?: string
}) {
  return (
    <div
      className={cx(s.skeleton, className)}
      style={{ width, height, borderRadius: radius }}
      aria-hidden="true"
    />
  )
}

/* ---------------- empty & error ---------------- */

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode
  title: string
  body?: string
  action?: ReactNode
}) {
  return (
    <div className={s.state}>
      <div className={s.stateIcon}>{icon}</div>
      <p className={s.stateTitle}>{title}</p>
      {body ? <p className={s.stateBody}>{body}</p> : null}
      {action}
    </div>
  )
}

export function ErrorState({
  title = 'Something went wrong',
  body,
  onRetry,
  retryLabel = 'Try again',
}: {
  title?: string
  body?: string
  onRetry?: () => void
  retryLabel?: string
}) {
  return (
    <div className={s.state} role="alert">
      <div className={cx(s.stateIcon, s.stateIconDanger)}>
        <AlertTriangle size={24} />
      </div>
      <p className={s.stateTitle}>{title}</p>
      {body ? <p className={s.stateBody}>{body}</p> : null}
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
    </div>
  )
}

/* ---------------- fields ---------------- */

interface FieldWrap {
  label?: string
  hint?: string
  error?: string
  id?: string
}

export function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
}: FieldWrap & { htmlFor?: string; children: ReactNode }) {
  return (
    <div className={s.field}>
      {label ? (
        <label className={s.label} htmlFor={htmlFor}>
          {label}
        </label>
      ) : null}
      {children}
      {error ? (
        <span className={s.errorText}>
          <AlertTriangle size={12} /> {error}
        </span>
      ) : hint ? (
        <span className={s.hint}>{hint}</span>
      ) : null}
    </div>
  )
}

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(
  function TextInput({ invalid, className, ...rest }, ref) {
    return <input ref={ref} className={cx(s.input, invalid && s.invalid, className)} {...rest} />
  },
)

export const TextArea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }
>(function TextArea({ invalid, className, ...rest }, ref) {
  return <textarea ref={ref} className={cx(s.textarea, invalid && s.invalid, className)} {...rest} />
})

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }>(
  function Select({ invalid, className, children, ...rest }, ref) {
    return (
      <select ref={ref} className={cx(s.select, invalid && s.invalid, className)} {...rest}>
        {children}
      </select>
    )
  },
)

/* ---------------- toggle ---------------- */

/**
 * `label` is visible text beside the switch. When the switch needs an accessible
 * name but no visible label — a toggle inside a table row that already names the
 * thing — pass `ariaLabel` instead.
 */
export function Toggle({
  checked,
  onChange,
  label,
  ariaLabel,
  description,
  disabled,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label?: string
  ariaLabel?: string
  description?: string
  disabled?: boolean
}) {
  return (
    <label className={s.toggleRow} style={disabled ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel ?? label}
        disabled={disabled}
        className={cx(s.toggle, checked && s.toggleOn)}
        onClick={() => !disabled && onChange(!checked)}
      >
        <span className={s.toggleKnob} />
      </button>
      {label || description ? (
        <span>
          {label ? <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{label}</span> : null}
          {description ? (
            <span style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              {description}
            </span>
          ) : null}
        </span>
      ) : null}
    </label>
  )
}

/* ---------------- quantity ---------------- */

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 20,
  label = 'Quantity',
}: {
  value: number
  onChange: (next: number) => void
  min?: number
  max?: number
  label?: string
}) {
  return (
    <div className={s.qty} role="group" aria-label={label}>
      <button
        type="button"
        className={s.qtyBtn}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Decrease quantity"
      >
        <Minus size={16} />
      </button>
      <span className={s.qtyValue} aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className={s.qtyBtn}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Increase quantity"
      >
        <Plus size={16} />
      </button>
    </div>
  )
}

/* ---------------- spice meter ---------------- */

export function SpiceMeter({ level, className }: { level: number; className?: string }) {
  if (level <= 0) return null
  return (
    <span
      className={cx(s.spice, className)}
      title={['', 'Mild', 'Medium', 'Hot'][level] ?? ''}
      aria-label={`Spice level ${level} of 3`}
    >
      {[1, 2, 3].map((n) => (
        <span key={n} className={cx(s.spiceDot, n <= level && s.spiceDotOn)} />
      ))}
    </span>
  )
}

export { s as uiStyles }
