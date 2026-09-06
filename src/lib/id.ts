const ALPHABET = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ'

/** Collision-resistant enough for a prototype, readable in the UI. */
export function makeId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 9)
  return `${prefix}_${Date.now().toString(36)}${rand}`
}

/** Guest-facing order reference, e.g. JK-4821. */
export function makeOrderReference(): string {
  let n = ''
  for (let i = 0; i < 4; i += 1) n += Math.floor(Math.random() * 10)
  return `JK-${n}`
}

/** Bank transfer reference shown on the payment screen. */
export function makeBankReference(): string {
  let s = ''
  for (let i = 0; i < 8; i += 1) {
    s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  }
  return s
}

export function makePairingCode(): string {
  let s = ''
  for (let i = 0; i < 4; i += 1) {
    s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  }
  return s
}
