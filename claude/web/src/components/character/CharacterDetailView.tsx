import { useState } from 'react'
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Share2, 
  Brain, 
  Mic, 
  Clock,
  MessageSquare,
  TrendingUp,
  Calendar,
  Hash
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import type { Character } from '@/types/api.types'
import { cn } from '@/utils/cn'
import { formatDistanceToNow } from '@/utils/date'

interface CharacterDetailViewProps {
  character: Character
  onBack: () => void
  onEdit: (character: Character) => void
  onDelete: (character: Character) => void
  className?: string
}

export function CharacterDetailView({
  character,
  onBack,
  onEdit,
  onDelete,
  className,
}: CharacterDetailViewProps) {
  const [activeTab, setActiveTab] = useState('overview')

  const handleShare = () => {
    // TODO: Implement sharing functionality
    navigator.clipboard.writeText(`Check out my AI character: ${character.name}`)
  }

  const stats = [
    {
      label: 'Total Generations',
      value: character.stats?.totalGenerations || 0,
      icon: Hash,
      color: 'text-blue-600',
    },
    {
      label: 'Avg Response Time',
      value: '2.3s',
      icon: Clock,
      color: 'text-green-600',
    },
    {
      label: 'Consistency Score',
      value: `${character.stats?.consistencyScore || 0}%`,
      icon: TrendingUp,
      color: 'text-purple-600',
    },
    {
      label: 'Last Active',
      value: formatDistanceToNow(character.updatedAt),
      icon: Calendar,
      color: 'text-orange-600',
    },
  ]

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-4">
            {character.avatar ? (
              <img
                src={character.avatar}
                alt={character.name}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                <span className="text-2xl font-semibold text-muted-foreground">
                  {character.name[0]?.toUpperCase()}
                </span>
              </div>
            )}
            
            <div>
              <h1 className="text-3xl font-bold">{character.name}</h1>
              {character.background && (
                <p className="text-muted-foreground mt-1">{character.background}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
          >
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(character)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(character)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <Icon className={cn('h-8 w-8', stat.color)} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="memories">Memories</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Personality Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Personality
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {character.personality?.traits && character.personality.traits.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Traits</h4>
                  <div className="flex flex-wrap gap-2">
                    {character.personality.traits.map((trait, index) => (
                      <Badge key={index} variant="secondary">
                        {trait}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Personality Metrics</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Humor</span>
                      <span>{character.personality?.humor || 0}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Formality</span>
                      <span>{character.personality?.formality || 0}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Enthusiasm</span>
                      <span>{character.personality?.enthusiasm || 0}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Empathy</span>
                      <span>{character.personality?.empathy || 0}%</span>
                    </div>
                  </div>
                </div>

                {character.personality?.quirks && character.personality.quirks.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Quirks</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      {character.personality.quirks.map((quirk, index) => (
                        <li key={index}>{quirk}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Voice Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5" />
                Voice & Style
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {character.voice?.tone && (
                  <div>
                    <h4 className="text-sm font-medium">Tone</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {character.voice.tone}
                    </p>
                  </div>
                )}
                {character.voice?.vocabulary && (
                  <div>
                    <h4 className="text-sm font-medium">Vocabulary</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {character.voice.vocabulary}
                    </p>
                  </div>
                )}
                {character.voice?.sentenceStructure && (
                  <div>
                    <h4 className="text-sm font-medium">Sentence Structure</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {character.voice.sentenceStructure}
                    </p>
                  </div>
                )}
                {character.voice?.languageStyle && (
                  <div>
                    <h4 className="text-sm font-medium">Language Style</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {character.voice.languageStyle}
                    </p>
                  </div>
                )}
              </div>

              {character.catchphrases && character.catchphrases.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Catchphrases</h4>
                  <div className="space-y-2">
                    {character.catchphrases.map((phrase, index) => (
                      <div
                        key={index}
                        className="p-3 bg-muted rounded-md text-sm italic"
                      >
                        "{phrase}"
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Background Section */}
          {character.background && (
            <Card>
              <CardHeader>
                <CardTitle>Background</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {character.background}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="memories" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Memory Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              {character.memoryAnchors && character.memoryAnchors.length > 0 ? (
                <div className="space-y-4">
                  {character.memoryAnchors.map((memory) => (
                    <div key={memory.id} className="border-l-2 border-muted pl-4 pb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 bg-primary rounded-full -ml-5" />
                        <Badge variant="secondary" className="text-xs">
                          {memory.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Importance: {memory.importance}%
                        </span>
                      </div>
                      <p className="text-sm">{memory.content}</p>
                      {memory.context && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Context: {memory.context}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No memory anchors yet. Start generating content to build character memory.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground py-8">
                Analytics coming soon. Track character performance and usage patterns.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}