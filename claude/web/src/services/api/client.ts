import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { handleApiError } from '@/utils/errors'
import { ApiResponse } from '@/types/api.types'

class ApiClient {
  private client: AxiosInstance
  private abortControllers: Map<string, AbortController> = new Map()

  constructor(baseURL: string = import.meta.env.VITE_API_BASE_URL || '') {
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = this.getAuthToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }

        // Add request ID for tracking
        config.headers['X-Request-ID'] = this.generateRequestId()

        // Log request in debug mode
        if (import.meta.env.VITE_ENABLE_DEBUG === 'true') {
          console.log('API Request:', {
            method: config.method,
            url: config.url,
            data: config.data,
            params: config.params,
          })
        }

        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        // Log response in debug mode
        if (import.meta.env.VITE_ENABLE_DEBUG === 'true') {
          console.log('API Response:', {
            status: response.status,
            url: response.config.url,
            data: response.data,
          })
        }

        return response
      },
      (error) => {
        // Log error in debug mode
        if (import.meta.env.VITE_ENABLE_DEBUG === 'true') {
          console.error('API Error:', error)
        }

        // Handle auth errors globally
        if (error.response?.status === 401) {
          this.handleAuthError()
        }

        return Promise.reject(handleApiError(error))
      }
    )
  }

  private getAuthToken(): string | null {
    // TODO: Implement auth token retrieval
    return localStorage.getItem('auth_token')
  }

  private handleAuthError(): void {
    // TODO: Implement auth error handling (e.g., redirect to login)
    localStorage.removeItem('auth_token')
    window.location.href = '/login'
  }

  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // Generic request methods
  async get<T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.get<ApiResponse<T>>(url, config)
      return response.data
    } catch (error) {
      throw handleApiError(error)
    }
  }

  async post<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.post<ApiResponse<T>>(url, data, config)
      return response.data
    } catch (error) {
      throw handleApiError(error)
    }
  }

  async put<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.put<ApiResponse<T>>(url, data, config)
      return response.data
    } catch (error) {
      throw handleApiError(error)
    }
  }

  async patch<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.patch<ApiResponse<T>>(url, data, config)
      return response.data
    } catch (error) {
      throw handleApiError(error)
    }
  }

  async delete<T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.delete<ApiResponse<T>>(url, config)
      return response.data
    } catch (error) {
      throw handleApiError(error)
    }
  }

  // Cancellable requests
  async getCancellable<T>(
    url: string,
    key: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    // Cancel any existing request with the same key
    this.cancelRequest(key)

    // Create new abort controller
    const controller = new AbortController()
    this.abortControllers.set(key, controller)

    try {
      const response = await this.get<T>(url, {
        ...config,
        signal: controller.signal,
      })
      this.abortControllers.delete(key)
      return response
    } catch (error) {
      this.abortControllers.delete(key)
      throw error
    }
  }

  cancelRequest(key: string): void {
    const controller = this.abortControllers.get(key)
    if (controller) {
      controller.abort()
      this.abortControllers.delete(key)
    }
  }

  cancelAllRequests(): void {
    this.abortControllers.forEach((controller) => controller.abort())
    this.abortControllers.clear()
  }

  // File upload
  async uploadFile<T>(
    url: string,
    file: File,
    additionalData?: Record<string, unknown>,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<T>> {
    const formData = new FormData()
    formData.append('file', file)

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value))
      })
    }

    try {
      const response = await this.client.post<ApiResponse<T>>(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = (progressEvent.loaded / progressEvent.total) * 100
            onProgress(Math.round(progress))
          }
        },
      })
      return response.data
    } catch (error) {
      throw handleApiError(error)
    }
  }

  // Stream response (for real-time generation)
  async *streamPost<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): AsyncGenerator<T, void, unknown> {
    try {
      const response = await this.client.post<ReadableStream<Uint8Array>>(
        url,
        data,
        {
          ...config,
          responseType: 'stream',
        }
      )

      const reader = response.data.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\\n').filter((line) => line.trim())

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue
            
            try {
              yield JSON.parse(data) as T
            } catch (e) {
              console.error('Failed to parse stream data:', e)
            }
          }
        }
      }
    } catch (error) {
      throw handleApiError(error)
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient()

// Export class for testing
export { ApiClient }