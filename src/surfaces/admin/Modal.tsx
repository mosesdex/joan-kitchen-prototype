import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '../../components/ui'
import { useEscape, useScrollLock } from '../../lib/hooks'
import s from './admin.module.css'

export function Modal({
  title,
  onClose,
  children,
  footer,
}: {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}) {
  useScrollLock(true)
  useEscape(onClose)

  return (
    <motion.div
      className={s.modalScrim}
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16 }}
    >
      <motion.div
        className={s.modal}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.99 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      >
        <header className={s.modalHead}>
          <h2 className={s.panelTitle}>{title}</h2>
          <Button variant="ghost" size="sm" iconOnly onClick={onClose} aria-label="Close">
            <X size={17} />
          </Button>
        </header>
        <div className={s.modalBody}>{children}</div>
        {footer ? <footer className={s.modalFoot}>{footer}</footer> : null}
      </motion.div>
    </motion.div>
  )
}

export function ConfirmModal({
  title,
  body,
  confirmLabel = 'Delete',
  onConfirm,
  onClose,
}: {
  title: string
  body: string
  confirmLabel?: string
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Keep it
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        {body}
      </p>
    </Modal>
  )
}
