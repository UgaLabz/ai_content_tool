import { Card, CardContent, CardFooter } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'

export function CharacterCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            {/* Avatar skeleton */}
            <Skeleton className="w-16 h-16 rounded-full" />
            
            {/* Info skeleton */}
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              
              {/* Traits skeleton */}
              <div className="flex gap-2 mt-3">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-18 rounded-full" />
              </div>
            </div>
          </div>
          
          {/* Menu button skeleton */}
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </CardContent>
      
      <CardFooter className="px-6 py-3 border-t bg-muted/50">
        <div className="flex items-center justify-between w-full text-xs">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      </CardFooter>
    </Card>
  )
}