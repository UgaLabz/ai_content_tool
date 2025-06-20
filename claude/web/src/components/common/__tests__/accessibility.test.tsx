import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { EmptyState } from '../EmptyState'
import { ErrorBoundary } from '../ErrorBoundary'
import { Users, AlertTriangle } from 'lucide-react'

describe('Common Components Accessibility', () => {
  describe('EmptyState', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <EmptyState
          icon={<Users className="h-12 w-12" />}
          title="No items"
          description="Create your first item"
          action={<button>Create Item</button>}
        />
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper heading structure', () => {
      render(
        <EmptyState
          icon={<Users className="h-12 w-12" />}
          title="No items"
          description="Create your first item"
        />
      )

      expect(screen.getByRole('heading', { level: 3, name: /no items/i })).toBeInTheDocument()
      expect(screen.getByText(/create your first item/i)).toBeInTheDocument()
    })

    it('should properly associate icon with content', () => {
      render(
        <EmptyState
          icon={<Users className="h-12 w-12" aria-label="Users icon" />}
          title="No users"
          description="Add users to get started"
        />
      )

      const icon = screen.getByLabelText(/users icon/i)
      expect(icon).toBeInTheDocument()
    })
  })

  describe('ErrorBoundary', () => {
    // Mock console.error for these tests
    const originalError = console.error
    beforeEach(() => {
      console.error = vi.fn()
    })
    afterEach(() => {
      console.error = originalError
    })

    const ThrowError = () => {
      throw new Error('Test error')
    }

    it('should have no accessibility violations in error state', async () => {
      const { container } = render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should display error information accessibly', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      // Should have alert role for screen readers
      const errorCard = screen.getByRole('article')
      expect(errorCard).toBeInTheDocument()

      // Should have proper heading
      expect(screen.getByRole('heading', { name: /something went wrong/i })).toBeInTheDocument()

      // Should have action buttons
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument()
    })

    it('should handle keyboard navigation in error state', async () => {
      const user = userEvent.setup()
      
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      // Tab to first button
      await user.tab()
      expect(screen.getByRole('button', { name: /try again/i })).toHaveFocus()

      // Tab to second button
      await user.tab()
      expect(screen.getByRole('button', { name: /reload page/i })).toHaveFocus()
    })

    it('should reset error state accessibly', async () => {
      const user = userEvent.setup()
      let shouldThrow = true

      const ConditionalError = () => {
        if (shouldThrow) throw new Error('Test error')
        return <div>Content loaded successfully</div>
      }

      const { rerender } = render(
        <ErrorBoundary>
          <ConditionalError />
        </ErrorBoundary>
      )

      // Verify error state
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()

      // Click try again
      shouldThrow = false
      await user.click(screen.getByRole('button', { name: /try again/i }))

      // Rerender to trigger state update
      rerender(
        <ErrorBoundary>
          <ConditionalError />
        </ErrorBoundary>
      )

      // Should show content
      expect(screen.getByText(/content loaded successfully/i)).toBeInTheDocument()
    })

    it('should show error details in development mode', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      // Should have collapsible error details
      const detailsElement = screen.getByText(/error details/i).closest('details')
      expect(detailsElement).toBeInTheDocument()

      // Details should be keyboard accessible
      const summary = within(detailsElement!).getByText(/error details/i)
      expect(summary).toHaveAttribute('tabindex', '0')

      process.env.NODE_ENV = originalEnv
    })
  })
})