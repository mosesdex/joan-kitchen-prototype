import { AnimatePresence, motion } from 'framer-motion'
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { AlertTriangle, Bell, Check } from 'lucide-react'
import s from './ui.module.css'

type ToastTone = 'success' | 'error' | 'accent'

interface Toast {
  id: number
  tone: ToastTone
  title: string
  detail?: string
}

interface ToastApi {
  push: (toast: Omit<Toast, 'id'>) => void
  success: (title: string, detail?: string) => void
  error: (title: string, detail?: string) => void
  info: (title: string, detail?: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)

const ICONS: Record<ToastTone, ReactNode> = {
  success: <Check size={18} />,
  error: <AlertTriangle size={18} />,
  accent: <Bell size={18} />,
}

const TONE_CLASS: Record<ToastTone, string> = {
  success: s.toastSuccess,
  error: s.toastError,
  accent: s.toastAccent,
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(1)

  const push = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = nextId.current++
    setToasts((current) => [...current.slice(-2), { ...toast, id }])
    setTimeout(() => setToasts((current) => current.filter((t) => t.id !== id)), 4200)
  }, [])

  const api = useMemo<ToastApi>(
    () => ({
      push,
      success: (title, detail) => push({ tone: 'success', title, detail }),
      error: (title, detail) => push({ tone: 'error', title, detail }),
      info: (title, detail) => push({ tone: 'accent', title, detail }),
    }),
    [push],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className={s.toastRegion} role="status" aria-live="polite">
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              className={[s.toast, TONE_CLASS[toast.tone]].join(' ')}
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className={s.toastIcon}>{ICONS[toast.tone]}</span>
              <span className={s.toastBody}>
                <span className={s.toastTitle}>{toast.title}</span>
                {toast.detail ? <span className={s.toastDetail}>{toast.detail}</span> : null}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside <ToastProvider>')
  return context
}
