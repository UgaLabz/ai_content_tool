import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  Hash,
  Plus,
  Filter,
  BarChart3,
  Settings,
  Download,
  Video,
  FileText,
  Image as ImageIcon
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import type { Character } from '@/types/api.types'
import { cn } from '@/utils/cn'
import { formatDistanceToNow } from '@/utils/date'
import { Progress } from '@/components/ui/Progress'

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
  const navigate = useNavigate()

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
                  {character.name?.[0]?.toUpperCase() || '?'}
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="content">Recent Content</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Performance Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Consistency Score</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">92%</span>
                    <Badge variant="outline" className="text-green-600">
                      +3%
                    </Badge>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Content Generated</p>
                  <p className="text-3xl font-bold">
                    {character.stats?.totalGenerations || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">All time</p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Avg Response Time</p>
                  <p className="text-3xl font-bold">
                    {character.stats?.averageResponseTime || 0}s
                  </p>
                  <p className="text-xs text-muted-foreground">Last 30 days</p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Quality Rating</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">4.8</span>
                    <span className="text-sm text-muted-foreground">/5</span>
                  </div>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "h-2 w-4 rounded-sm",
                          i < 4 ? "bg-primary" : "bg-muted"
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="flex gap-2 mt-6">
                <Button 
                  size="lg" 
                  className="flex-1"
                  onClick={() => {
                    // Navigate to generation page with this character pre-selected
                    navigate('/generate', { 
                      state: { 
                        selectedCharacter: character 
                      } 
                    })
                  }}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Generate Content
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => {
                    // TODO: Show full analytics
                    setActiveTab('analytics')
                  }}
                >
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Full Stats
                </Button>
              </div>
            </CardContent>
          </Card>

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

        <TabsContent value="content" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Recent Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Content Type Filters */}
                <div className="flex items-center justify-between pb-4 border-b">
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm">
                      <Filter className="mr-2 h-3 w-3" />
                      All
                    </Button>
                    <Button variant="outline" size="sm">
                      <ImageIcon className="mr-2 h-3 w-3" />
                      Memes
                    </Button>
                    <Button variant="outline" size="sm">
                      <Video className="mr-2 h-3 w-3" />
                      Scripts
                    </Button>
                    <Button variant="outline" size="sm">
                      <FileText className="mr-2 h-3 w-3" />
                      Posts
                    </Button>
                  </div>
                  <Button 
                    size="sm"
                    onClick={() => {
                      navigate('/generate', { 
                        state: { 
                          selectedCharacter: character 
                        } 
                      })
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Generate New
                  </Button>
                </div>
                
                {/* Recent Content List */}
                <div className="space-y-3">
                  {/* Example content items - will be replaced with real data */}
                  <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors">
                    <div className="w-16 h-16 rounded bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
                      <ImageIcon className="h-8 w-8" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">Drake Meme</p>
                          <p className="text-xs text-muted-foreground">Generated 2 hours ago</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-purple-600 border-purple-600">
                            <ImageIcon className="mr-1 h-3 w-3" />
                            Meme
                          </Badge>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm mt-2 line-clamp-2">
                        "When they say AI can't understand humor vs When AI drops a fire meme"
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          2.3k views
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          45 comments
                        </span>
                        <span className="flex items-center gap-1">
                          <Share2 className="h-3 w-3" />
                          12 shares
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors">
                    <div className="w-16 h-16 rounded bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white">
                      <Video className="h-8 w-8" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">TikTok Script - 30s</p>
                          <p className="text-xs text-muted-foreground">Generated yesterday</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-blue-600 border-blue-600">
                            <Video className="mr-1 h-3 w-3" />
                            Video
                          </Badge>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm mt-2 line-clamp-2">
                        "POV: You're explaining to your boomer boss why AI won't steal their job..."
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          30 seconds
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          5.1k views
                        </span>
                        <span className="flex items-center gap-1">
                          <Hash className="h-3 w-3" />
                          #AI #Tech #Comedy
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors">
                    <div className="w-16 h-16 rounded bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white">
                      <FileText className="h-8 w-8" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">Twitter Thread</p>
                          <p className="text-xs text-muted-foreground">Generated 3 days ago</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <FileText className="mr-1 h-3 w-3" />
                            Post
                          </Badge>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm mt-2 line-clamp-2">
                        "Thread: Why AI-generated content is actually making us MORE creative, not less 🧵"
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          5 tweets
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          1.2k impressions
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          23 replies
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Load More */}
                <div className="flex justify-center pt-4">
                  <Button variant="outline" size="sm">
                    Load More Content
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6 mt-6">
          {/* Usage Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Usage Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Total Generations</p>
                  <p className="text-3xl font-bold">{character.stats?.totalGenerations || 0}</p>
                  <p className="text-xs text-green-600">+12% from last month</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Avg Daily Usage</p>
                  <p className="text-3xl font-bold">8.3</p>
                  <p className="text-xs text-muted-foreground">generations per day</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Most Active Time</p>
                  <p className="text-3xl font-bold">2-4 PM</p>
                  <p className="text-xs text-muted-foreground">Peak usage hours</p>
                </div>
              </div>
              
              {/* Placeholder for chart */}
              <div className="mt-6 h-64 bg-muted rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">Usage trend chart will be displayed here</p>
              </div>
            </CardContent>
          </Card>
          
          {/* Content Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Content Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <ImageIcon className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="font-medium">Memes</p>
                      <p className="text-sm text-muted-foreground">156 generated</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">89% success rate</p>
                    <p className="text-sm text-muted-foreground">Avg 2.1k views</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Video className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Video Scripts</p>
                      <p className="text-sm text-muted-foreground">42 generated</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">94% success rate</p>
                    <p className="text-sm text-muted-foreground">Avg 5.3k views</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Social Posts</p>
                      <p className="text-sm text-muted-foreground">89 generated</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">76% success rate</p>
                    <p className="text-sm text-muted-foreground">Avg 890 impressions</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Character Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Generation Settings */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Generation Preferences</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label htmlFor="creativity" className="text-sm">
                      Creativity Level
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        id="creativity"
                        min="0"
                        max="100"
                        defaultValue="70"
                        className="w-32 accent-primary"
                      />
                      <span className="text-sm text-muted-foreground w-10">70%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label htmlFor="consistency" className="text-sm">
                      Voice Consistency
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        id="consistency"
                        min="0"
                        max="100"
                        defaultValue="85"
                        className="w-32 accent-primary"
                      />
                      <span className="text-sm text-muted-foreground w-10">85%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label htmlFor="humor-level" className="text-sm">
                      Humor Intensity
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        id="humor-level"
                        min="0"
                        max="100"
                        defaultValue={character.personality?.humor || 50}
                        className="w-32 accent-primary"
                      />
                      <span className="text-sm text-muted-foreground w-10">
                        {character.personality?.humor || 50}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Content Restrictions */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Content Restrictions</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="accent-primary" />
                    <span className="text-sm">Family-friendly content only</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="accent-primary" />
                    <span className="text-sm">Avoid controversial topics</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="accent-primary" />
                    <span className="text-sm">Include character catchphrases</span>
                  </label>
                </div>
              </div>
              
              {/* Default Templates */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Preferred Templates</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Drake Meme</Badge>
                  <Badge variant="secondary">Expanding Brain</Badge>
                  <Badge variant="secondary">30s TikTok</Badge>
                  <Badge variant="secondary">Twitter Thread</Badge>
                  <Button variant="outline" size="sm">
                    <Plus className="mr-1 h-3 w-3" />
                    Add Template
                  </Button>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button>
                  Save Settings
                </Button>
                <Button variant="outline">
                  Reset to Defaults
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}