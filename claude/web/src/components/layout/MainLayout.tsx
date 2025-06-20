import React from 'react'
import { cn } from '@/utils/cn'
import { ThemeToggle } from '@/components/theme/ThemeToggle'

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

function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center px-4">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold">AI Content Studio</h1>
        </div>
        <nav className="ml-auto flex items-center space-x-4">
          <a
            href="/characters"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Characters
          </a>
          <a
            href="/generate"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Generate
          </a>
          <a
            href="/library"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Library
          </a>
          <ThemeToggle />
        </nav>
      </div>
    </header>
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