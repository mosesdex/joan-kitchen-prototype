import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

/**
 * jsdom implements neither the media, layout nor audio APIs the surfaces use.
 * These stubs exist so a render smoke test can mount a whole surface; they are
 * not stand-ins for behaviour, and nothing asserts against them.
 */

if (!('matchMedia' in window)) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  })
}

if (!('ResizeObserver' in globalThis)) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
}

if (!('BroadcastChannel' in globalThis)) {
  globalThis.BroadcastChannel = class {
    onmessage: ((event: MessageEvent) => void) | null = null
    postMessage() {}
    close() {}
    addEventListener() {}
    removeEventListener() {}
  } as unknown as typeof BroadcastChannel
}

if (!('AudioContext' in window)) {
  Object.defineProperty(window, 'AudioContext', {
    writable: true,
    value: class {
      state = 'running'
      currentTime = 0
      destination = {}
      resume() {}
      createOscillator() {
        return {
          type: '',
          frequency: { setValueAtTime() {} },
          connect() {
            return this
          },
          start() {},
          stop() {},
        }
      }
      createGain() {
        return {
          gain: { setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} },
          connect() {
            return this
          },
        }
      }
    },
  })
}
