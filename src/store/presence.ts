import { useEffect, useState } from 'react'

/**
 * Lightweight presence so the customer surface knows whether a real kitchen
 * display is watching. If one is, orders wait for a human to bump them; if not,
 * the auto-kitchen advances them so a solo reviewer still sees tracking work.
 */

const CHANNEL = 'joan-kitchen-presence'
const HEARTBEAT_MS = 2000
const STALE_MS = 6000

type Surface = 'customer' | 'kitchen' | 'admin' | 'hub'

interface Heartbeat {
  surface: Surface
  id: string
  at: number
}

const selfId = Math.random().toString(36).slice(2, 10)

/** Announce this tab on the presence channel for as long as it is mounted. */
export function useAnnouncePresence(surface: Surface) {
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return
    const channel = new BroadcastChannel(CHANNEL)
    const beat = () =>
      channel.postMessage({ surface, id: selfId, at: Date.now() } satisfies Heartbeat)
    beat()
    const id = setInterval(beat, HEARTBEAT_MS)
    return () => {
      clearInterval(id)
      channel.close()
    }
  }, [surface])
}

/** True while at least one tab of `surface` has beaten recently. */
export function useSurfacePresent(surface: Surface): boolean {
  const [lastSeen, setLastSeen] = useState(0)

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return
    const channel = new BroadcastChannel(CHANNEL)
    channel.onmessage = (event: MessageEvent<Heartbeat>) => {
      if (event.data?.surface === surface && event.data.id !== selfId) {
        setLastSeen(event.data.at)
      }
    }
    return () => channel.close()
  }, [surface])

  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 2000)
    return () => clearInterval(id)
  }, [])

  return Date.now() - lastSeen < STALE_MS
}
