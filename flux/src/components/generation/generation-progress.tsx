'use client'

import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { useGenerationStore } from '@/lib/store'

export function GenerationProgress() {
  const { isGenerating, progress } = useGenerationStore()
  
  if (!isGenerating) return null
  
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm font-medium">Generating image...</span>
            </div>
            <span className="text-sm text-muted-foreground">{progress}%</span>
          </div>
          
          <Progress value={progress} className="w-full" />
          
          <p className="text-xs text-muted-foreground">
            This may take 10-30 seconds depending on resolution and GPU load.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}