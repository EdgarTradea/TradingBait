import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Optimized loading fallback component
export const LoadingFallback = React.memo(() => (
  <div className="flex min-h-screen w-full flex-col bg-background">
    <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
      {/* Header skeleton */}
      <div className="flex h-14 items-center gap-4 border-b bg-muted/40 px-6">
        <Skeleton className="h-8 w-8" />
        <div className="ml-auto flex items-center gap-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
      
      {/* Main content skeleton */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-8">
        <div className="space-y-6">
          {/* Title skeleton */}
          <Skeleton className="h-8 w-48" />
          
          {/* Cards skeleton */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-gray-900 border-gray-800 rounded-lg p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-40" />
              </div>
            ))}
          </div>
          
          {/* Content skeleton */}
          <div className="bg-gray-900/50 border-gray-800 rounded-lg p-4">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
));

LoadingFallback.displayName = 'LoadingFallback';

// Simplified loading spinner for smaller components
export const LoadingSpinner = React.memo(() => (
  <div className="flex items-center justify-center p-4">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
  </div>
));

LoadingSpinner.displayName = 'LoadingSpinner';