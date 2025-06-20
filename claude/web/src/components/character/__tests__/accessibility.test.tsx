import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { CharacterCard } from '../CharacterCard'
import { CharacterGallery } from '../CharacterGallery'
import { CharacterCreatorForm } from '../CharacterCreatorForm'
import { CharacterDetailView } from '../CharacterDetailView'
import type { Character } from '@/types/api.types'

const mockCharacter: Character = {
  id: '1',
  name: 'Test Character',
  avatar: 'https://example.com/avatar.jpg',
  personality: {
    traits: ['friendly', 'helpful'],
    humor: 50,
    formality: 50,
    enthusiasm: 75,
    empathy: 75,
  },
  voice: {
    tone: 'casual',
    vocabulary: 'simple',
    sentenceStructure: 'short',
  },
  background: 'Test background',
  relationships: [],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

describe('Character Components Accessibility', () => {
  describe('CharacterCard', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <CharacterCard
          character={mockCharacter}
          onSelect={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onDuplicate={vi.fn()}
        />
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper ARIA labels', () => {
      render(
        <CharacterCard
          character={mockCharacter}
          onSelect={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onDuplicate={vi.fn()}
        />
      )

      expect(screen.getByRole('button', { name: /select test character/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /more options/i })).toBeInTheDocument()
    })

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup()
      const onSelect = vi.fn()
      const onEdit = vi.fn()

      render(
        <CharacterCard
          character={mockCharacter}
          onSelect={onSelect}
          onEdit={onEdit}
          onDelete={vi.fn()}
          onDuplicate={vi.fn()}
        />
      )

      // Tab to card
      await user.tab()
      expect(screen.getByRole('button', { name: /select test character/i })).toHaveFocus()

      // Enter to select
      await user.keyboard('{Enter}')
      expect(onSelect).toHaveBeenCalledWith(mockCharacter)

      // Tab to menu button
      await user.tab()
      expect(screen.getByRole('button', { name: /more options/i })).toHaveFocus()

      // Open menu
      await user.keyboard('{Enter}')
      expect(screen.getByRole('menuitem', { name: /edit/i })).toBeInTheDocument()

      // Navigate menu with arrow keys
      await user.keyboard('{ArrowDown}')
      expect(screen.getByRole('menuitem', { name: /duplicate/i })).toHaveFocus()
    })

    it('should have proper focus management', async () => {
      const user = userEvent.setup()
      render(
        <CharacterCard
          character={mockCharacter}
          onSelect={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onDuplicate={vi.fn()}
        />
      )

      // Open menu
      await user.click(screen.getByRole('button', { name: /more options/i }))
      
      // Focus should be in menu
      expect(screen.getByRole('menuitem', { name: /edit/i })).toBeInTheDocument()

      // Escape closes menu and returns focus
      await user.keyboard('{Escape}')
      expect(screen.getByRole('button', { name: /more options/i })).toHaveFocus()
    })
  })

  describe('CharacterGallery', () => {
    const mockCharacters = [
      mockCharacter,
      { ...mockCharacter, id: '2', name: 'Another Character' },
    ]

    it('should have no accessibility violations', async () => {
      const { container } = render(
        <CharacterGallery
          characters={mockCharacters}
          onCharacterSelect={vi.fn()}
          onCharacterEdit={vi.fn()}
          onCharacterDelete={vi.fn()}
          onCharacterDuplicate={vi.fn()}
        />
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper grid semantics', () => {
      render(
        <CharacterGallery
          characters={mockCharacters}
          onCharacterSelect={vi.fn()}
          onCharacterEdit={vi.fn()}
          onCharacterDelete={vi.fn()}
          onCharacterDuplicate={vi.fn()}
        />
      )

      const gallery = screen.getByRole('region', { name: /character gallery/i })
      expect(gallery).toBeInTheDocument()

      // Should have search
      expect(screen.getByRole('searchbox', { name: /search characters/i })).toBeInTheDocument()

      // Should have sort options
      expect(screen.getByRole('combobox', { name: /sort by/i })).toBeInTheDocument()
    })

    it('should announce search results', async () => {
      const user = userEvent.setup()
      render(
        <CharacterGallery
          characters={mockCharacters}
          onCharacterSelect={vi.fn()}
          onCharacterEdit={vi.fn()}
          onCharacterDelete={vi.fn()}
          onCharacterDuplicate={vi.fn()}
        />
      )

      const searchInput = screen.getByRole('searchbox', { name: /search characters/i })
      await user.type(searchInput, 'test')

      // Check for live region announcement
      const liveRegion = screen.getByRole('status')
      expect(liveRegion).toHaveTextContent(/1 character found/i)
    })

    it('should support keyboard navigation between cards', async () => {
      const user = userEvent.setup()
      const onSelect = vi.fn()

      render(
        <CharacterGallery
          characters={mockCharacters}
          onCharacterSelect={onSelect}
          onCharacterEdit={vi.fn()}
          onCharacterDelete={vi.fn()}
          onCharacterDuplicate={vi.fn()}
        />
      )

      // Tab through gallery controls and cards
      await user.tab() // Search
      await user.tab() // Sort
      await user.tab() // View toggle
      await user.tab() // First card

      const firstCard = screen.getByRole('button', { name: /select test character/i })
      expect(firstCard).toHaveFocus()

      // Tab to second card
      await user.tab() // First card menu
      await user.tab() // Second card
      
      const secondCard = screen.getByRole('button', { name: /select another character/i })
      expect(secondCard).toHaveFocus()
    })
  })

  describe('CharacterCreatorForm', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <CharacterCreatorForm
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper form labels', () => {
      render(
        <CharacterCreatorForm
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />
      )

      // Check all form fields have labels
      expect(screen.getByLabelText(/character name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/personality traits/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/humor level/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/formality level/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/enthusiasm level/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/empathy level/i)).toBeInTheDocument()
    })

    it('should show validation errors accessibly', async () => {
      const user = userEvent.setup()
      render(
        <CharacterCreatorForm
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />
      )

      // Submit empty form
      await user.click(screen.getByRole('button', { name: /create character/i }))

      // Check error messages are associated with fields
      const nameInput = screen.getByLabelText(/character name/i)
      expect(nameInput).toHaveAttribute('aria-invalid', 'true')
      expect(nameInput).toHaveAttribute('aria-describedby')

      const errorId = nameInput.getAttribute('aria-describedby')
      expect(document.getElementById(errorId!)).toHaveTextContent(/name must be at least/i)
    })

    it('should have keyboard-accessible sliders', async () => {
      const user = userEvent.setup()
      render(
        <CharacterCreatorForm
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />
      )

      const humorSlider = screen.getByRole('slider', { name: /humor level/i })
      
      // Focus slider
      await user.click(humorSlider)
      expect(humorSlider).toHaveFocus()

      // Arrow keys should change value
      const initialValue = humorSlider.getAttribute('aria-valuenow')
      await user.keyboard('{ArrowRight}')
      expect(humorSlider.getAttribute('aria-valuenow')).not.toBe(initialValue)

      // Should announce value
      expect(humorSlider).toHaveAttribute('aria-valuemin', '0')
      expect(humorSlider).toHaveAttribute('aria-valuemax', '100')
      expect(humorSlider).toHaveAttribute('aria-valuenow')
    })

    it('should navigate through tabs with keyboard', async () => {
      const user = userEvent.setup()
      render(
        <CharacterCreatorForm
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />
      )

      // Tab to tabs list
      const tabsList = screen.getByRole('tablist')
      const basicTab = within(tabsList).getByRole('tab', { name: /basic info/i })
      const personalityTab = within(tabsList).getByRole('tab', { name: /personality/i })
      const voiceTab = within(tabsList).getByRole('tab', { name: /voice/i })

      // Click personality tab
      await user.click(personalityTab)
      expect(personalityTab).toHaveAttribute('aria-selected', 'true')

      // Arrow keys navigate tabs
      await user.keyboard('{ArrowRight}')
      expect(voiceTab).toHaveFocus()
      expect(voiceTab).toHaveAttribute('aria-selected', 'true')

      await user.keyboard('{ArrowLeft}')
      expect(personalityTab).toHaveFocus()
      expect(personalityTab).toHaveAttribute('aria-selected', 'true')
    })
  })

  describe('CharacterDetailView', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <CharacterDetailView
          character={mockCharacter}
          onBack={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper heading hierarchy', () => {
      render(
        <CharacterDetailView
          character={mockCharacter}
          onBack={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      )

      // Main heading
      expect(screen.getByRole('heading', { level: 1, name: mockCharacter.name })).toBeInTheDocument()

      // Section headings
      expect(screen.getByRole('heading', { level: 2, name: /personality/i })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 2, name: /voice settings/i })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 2, name: /background/i })).toBeInTheDocument()
    })

    it('should have accessible action buttons', () => {
      render(
        <CharacterDetailView
          character={mockCharacter}
          onBack={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      )

      expect(screen.getByRole('button', { name: /back to gallery/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /edit character/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /delete character/i })).toBeInTheDocument()
    })

    it('should handle delete confirmation accessibly', async () => {
      const user = userEvent.setup()
      const onDelete = vi.fn()

      render(
        <CharacterDetailView
          character={mockCharacter}
          onBack={vi.fn()}
          onEdit={vi.fn()}
          onDelete={onDelete}
        />
      )

      // Click delete
      await user.click(screen.getByRole('button', { name: /delete character/i }))

      // Confirmation dialog should appear
      const dialog = screen.getByRole('alertdialog')
      expect(dialog).toBeInTheDocument()

      // Should have proper focus management
      const cancelButton = within(dialog).getByRole('button', { name: /cancel/i })
      const confirmButton = within(dialog).getByRole('button', { name: /delete/i })

      expect(document.activeElement).toBe(cancelButton)

      // Tab to confirm button
      await user.tab()
      expect(confirmButton).toHaveFocus()

      // Escape closes dialog
      await user.keyboard('{Escape}')
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: /delete character/i })).toHaveFocus()
    })
  })

  describe('Global Accessibility', () => {
    it('should support screen reader announcements', () => {
      const { container } = render(
        <div>
          <CharacterGallery
            characters={[mockCharacter]}
            onCharacterSelect={vi.fn()}
            onCharacterEdit={vi.fn()}
            onCharacterDelete={vi.fn()}
            onCharacterDuplicate={vi.fn()}
          />
        </div>
      )

      // Should have live regions for dynamic content
      const liveRegions = container.querySelectorAll('[aria-live]')
      expect(liveRegions.length).toBeGreaterThan(0)
    })

    it('should have sufficient color contrast', async () => {
      const { container } = render(
        <CharacterCard
          character={mockCharacter}
          onSelect={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onDuplicate={vi.fn()}
        />
      )

      // Note: This checks for WCAG violations including color contrast
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
        },
      })

      expect(results).toHaveNoViolations()
    })

    it('should support reduced motion preferences', () => {
      // Mock prefers-reduced-motion
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))

      render(
        <CharacterCard
          character={mockCharacter}
          onSelect={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onDuplicate={vi.fn()}
        />
      )

      // Check that the component renders without animation issues
      const card = screen.getByTestId('character-card')
      expect(card).toBeInTheDocument()
    })
  })
})