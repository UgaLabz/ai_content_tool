import { useState } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { PageLayout } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { CharacterCreatorPage } from '@/pages/CharacterCreatorPage'

function App() {
  const [showCharacterCreator, setShowCharacterCreator] = useState(false)

  if (showCharacterCreator) {
    return (
      <MainLayout>
        <CharacterCreatorPage />
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <PageLayout
        title="Welcome to AI Content Studio"
        description="Create and manage AI characters for consistent content generation"
      >
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Create Character</CardTitle>
              <CardDescription>
                Design a new AI personality with unique traits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full"
                onClick={() => setShowCharacterCreator(true)}
              >
                Get Started
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Generate Content</CardTitle>
              <CardDescription>
                Create content with your AI characters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Start Generating
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Content Library</CardTitle>
              <CardDescription>
                Browse and manage your generated content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="secondary" className="w-full">
                View Library
              </Button>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    </MainLayout>
  )
}

export default App