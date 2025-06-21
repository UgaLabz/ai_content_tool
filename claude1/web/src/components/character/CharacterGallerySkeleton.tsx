import { CharacterCardSkeleton } from './CharacterCardSkeleton'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/utils/cn'

interface CharacterGallerySkeletonProps {
  count?: number
  viewMode?: 'grid' | 'list'
  className?: string
}

export function CharacterGallerySkeleton({ 
  count = 6, 
  viewMode = 'grid',
  className 
}: CharacterGallerySkeletonProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Controls skeleton */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="flex-1 h-9" /> {/* Search bar */}
          <Skeleton className="w-[180px] h-9" /> {/* Sort dropdown */}
          <Skeleton className="w-[72px] h-9" /> {/* View toggle */}
        </div>
        
        {/* Filter tags skeleton */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-7 w-18" />
        </div>
      </div>
      
      {/* Results count skeleton */}
      <Skeleton className="h-4 w-32" />
      
      {/* Character grid skeleton */}
      <div
        className={cn(
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
            : 'space-y-4'
        )}
      >
        {Array.from({ length: count }).map((_, i) => (
          <CharacterCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}