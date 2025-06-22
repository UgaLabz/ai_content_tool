'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Sparkles } from 'lucide-react'
import { useGenerationStore } from '@/lib/store'

interface PromptInputProps {
  onGenerate: (prompt: string) => void
}

export function PromptInput({ onGenerate }: PromptInputProps) {
  const { currentPrompt, setPrompt, isGenerating } = useGenerationStore()
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (currentPrompt.trim() && !isGenerating) {
      onGenerate(currentPrompt.trim())
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="prompt">Prompt</Label>
        <Textarea
          id="prompt"
          placeholder="Describe the image you want to generate..."
          value={currentPrompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="min-h-[100px] resize-none"
          disabled={isGenerating}
        />
      </div>
      
      <Button 
        type="submit" 
        disabled={!currentPrompt.trim() || isGenerating}
        className="w-full"
      >
        <Sparkles className="mr-2 h-4 w-4" />
        {isGenerating ? 'Generating...' : 'Generate Image'}
      </Button>
    </form>
  )
}