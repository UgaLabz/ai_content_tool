import { useState, useMemo } from 'react'
import { Search, Filter, SortAsc, Grid, List } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { CharacterCard } from './CharacterCard'
import { Character } from '@/types/api.types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { cn } from '@/utils/cn'

interface CharacterGalleryProps {
  characters: Character[]
  onCharacterSelect?: (character: Character) => void
  onCharacterEdit?: (character: Character) => void
  onCharacterDelete?: (character: Character) => void
  onCharacterDuplicate?: (character: Character) => void
  className?: string
}

type SortOption = 'name' | 'created' | 'updated' | 'memories'
type ViewMode = 'grid' | 'list'

export function CharacterGallery({
  characters,
  onCharacterSelect,
  onCharacterEdit,
  onCharacterDelete,
  onCharacterDuplicate,
  className,
}: CharacterGalleryProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('created')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [filterTraits, setFilterTraits] = useState<string[]>([])

  // Get all unique traits from characters
  const allTraits = useMemo(() => {
    const traits = new Set<string>()
    characters.forEach(character => {
      character.personality?.traits?.forEach(trait => traits.add(trait))
    })
    return Array.from(traits).sort()
  }, [characters])

  // Filter and sort characters
  const filteredCharacters = useMemo(() => {
    let filtered = characters

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(character => 
        character.name.toLowerCase().includes(query) ||
        character.bio?.toLowerCase().includes(query) ||
        character.personality?.traits?.some(trait => 
          trait.toLowerCase().includes(query)
        )
      )
    }

    // Trait filter
    if (filterTraits.length > 0) {
      filtered = filtered.filter(character =>
        filterTraits.every(trait =>
          character.personality?.traits?.includes(trait)
        )
      )
    }

    // Sort
    const sorted = [...filtered]
    switch (sortBy) {
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'created':
        sorted.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        break
      case 'updated':
        sorted.sort((a, b) => 
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        )
        break
      case 'memories':
        sorted.sort((a, b) => 
          (b.memories?.length || 0) - (a.memories?.length || 0)
        )
        break
    }

    return sorted
  }, [characters, searchQuery, sortBy, filterTraits])

  const handleTraitToggle = (trait: string) => {
    setFilterTraits(prev => 
      prev.includes(trait)
        ? prev.filter(t => t !== trait)
        : [...prev, trait]
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Controls */}
      <div className="space-y-4">
        {/* Search and View Toggle */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search characters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <SelectTrigger className="w-[180px]">
              <SortAsc className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="created">Recently Created</SelectItem>
              <SelectItem value="updated">Recently Updated</SelectItem>
              <SelectItem value="memories">Most Memories</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1 border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Trait Filters */}
        {allTraits.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span>Filter by traits:</span>
            </div>
            {allTraits.map(trait => (
              <Button
                key={trait}
                variant={filterTraits.includes(trait) ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleTraitToggle(trait)}
                className="h-7"
              >
                {trait}
              </Button>
            ))}
            {filterTraits.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilterTraits([])}
                className="h-7 text-muted-foreground"
              >
                Clear all
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        {filteredCharacters.length === characters.length ? (
          <span>{characters.length} characters</span>
        ) : (
          <span>
            Showing {filteredCharacters.length} of {characters.length} characters
          </span>
        )}
      </div>

      {/* Character Grid/List */}
      {filteredCharacters.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchQuery || filterTraits.length > 0
              ? 'No characters match your filters'
              : 'No characters yet'}
          </p>
        </div>
      ) : (
        <div
          className={cn(
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
              : 'space-y-4'
          )}
        >
          {filteredCharacters.map((character) => (
            <CharacterCard
              key={character.id}
              character={character}
              onClick={onCharacterSelect}
              onEdit={onCharacterEdit}
              onDelete={onCharacterDelete}
              onDuplicate={onCharacterDuplicate}
            />
          ))}
        </div>
      )}
    </div>
  )
}