import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { Shell } from '../app/App'
import { ToastProvider } from '../components/Toaster'
import { useStore } from '../store/useStore'

/**
 * A render smoke test per surface.
 *
 * This exists because of a real escape: a Zustand selector that filtered an
 * array returned a new reference on every call, which spun React into an
 * infinite render loop. It surfaced only in the production build, as a blank
 * page — the dev server tolerated it. Mounting each surface catches that whole
 * class of bug before it reaches a reviewer.
 */

function mountAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ToastProvider>
        <Shell />
      </ToastProvider>
    </MemoryRouter>,
  )
}

afterEach(cleanup)

describe('surfaces mount', () => {
  it('customer app shows the table gate before a table is chosen', () => {
    useStore.getState().setActiveTable(null)
    mountAt('/')
    expect(screen.getByText(/which table are you on/i)).toBeInTheDocument()
  })

  it('customer app shows the menu once a table is bound', () => {
    const store = useStore.getState()
    store.setActiveTable(store.tables[0].id)
    mountAt('/')
    expect(screen.getByLabelText(/search the menu/i)).toBeInTheDocument()
    useStore.getState().setActiveTable(null)
  })

  it('kitchen display renders the ticket board', () => {
    mountAt('/kitchen')
    expect(screen.getByText(/kitchen display/i)).toBeInTheDocument()
    expect(screen.getByText(/preparing/i)).toBeInTheDocument()
  })

  it('reviewer hub renders without looping', () => {
    mountAt('/demo')
    expect(screen.getByText(/joan kitchen ordering system/i)).toBeInTheDocument()
  })

  it('an unknown route falls back to the customer app', () => {
    useStore.getState().setActiveTable(null)
    mountAt('/not-a-real-route')
    expect(screen.getByText(/which table are you on/i)).toBeInTheDocument()
  })
})
