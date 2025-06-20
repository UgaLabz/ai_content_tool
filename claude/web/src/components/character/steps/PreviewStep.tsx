import { UseFormReturn } from 'react-hook-form'
import { User, Sparkles, MessageSquare, Info } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { CharacterFormData } from '@/types/character.types'
import { Button } from '@/components/ui/Button'
import { useState } from 'react'

interface PreviewStepProps {
  form: UseFormReturn<CharacterFormData>
}

export function PreviewStep({ form }: PreviewStepProps) {
  const { watch } = form
  const character = watch()
  const [isGenerating, setIsGenerating] = useState(false)
  const [sampleResponse, setSampleResponse] = useState('')

  const handleGenerateSample = async () => {
    setIsGenerating(true)
    // Simulate API call
    setTimeout(() => {
      setSampleResponse(
        `Hey there! I'm ${character.name}, and I'm excited to help you create amazing content. ${
          character.catchphrases?.[0] || "Let's make something awesome together!"
        }`
      )
      setIsGenerating(false)
    }, 1500)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Character Preview</h3>
        <p className="text-sm text-muted-foreground">
          Review your character before creating
        </p>
      </div>

      <div className="grid gap-4">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              {character.avatar ? (
                <img
                  src={character.avatar}
                  alt={character.name}
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <User className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div>
                <h4 className="text-lg font-semibold">{character.name}</h4>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personality */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Personality
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Traits</p>
              <div className="flex flex-wrap gap-2">
                {character.personality.traits.map((trait) => (
                  <Badge key={trait} variant="secondary">
                    {trait}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Humor:</span>
                <span className="ml-2">{character.personality.humor}%</span>
              </div>
              <div>
                <span className="text-muted-foreground">Formality:</span>
                <span className="ml-2">{character.personality.formality}%</span>
              </div>
              <div>
                <span className="text-muted-foreground">Enthusiasm:</span>
                <span className="ml-2">{character.personality.enthusiasm}%</span>
              </div>
              <div>
                <span className="text-muted-foreground">Empathy:</span>
                <span className="ml-2">{character.personality.empathy}%</span>
              </div>
            </div>

            {character.personality.quirks && character.personality.quirks.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Quirks</p>
                <div className="flex flex-wrap gap-2">
                  {character.personality.quirks.map((quirk, index) => (
                    <Badge key={index} variant="outline">
                      {quirk}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Voice */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Voice & Style
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-1 gap-2">
              <div>
                <span className="text-muted-foreground">Tone:</span>
                <span className="ml-2">{character.voice.tone}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Vocabulary:</span>
                <span className="ml-2">{character.voice.vocabulary}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Sentence Structure:</span>
                <span className="ml-2">{character.voice.sentenceStructure}</span>
              </div>
              {character.voice.languageStyle && (
                <div>
                  <span className="text-muted-foreground">Language Style:</span>
                  <span className="ml-2">{character.voice.languageStyle}</span>
                </div>
              )}
            </div>

            {character.voice.speechPatterns && character.voice.speechPatterns.length > 0 && (
              <div>
                <p className="font-medium mb-1">Speech Patterns</p>
                <div className="space-y-1">
                  {character.voice.speechPatterns.map((pattern, index) => (
                    <div key={index} className="text-muted-foreground">
                      "{pattern}"
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Details */}
        {(character.background || (character.catchphrases && character.catchphrases.length > 0)) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                Additional Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {character.background && (
                <div>
                  <p className="text-sm font-medium mb-1">Background</p>
                  <p className="text-sm text-muted-foreground">
                    {character.background}
                  </p>
                </div>
              )}
              
              {character.catchphrases && character.catchphrases.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Catchphrases</p>
                  <div className="space-y-1">
                    {character.catchphrases.map((phrase, index) => (
                      <div key={index} className="text-sm text-muted-foreground">
                        "{phrase}"
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Sample Generation */}
        <Card>
          <CardHeader>
            <CardTitle>Test Your Character</CardTitle>
            <CardDescription>
              Generate a sample response to see your character in action
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              type="button"
              onClick={handleGenerateSample}
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? 'Generating...' : 'Generate Sample Response'}
            </Button>
            
            {sampleResponse && (
              <div className="rounded-md bg-muted p-4">
                <p className="text-sm italic">{sampleResponse}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}