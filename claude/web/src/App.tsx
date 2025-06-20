import { useState } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { CharacterGalleryPage } from '@/pages/CharacterGalleryPage'
import { ToastContainer } from '@/components/ui/Toast'
import { useToast } from '@/hooks/useToast'

function App() {
  const { toasts, dismiss } = useToast()
  const [currentPage] = useState<'gallery'>('gallery')

  return (
    <>
      <MainLayout>
        {currentPage === 'gallery' && <CharacterGalleryPage />}
      </MainLayout>
      <ToastContainer toasts={toasts} onClose={dismiss} />
    </>
  )
}

export default App