import { Suspense, lazy, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import { Loading } from './components/ui/Loading'
import ErrorBoundary from './components/ErrorBoundary'
import { ToastProvider } from './components/ui/Toast'
import { useStore } from './store/useStore'

const MapPage = lazy(() => import('./pages/MapPage'))
const AiPage = lazy(() => import('./pages/AiPage'))
const CommunityPage = lazy(() => import('./pages/CommunityPage'))
const CommunityPostDetailPage = lazy(() => import('./pages/CommunityPage/PostDetailPage'))
const PetPage = lazy(() => import('./pages/PetPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))

function Boot() {
  const hydrate = useStore((s) => s.hydrateFromStorage)
  useEffect(() => {
    hydrate()
  }, [hydrate])
  return null
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <Boot />
        <Suspense fallback={<Loading variant="shimmer" />}>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<Navigate to="/ai" replace />} />
              <Route path="map" element={<MapPage />} />
              <Route path="ai" element={<AiPage />} />
              <Route path="ai/:mode" element={<AiPage />} />
              <Route path="community" element={<CommunityPage />} />
              <Route path="community/:postId" element={<CommunityPostDetailPage />} />
              <Route path="pet" element={<PetPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/ai" replace />} />
            </Route>
          </Routes>
        </Suspense>
      </ToastProvider>
    </ErrorBoundary>
  )
}
