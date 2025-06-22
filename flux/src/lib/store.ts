import { create } from 'zustand'
import { GenerationParams } from './api-client'

interface GeneratedImage {
  id: string
  url: string
  prompt: string
  params: GenerationParams
  timestamp: Date
}

interface GenerationState {
  // Current generation
  isGenerating: boolean
  currentPrompt: string
  progress: number
  error: string | null
  
  // History
  history: GeneratedImage[]
  
  // Actions
  setPrompt: (prompt: string) => void
  setGenerating: (isGenerating: boolean) => void
  setProgress: (progress: number) => void
  setError: (error: string | null) => void
  addToHistory: (image: GeneratedImage) => void
  removeFromHistory: (id: string) => void
  clearHistory: () => void
}

export const useGenerationStore = create<GenerationState>((set) => ({
  // Initial state
  isGenerating: false,
  currentPrompt: '',
  progress: 0,
  error: null,
  history: [],
  
  // Actions
  setPrompt: (prompt) => set({ currentPrompt: prompt }),
  setGenerating: (isGenerating) => set({ isGenerating, progress: 0, error: null }),
  setProgress: (progress) => set({ progress }),
  setError: (error) => set({ error, isGenerating: false }),
  addToHistory: (image) => set((state) => ({ 
    history: [image, ...state.history].slice(0, 50) // Keep last 50
  })),
  removeFromHistory: (id) => set((state) => ({
    history: state.history.filter(img => img.id !== id)
  })),
  clearHistory: () => set({ history: [] }),
}))