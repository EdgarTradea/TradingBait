/**
 * Error tracking and monitoring utilities for TradingBait
 */

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface ErrorContext {
  componentName?: string;
  userId?: string;
  userAgent?: string;
  url?: string;
  timestamp?: string;
  errorId?: string;
  context?: Record<string, any>;
  componentStack?: string;
  errorBoundary?: string;
  sessionId?: string;
  userActions?: UserAction[];
}

export interface UserAction {
  type: string;
  timestamp: number;
  details?: Record<string, any>;
}

export interface ErrorReport {
  id: string;
  error: {
    message: string;
    stack?: string;
    name: string;
  };
  severity: ErrorSeverity;
  context: ErrorContext;
  timestamp: number;
  resolved?: boolean;
}

/**
 * Global error tracking state
 */
class ErrorTracker {
  private errors: ErrorReport[] = [];
  private userActions: UserAction[] = [];
  private sessionId: string;
  private maxActions = 50; // Keep last 50 user actions
  private maxErrors = 100; // Keep last 100 errors in memory

  constructor() {
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.initializeGlobalErrorHandlers();
  }

  /**
   * Initialize global error handlers
   */
  private initializeGlobalErrorHandlers() {
    // Handle unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      // Filter out ResizeObserver cascade errors - these are not real errors
      if (event.message?.includes('ResizeObserver loop completed with undelivered notifications')) {
        return; // Ignore ResizeObserver cascade errors
      }
      
      this.captureError(
        new Error(event.message),
        ErrorSeverity.HIGH,
        {
          componentName: 'Global',
          url: event.filename,
          context: {
            lineno: event.lineno,
            colno: event.colno,
            type: 'unhandled_error'
          }
        }
      );
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(
        new Error(event.reason?.toString() || 'Unhandled promise rejection'),
        ErrorSeverity.MEDIUM,
        {
          componentName: 'Global',
          context: {
            type: 'unhandled_promise_rejection',
            reason: event.reason
          }
        }
      );
    });
  }

  /**
   * Capture an error with context
   */
  captureError(error: Error, severity: ErrorSeverity, context: ErrorContext = {}) {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const errorReport: ErrorReport = {
      id: errorId,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      severity,
      context: {
        ...context,
        sessionId: this.sessionId,
        userActions: this.getRecentActions(),
        timestamp: new Date().toISOString()
      },
      timestamp: Date.now()
    };

    // Add to memory
    this.errors.unshift(errorReport);
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // Log to console
    console.error(`[ErrorTracker] ${severity.toUpperCase()}:`, errorReport);

    // Store in localStorage for persistence
    this.persistError(errorReport);

    // Send to backend if available
    this.sendToBackend(errorReport);

    return errorId;
  }

  /**
   * Track user actions for error context
   */
  trackUserAction(type: string, details: Record<string, any> = {}) {
    const action: UserAction = {
      type,
      timestamp: Date.now(),
      details
    };

    this.userActions.unshift(action);
    if (this.userActions.length > this.maxActions) {
      this.userActions = this.userActions.slice(0, this.maxActions);
    }
  }

  /**
   * Get recent user actions
   */
  private getRecentActions(): UserAction[] {
    return this.userActions.slice(0, 10); // Last 10 actions
  }

  /**
   * Persist error to localStorage
   */
  private persistError(errorReport: ErrorReport) {
    try {
      const key = `tradingbait_errors_${new Date().toISOString().split('T')[0]}`;
      const existing = localStorage.getItem(key);
      const errors = existing ? JSON.parse(existing) : [];
      
      errors.unshift(errorReport);
      // Keep only last 20 errors per day
      if (errors.length > 20) {
        errors.splice(20);
      }
      
      localStorage.setItem(key, JSON.stringify(errors));
    } catch (e) {
      console.warn('Failed to persist error to localStorage:', e);
    }
  }

  /**
   * Send error to backend
   */
  private async sendToBackend(errorReport: ErrorReport) {
    try {
      // Only send high severity errors to backend to avoid spam
      if (errorReport.severity === ErrorSeverity.HIGH || errorReport.severity === ErrorSeverity.CRITICAL) {
        // Would integrate with your backend API here
        // await brain.reportError(errorReport);
        console.log('Would send to backend:', errorReport.id);
      }
    } catch (e) {
      console.warn('Failed to send error to backend:', e);
    }
  }

  /**
   * Get error statistics
   */
  getErrorStats() {
    const now = Date.now();
    const last24h = now - (24 * 60 * 60 * 1000);
    const lastHour = now - (60 * 60 * 1000);

    const recentErrors = this.errors.filter(e => e.timestamp > last24h);
    const criticalErrors = recentErrors.filter(e => e.severity === ErrorSeverity.CRITICAL);
    const hourlyErrors = this.errors.filter(e => e.timestamp > lastHour);

    return {
      total: this.errors.length,
      last24h: recentErrors.length,
      lastHour: hourlyErrors.length,
      critical: criticalErrors.length,
      byComponent: this.getErrorsByComponent()
    };
  }

  /**
   * Get errors grouped by component
   */
  private getErrorsByComponent() {
    const componentErrors: Record<string, number> = {};
    
    this.errors.forEach(error => {
      const component = error.context.componentName || 'Unknown';
      componentErrors[component] = (componentErrors[component] || 0) + 1;
    });

    return componentErrors;
  }

  /**
   * Get all errors (for debugging)
   */
  getAllErrors(): ErrorReport[] {
    return [...this.errors];
  }

  /**
   * Clear all errors
   */
  clearErrors() {
    this.errors = [];
    // Clear localStorage
    Object.keys(localStorage)
      .filter(key => key.startsWith('tradingbait_errors_'))
      .forEach(key => localStorage.removeItem(key));
  }
}

// Global error tracker instance
const errorTracker = new ErrorTracker();

/**
 * Public API for error tracking
 */
export const captureError = (error: Error, severity: ErrorSeverity, context?: ErrorContext) => {
  return errorTracker.captureError(error, severity, context);
};

export const trackUserAction = (type: string, details?: Record<string, any>) => {
  errorTracker.trackUserAction(type, details);
};

export const getErrorStats = () => {
  return errorTracker.getErrorStats();
};

export const getAllErrors = () => {
  return errorTracker.getAllErrors();
};

export const clearErrors = () => {
  errorTracker.clearErrors();
};

/**
 * React hook for error tracking
 */
export const useErrorTracking = () => {
  return {
    captureError,
    trackUserAction,
    getErrorStats,
    getAllErrors,
    clearErrors
  };
};
