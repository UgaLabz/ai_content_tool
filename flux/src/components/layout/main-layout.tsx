'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Toaster } from '@/components/ui/toaster'
import { Button } from '@/components/ui/button'
import { ImageIcon, Users } from 'lucide-react'

interface MainLayoutProps {
  children: ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname()
  
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/">
                <h1 className="text-2xl font-bold cursor-pointer hover:opacity-80 transition-opacity">
                  Flux Browser
                </h1>
              </Link>
              
              <nav className="flex items-center gap-2">
                <Link href="/generate">
                  <Button
                    variant={pathname === '/generate' ? 'default' : 'ghost'}
                    size="sm"
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Generate
                  </Button>
                </Link>
                
                <Link href="/characters">
                  <Button
                    variant={pathname === '/characters' ? 'default' : 'ghost'}
                    size="sm"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Characters
                  </Button>
                </Link>
              </nav>
            </div>
            
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