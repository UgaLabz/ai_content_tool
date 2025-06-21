import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/utils/cn'

interface CharacterPreviewSkeletonProps {
  className?: string
}

export function CharacterPreviewSkeleton({ className }: CharacterPreviewSkeletonProps) {
  return (
    <Card className={cn('p-6', className)}>
      <div className="space-y-6">
        {/* Character Display Skeleton */}
        <div className="flex items-start gap-4">
          <Skeleton className="w-20 h-20 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full max-w-md" />
          </div>
        </div>

        {/* Personality Preview Skeleton */}
        <div>
          <Skeleton className="h-4 w-24 mb-2" />
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-6 w-16 rounded-md" />
              <Skeleton className="h-6 w-20 rounded-md" />
              <Skeleton className="h-6 w-24 rounded-md" />
              <Skeleton className="h-6 w-18 rounded-md" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        </div>

        {/* Voice Preview Skeleton */}
        <div>
          <Skeleton className="h-4 w-32 mb-2" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>

        {/* Sample Generation Skeleton */}
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-9 w-36 rounded-md" />
          </div>
          <Skeleton className="h-24 w-full rounded-md" />
        </div>
      </div>
    </Card>
  )
}