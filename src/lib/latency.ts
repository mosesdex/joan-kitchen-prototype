/**
 * The prototype fakes network latency so loading states are real rather than
 * theoretical, and can be forced to fail so error states are demonstrable.
 * Both are driven from the demo control panel.
 */

let failureRate = 0
let latencyScale = 1

export function setSimulatedFailureRate(rate: number) {
  failureRate = Math.min(1, Math.max(0, rate))
}

export function setLatencyScale(scale: number) {
  latencyScale = Math.max(0, scale)
}

export function getSimulatedFailureRate() {
  return failureRate
}

export class SimulatedNetworkError extends Error {
  constructor(message = 'Network request failed. Check the connection and try again.') {
    super(message)
    this.name = 'SimulatedNetworkError'
  }
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms * latencyScale))
}

/**
 * Wraps a value in a fake round trip: 300–900ms by default, and a rejection
 * whenever the injected failure rate fires.
 */
export async function fakeRequest<T>(
  value: T | (() => T),
  { min = 300, max = 900, canFail = true }: { min?: number; max?: number; canFail?: boolean } = {},
): Promise<T> {
  await delay(min + Math.random() * (max - min))
  if (canFail && failureRate > 0 && Math.random() < failureRate) {
    throw new SimulatedNetworkError()
  }
  return typeof value === 'function' ? (value as () => T)() : value
}
