import React from 'react'
import { cn } from '@/utils/cn'
import { Header } from './Header'

interface MainLayoutProps {
  children: React.ReactNode
  className?: string
}

export function MainLayout({ children, className }: MainLayoutProps) {
  return (
    <div className={cn('min-h-screen bg-background', className)}>
      <Header />
      <main className="container mx-auto px-4 py-8">{children}</main>
      <Footer />
    </div>
  )
}


function Footer() {
  return (
    <footer className="border-t py-6 md:py-0">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 md:h-16 md:flex-row">
        <p className="text-sm text-muted-foreground">
          © 2025 AI Content Studio. All rights reserved.
        </p>
      </div>
    </footer>
  )
}