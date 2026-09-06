/**
 * The kitchen bell is synthesised with WebAudio rather than shipped as an audio
 * file — no binary in the repo, no CDN request, and the pitch can be tuned in
 * code. Browsers require a user gesture before audio plays; the kitchen screen
 * primes the context on the first interaction.
 */

let context: AudioContext | null = null

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  if (!context) context = new Ctor()
  return context
}

export function primeAudio() {
  const ctx = getContext()
  if (ctx?.state === 'suspended') void ctx.resume()
}

function tone(ctx: AudioContext, frequency: number, startAt: number, duration: number, gain: number) {
  const osc = ctx.createOscillator()
  const amp = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(frequency, startAt)
  amp.gain.setValueAtTime(0, startAt)
  amp.gain.linearRampToValueAtTime(gain, startAt + 0.012)
  amp.gain.exponentialRampToValueAtTime(0.0001, startAt + duration)
  osc.connect(amp).connect(ctx.destination)
  osc.start(startAt)
  osc.stop(startAt + duration + 0.05)
}

/** Two-note chime for a new ticket. Cuts through kitchen noise without being shrill. */
export function playNewOrderChime() {
  const ctx = getContext()
  if (!ctx) return
  if (ctx.state === 'suspended') void ctx.resume()
  const now = ctx.currentTime
  tone(ctx, 880, now, 0.32, 0.16)
  tone(ctx, 1318.5, now + 0.13, 0.42, 0.13)
}

/** Softer single note for status changes and guest-side confirmations. */
export function playSoftPing() {
  const ctx = getContext()
  if (!ctx) return
  if (ctx.state === 'suspended') void ctx.resume()
  tone(ctx, 660, ctx.currentTime, 0.22, 0.08)
}
