import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@/test/utils'
import { AvatarUpload } from '../AvatarUpload'

// Mock file reader
const mockFileReader = {
  readAsDataURL: vi.fn(),
  result: 'data:image/png;base64,mockImageData',
  onload: null as any,
}

Object.defineProperty(global, 'FileReader', {
  writable: true,
  value: vi.fn(() => mockFileReader),
})

describe('AvatarUpload', () => {
  const mockOnChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders upload area', () => {
    render(<AvatarUpload onChange={mockOnChange} />)
    
    expect(screen.getByText(/drag & drop/i)).toBeInTheDocument()
    expect(screen.getByText(/click to upload/i)).toBeInTheDocument()
    expect(screen.getByText(/PNG, JPG, GIF up to 5MB/i)).toBeInTheDocument()
  })

  it('handles file drop', async () => {
    render(<AvatarUpload onChange={mockOnChange} />)
    
    const dropzone = screen.getByText(/drag & drop/i).closest('div')!
    const file = new File(['test'], 'test.png', { type: 'image/png' })
    
    const dropEvent = {
      dataTransfer: {
        files: [file],
      },
    }
    
    fireEvent.drop(dropzone, dropEvent)
    
    // Simulate FileReader onload
    mockFileReader.onload?.()
    
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith('data:image/png;base64,mockImageData')
    })
  })

  it('validates file type', async () => {
    render(<AvatarUpload onChange={mockOnChange} />)
    
    const dropzone = screen.getByText(/drag & drop/i).closest('div')!
    const file = new File(['test'], 'test.txt', { type: 'text/plain' })
    
    const dropEvent = {
      dataTransfer: {
        files: [file],
      },
    }
    
    fireEvent.drop(dropzone, dropEvent)
    
    // Should not call onChange for invalid file type
    expect(mockOnChange).not.toHaveBeenCalled()
  })

  it('validates file size', async () => {
    render(<AvatarUpload onChange={mockOnChange} />)
    
    const dropzone = screen.getByText(/drag & drop/i).closest('div')!
    // Create a file larger than 5MB
    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.png', { type: 'image/png' })
    
    const dropEvent = {
      dataTransfer: {
        files: [largeFile],
      },
    }
    
    fireEvent.drop(dropzone, dropEvent)
    
    // Should not call onChange for oversized file
    expect(mockOnChange).not.toHaveBeenCalled()
  })

  it('displays uploaded image', () => {
    const imageUrl = 'https://example.com/avatar.png'
    render(<AvatarUpload value={imageUrl} onChange={mockOnChange} />)
    
    const image = screen.getByAltText('Character avatar')
    expect(image).toHaveAttribute('src', imageUrl)
  })

  it('allows removing uploaded image', async () => {
    const imageUrl = 'https://example.com/avatar.png'
    const { user } = render(<AvatarUpload value={imageUrl} onChange={mockOnChange} />)
    
    const removeButton = screen.getByLabelText('Remove avatar')
    await user.click(removeButton)
    
    expect(mockOnChange).toHaveBeenCalledWith(undefined)
  })
})