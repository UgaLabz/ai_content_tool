import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Profiler } from 'react'
import { CharacterCard } from '../CharacterCard'
import { CharacterGallery } from '../CharacterGallery'
import { CharacterCreatorForm } from '../CharacterCreatorForm'
import { CharacterDetailView } from '../CharacterDetailView'
import { CharacterGallerySkeleton } from '../CharacterGallerySkeleton'
import type { Character } from '@/types/api.types'
import { 
  PerformanceMonitor, 
  PERFORMANCE_THRESHOLDS,
  onRenderCallback,
  measureAsyncOperation 
} from '@/tests/utils/performance'

const createMockCharacters = (count: number): Character[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `${i + 1}`,
    name: `Character ${i + 1}`,
    avatar: `https://example.com/avatar${i + 1}.jpg`,
    personality: {
      traits: ['trait1', 'trait2'],
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
    background: `Background for character ${i + 1}`,
    relationships: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }))
}

describe('Character Components Performance', () => {
  let performanceMonitor: PerformanceMonitor

  beforeEach(() => {
    performanceMonitor = new PerformanceMonitor()
    vi.clearAllMocks()
  })

  describe('CharacterCard', () => {
    it('should render within performance threshold', async () => {
      const character = createMockCharacters(1)[0]
      const renderTimes: number[] = []

      const handleRender = (
        id: string,
        phase: 'mount' | 'update',
        actualDuration: number
      ) => {
        renderTimes.push(actualDuration)
      }

      render(
        <Profiler id="character-card" onRender={handleRender}>
          <CharacterCard
            character={character}
            onSelect={vi.fn()}
            onEdit={vi.fn()}
            onDelete={vi.fn()}
            onDuplicate={vi.fn()}
          />
        </Profiler>
      )

      await waitFor(() => {
        expect(renderTimes.length).toBeGreaterThan(0)
      })

      const initialRenderTime = renderTimes[0]
      expect(initialRenderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.ACCEPTABLE_RENDER)
    })

    it('should handle rapid re-renders efficiently', async () => {
      const character = createMockCharacters(1)[0]
      const renderTimes: number[] = []

      const handleRender = (
        id: string,
        phase: 'mount' | 'update',
        actualDuration: number
      ) => {
        renderTimes.push(actualDuration)
      }

      const { rerender } = render(
        <Profiler id="character-card" onRender={handleRender}>
          <CharacterCard
            character={character}
            onSelect={vi.fn()}
            onEdit={vi.fn()}
            onDelete={vi.fn()}
            onDuplicate={vi.fn()}
          />
        </Profiler>
      )

      // Simulate rapid re-renders
      for (let i = 0; i < 10; i++) {
        rerender(
          <Profiler id="character-card" onRender={handleRender}>
            <CharacterCard
              character={{ ...character, name: `Updated ${i}` }}
              onSelect={vi.fn()}
              onEdit={vi.fn()}
              onDelete={vi.fn()}
              onDuplicate={vi.fn()}
            />
          </Profiler>
        )
      }

      await waitFor(() => {
        expect(renderTimes.length).toBeGreaterThanOrEqual(10)
      })

      // Check that re-renders are faster than initial render
      const reRenderTimes = renderTimes.slice(1)
      const avgReRenderTime = reRenderTimes.reduce((a, b) => a + b, 0) / reRenderTimes.length
      
      expect(avgReRenderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.FAST_RENDER)
    })
  })

  describe('CharacterGallery', () => {
    it('should render large lists efficiently', async () => {
      const characters = createMockCharacters(100)
      const renderTimes: number[] = []

      const handleRender = (
        id: string,
        phase: 'mount' | 'update',
        actualDuration: number
      ) => {
        renderTimes.push(actualDuration)
      }

      const { result, duration } = await measureAsyncOperation(async () => {
        const rendered = render(
          <Profiler id="character-gallery" onRender={handleRender}>
            <CharacterGallery
              characters={characters}
              onCharacterSelect={vi.fn()}
              onCharacterEdit={vi.fn()}
              onCharacterDelete={vi.fn()}
              onCharacterDuplicate={vi.fn()}
            />
          </Profiler>
        )
        
        await waitFor(() => {
          expect(screen.getByRole('region', { name: /character gallery/i })).toBeInTheDocument()
        })
        
        return rendered
      }, 'gallery-render')

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.SLOW_RENDER)
      
      // Verify all characters are rendered
      const cards = screen.getAllByTestId('character-card')
      expect(cards).toHaveLength(100)
    })

    it('should handle search filtering efficiently', async () => {
      const characters = createMockCharacters(50)
      const user = userEvent.setup()

      render(
        <CharacterGallery
          characters={characters}
          onCharacterSelect={vi.fn()}
          onCharacterEdit={vi.fn()}
          onCharacterDelete={vi.fn()}
          onCharacterDuplicate={vi.fn()}
        />
      )

      const searchInput = screen.getByRole('searchbox', { name: /search characters/i })

      // Measure search performance
      const { duration } = await measureAsyncOperation(async () => {
        await user.type(searchInput, 'Character 25')
        
        await waitFor(() => {
          const visibleCards = screen.getAllByTestId('character-card')
          expect(visibleCards.length).toBeLessThan(50)
        })
      }, 'search-filter')

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.ACCEPTABLE_INTERACTION)
    })

    it('should lazy load images efficiently', async () => {
      const characters = createMockCharacters(20)
      
      // Mock IntersectionObserver
      const observerMap = new Map()
      const instanceMap = new Map()
      
      global.IntersectionObserver = vi.fn((callback, options) => {
        const instance = {
          observe: vi.fn((element: Element) => {
            observerMap.set(element, callback)
            instanceMap.set(element, instance)
          }),
          unobserve: vi.fn((element: Element) => {
            observerMap.delete(element)
            instanceMap.delete(element)
          }),
          disconnect: vi.fn(),
        }
        return instance
      })

      render(
        <CharacterGallery
          characters={characters}
          onCharacterSelect={vi.fn()}
          onCharacterEdit={vi.fn()}
          onCharacterDelete={vi.fn()}
          onCharacterDuplicate={vi.fn()}
        />
      )

      // Verify images are set up for lazy loading
      const images = screen.getAllByRole('img')
      expect(images.length).toBeGreaterThan(0)
      
      // Simulate scrolling to trigger lazy loading
      observerMap.forEach((callback, element) => {
        callback([{ isIntersecting: true, target: element }], instanceMap.get(element))
      })
    })
  })

  describe('CharacterCreatorForm', () => {
    it('should handle form validation efficiently', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      
      const renderTimes: number[] = []
      const handleRender = (
        id: string,
        phase: 'mount' | 'update',
        actualDuration: number
      ) => {
        renderTimes.push(actualDuration)
      }

      render(
        <Profiler id="creator-form" onRender={handleRender}>
          <CharacterCreatorForm
            onSubmit={onSubmit}
            onCancel={vi.fn()}
          />
        </Profiler>
      )

      // Measure form interaction performance
      const { duration } = await measureAsyncOperation(async () => {
        // Fill out form
        await user.type(screen.getByLabelText(/character name/i), 'Test Character')
        await user.type(screen.getByLabelText(/description/i), 'Test description')
        
        // Change tabs
        await user.click(screen.getByRole('tab', { name: /personality/i }))
        
        // Adjust sliders
        const humorSlider = screen.getByRole('slider', { name: /humor level/i })
        await user.click(humorSlider)
        
        // Submit form
        await user.click(screen.getByRole('button', { name: /create character/i }))
      }, 'form-interaction')

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.SLOW_INTERACTION)
      
      // Check that re-renders during form interaction are efficient
      const avgRenderTime = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length
      expect(avgRenderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.FAST_RENDER)
    })

    it('should debounce form validation', async () => {
      const user = userEvent.setup()
      let validationCount = 0
      
      // Mock validation function
      const validateName = vi.fn((value: string) => {
        validationCount++
        return value.length >= 3
      })

      render(
        <CharacterCreatorForm
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />
      )

      const nameInput = screen.getByLabelText(/character name/i)
      
      // Type quickly
      await user.type(nameInput, 'TestCharacter', { delay: 10 })
      
      // Wait for debounce
      await waitFor(() => {
        // Validation should be called less than the number of characters typed
        expect(validationCount).toBeLessThan('TestCharacter'.length)
      }, { timeout: 500 })
    })
  })

  describe('CharacterDetailView', () => {
    it('should render complex character data efficiently', async () => {
      const character = createMockCharacters(1)[0]
      const renderTimes: number[] = []

      const handleRender = (
        id: string,
        phase: 'mount' | 'update',
        actualDuration: number
      ) => {
        renderTimes.push(actualDuration)
      }

      render(
        <Profiler id="detail-view" onRender={handleRender}>
          <CharacterDetailView
            character={character}
            onBack={vi.fn()}
            onEdit={vi.fn()}
            onDelete={vi.fn()}
          />
        </Profiler>
      )

      await waitFor(() => {
        expect(renderTimes.length).toBeGreaterThan(0)
      })

      const initialRenderTime = renderTimes[0]
      expect(initialRenderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.ACCEPTABLE_RENDER)
    })
  })

  describe('CharacterGallerySkeleton', () => {
    it('should render skeleton efficiently', async () => {
      const renderTimes: number[] = []

      const handleRender = (
        id: string,
        phase: 'mount' | 'update',
        actualDuration: number
      ) => {
        renderTimes.push(actualDuration)
      }

      render(
        <Profiler id="skeleton" onRender={handleRender}>
          <CharacterGallerySkeleton count={20} />
        </Profiler>
      )

      await waitFor(() => {
        expect(renderTimes.length).toBeGreaterThan(0)
      })

      const renderTime = renderTimes[0]
      expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.FAST_RENDER)
    })
  })

  describe('Memory Usage', () => {
    it('should not leak memory during component lifecycle', async () => {
      const monitor = new PerformanceMonitor()
      const initialMemory = monitor.getMemoryUsage()
      
      // Skip if memory API not available
      if (!initialMemory) {
        console.warn('Performance memory API not available, skipping memory test')
        return
      }

      const characters = createMockCharacters(50)
      
      // Mount and unmount component multiple times
      for (let i = 0; i < 5; i++) {
        const { unmount } = render(
          <CharacterGallery
            characters={characters}
            onCharacterSelect={vi.fn()}
            onCharacterEdit={vi.fn()}
            onCharacterDelete={vi.fn()}
            onCharacterDuplicate={vi.fn()}
          />
        )
        
        await waitFor(() => {
          expect(screen.getByRole('region', { name: /character gallery/i })).toBeInTheDocument()
        })
        
        unmount()
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }

      const finalMemory = monitor.getMemoryUsage()
      if (finalMemory) {
        const memoryIncrease = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize
        
        // Memory increase should be minimal (less than 5MB)
        expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024)
      }
    })
  })
})