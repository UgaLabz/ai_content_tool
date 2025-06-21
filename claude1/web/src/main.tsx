import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import { QueryProvider } from '@/providers/QueryProvider'
import { initWebVitals } from '@/utils/webVitals'

// Initialize Web Vitals monitoring
initWebVitals()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryProvider>
      <ThemeProvider defaultTheme="system">
        <App />
      </ThemeProvider>
    </QueryProvider>
  </StrictMode>,
)