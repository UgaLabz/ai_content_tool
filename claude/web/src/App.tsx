import { useState } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { CharacterGalleryPage } from '@/pages/CharacterGalleryPage'
import { ToastContainer } from '@/components/ui/Toast'
import { useToast } from '@/hooks/useToast'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { PerformanceMonitor } from '@/components/dev/PerformanceMonitor'

function App() {
  const { toasts, dismiss } = useToast()
  const [currentPage] = useState<'gallery'>('gallery')

  return (
    <ErrorBoundary>
      <MainLayout>
        <ErrorBoundary>
          {currentPage === 'gallery' && <CharacterGalleryPage />}
        </ErrorBoundary>
      </MainLayout>
      <ToastContainer toasts={toasts} onClose={dismiss} />
      <PerformanceMonitor />
    </ErrorBoundary>
  )
}

export default App