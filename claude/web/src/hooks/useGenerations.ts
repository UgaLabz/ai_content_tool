import { useMutation } from '@tanstack/react-query'
import { generationService } from '@/services/api/generation'
import type { GenerationRequest } from '@/types/api.types'
import { useToast } from './useToast'

export function useGeneration() {
  const { error: showError } = useToast()
  
  return useMutation({
    mutationFn: (request: GenerationRequest) => generationService.generate(request),
    onError: (error: Error) => {
      showError('Failed to generate content')
      console.error('Error generating content:', error)
    },
  })
}