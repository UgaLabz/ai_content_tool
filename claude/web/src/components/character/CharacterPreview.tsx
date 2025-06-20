import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Label } from '@/components/ui/Label'
import { Sparkles, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Character } from '@/types/api.types'
import { CharacterFormData } from '@/types/character.types'
import { generationService } from '@/services/api/generation'
import { cn } from '@/utils/cn'

interface CharacterPreviewProps {
  formData: CharacterFormData
  className?: string
}

export function CharacterPreview({ formData, className }: CharacterPreviewProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [sampleContent, setSampleContent] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Convert form data to character format for preview
  const character: Partial<Character> = {
    name: formData.name,
    avatar: formData.avatar,
    personality: formData.personality,
    voice: formData.voice,
    catchphrases: formData.catchphrases,
    bio: formData.bio,
    background: formData.background,
    relationships: formData.relationships || [],
    memories: [],
  }

  const generateSample = async () => {
    if (!character.name) {
      setError('Please provide a character name first')
      return
    }

    setIsGenerating(true)
    setError(null)
    setSampleContent('')

    try {
      const response = await generationService.generate({
        prompt: 'Introduce yourself in a few sentences that showcase your personality.',
        character_id: 'preview', // Special ID for preview
        character, // Pass character data directly
        options: {
          temperature: 0.8,
          max_tokens: 150,
        },
      })

      if (response.content) {
        setSampleContent(response.content)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate sample')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card className={cn('p-6', className)}>
      <div className="space-y-6">
        {/* Character Display */}
        <div className="flex items-start gap-4">
          {character.avatar ? (
            <img
              src={character.avatar}
              alt={character.name || 'Character'}
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
              <span className="text-2xl text-muted-foreground">
                {character.name?.[0]?.toUpperCase() || '?'}
              </span>
            </div>
          )}
          
          <div className="flex-1">
            <h3 className="text-xl font-semibold">
              {character.name || 'Unnamed Character'}
            </h3>
            {character.bio && (
              <p className="text-sm text-muted-foreground mt-1">
                {character.bio}
              </p>
            )}
          </div>
        </div>

        {/* Personality Preview */}
        {character.personality && (
          <div>
            <Label className="text-sm font-medium">Personality</Label>
            <div className="mt-2 space-y-2">
              {character.personality.traits && character.personality.traits.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {character.personality.traits.map((trait, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm"
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                {character.personality.humor !== undefined && (
                  <div>
                    <span className="text-muted-foreground">Humor:</span>
                    <span className="ml-2">{Math.round(character.personality.humor * 100)}%</span>
                  </div>
                )}
                {character.personality.formality !== undefined && (
                  <div>
                    <span className="text-muted-foreground">Formality:</span>
                    <span className="ml-2">{Math.round(character.personality.formality * 100)}%</span>
                  </div>
                )}
                {character.personality.enthusiasm !== undefined && (
                  <div>
                    <span className="text-muted-foreground">Enthusiasm:</span>
                    <span className="ml-2">{Math.round(character.personality.enthusiasm * 100)}%</span>
                  </div>
                )}
                {character.personality.empathy !== undefined && (
                  <div>
                    <span className="text-muted-foreground">Empathy:</span>
                    <span className="ml-2">{Math.round(character.personality.empathy * 100)}%</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Voice Preview */}
        {character.voice && (
          <div>
            <Label className="text-sm font-medium">Voice & Style</Label>
            <div className="mt-2 space-y-2 text-sm">
              {character.voice.tone && (
                <div>
                  <span className="text-muted-foreground">Tone:</span>
                  <span className="ml-2">{character.voice.tone}</span>
                </div>
              )}
              {character.voice.vocabulary && (
                <div>
                  <span className="text-muted-foreground">Vocabulary:</span>
                  <span className="ml-2">{character.voice.vocabulary}</span>
                </div>
              )}
              {character.voice.sentence_structure && (
                <div>
                  <span className="text-muted-foreground">Sentence Structure:</span>
                  <span className="ml-2">{character.voice.sentence_structure}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Catchphrases */}
        {character.catchphrases && character.catchphrases.length > 0 && (
          <div>
            <Label className="text-sm font-medium">Catchphrases</Label>
            <div className="mt-2 space-y-1">
              {character.catchphrases.map((phrase, index) => (
                <p key={index} className="text-sm italic text-muted-foreground">
                  "{phrase}"
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Sample Generation */}
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <Label className="text-sm font-medium">Sample Generation</Label>
            <Button
              type="button"
              size="sm"
              onClick={generateSample}
              disabled={isGenerating || !character.name}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Sample
                </>
              )}
            </Button>
          </div>
          
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
              {error}
            </div>
          )}
          
          {sampleContent && (
            <div className="p-4 bg-muted rounded-md">
              <p className="text-sm whitespace-pre-wrap">{sampleContent}</p>
            </div>
          )}
          
          {!sampleContent && !error && !isGenerating && (
            <div className="p-4 bg-muted/50 rounded-md text-center">
              <p className="text-sm text-muted-foreground">
                Click "Generate Sample" to see how your character would introduce themselves
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}