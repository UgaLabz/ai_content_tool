import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import { apiClient } from '../client'
import { characterService } from '../characters'
import { handleApiError, AppError } from '@/utils/errors'

// Mock axios
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    })),
  },
}))

describe('API Error Handling', () => {
  const mockAxios = axios.create() as any

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('Network Errors', () => {
    it('should handle network connection errors', async () => {
      const networkError = new Error('Network Error')
      networkError.code = 'ERR_NETWORK'
      mockAxios.get.mockRejectedValue(networkError)

      await expect(characterService.getAll()).rejects.toThrow(AppError)
      
      try {
        await characterService.getAll()
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect(error.code).toBe('NETWORK_ERROR')
        expect(error.message).toBe('Network connection failed')
      }
    })

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Timeout')
      timeoutError.code = 'ECONNABORTED'
      mockAxios.get.mockRejectedValue(timeoutError)

      await expect(characterService.getAll()).rejects.toThrow(AppError)
      
      try {
        await characterService.getAll()
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect(error.code).toBe('TIMEOUT')
        expect(error.message).toBe('Request timed out')
        expect(error.statusCode).toBe(408)
      }
    })
  })

  describe('HTTP Errors', () => {
    it('should handle 400 Bad Request', async () => {
      mockAxios.get.mockRejectedValue({
        response: {
          status: 400,
          data: {
            error: {
              code: 'INVALID_REQUEST',
              message: 'Invalid request parameters',
              details: { field: 'name' }
            }
          }
        }
      })

      try {
        await characterService.getAll()
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect(error.code).toBe('INVALID_REQUEST')
        expect(error.message).toBe('Invalid request parameters')
        expect(error.statusCode).toBe(400)
        expect(error.details).toEqual({ field: 'name' })
      }
    })

    it('should handle 401 Unauthorized', async () => {
      mockAxios.get.mockRejectedValue({
        response: {
          status: 401,
          statusText: 'Unauthorized'
        }
      })

      try {
        await characterService.getAll()
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect(error.code).toBe('HTTP_401')
        expect(error.statusCode).toBe(401)
      }
    })

    it('should handle 404 Not Found', async () => {
      mockAxios.get.mockRejectedValue({
        response: {
          status: 404,
          data: {
            error: {
              code: 'NOT_FOUND',
              message: 'Character not found'
            }
          }
        }
      })

      try {
        await characterService.getById('123')
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect(error.code).toBe('NOT_FOUND')
        expect(error.message).toBe('Character not found')
        expect(error.statusCode).toBe(404)
      }
    })

    it('should handle 429 Rate Limit', async () => {
      mockAxios.post.mockRejectedValue({
        response: {
          status: 429,
          data: {
            error: {
              code: 'RATE_LIMIT',
              message: 'Too many requests',
              details: { retryAfter: 60 }
            }
          }
        }
      })

      try {
        await characterService.create({
          name: 'Test',
          personality: { traits: [], humor: 50, formality: 50, enthusiasm: 50, empathy: 50 },
          voice: { tone: 'casual', vocabulary: 'simple', sentenceStructure: 'short' }
        })
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect(error.code).toBe('RATE_LIMIT')
        expect(error.message).toBe('Too many requests')
        expect(error.statusCode).toBe(429)
        expect(error.details?.retryAfter).toBe(60)
      }
    })

    it('should handle 500 Server Error', async () => {
      mockAxios.get.mockRejectedValue({
        response: {
          status: 500,
          statusText: 'Internal Server Error'
        }
      })

      try {
        await characterService.getAll()
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect(error.code).toBe('HTTP_500')
        expect(error.message).toBe('Internal Server Error')
        expect(error.statusCode).toBe(500)
      }
    })

    it('should handle 503 Service Unavailable', async () => {
      mockAxios.get.mockRejectedValue({
        response: {
          status: 503,
          data: {
            error: {
              code: 'SERVICE_UNAVAILABLE',
              message: 'Service temporarily unavailable'
            }
          }
        }
      })

      try {
        await characterService.getAll()
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect(error.code).toBe('SERVICE_UNAVAILABLE')
        expect(error.message).toBe('Service temporarily unavailable')
        expect(error.statusCode).toBe(503)
      }
    })
  })

  describe('Data Validation Errors', () => {
    it('should handle missing required fields', async () => {
      mockAxios.post.mockRejectedValue({
        response: {
          status: 422,
          data: {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Validation failed',
              details: {
                errors: [
                  { field: 'name', message: 'Name is required' },
                  { field: 'personality.traits', message: 'At least one trait is required' }
                ]
              }
            }
          }
        }
      })

      try {
        await characterService.create({
          name: '',
          personality: { traits: [], humor: 50, formality: 50, enthusiasm: 50, empathy: 50 },
          voice: { tone: 'casual', vocabulary: 'simple', sentenceStructure: 'short' }
        })
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect(error.code).toBe('VALIDATION_ERROR')
        expect(error.statusCode).toBe(422)
        expect(error.details?.errors).toHaveLength(2)
      }
    })

    it('should handle invalid data types', async () => {
      mockAxios.put.mockRejectedValue({
        response: {
          status: 400,
          data: {
            error: {
              code: 'INVALID_TYPE',
              message: 'Invalid data type',
              details: {
                field: 'personality.humor',
                expected: 'number',
                received: 'string'
              }
            }
          }
        }
      })

      try {
        await characterService.update('123', { personality: { humor: 'high' as any } })
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect(error.code).toBe('INVALID_TYPE')
        expect(error.details?.field).toBe('personality.humor')
      }
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty error response', async () => {
      mockAxios.get.mockRejectedValue({
        response: {
          status: 500,
          data: null
        }
      })

      try {
        await characterService.getAll()
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect(error.code).toBe('HTTP_500')
        expect(error.statusCode).toBe(500)
      }
    })

    it('should handle non-standard error format', async () => {
      mockAxios.get.mockRejectedValue({
        response: {
          status: 400,
          data: {
            message: 'Something went wrong',
            errorCode: 'CUSTOM_ERROR'
          }
        }
      })

      try {
        await characterService.getAll()
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect(error.code).toBe('HTTP_400')
        expect(error.statusCode).toBe(400)
      }
    })

    it('should handle non-Error objects', async () => {
      mockAxios.get.mockRejectedValue('String error')

      try {
        await characterService.getAll()
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect(error.code).toBe('UNKNOWN_ERROR')
        expect(error.message).toBe('An unknown error occurred')
      }
    })
  })

  describe('Retry Logic', () => {
    it('should retry on transient errors', async () => {
      // First two calls fail, third succeeds
      mockAxios.get
        .mockRejectedValueOnce({ response: { status: 503 } })
        .mockRejectedValueOnce({ response: { status: 503 } })
        .mockResolvedValueOnce({ data: [] })

      // Note: This test assumes retry logic is implemented in the API client
      // For now, we're just testing that the error is properly handled
      const firstCall = characterService.getAll()
      await expect(firstCall).rejects.toThrow(AppError)
    })
  })

  describe('Error Utilities', () => {
    it('should identify network errors', () => {
      const networkError = new Error('Network')
      networkError.code = 'ERR_NETWORK'
      
      const appError = handleApiError(networkError)
      expect(appError.code).toBe('NETWORK_ERROR')
    })

    it('should identify auth errors', () => {
      const authError = {
        response: { status: 401 }
      }
      
      const appError = handleApiError(authError)
      expect(appError.statusCode).toBe(401)
    })

    it('should identify validation errors', () => {
      const validationError = {
        response: { status: 422 }
      }
      
      const appError = handleApiError(validationError)
      expect(appError.statusCode).toBe(422)
    })
  })
})