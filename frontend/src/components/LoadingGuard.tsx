import type { ReactNode } from "react";
import { useCurrentUser } from "app";
import { Skeleton } from "@/components/ui/skeleton";

interface LoadingGuardProps {
  children: ReactNode;
}

/**
 * A wrapper that provides a proper loading state while authentication is loading
 */
export const LoadingGuard = ({ children }: LoadingGuardProps) => {
  const { loading } = useCurrentUser();

  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        {/* Sidebar skeleton */}
        <div className="hidden lg:block w-64 border-r bg-muted/40 p-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-32" />
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          </div>
        </div>
        
        {/* Main content skeleton */}
        <div className="flex-1 flex flex-col">
          {/* Header skeleton */}
          <div className="h-14 border-b bg-muted/40 flex items-center px-6">
            <Skeleton className="h-8 w-48" />
          </div>
          
          {/* Content skeleton */}
          <div className="flex-1 p-8 space-y-6">
            <Skeleton className="h-8 w-64" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
