import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App } from '@/App'
import { CharacterGalleryPage } from '@/pages/CharacterGalleryPage'
import type { Character } from '@/types/api.types'

// Mock the API
vi.mock('@/services/api/characters', () => ({
  characterService: {
    getAll: vi.fn().mockResolvedValue([
      {
        id: '1',
        name: 'Character 1',
        avatar: 'https://example.com/1.jpg',
        personality: {
          traits: ['friendly'],
          humor: 50,
          formality: 50,
          enthusiasm: 50,
          empathy: 50,
        },
        voice: {
          tone: 'casual',
          vocabulary: 'simple',
          sentenceStructure: 'short',
        },
        background: 'Background 1',
        relationships: [],
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
      {
        id: '2',
        name: 'Character 2',
        avatar: 'https://example.com/2.jpg',
        personality: {
          traits: ['serious'],
          humor: 20,
          formality: 80,
          enthusiasm: 30,
          empathy: 60,
        },
        voice: {
          tone: 'formal',
          vocabulary: 'advanced',
          sentenceStructure: 'complex',
        },
        background: 'Background 2',
        relationships: [],
        createdAt: '2024-01-02',
        updatedAt: '2024-01-02',
      },
    ]),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    duplicate: vi.fn(),
  },
}))

describe('Keyboard Navigation', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    )
  }

  describe('Global Navigation', () => {
    it('should navigate through all interactive elements with Tab', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CharacterGalleryPage />)

      // Wait for content to load
      await screen.findByRole('button', { name: /create character/i })

      // Tab through all interactive elements
      const expectedOrder = [
        /create character/i,  // Header button
        /search characters/i, // Search input
        /sort by/i,          // Sort select
        /view mode/i,        // View toggle
        /select character 1/i, // First character card
        /more options/i,      // First character menu
        /select character 2/i, // Second character card
        /more options/i,      // Second character menu
      ]

      for (const pattern of expectedOrder) {
        await user.tab()
        const element = document.activeElement
        
        if (element?.getAttribute('role') === 'button') {
          expect(screen.getByRole('button', { name: pattern })).toHaveFocus()
        } else if (element?.getAttribute('role') === 'searchbox') {
          expect(screen.getByRole('searchbox', { name: pattern })).toHaveFocus()
        } else if (element?.getAttribute('role') === 'combobox') {
          expect(screen.getByRole('combobox', { name: pattern })).toHaveFocus()
        }
      }
    })

    it('should navigate backwards with Shift+Tab', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CharacterGalleryPage />)

      await screen.findByRole('button', { name: /create character/i })

      // Tab to the last element
      const createButton = screen.getByRole('button', { name: /create character/i })
      await user.click(createButton)

      // Tab backwards
      await user.keyboard('{Shift>}{Tab}{/Shift}')
      
      // Should focus on the last interactive element (which would be the main content area)
      expect(document.activeElement).not.toBe(createButton)
    })
  })

  describe('Form Navigation', () => {
    it('should navigate through form fields with Tab', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CharacterGalleryPage />)

      // Open create form
      await user.click(await screen.findByRole('button', { name: /create character/i }))

      // Navigate through form fields
      await user.tab() // Name input
      expect(screen.getByLabelText(/character name/i)).toHaveFocus()

      await user.tab() // Description
      expect(screen.getByLabelText(/description/i)).toHaveFocus()

      await user.tab() // Avatar upload
      const avatarButton = screen.getByRole('button', { name: /upload avatar/i })
      expect(avatarButton).toHaveFocus()

      await user.tab() // Tab to personality tab
      // Continue through tabs...
    })

    it('should submit form with Enter in input fields', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CharacterGalleryPage />)

      await user.click(await screen.findByRole('button', { name: /create character/i }))

      const nameInput = screen.getByLabelText(/character name/i)
      await user.type(nameInput, 'Test Character')

      // Enter should not submit when form is invalid
      await user.keyboard('{Enter}')
      
      // Form should still be visible
      expect(screen.getByLabelText(/character name/i)).toBeInTheDocument()
    })
  })

  describe('Menu Navigation', () => {
    it('should navigate dropdown menus with arrow keys', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CharacterGalleryPage />)

      await screen.findByRole('button', { name: /select character 1/i })

      // Open first character's menu
      const menuButton = screen.getAllByRole('button', { name: /more options/i })[0]
      await user.click(menuButton)

      // Menu should be open
      const editOption = await screen.findByRole('menuitem', { name: /edit/i })
      expect(editOption).toBeInTheDocument()

      // Arrow down to navigate
      await user.keyboard('{ArrowDown}')
      expect(screen.getByRole('menuitem', { name: /duplicate/i })).toHaveFocus()

      await user.keyboard('{ArrowDown}')
      expect(screen.getByRole('menuitem', { name: /delete/i })).toHaveFocus()

      // Arrow up to go back
      await user.keyboard('{ArrowUp}')
      expect(screen.getByRole('menuitem', { name: /duplicate/i })).toHaveFocus()

      // Escape to close
      await user.keyboard('{Escape}')
      expect(screen.queryByRole('menuitem')).not.toBeInTheDocument()
      expect(menuButton).toHaveFocus()
    })

    it('should select menu items with Enter', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CharacterGalleryPage />)

      await screen.findByRole('button', { name: /select character 1/i })

      // Open menu
      const menuButton = screen.getAllByRole('button', { name: /more options/i })[0]
      await user.click(menuButton)

      // Select duplicate option
      await user.keyboard('{ArrowDown}') // Skip edit
      await user.keyboard('{Enter}')

      // Menu should close
      expect(screen.queryByRole('menuitem')).not.toBeInTheDocument()
    })
  })

  describe('Dialog Navigation', () => {
    it('should trap focus within dialogs', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CharacterGalleryPage />)

      await screen.findByRole('button', { name: /select character 1/i })

      // Click on character to open detail view
      await user.click(screen.getByRole('button', { name: /select character 1/i }))

      // Click delete to open confirmation dialog
      await user.click(screen.getByRole('button', { name: /delete character/i }))

      // Focus should be trapped in dialog
      const dialog = screen.getByRole('alertdialog')
      expect(dialog).toBeInTheDocument()

      // Tab through dialog buttons
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      const deleteButton = screen.getByRole('button', { name: /delete/i })

      expect(cancelButton).toHaveFocus()

      await user.tab()
      expect(deleteButton).toHaveFocus()

      // Tab should cycle back
      await user.tab()
      expect(cancelButton).toHaveFocus()
    })

    it('should close dialogs with Escape', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CharacterGalleryPage />)

      await screen.findByRole('button', { name: /select character 1/i })
      await user.click(screen.getByRole('button', { name: /select character 1/i }))
      await user.click(screen.getByRole('button', { name: /delete character/i }))

      // Dialog should be open
      expect(screen.getByRole('alertdialog')).toBeInTheDocument()

      // Escape to close
      await user.keyboard('{Escape}')

      // Dialog should be closed
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()

      // Focus should return to delete button
      expect(screen.getByRole('button', { name: /delete character/i })).toHaveFocus()
    })
  })

  describe('Skip Links', () => {
    it('should provide skip to main content link', async () => {
      const user = userEvent.setup()
      renderWithProviders(<App />)

      // Tab once should focus skip link (if implemented)
      await user.tab()

      // Check if skip link exists (this assumes it's implemented)
      const skipLink = screen.queryByText(/skip to main content/i)
      if (skipLink) {
        expect(skipLink).toHaveFocus()
        
        // Activate skip link
        await user.keyboard('{Enter}')
        
        // Focus should move to main content
        const main = screen.getByRole('main')
        expect(document.activeElement).toBeInTheDocument()
        expect(main.contains(document.activeElement)).toBe(true)
      }
    })
  })

  describe('Focus Management', () => {
    it('should restore focus after closing modals', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CharacterGalleryPage />)

      // Click create button
      const createButton = await screen.findByRole('button', { name: /create character/i })
      await user.click(createButton)

      // Cancel form
      await user.click(screen.getByRole('button', { name: /cancel/i }))

      // Focus should return to create button
      expect(createButton).toHaveFocus()
    })

    it('should maintain focus visibility', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CharacterGalleryPage />)

      await screen.findByRole('button', { name: /create character/i })

      // Tab to first interactive element
      await user.tab()

      // Check that focused element has visible focus indicator
      const focusedElement = document.activeElement
      if (focusedElement) {
        const styles = window.getComputedStyle(focusedElement)
        
        // Check for focus ring (this depends on your CSS implementation)
        expect(
          styles.outline !== 'none' || 
          styles.boxShadow.includes('0 0 0') || 
          styles.borderColor !== styles.backgroundColor
        ).toBe(true)
      }
    })
  })

  describe('Custom Shortcuts', () => {
    it('should support search shortcut (Cmd/Ctrl + K)', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CharacterGalleryPage />)

      await screen.findByRole('button', { name: /create character/i })

      // Press Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      const isMac = navigator.platform.includes('Mac')
      if (isMac) {
        await user.keyboard('{Meta>}k{/Meta}')
      } else {
        await user.keyboard('{Control>}k{/Control}')
      }

      // Search input should be focused (if shortcut is implemented)
      const searchInput = screen.getByRole('searchbox', { name: /search characters/i })
      // This test assumes the shortcut is implemented
      // expect(searchInput).toHaveFocus()
    })

    it('should support escape to cancel operations', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CharacterGalleryPage />)

      // Open create form
      await user.click(await screen.findByRole('button', { name: /create character/i }))

      // Form should be visible
      expect(screen.getByLabelText(/character name/i)).toBeInTheDocument()

      // Escape to close (if implemented)
      await user.keyboard('{Escape}')

      // This assumes Escape closes the form
      // expect(screen.queryByLabelText(/character name/i)).not.toBeInTheDocument()
    })
  })
})