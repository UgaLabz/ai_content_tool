import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@/test/utils'
import { CharacterCreatorForm } from '../CharacterCreatorForm'

describe('CharacterCreatorForm', () => {
  const mockOnSubmit = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the form with progress indicator', () => {
    render(
      <CharacterCreatorForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )
    
    // Check progress indicator
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    
    // Check first step is shown
    expect(screen.getByText('Basic Information')).toBeInTheDocument()
  })

  it('navigates between steps', async () => {
    const { user } = render(
      <CharacterCreatorForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )
    
    // Fill required field
    const nameInput = screen.getByLabelText('Character Name *')
    await user.type(nameInput, 'Test Character')
    
    // Navigate to next step
    const nextButton = screen.getByText('Next')
    await user.click(nextButton)
    
    // Should show personality step
    await waitFor(() => {
      expect(screen.getByText('Personality Configuration')).toBeInTheDocument()
    })
    
    // Navigate back
    const backButton = screen.getByText('Back')
    await user.click(backButton)
    
    // Should show basic info step again
    expect(screen.getByText('Basic Information')).toBeInTheDocument()
  })

  it('validates required fields before navigation', async () => {
    const { user } = render(
      <CharacterCreatorForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )
    
    // Try to navigate without filling required fields
    const nextButton = screen.getByText('Next')
    await user.click(nextButton)
    
    // Should still be on first step
    expect(screen.getByText('Basic Information')).toBeInTheDocument()
  })

  it('calls onCancel when cancel button is clicked', async () => {
    const { user } = render(
      <CharacterCreatorForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )
    
    const cancelButton = screen.getByText('Cancel')
    await user.click(cancelButton)
    
    expect(mockOnCancel).toHaveBeenCalledOnce()
  })

  it('submits form data on final step', async () => {
    const { user } = render(
      <CharacterCreatorForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )
    
    // Fill basic info
    await user.type(screen.getByLabelText('Character Name *'), 'Test Character')
    await user.click(screen.getByText('Next'))
    
    // Skip through steps (they have default values)
    await waitFor(() => screen.getByText('Personality Configuration'))
    await user.click(screen.getByText('Next'))
    
    await waitFor(() => screen.getByText('Voice & Style'))
    await user.click(screen.getByText('Next'))
    
    await waitFor(() => screen.getByText('Additional Details'))
    await user.click(screen.getByText('Next'))
    
    // Should be on preview step
    await waitFor(() => screen.getByText('Character Preview'))
    
    // Submit form
    const createButton = screen.getByText('Create Character')
    await user.click(createButton)
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Character',
        })
      )
    })
  })
})