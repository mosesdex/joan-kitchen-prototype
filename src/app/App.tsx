import { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { ToastProvider } from '../components/Toaster'
import { connectSync } from '../store/useStore'
import { CustomerApp } from '../surfaces/customer/CustomerApp'
import { KitchenApp } from '../surfaces/kitchen/KitchenApp'
import { DemoHub } from './DemoHub'
import { DemoDock } from './DemoDock'
import { SurfaceSkeleton } from './SurfaceSkeleton'

/*
 * Admin is the only surface that pulls in the charting library, and a guest at a
 * table will never open it — so it loads on demand rather than in the bundle the
 * iPad downloads.
 */
const AdminApp = lazy(() =>
  import('../surfaces/admin/AdminApp').then((module) => ({ default: module.AdminApp })),
)

/** Customer and kitchen run dark; admin runs light. */
function ThemeController() {
  const { pathname } = useLocation()
  useEffect(() => {
    const theme = pathname.startsWith('/admin') ? 'light' : 'dark'
    document.documentElement.dataset.theme = theme
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'light' ? '#FAF8F5' : '#12100E')
  }, [pathname])
  return null
}

function Shell() {
  return (
    <>
      <ThemeController />
      <Routes>
        <Route path="/" element={<CustomerApp />} />
        <Route path="/kitchen" element={<KitchenApp />} />
        <Route
          path="/admin/*"
          element={
            <Suspense fallback={<SurfaceSkeleton />}>
              <AdminApp />
            </Suspense>
          }
        />
        <Route path="/demo" element={<DemoHub />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <DemoDock />
    </>
  )
}

export function App() {
  useEffect(() => connectSync(), [])

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ToastProvider>
        <Shell />
      </ToastProvider>
    </BrowserRouter>
  )
}
