import { AxiosError } from 'axios'
import { ApiError } from '@/types/api.types'

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode?: number,
    public details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export const handleApiError = (error: unknown): AppError => {
  if (error instanceof AxiosError) {
    const apiError = error.response?.data?.error as ApiError | undefined
    
    if (apiError) {
      return new AppError(
        apiError.code,
        apiError.message,
        error.response?.status,
        apiError.details
      )
    }

    // Network errors
    if (error.code === 'ECONNABORTED') {
      return new AppError('TIMEOUT', 'Request timed out', 408)
    }
    
    if (error.code === 'ERR_NETWORK') {
      return new AppError('NETWORK_ERROR', 'Network connection failed', 0)
    }

    // Generic HTTP errors
    const status = error.response?.status
    const statusText = error.response?.statusText || 'Unknown error'
    
    return new AppError(
      `HTTP_${status || 'ERROR'}`,
      statusText,
      status
    )
  }

  if (error instanceof AppError) {
    return error
  }

  // Unknown errors
  return new AppError(
    'UNKNOWN_ERROR',
    error instanceof Error ? error.message : 'An unknown error occurred',
    500
  )
}

export const isNetworkError = (error: unknown): boolean => {
  if (error instanceof AxiosError) {
    return error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED'
  }
  return false
}

export const isAuthError = (error: unknown): boolean => {
  if (error instanceof AxiosError) {
    return error.response?.status === 401 || error.response?.status === 403
  }
  if (error instanceof AppError) {
    return error.statusCode === 401 || error.statusCode === 403
  }
  return false
}

export const isValidationError = (error: unknown): boolean => {
  if (error instanceof AxiosError) {
    return error.response?.status === 400 || error.response?.status === 422
  }
  if (error instanceof AppError) {
    return error.statusCode === 400 || error.statusCode === 422
  }
  return false
}

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof AppError) {
    return error.message
  }
  
  if (error instanceof AxiosError) {
    return handleApiError(error).message
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  return 'An unknown error occurred'
}