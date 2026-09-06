import type { AppEvent, EnvelopedEvent } from './events'

/**
 * The single seam between the prototype and a real backend.
 *
 * `BroadcastChannelAdapter` ships today: it needs no server, works on GitHub
 * Pages, and syncs every browser tab on the same machine in real time. A
 * `SupabaseAdapter` (or any websocket transport) can be dropped in behind this
 * same interface without a single screen changing.
 */
export interface SyncAdapter {
  readonly name: string
  /** Send a locally-produced event to every other surface. */
  publish(event: AppEvent): void
  /** Receive events produced elsewhere. Returns an unsubscribe function. */
  subscribe(handler: (event: AppEvent) => void): () => void
  close(): void
}

const CHANNEL = 'joan-kitchen-sync'

export const SOURCE_ID = Math.random().toString(36).slice(2, 10)

export class BroadcastChannelAdapter implements SyncAdapter {
  readonly name = 'broadcast-channel'
  private channel: BroadcastChannel | null = null
  private handlers = new Set<(event: AppEvent) => void>()

  constructor() {
    if (typeof BroadcastChannel === 'undefined') return
    this.channel = new BroadcastChannel(CHANNEL)
    this.channel.onmessage = (message: MessageEvent<EnvelopedEvent>) => {
      const data = message.data
      if (!data || data.sourceId === SOURCE_ID) return
      this.handlers.forEach((handler) => handler(data.event))
    }
  }

  publish(event: AppEvent) {
    this.channel?.postMessage({ sourceId: SOURCE_ID, event, at: Date.now() } satisfies EnvelopedEvent)
  }

  subscribe(handler: (event: AppEvent) => void) {
    this.handlers.add(handler)
    return () => {
      this.handlers.delete(handler)
    }
  }

  close() {
    this.handlers.clear()
    this.channel?.close()
    this.channel = null
  }
}

/** Used in tests and in environments without BroadcastChannel. */
export class NullSyncAdapter implements SyncAdapter {
  readonly name = 'null'
  publish() {}
  subscribe() {
    return () => {}
  }
  close() {}
}

export function createSyncAdapter(): SyncAdapter {
  return typeof BroadcastChannel === 'undefined'
    ? new NullSyncAdapter()
    : new BroadcastChannelAdapter()
}
