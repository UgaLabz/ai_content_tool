import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { CharacterGalleryPage } from '../CharacterGalleryPage'
import { characterService } from '@/services/api/characters'
import type { Character } from '@/types/api.types'

// Mock the character service
vi.mock('@/services/api/characters', () => ({
  characterService: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getById: vi.fn(),
  },
}))

// Mock toast
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}))

const mockCharacter: Character = {
  id: '1',
  name: 'Test Character',
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
  catchphrases: ['Hello!'],
  stats: {
    totalGenerations: 10,
    consistencyScore: 95,
    popularityScore: 85,
  },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('CharacterGalleryPage Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Initial Load', () => {
    it('should show loading state initially', () => {
      vi.mocked(characterService.getAll).mockImplementation(() => new Promise(() => {}))

      render(<CharacterGalleryPage />, { wrapper: createWrapper() })

      expect(screen.getByText(/loading characters/i)).toBeInTheDocument()
    })

    it('should display characters after loading', async () => {
      vi.mocked(characterService.getAll).mockResolvedValue([mockCharacter])

      render(<CharacterGalleryPage />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByText('Test Character')).toBeInTheDocument()
      })
    })

    it('should show empty state when no characters', async () => {
      vi.mocked(characterService.getAll).mockResolvedValue([])

      render(<CharacterGalleryPage />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByText(/no characters yet/i)).toBeInTheDocument()
        expect(screen.getByText(/create your first ai character/i)).toBeInTheDocument()
      })
    })

    it('should handle fetch error', async () => {
      vi.mocked(characterService.getAll).mockRejectedValue(new Error('Network error'))

      render(<CharacterGalleryPage />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Character Creation Flow', () => {
    it('should open character creator form', async () => {
      const user = userEvent.setup()
      vi.mocked(characterService.getAll).mockResolvedValue([])

      render(<CharacterGalleryPage />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByText(/no characters yet/i)).toBeInTheDocument()
      })

      const createButton = screen.getAllByRole('button', { name: /create.*character/i })[0]
      await user.click(createButton)

      expect(screen.getByText('Create Character')).toBeInTheDocument()
      expect(screen.getByText('Basic Information')).toBeInTheDocument()
    })

    it('should create character and return to gallery', async () => {
      const user = userEvent.setup()
      const newCharacter = { ...mockCharacter, id: '2', name: 'New Character' }
      
      vi.mocked(characterService.getAll).mockResolvedValue([])
      vi.mocked(characterService.create).mockResolvedValue(newCharacter)

      render(<CharacterGalleryPage />, { wrapper: createWrapper() })

      // Open creator
      await waitFor(() => {
        expect(screen.getByText(/no characters yet/i)).toBeInTheDocument()
      })

      const createButton = screen.getAllByRole('button', { name: /create.*character/i })[0]
      await user.click(createButton)

      // Fill form (simplified - in real test would fill all fields)
      const nameInput = screen.getByLabelText(/character name/i)
      await user.type(nameInput, 'New Character')

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create character/i })
      await user.click(submitButton)

      // Should return to gallery with new character
      await waitFor(() => {
        expect(screen.queryByText('Create Character')).not.toBeInTheDocument()
        expect(screen.getByText('Characters')).toBeInTheDocument()
      })
    })

    it('should cancel character creation', async () => {
      const user = userEvent.setup()
      vi.mocked(characterService.getAll).mockResolvedValue([mockCharacter])

      render(<CharacterGalleryPage />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByText('Test Character')).toBeInTheDocument()
      })

      // Open creator
      const createButton = screen.getByRole('button', { name: /create character/i })
      await user.click(createButton)

      // Cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      // Should return to gallery
      expect(screen.getByText('Characters')).toBeInTheDocument()
      expect(screen.getByText('Test Character')).toBeInTheDocument()
    })
  })

  describe('Character Detail View', () => {
    it('should open character detail view', async () => {
      const user = userEvent.setup()
      vi.mocked(characterService.getAll).mockResolvedValue([mockCharacter])

      render(<CharacterGalleryPage />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByText('Test Character')).toBeInTheDocument()
      })

      const characterCard = screen.getByTestId('character-card')
      await user.click(characterCard)

      expect(screen.getByRole('heading', { name: 'Test Character' })).toBeInTheDocument()
      expect(screen.getByText(/total generations/i)).toBeInTheDocument()
    })

    it('should return from detail view', async () => {
      const user = userEvent.setup()
      vi.mocked(characterService.getAll).mockResolvedValue([mockCharacter])

      render(<CharacterGalleryPage />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByText('Test Character')).toBeInTheDocument()
      })

      // Open detail view
      const characterCard = screen.getByTestId('character-card')
      await user.click(characterCard)

      // Go back
      const backButton = screen.getByRole('button', { name: /back/i })
      await user.click(backButton)

      // Should be back in gallery
      expect(screen.getByText('Characters')).toBeInTheDocument()
      expect(screen.getByText('Manage your AI characters')).toBeInTheDocument()
    })
  })

  describe('Character Operations', () => {
    it('should delete character', async () => {
      const user = userEvent.setup()
      vi.mocked(characterService.getAll).mockResolvedValue([mockCharacter])
      vi.mocked(characterService.delete).mockResolvedValue()

      // Mock confirm dialog
      vi.spyOn(window, 'confirm').mockReturnValue(true)

      render(<CharacterGalleryPage />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByText('Test Character')).toBeInTheDocument()
      })

      // Open dropdown menu
      const menuButton = screen.getByRole('button') // Dropdown menu button
      await user.click(menuButton)

      // Click delete
      const deleteButton = screen.getByText(/delete/i)
      await user.click(deleteButton)

      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete Test Character?')
      expect(characterService.delete).toHaveBeenCalledWith('1')
    })

    it('should duplicate character', async () => {
      const user = userEvent.setup()
      const duplicatedCharacter = { ...mockCharacter, id: '2', name: 'Test Character (Copy)' }
      
      vi.mocked(characterService.getAll).mockResolvedValue([mockCharacter])
      vi.mocked(characterService.getById).mockResolvedValue(mockCharacter)
      vi.mocked(characterService.create).mockResolvedValue(duplicatedCharacter)

      render(<CharacterGalleryPage />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByText('Test Character')).toBeInTheDocument()
      })

      // Open dropdown menu
      const menuButton = screen.getByRole('button') // Dropdown menu button
      await user.click(menuButton)

      // Click duplicate
      const duplicateButton = screen.getByText(/duplicate/i)
      await user.click(duplicateButton)

      await waitFor(() => {
        expect(characterService.getById).toHaveBeenCalledWith('1')
        expect(characterService.create).toHaveBeenCalled()
      })
    })
  })

  describe('Search and Filter Integration', () => {
    it('should filter characters by search term', async () => {
      const user = userEvent.setup()
      const characters = [
        mockCharacter,
        { ...mockCharacter, id: '2', name: 'Another Character' },
      ]
      
      vi.mocked(characterService.getAll).mockResolvedValue(characters)

      render(<CharacterGalleryPage />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByText('Test Character')).toBeInTheDocument()
        expect(screen.getByText('Another Character')).toBeInTheDocument()
      })

      // Search
      const searchInput = screen.getByPlaceholderText(/search characters/i)
      await user.type(searchInput, 'Test')

      await waitFor(() => {
        expect(screen.getByText('Test Character')).toBeInTheDocument()
        expect(screen.queryByText('Another Character')).not.toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle character deletion error', async () => {
      const user = userEvent.setup()
      vi.mocked(characterService.getAll).mockResolvedValue([mockCharacter])
      vi.mocked(characterService.delete).mockRejectedValue(new Error('Delete failed'))

      vi.spyOn(window, 'confirm').mockReturnValue(true)

      render(<CharacterGalleryPage />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByText('Test Character')).toBeInTheDocument()
      })

      // Try to delete
      const menuButton = screen.getByRole('button') // Dropdown menu button
      await user.click(menuButton)

      const deleteButton = screen.getByText(/delete/i)
      await user.click(deleteButton)

      // Character should still be visible after failed delete
      await waitFor(() => {
        expect(screen.getByText('Test Character')).toBeInTheDocument()
      })
    })
  })
})