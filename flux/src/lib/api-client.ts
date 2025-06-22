import axios from 'axios'
import { io, Socket } from 'socket.io-client'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export interface GenerationParams {
  prompt: string
  width?: number
  height?: number
  steps?: number
  seed?: number
  sampler?: string
  scheduler?: string
  outputPath?: string
  filenameOverride?: string
}

export interface GenerationResponse {
  success: boolean
  id: string
  url: string
  params: GenerationParams
}

export interface GenerationStatus {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  progress?: number
  result?: string
  error?: string
}

export interface SystemStats {
  system: {
    os: string
    python_version: string
    embedded_python: boolean
  }
  devices: Array<{
    name: string
    type: string
    index: number
    vram_total: number
    vram_free: number
    torch_vram_total: number
    torch_vram_free: number
  }>
}

class APIClient {
  private socket: Socket | null = null
  private api = axios.create({
    baseURL: API_URL,
    timeout: 120000, // 2 minutes
  })

  constructor() {
    this.initSocket()
  }

  private initSocket() {
    this.socket = io(API_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    })

    this.socket.on('connect', () => {
      console.log('Connected to server')
    })

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server')
    })
  }

  // Health check
  async checkHealth() {
    const response = await this.api.get('/api/health')
    return response.data
  }

  // Get system stats
  async getSystemStats(): Promise<SystemStats> {
    const response = await this.api.get('/api/system')
    return response.data
  }

  // Generate image
  async generateImage(params: GenerationParams): Promise<GenerationResponse> {
    const response = await this.api.post('/api/generate', params)
    return response.data
  }

  // Get generation status
  async getStatus(id: string): Promise<GenerationStatus> {
    const response = await this.api.get(`/api/status/${id}`)
    return response.data
  }

  // Cancel generation
  async cancelGeneration(id: string): Promise<void> {
    await this.api.post(`/api/cancel/${id}`)
  }

  // Upload image
  async uploadImage(file: File): Promise<{ url: string }> {
    const formData = new FormData()
    formData.append('image', file)

    const response = await this.api.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    return response.data
  }

  // Delete image
  async deleteImage(url: string): Promise<void> {
    const urlObj = new URL(url)
    
    // Check if it's a custom path image
    if (urlObj.pathname === '/api/image/custom') {
      const customPath = urlObj.searchParams.get('path')
      if (!customPath) {
        throw new Error('Invalid custom image URL')
      }
      
      await this.api.delete('/api/image/placeholder', {
        params: { customPath }
      })
    } else {
      // Extract filename from URL for ComfyUI images
      const filename = urlObj.searchParams.get('filename')
      const subfolder = urlObj.searchParams.get('subfolder') || ''
      const type = urlObj.searchParams.get('type') || 'output'

      if (!filename) {
        throw new Error('Invalid image URL')
      }

      await this.api.delete(`/api/image/${filename}`, {
        params: { subfolder, type }
      })
    }
  }

  // Get current output path
  async getOutputPath(): Promise<{ path: string }> {
    const response = await this.api.get('/api/output-path')
    return response.data
  }

  // Browse for folder
  async browseFolder(currentPath: string): Promise<{ path: string }> {
    const response = await this.api.post('/api/browse-folder', { currentPath })
    return response.data
  }

  // List images from output folder
  async listImages(path?: string): Promise<{
    images: Array<{
      id: string
      filename: string
      url: string
      path: string
      size: number
      modified: string
      isCustomPath: boolean
    }>
    total: number
    path: string
  }> {
    const response = await this.api.get('/api/images', {
      params: { path }
    })
    return response.data
  }

  // Socket event listeners
  onGenerationStart(callback: (data: { id: string }) => void) {
    this.socket?.on('generation:start', callback)
  }

  onGenerationProgress(callback: (data: { id: string; progress: number }) => void) {
    this.socket?.on('generation:progress', callback)
  }

  onGenerationComplete(callback: (data: { id: string; url: string }) => void) {
    this.socket?.on('generation:complete', callback)
  }

  onGenerationError(callback: (data: { id: string; error: string }) => void) {
    this.socket?.on('generation:error', callback)
  }

  onGenerationCancelled(callback: (data: { id: string }) => void) {
    this.socket?.on('generation:cancelled', callback)
  }

  // Remove socket listeners
  removeAllListeners() {
    this.socket?.removeAllListeners()
  }

  // Disconnect socket
  disconnect() {
    this.socket?.disconnect()
  }
}

// Export singleton instance
export const apiClient = new APIClient()