import React, { Component, ReactNode } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { mode, Mode } from 'app';
import { captureError, ErrorSeverity } from 'utils/errorTracking';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  // New monitoring props
  componentName?: string;
  userId?: string;
  context?: Record<string, any>;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  errorId?: string;
  timestamp?: number;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    const timestamp = Date.now();
    const errorId = `error_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
    
    return { 
      hasError: true, 
      error,
      errorId,
      timestamp
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Store error info in state
    this.setState({ errorInfo });
    
    // Enhanced error logging with context
    const errorContext = {
      componentName: this.props.componentName || 'Unknown',
      userId: this.props.userId,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      errorId: this.state.errorId,
      context: this.props.context,
      componentStack: errorInfo.componentStack,
      errorBoundary: errorInfo.errorBoundary
    };
    
    // Log to console for debugging
    console.error('ErrorBoundary caught an error:', {
      error,
      errorInfo,
      context: errorContext
    });
    
    // Capture error for monitoring
    captureError(error, ErrorSeverity.HIGH, errorContext);
    
    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    // Log retry attempt
    console.log('User retrying after error:', this.state.errorId);
    
    // Reset error state
    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined,
      errorId: undefined,
      timestamp: undefined
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isDev = mode === Mode.DEV;

      // Default fallback UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-md w-full space-y-4">
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold">Something went wrong</h3>
                    <p className="text-sm mt-1">
                      An unexpected error occurred while rendering this section of the app.
                    </p>
                  </div>
                  
                  {isDev && this.state.error && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm font-medium">Error Details</summary>
                      <div className="mt-2 space-y-2">
                        <div>
                          <p className="text-xs font-medium">Error ID: {this.state.errorId}</p>
                          <p className="text-xs text-gray-600">Timestamp: {this.state.timestamp ? new Date(this.state.timestamp).toLocaleString() : 'N/A'}</p>
                        </div>
                        <pre className="text-xs bg-red-100 p-2 rounded overflow-auto max-h-32">
                          {this.state.error.toString()}
                        </pre>
                        {this.state.errorInfo?.componentStack && (
                          <details>
                            <summary className="text-xs cursor-pointer">Component Stack</summary>
                            <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-24 mt-1">
                              {this.state.errorInfo.componentStack}
                            </pre>
                          </details>
                        )}
                      </div>
                    </details>
                  )}
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={this.handleRetry}
                      size="sm"
                      variant="outline"
                      className="text-red-700 border-red-300 hover:bg-red-100"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Try Again
                    </Button>
                    <Button
                      onClick={() => window.location.reload()}
                      size="sm"
                      variant="outline"
                      className="text-red-700 border-red-300 hover:bg-red-100"
                    >
                      Refresh Page
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easier usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorFallback?: ReactNode
) {
  return function WithErrorBoundaryComponent(props: P) {
    return (
      <ErrorBoundary fallback={errorFallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

// Hook for error handling in functional components
export function useErrorHandler() {
  return (error: Error, errorInfo?: any) => {
    console.error('Manual error report:', error, errorInfo);
    
    // In a real app, you might want to send this to an error reporting service
    // Example: Sentry.captureException(error);
  };
}
