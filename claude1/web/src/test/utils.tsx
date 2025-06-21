import type { ReactElement } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '@/components/theme/ThemeProvider'

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  theme?: 'light' | 'dark' | 'system'
}

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider defaultTheme="light" storageKey="test-theme">
      {children}
    </ThemeProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: CustomRenderOptions
) => {
  const user = userEvent.setup()
  const utils = render(ui, { wrapper: AllTheProviders, ...options })
  return { ...utils, user }
}

// re-export everything
export * from '@testing-library/react'
export { customRender as render }