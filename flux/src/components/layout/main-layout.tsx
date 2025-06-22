'use client'

import { ReactNode } from 'react'
import { Toaster } from '@/components/ui/toaster'

interface MainLayoutProps {
  children: ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Flux Browser</h1>
            <div className="text-sm text-muted-foreground">
              AI Image Generation
            </div>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
      
      <Toaster />
    </div>
  )
}