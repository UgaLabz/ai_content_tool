import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { MainLayout } from '@/components/layout/MainLayout'
import { CharacterGalleryPage } from '@/pages/CharacterGalleryPage'
import { CharacterDetailPage } from '@/pages/CharacterDetailPage'
import { GenerationPage } from '@/pages/GenerationPage'
import { ToastContainer } from '@/components/ui/Toast'
import { useToast } from '@/hooks/useToast'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { PerformanceMonitor } from '@/components/dev/PerformanceMonitor'

function App() {
  const { toasts, dismiss } = useToast()

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <MainLayout>
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Navigate to="/characters" replace />} />
              <Route path="/characters" element={<CharacterGalleryPage />} />
              <Route path="/characters/:id" element={<CharacterDetailPage />} />
              <Route path="/generate" element={<GenerationPage />} />
              <Route path="*" element={<Navigate to="/characters" replace />} />
            </Routes>
          </ErrorBoundary>
        </MainLayout>
        <ToastContainer toasts={toasts} onClose={dismiss} />
        <PerformanceMonitor />
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App