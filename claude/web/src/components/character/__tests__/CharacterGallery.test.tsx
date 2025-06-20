import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import { CharacterGallery } from '../CharacterGallery'
import type { Character } from '@/types/api.types'

const mockCharacters: Character[] = [
  {
    id: '1',
    name: 'Alice',
    personality: {
      traits: ['friendly', 'creative'],
      humor: 70,
      formality: 30,
      enthusiasm: 80,
      empathy: 90,
    },
    voice: {
      tone: 'casual',
      vocabulary: 'simple',
      sentenceStructure: 'short',
    },
    catchphrases: ['Hello there!'],
    background: 'A friendly character',
    stats: {
      totalGenerations: 50,
      consistencyScore: 95,
      popularityScore: 85,
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z',
  },
  {
    id: '2',
    name: 'Bob',
    personality: {
      traits: ['professional', 'analytical'],
      humor: 30,
      formality: 80,
      enthusiasm: 40,
      empathy: 60,
    },
    voice: {
      tone: 'formal',
      vocabulary: 'advanced',
      sentenceStructure: 'complex',
    },
    catchphrases: ['Let me analyze that'],
    background: 'A professional analyst',
    stats: {
      totalGenerations: 100,
      consistencyScore: 98,
      popularityScore: 70,
    },
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
  {
    id: '3',
    name: 'Charlie',
    personality: {
      traits: ['humorous', 'spontaneous'],
      humor: 90,
      formality: 20,
      enthusiasm: 95,
      empathy: 70,
    },
    voice: {
      tone: 'playful',
      vocabulary: 'colloquial',
      sentenceStructure: 'varied',
    },
    catchphrases: ['That\'s hilarious!'],
    stats: {
      totalGenerations: 30,
      consistencyScore: 88,
      popularityScore: 92,
    },
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-04T00:00:00Z',
  },
]

const mockHandlers = {
  onCharacterSelect: vi.fn(),
  onCharacterEdit: vi.fn(),
  onCharacterDelete: vi.fn(),
  onCharacterDuplicate: vi.fn(),
}

describe('CharacterGallery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render all characters', () => {
      render(
        <CharacterGallery
          characters={mockCharacters}
          {...mockHandlers}
        />
      )

      expect(screen.getByText('Alice')).toBeInTheDocument()
      expect(screen.getByText('Bob')).toBeInTheDocument()
      expect(screen.getByText('Charlie')).toBeInTheDocument()
    })

    it('should display character details', () => {
      render(
        <CharacterGallery
          characters={[mockCharacters[0]]}
          {...mockHandlers}
        />
      )

      expect(screen.getByText('A friendly character')).toBeInTheDocument()
      expect(screen.getByText(/friendly/)).toBeInTheDocument()
      expect(screen.getByText(/creative/)).toBeInTheDocument()
    })
  })

  describe('Search Functionality', () => {
    it('should filter characters by name', async () => {
      const user = userEvent.setup()
      render(
        <CharacterGallery
          characters={mockCharacters}
          {...mockHandlers}
        />
      )

      const searchInput = screen.getByPlaceholderText(/search characters/i)
      await user.type(searchInput, 'Alice')

      await waitFor(() => {
        expect(screen.getByText('Alice')).toBeInTheDocument()
        expect(screen.queryByText('Bob')).not.toBeInTheDocument()
        expect(screen.queryByText('Charlie')).not.toBeInTheDocument()
      })
    })

    it('should filter characters by traits', async () => {
      const user = userEvent.setup()
      render(
        <CharacterGallery
          characters={mockCharacters}
          {...mockHandlers}
        />
      )

      const searchInput = screen.getByPlaceholderText(/search characters/i)
      await user.type(searchInput, 'professional')

      await waitFor(() => {
        expect(screen.queryByText('Alice')).not.toBeInTheDocument()
        expect(screen.getByText('Bob')).toBeInTheDocument()
        expect(screen.queryByText('Charlie')).not.toBeInTheDocument()
      })
    })

    it('should show no results message', async () => {
      const user = userEvent.setup()
      render(
        <CharacterGallery
          characters={mockCharacters}
          {...mockHandlers}
        />
      )

      const searchInput = screen.getByPlaceholderText(/search characters/i)
      await user.type(searchInput, 'NonExistent')

      await waitFor(() => {
        expect(screen.getByText(/no characters match your filters/i)).toBeInTheDocument()
      })
    })
  })

  describe('Sorting Functionality', () => {
    it('should sort by name', async () => {
      const user = userEvent.setup()
      render(
        <CharacterGallery
          characters={mockCharacters}
          {...mockHandlers}
        />
      )

      const sortButton = screen.getByRole('combobox')
      await user.click(sortButton)

      const nameOption = screen.getByText(/name/i)
      await user.click(nameOption)

      const characterNames = screen.getAllByRole('heading', { level: 3 })
        .map(el => el.textContent)

      expect(characterNames).toEqual(['Alice', 'Bob', 'Charlie'])
    })

    it('should sort by creation date', async () => {
      const user = userEvent.setup()
      render(
        <CharacterGallery
          characters={mockCharacters}
          {...mockHandlers}
        />
      )

      const sortButton = screen.getByRole('combobox')
      await user.click(sortButton)

      const dateOption = screen.getByText(/created/i)
      await user.click(dateOption)

      const characterNames = screen.getAllByRole('heading', { level: 3 })
        .map(el => el.textContent)

      expect(characterNames).toEqual(['Alice', 'Bob', 'Charlie'])
    })

    it('should sort by popularity', async () => {
      const user = userEvent.setup()
      render(
        <CharacterGallery
          characters={mockCharacters}
          {...mockHandlers}
        />
      )

      const sortButton = screen.getByRole('combobox')
      await user.click(sortButton)

      const popularityOption = screen.getByText(/popularity/i)
      await user.click(popularityOption)

      const characterNames = screen.getAllByRole('heading', { level: 3 })
        .map(el => el.textContent)

      expect(characterNames[0]).toBe('Charlie') // Highest popularity (92)
    })
  })

  describe('View Toggle', () => {
    it('should toggle between grid and list view', async () => {
      const user = userEvent.setup()
      render(
        <CharacterGallery
          characters={mockCharacters}
          {...mockHandlers}
        />
      )

      // Should start in grid view
      expect(screen.getByTestId('character-grid')).toHaveClass('grid')

      // Toggle to list view
      const listButton = screen.getAllByRole('button')[2] // List view button
      await user.click(listButton)

      expect(screen.getByTestId('character-grid')).toHaveClass('space-y-4')
    })
  })

  describe('Character Actions', () => {
    it('should call onCharacterSelect when card is clicked', async () => {
      const user = userEvent.setup()
      render(
        <CharacterGallery
          characters={[mockCharacters[0]]}
          {...mockHandlers}
        />
      )

      const characterCard = screen.getByTestId('character-card')
      await user.click(characterCard)

      expect(mockHandlers.onCharacterSelect).toHaveBeenCalledWith(mockCharacters[0])
    })

    it('should call onCharacterEdit from dropdown', async () => {
      const user = userEvent.setup()
      render(
        <CharacterGallery
          characters={[mockCharacters[0]]}
          {...mockHandlers}
        />
      )

      const menuButton = screen.getByRole('button') // Dropdown menu button
      await user.click(menuButton)

      const editButton = screen.getByText(/edit/i)
      await user.click(editButton)

      expect(mockHandlers.onCharacterEdit).toHaveBeenCalledWith(mockCharacters[0])
    })

    it('should call onCharacterDelete from dropdown', async () => {
      const user = userEvent.setup()
      render(
        <CharacterGallery
          characters={[mockCharacters[0]]}
          {...mockHandlers}
        />
      )

      const menuButton = screen.getByRole('button') // Dropdown menu button
      await user.click(menuButton)

      const deleteButton = screen.getByText(/delete/i)
      await user.click(deleteButton)

      expect(mockHandlers.onCharacterDelete).toHaveBeenCalledWith(mockCharacters[0])
    })

    it('should call onCharacterDuplicate from dropdown', async () => {
      const user = userEvent.setup()
      render(
        <CharacterGallery
          characters={[mockCharacters[0]]}
          {...mockHandlers}
        />
      )

      const menuButton = screen.getByRole('button') // Dropdown menu button
      await user.click(menuButton)

      const duplicateButton = screen.getByText(/duplicate/i)
      await user.click(duplicateButton)

      expect(mockHandlers.onCharacterDuplicate).toHaveBeenCalledWith(mockCharacters[0])
    })
  })

  describe('Performance', () => {
    it('should handle large character lists', () => {
      const largeCharacterList = Array.from({ length: 100 }, (_, i) => ({
        ...mockCharacters[0],
        id: `char-${i}`,
        name: `Character ${i}`,
      }))

      const { container } = render(
        <CharacterGallery
          characters={largeCharacterList}
          {...mockHandlers}
        />
      )

      const cards = container.querySelectorAll('[data-testid="character-card"]')
      expect(cards.length).toBe(100)
    })
  })
})