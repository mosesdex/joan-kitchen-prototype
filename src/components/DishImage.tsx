import { useState } from 'react'
import { dishImage, photoAlt } from '../data/images'
import type { MenuItem } from '../types'
import styles from './DishImage.module.css'

const TONE_CLASS: Record<MenuItem['imageTone'], string> = {
  ember: styles.ember,
  clay: styles.clay,
  palm: styles.palm,
  gold: styles.gold,
  char: styles.char,
  cream: styles.cream,
}

interface Props {
  photoKey: string
  tone: MenuItem['imageTone']
  name: string
  width?: number
  height?: number
  className?: string
  /** Rendered over the image, e.g. an unavailable veil or a badge row. */
  children?: React.ReactNode
  eager?: boolean
}

/**
 * Dish photography with a designed fallback. If the remote photo fails — offline
 * review, blocked CDN — the tile still reads as a deliberate piece of the menu
 * rather than a broken image.
 */
export function DishImage({
  photoKey,
  tone,
  name,
  width = 640,
  height,
  className,
  children,
  eager = false,
}: Props) {
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const src = dishImage(photoKey, width, height)
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()

  return (
    <div className={[styles.frame, TONE_CLASS[tone], className].filter(Boolean).join(' ')}>
      {!failed && src ? (
        <img
          className={[styles.image, loaded ? styles.loaded : ''].join(' ')}
          src={src}
          alt={photoAlt(photoKey, name)}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      ) : null}
      {(failed || !loaded) && (
        <div className={styles.fallback} aria-hidden="true">
          <span className={styles.initials}>{initials}</span>
        </div>
      )}
      {children}
    </div>
  )
}
