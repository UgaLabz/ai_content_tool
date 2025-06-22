'use client'

import { useState, useEffect } from 'react'
import { Clock, Download, ExternalLink } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { apiClient } from '@/lib/api-client'
import type { GenerationHistory } from '@/server/types/character'
import Image from 'next/image'

interface GenerationHistoryProps {
  characterId: number
}

export function GenerationHistoryComponent({ characterId }: GenerationHistoryProps) {
  const [history, setHistory] = useState<GenerationHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHistory()
  }, [characterId])

  const loadHistory = async () => {
    try {
      setLoading(true)
      const data = await apiClient.getGenerationHistory(characterId, 20)
      setHistory(data)
    } catch (error) {
      console.error('Failed to load generation history:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Loading generation history...
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">
          No generations yet for this character
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {history.map((item) => (
        <Card key={item.id} className="overflow-hidden group">
          <div className="aspect-square relative">
            <Image
              src={item.image_path}
              alt="Generated image"
              fill
              className="object-cover"
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute bottom-2 left-2 right-2">
                <p className="text-white text-xs truncate mb-1">
                  {formatDate(item.generated_at)}
                </p>
                {item.workflow_type && (
                  <Badge variant="secondary" className="text-xs">
                    {item.workflow_type}
                  </Badge>
                )}
              </div>
              
              <div className="absolute top-2 right-2 flex gap-1">
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => window.open(item.image_path, '_blank')}
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
          
          {item.prompt && (
            <div className="p-2">
              <p className="text-xs text-muted-foreground line-clamp-2">
                {item.prompt}
              </p>
            </div>
          )}
        </Card>
      ))}
    </div>
  )
}