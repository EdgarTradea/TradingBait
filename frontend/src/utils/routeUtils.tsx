import React from 'react';
import { PageLoadingFallback } from '../components/LoadingStates';
import { mode, Mode } from 'app';

/**
 * Route-specific loading fallbacks for better UX during code splitting
 */
export const RouteLoadingFallbacks = {
  Dashboard: () => <PageLoadingFallback type="dashboard" />,
  Trades: () => <PageLoadingFallback type="trades" />,
  Analytics: () => <PageLoadingFallback type="analytics" />,
  Settings: () => <PageLoadingFallback type="settings" />,
  Generic: () => <PageLoadingFallback type="generic" />,
};

/**
 * Enhanced Suspense wrapper with route-specific fallbacks
 */
export const RouteSuspense = React.memo(({ 
  children, 
  fallback 
}: { 
  children: React.ReactNode;
  fallback?: React.ComponentType;
}) => {
  const FallbackComponent = fallback || RouteLoadingFallbacks.Generic;
  
  return (
    <React.Suspense fallback={<FallbackComponent />}>
      {children}
    </React.Suspense>
  );
});

RouteSuspense.displayName = 'RouteSuspense';

/**
 * Error boundary for lazy-loaded components
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class LazyLoadErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy load error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error!} />;
    }

    return this.props.children;
  }
}

/**
 * Default error fallback for lazy load failures
 */
const DefaultErrorFallback = React.memo(({ error }: { error: Error }) => (
  <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
    <div className="text-center space-y-4">
      <h2 className="text-xl font-semibold text-red-400">Failed to load page</h2>
      <p className="text-gray-400">There was an error loading this page. Please try refreshing.</p>
      <button 
        onClick={() => window.location.reload()} 
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
      >
        Refresh Page
      </button>
      {mode === Mode.DEV && (
        <details className="mt-4 text-left">
          <summary className="cursor-pointer text-sm text-gray-500">Error Details</summary>
          <pre className="mt-2 text-xs text-gray-600 whitespace-pre-wrap">{error.message}</pre>
        </details>
      )}
    </div>
  </div>
));

DefaultErrorFallback.displayName = 'DefaultErrorFallback';

/**
 * Enhanced wrapper for lazy-loaded routes with error boundary
 */
export const LazyRouteWrapper = React.memo(({ 
  children, 
  fallback,
  errorFallback 
}: { 
  children: React.ReactNode;
  fallback?: React.ComponentType;
  errorFallback?: React.ComponentType<{ error: Error }>;
}) => (
  <LazyLoadErrorBoundary fallback={errorFallback}>
    <RouteSuspense fallback={fallback}>
      {children}
    </RouteSuspense>
  </LazyLoadErrorBoundary>
));

LazyRouteWrapper.displayName = 'LazyRouteWrapper';
