import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFormPersistence } from '../useFormPersistence'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('useFormPersistence', () => {
  const mockWatch = vi.fn()
  const mockReset = vi.fn()
  const mockUnsubscribe = vi.fn()

  const mockForm = {
    watch: mockWatch,
    reset: mockReset,
  } as any

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    mockWatch.mockReturnValue({ unsubscribe: mockUnsubscribe })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('loads saved data from localStorage', () => {
    const savedData = { name: 'Test Character', level: 5 }
    localStorageMock.getItem.mockReturnValue(JSON.stringify(savedData))

    renderHook(() => useFormPersistence(mockForm, 'test-form'))

    expect(localStorageMock.getItem).toHaveBeenCalledWith('test-form')
    expect(mockReset).toHaveBeenCalledWith(savedData)
  })

  it('does not reset when no saved data exists', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify({}))

    renderHook(() => useFormPersistence(mockForm, 'test-form'))

    expect(mockReset).not.toHaveBeenCalled()
  })

  it('saves data to localStorage with debounce', () => {
    renderHook(() => useFormPersistence(mockForm, 'test-form', { debounceMs: 500 }))

    // Get the watch callback
    const watchCallback = mockWatch.mock.calls[0][0]
    const testData = { name: 'New Character', level: 10 }
    
    act(() => {
      watchCallback(testData)
    })

    // Should not save immediately
    expect(localStorageMock.setItem).not.toHaveBeenCalled()

    // Fast forward past debounce delay
    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'test-form',
      JSON.stringify(testData)
    )
  })

  it('excludes specified fields when saving', () => {
    renderHook(() => 
      useFormPersistence(mockForm, 'test-form', { 
        exclude: ['password', 'tempData'] as any,
        debounceMs: 500 
      })
    )

    const watchCallback = mockWatch.mock.calls[0][0]
    const testData = {
      name: 'Character',
      password: 'secret',
      tempData: 'temporary',
      permanent: 'keep this',
    }
    
    act(() => {
      watchCallback(testData)
    })

    act(() => {
      vi.advanceTimersByTime(500)
    })

    const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1])
    expect(savedData).toEqual({
      name: 'Character',
      permanent: 'keep this',
    })
    expect(savedData.password).toBeUndefined()
    expect(savedData.tempData).toBeUndefined()
  })

  it('clears saved data', () => {
    const { result } = renderHook(() => useFormPersistence(mockForm, 'test-form'))

    act(() => {
      result.current.clearSavedData()
    })

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('test-form')
  })

  it('handles localStorage errors gracefully', () => {
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error('Storage error')
    })

    // Should not throw
    renderHook(() => useFormPersistence(mockForm, 'test-form'))
    
    expect(mockReset).not.toHaveBeenCalled()
  })
})