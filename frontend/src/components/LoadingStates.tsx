import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

/**
 * Loading skeleton for dashboard page
 */
export const DashboardSkeleton = React.memo(() => (
  <div className="space-y-6 p-6">
    {/* Header */}
    <div className="space-y-2">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-96" />
    </div>
    
    {/* KPI Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="bg-gray-800/50">
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-3 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
    
    {/* Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="bg-gray-800/50">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
      <Card className="bg-gray-800/50">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  </div>
));

DashboardSkeleton.displayName = 'DashboardSkeleton';

/**
 * Loading skeleton for trades page
 */
export const TradesSkeleton = React.memo(() => (
  <div className="space-y-6 p-6">
    {/* Header with filters */}
    <div className="flex justify-between items-center">
      <Skeleton className="h-8 w-32" />
      <div className="flex gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
    
    {/* Table */}
    <Card className="bg-gray-800/50">
      <CardContent className="p-0">
        <div className="space-y-3 p-4">
          {/* Table header */}
          <div className="flex gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-4 flex-1" />
            ))}
          </div>
          
          {/* Table rows */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              {Array.from({ length: 6 }).map((_, j) => (
                <Skeleton key={j} className="h-6 flex-1" />
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
));

TradesSkeleton.displayName = 'TradesSkeleton';

/**
 * Loading skeleton for analytics page
 */
export const AnalyticsSkeleton = React.memo(() => (
  <div className="space-y-6 p-6">
    {/* Header */}
    <div className="space-y-2">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-4 w-80" />
    </div>
    
    {/* Large chart */}
    <Card className="bg-gray-800/50">
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-96 w-full" />
      </CardContent>
    </Card>
    
    {/* Multiple smaller charts */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="bg-gray-800/50">
          <CardHeader>
            <Skeleton className="h-5 w-36" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
));

AnalyticsSkeleton.displayName = 'AnalyticsSkeleton';

/**
 * Loading skeleton for settings page
 */
export const SettingsSkeleton = React.memo(() => (
  <div className="space-y-6 p-6">
    {/* Header */}
    <div className="space-y-2">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-4 w-64" />
    </div>
    
    {/* Settings sections */}
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i} className="bg-gray-800/50">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
));

SettingsSkeleton.displayName = 'SettingsSkeleton';

/**
 * Generic page loading skeleton
 */
export const GenericPageSkeleton = React.memo(() => (
  <div className="space-y-6 p-6">
    {/* Header */}
    <div className="space-y-2">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-96" />
    </div>
    
    {/* Content */}
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="bg-gray-800/50">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
));

GenericPageSkeleton.displayName = 'GenericPageSkeleton';

/**
 * Loading fallback with error boundary
 */
export const PageLoadingFallback = React.memo(({ 
  type = 'generic' 
}: { 
  type?: 'dashboard' | 'trades' | 'analytics' | 'settings' | 'generic' 
}) => {
  const LoadingComponent = React.useMemo(() => {
    switch (type) {
      case 'dashboard':
        return DashboardSkeleton;
      case 'trades':
        return TradesSkeleton;
      case 'analytics':
        return AnalyticsSkeleton;
      case 'settings':
        return SettingsSkeleton;
      default:
        return GenericPageSkeleton;
    }
  }, [type]);
  
  return (
    <div className="min-h-screen bg-gray-900 text-white animate-pulse">
      <LoadingComponent />
    </div>
  );
});

PageLoadingFallback.displayName = 'PageLoadingFallback';
