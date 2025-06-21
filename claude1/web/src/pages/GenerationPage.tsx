import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ArrowLeft, Sparkles, ImageIcon, Video, FileText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { Textarea } from '@/components/ui/Textarea'
import { Label } from '@/components/ui/Label'
import { Alert } from '@/components/ui/Alert'
import { useToast } from '@/hooks/useToast'
import { generationService } from '@/services/api/generation.service'
import type { Character } from '@/types/api.types'
import type { GenerationResponse } from '@/services/api/generation.service'

export function GenerationPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(
    location.state?.selectedCharacter || null
  )
  const [prompt, setPrompt] = useState('')
  const [contentType, setContentType] = useState('meme')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<GenerationResponse | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [videoDuration, setVideoDuration] = useState<number>(30)
  const [platform, setPlatform] = useState<string>('twitter')

  useEffect(() => {
    // If a character was passed in navigation state, use it
    if (location.state?.selectedCharacter) {
      setSelectedCharacter(location.state.selectedCharacter)
    }
  }, [location.state])

  const handleGenerate = async () => {
    if (!selectedCharacter || !prompt) return

    setIsGenerating(true)
    setGeneratedContent(null)
    
    try {
      let response: GenerationResponse
      
      switch (contentType) {
        case 'meme':
          response = await generationService.generateMeme(
            selectedCharacter,
            prompt,
            selectedTemplate
          )
          break
        case 'video':
          response = await generationService.generateVideoScript(
            selectedCharacter,
            prompt,
            videoDuration
          )
          break
        case 'post':
          response = await generationService.generateSocialPost(
            selectedCharacter,
            prompt,
            platform
          )
          break
        default:
          throw new Error('Invalid content type')
      }
      
      setGeneratedContent(response)
      toast({
        title: 'Content Generated!',
        description: `Your ${contentType} has been created successfully.`,
        variant: 'success'
      })
    } catch (error) {
      console.error('Generation error:', error)
      toast({
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'Failed to generate content. Please try again.',
        variant: 'error'
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-primary" />
              Content Generation Hub
            </h1>
            <p className="text-muted-foreground">
              Create amazing content with your AI characters
            </p>
          </div>
        </div>
      </div>

      {/* Selected Character */}
      {selectedCharacter && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              {selectedCharacter.avatar ? (
                <img
                  src={selectedCharacter.avatar}
                  alt={selectedCharacter.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-xl font-semibold text-muted-foreground">
                    {selectedCharacter.name?.[0]?.toUpperCase() || '?'}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Generating as</p>
                <p className="font-semibold text-lg">{selectedCharacter.name}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/characters')}
              >
                Change Character
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content Type Selection */}
      <Tabs value={contentType} onValueChange={setContentType}>
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="meme" className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Meme
          </TabsTrigger>
          <TabsTrigger value="video" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            Video Script
          </TabsTrigger>
          <TabsTrigger value="post" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Social Post
          </TabsTrigger>
        </TabsList>

        <TabsContent value="meme" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create a Meme</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="meme-prompt">What's your meme idea?</Label>
                <Textarea
                  id="meme-prompt"
                  placeholder="E.g., 'Create a meme about debugging code at 3am'"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Popular Templates</Label>
                <div className="grid grid-cols-3 gap-2">
                  {['Drake', 'Distracted Boyfriend', 'Woman Yelling at Cat', 'Expanding Brain', 'This is Fine', 'Custom'].map((template) => (
                    <Button
                      key={template}
                      variant={selectedTemplate === template ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedTemplate(template)}
                    >
                      {template}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="video" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generate Video Script</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="video-prompt">What's your video about?</Label>
                <Textarea
                  id="video-prompt"
                  placeholder="E.g., 'Create a 30-second TikTok about the struggles of being a developer'"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Video Length</Label>
                <div className="grid grid-cols-4 gap-2">
                  {[15, 30, 60].map((duration) => (
                    <Button
                      key={duration}
                      variant={videoDuration === duration ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() => setVideoDuration(duration)}
                    >
                      {duration}s
                    </Button>
                  ))}
                  <Button
                    variant={videoDuration && ![15, 30, 60].includes(videoDuration) ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => {
                      const custom = prompt('Enter custom duration in seconds:', '45')
                      if (custom && !isNaN(Number(custom))) {
                        setVideoDuration(Number(custom))
                      }
                    }}
                  >
                    Custom
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="post" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Write Social Post</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="post-prompt">What do you want to post about?</Label>
                <Textarea
                  id="post-prompt"
                  placeholder="E.g., 'Write a Twitter thread about why AI makes us more creative'"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Platform</Label>
                <div className="grid grid-cols-3 gap-2">
                  {['twitter', 'linkedin', 'instagram'].map((p) => (
                    <Button
                      key={p}
                      variant={platform === p ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() => setPlatform(p)}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                      {p === 'twitter' && '/X'}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Generate Button */}
      <div className="flex justify-center">
        <Button
          size="lg"
          onClick={handleGenerate}
          disabled={!selectedCharacter || !prompt || isGenerating}
          className="min-w-[200px]"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Generate {contentType === 'meme' ? 'Meme' : contentType === 'video' ? 'Script' : 'Post'}
            </>
          )}
        </Button>
      </div>

      {/* Output Area */}
      <Card>
        <CardHeader>
          <CardTitle>Generated Content</CardTitle>
        </CardHeader>
        <CardContent>
          {generatedContent ? (
            <div className="space-y-4">
              {/* Generated Content */}
              <div className="p-4 bg-muted rounded-lg">
                <pre className="whitespace-pre-wrap font-sans">{generatedContent.content}</pre>
              </div>
              
              {/* Consistency Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                <div className="text-center p-2 bg-background rounded border">
                  <p className="text-muted-foreground">Overall</p>
                  <p className="font-semibold">{Math.round(generatedContent.consistency.overall)}%</p>
                </div>
                <div className="text-center p-2 bg-background rounded border">
                  <p className="text-muted-foreground">Personality</p>
                  <p className="font-semibold">{Math.round(generatedContent.consistency.personality)}%</p>
                </div>
                <div className="text-center p-2 bg-background rounded border">
                  <p className="text-muted-foreground">Voice</p>
                  <p className="font-semibold">{Math.round(generatedContent.consistency.voice)}%</p>
                </div>
                <div className="text-center p-2 bg-background rounded border">
                  <p className="text-muted-foreground">Knowledge</p>
                  <p className="font-semibold">{Math.round(generatedContent.consistency.knowledge)}%</p>
                </div>
                <div className="text-center p-2 bg-background rounded border">
                  <p className="text-muted-foreground">Emotional</p>
                  <p className="font-semibold">{Math.round(generatedContent.consistency.emotional)}%</p>
                </div>
              </div>
              
              {/* Metadata */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span>Model: {generatedContent.modelId}</span>
                  <span>Provider: {generatedContent.providerId}</span>
                  <span>Time: {generatedContent.metadata.generationTime}ms</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedContent.content)
                      toast({
                        title: 'Copied!',
                        description: 'Content copied to clipboard',
                        variant: 'success'
                      })
                    }}
                  >
                    Copy
                  </Button>
                  <Button variant="outline" size="sm">
                    Save to Library
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Your generated content will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}