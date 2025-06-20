import { Card, CardContent, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { MoreVertical, Edit, Trash2, Copy } from 'lucide-react'
import type { Character } from '@/types/api.types'
import { cn } from '@/utils/cn'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'

interface CharacterCardProps {
  character: Character
  onEdit?: (character: Character) => void
  onDelete?: (character: Character) => void
  onDuplicate?: (character: Character) => void
  onClick?: (character: Character) => void
  className?: string
}

export function CharacterCard({
  character,
  onEdit,
  onDelete,
  onDuplicate,
  onClick,
  className,
}: CharacterCardProps) {
  // Safety check for invalid character data
  if (!character || !character.name) {
    return null
  }

  const handleCardClick = () => {
    if (onClick) {
      onClick(character)
    }
  }

  const handleAction = (e: React.MouseEvent, action?: () => void) => {
    e.stopPropagation()
    action?.()
  }

  return (
    <Card
      data-testid="character-card"
      className={cn(
        'group cursor-pointer transition-all hover:shadow-md',
        className
      )}
      onClick={handleCardClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            {/* Avatar */}
            {character.avatar ? (
              <img
                src={character.avatar}
                alt={character.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <span className="text-xl font-semibold text-muted-foreground">
                  {character.name?.[0]?.toUpperCase() || '?'}
                </span>
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">{character.name}</h3>
              {character.background && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {character.background}
                </p>
              )}
              
              {/* Traits */}
              {character.personality?.traits && character.personality.traits.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {character.personality.traits.slice(0, 3).map((trait, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {trait}
                    </Badge>
                  ))}
                  {character.personality.traits.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{character.personality.traits.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem
                  onClick={(e) => handleAction(e, () => onEdit(character))}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {onDuplicate && (
                <DropdownMenuItem
                  onClick={(e) => handleAction(e, () => onDuplicate(character))}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </DropdownMenuItem>
              )}
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={(e) => handleAction(e, () => onDelete(character))}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>

      <CardFooter className="px-6 py-3 bg-muted/50">
        <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
          <span>Created: {new Date(character.createdAt).toLocaleDateString()}</span>
          {character.memoryAnchors && character.memoryAnchors.length > 0 && (
            <span>{character.memoryAnchors.length} memory anchors</span>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}