/**
 * Frontend API resilience utilities for robust error handling and retry logic.
 */

import { toast } from "sonner";

export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium", 
  HIGH = "high",
  CRITICAL = "critical"
}

export enum ErrorCategory {
  USER_ERROR = "user_error",
  NETWORK_ERROR = "network_error",
  SERVICE_ERROR = "service_error",
  SECURITY_ERROR = "security_error",
  SYSTEM_ERROR = "system_error"
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  exponentialBackoff: boolean;
  jitter: boolean;
  retryableStatusCodes: number[];
}

export interface ErrorResponse {
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  suggestions?: string[];
  operation?: string;
  requestId?: string;
}

export class ResilientError extends Error {
  public readonly category: ErrorCategory;
  public readonly severity: ErrorSeverity;
  public readonly userMessage: string;
  public readonly suggestions: string[];
  public readonly statusCode?: number;
  public readonly originalError?: Error;
  public readonly timestamp: number;

  constructor(
    message: string,
    category: ErrorCategory = ErrorCategory.SYSTEM_ERROR,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    userMessage?: string,
    suggestions: string[] = [],
    statusCode?: number,
    originalError?: Error
  ) {
    super(message);
    this.name = 'ResilientError';
    this.category = category;
    this.severity = severity;
    this.userMessage = userMessage || this.generateUserMessage();
    this.suggestions = suggestions;
    this.statusCode = statusCode;
    this.originalError = originalError;
    this.timestamp = Date.now();
  }

  private generateUserMessage(): string {
    const messages = {
      [ErrorCategory.USER_ERROR]: "Please check your input and try again.",
      [ErrorCategory.NETWORK_ERROR]: "Network connection issue. Please check your internet and try again.",
      [ErrorCategory.SERVICE_ERROR]: "Service temporarily unavailable. Please try again later.",
      [ErrorCategory.SECURITY_ERROR]: "Authentication required. Please log in and try again.",
      [ErrorCategory.SYSTEM_ERROR]: "An unexpected error occurred. Please try again."
    };
    return messages[this.category] || "An unexpected error occurred.";
  }

  showToast(): void {
    const toastFunctions = {
      [ErrorSeverity.LOW]: toast.info,
      [ErrorSeverity.MEDIUM]: toast.warning,
      [ErrorSeverity.HIGH]: toast.error,
      [ErrorSeverity.CRITICAL]: toast.error
    };

    const toastFn = toastFunctions[this.severity] || toast.error;
    toastFn(this.userMessage, {
      description: this.suggestions.length > 0 ? this.suggestions[0] : undefined,
      duration: this.severity === ErrorSeverity.CRITICAL ? 10000 : 5000
    });
  }
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  exponentialBackoff: true,
  jitter: true,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504]
};

export class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private failureThreshold: number = 5,
    private timeout: number = 60000 // milliseconds
  ) {}

  canExecute(): boolean {
    if (this.state === 'closed') {
      return true;
    } else if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime >= this.timeout) {
        this.state = 'half-open';
        return true;
      }
      return false;
    } else { // half-open
      return true;
    }
  }

  recordSuccess(): void {
    this.failureCount = 0;
    this.state = 'closed';
  }

  recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'open';
    }
  }

  getState(): string {
    return this.state;
  }
}

// Circuit breakers for different services
export const apiCircuitBreaker = new CircuitBreaker(3, 30000);
export const externalServiceCircuitBreaker = new CircuitBreaker(5, 60000);

export async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  circuitBreaker?: CircuitBreaker
): Promise<T> {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error | null = null;

  // Check circuit breaker
  if (circuitBreaker && !circuitBreaker.canExecute()) {
    const error = new ResilientError(
      "Service temporarily unavailable",
      ErrorCategory.SERVICE_ERROR,
      ErrorSeverity.HIGH,
      "The service is currently unavailable. Please try again later.",
      ["Please wait a moment and try again", "Check the service status page"]
    );
    throw error;
  }

  for (let attempt = 0; attempt < retryConfig.maxAttempts; attempt++) {
    try {
      const result = await fn();
      
      // Record success in circuit breaker
      if (circuitBreaker) {
        circuitBreaker.recordSuccess();
      }
      
      return result;
    } catch (error) {
      lastError = error as Error;
      
      // Check if error is retryable
      const isRetryable = isRetryableError(error, retryConfig.retryableStatusCodes);
      
      if (!isRetryable || attempt === retryConfig.maxAttempts - 1) {
        // Record failure in circuit breaker
        if (circuitBreaker) {
          circuitBreaker.recordFailure();
        }
        
        // Convert to ResilientError if needed
        if (!(error instanceof ResilientError)) {
          throw convertToResilientError(error as Error);
        }
        throw error;
      }

      // Calculate delay for next attempt
      const delay = calculateDelay(attempt, retryConfig);
      console.log(`Retry attempt ${attempt + 1}/${retryConfig.maxAttempts} after ${delay}ms`);
      
      await sleep(delay);
    }
  }

  // This should never be reached, but just in case
  if (circuitBreaker) {
    circuitBreaker.recordFailure();
  }
  
  throw convertToResilientError(lastError!);
}

function isRetryableError(error: any, retryableStatusCodes: number[]): boolean {
  // Network errors are generally retryable
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return true;
  }
  
  // Check status codes
  if (error.response?.status) {
    return retryableStatusCodes.includes(error.response.status);
  }
  
  // Check for specific error types
  if (error instanceof ResilientError) {
    return error.category === ErrorCategory.NETWORK_ERROR || 
           error.category === ErrorCategory.SERVICE_ERROR;
  }
  
  return false;
}

function calculateDelay(attempt: number, config: RetryConfig): number {
  let delay: number;
  
  if (config.exponentialBackoff) {
    delay = Math.min(config.baseDelay * Math.pow(2, attempt), config.maxDelay);
  } else {
    delay = config.baseDelay;
  }
  
  // Add jitter to prevent thundering herd
  if (config.jitter) {
    delay *= (0.5 + Math.random() * 0.5); // 50-100% of calculated delay
  }
  
  return Math.floor(delay);
}

function convertToResilientError(error: Error): ResilientError {
  // Try to parse error response for more context
  let category = ErrorCategory.SYSTEM_ERROR;
  let severity = ErrorSeverity.MEDIUM;
  let suggestions: string[] = [];
  let userMessage: string | undefined;
  let statusCode: number | undefined;

  // Check if it's a fetch error
  if (error.message.includes('fetch') || error.message.includes('network')) {
    category = ErrorCategory.NETWORK_ERROR;
    suggestions = ["Check your internet connection", "Try again in a moment"];
  }
  
  // Try to extract status code and details from response
  const errorString = error.toString();
  if (errorString.includes('400')) {
    category = ErrorCategory.USER_ERROR;
    severity = ErrorSeverity.LOW;
    statusCode = 400;
  } else if (errorString.includes('401') || errorString.includes('403')) {
    category = ErrorCategory.SECURITY_ERROR;
    severity = ErrorSeverity.MEDIUM;
    statusCode = parseInt(errorString.match(/\d{3}/)?.[0] || '401');
  } else if (errorString.includes('429')) {
    category = ErrorCategory.SERVICE_ERROR;
    severity = ErrorSeverity.MEDIUM;
    statusCode = 429;
    suggestions = ["Please wait a moment and try again", "You may be making requests too quickly"];
  } else if (errorString.includes('5')) {
    category = ErrorCategory.SERVICE_ERROR;
    severity = ErrorSeverity.HIGH;
    statusCode = parseInt(errorString.match(/5\d{2}/)?.[0] || '500');
  }

  return new ResilientError(
    error.message,
    category,
    severity,
    userMessage,
    suggestions,
    statusCode,
    error
  );
}

export function parseApiError(response: Response, responseData?: any): ResilientError {
  let category: ErrorCategory;
  let severity: ErrorSeverity;
  let suggestions: string[] = [];
  let userMessage: string;

  // Determine category and severity based on status code
  if (response.status >= 400 && response.status < 500) {
    if (response.status === 401 || response.status === 403) {
      category = ErrorCategory.SECURITY_ERROR;
      severity = ErrorSeverity.MEDIUM;
      suggestions = ["Please log in and try again", "Check your permissions"];
    } else if (response.status === 429) {
      category = ErrorCategory.SERVICE_ERROR;
      severity = ErrorSeverity.MEDIUM;
      suggestions = ["Please wait a moment and try again", "You may be making requests too quickly"];
    } else {
      category = ErrorCategory.USER_ERROR;
      severity = ErrorSeverity.LOW;
      suggestions = ["Please check your input and try again"];
    }
  } else if (response.status >= 500) {
    category = ErrorCategory.SERVICE_ERROR;
    severity = ErrorSeverity.HIGH;
    suggestions = ["Please try again later", "Contact support if the issue persists"];
  } else {
    category = ErrorCategory.SYSTEM_ERROR;
    severity = ErrorSeverity.MEDIUM;
  }

  // Extract user message from response
  if (responseData?.detail) {
    if (typeof responseData.detail === 'string') {
      userMessage = responseData.detail;
    } else if (responseData.detail.message) {
      userMessage = responseData.detail.message;
      if (responseData.detail.suggestions) {
        suggestions = responseData.detail.suggestions;
      }
    } else {
      userMessage = JSON.stringify(responseData.detail);
    }
  } else if (responseData?.message) {
    userMessage = responseData.message;
  } else {
    userMessage = `HTTP ${response.status}: ${response.statusText}`;
  }

  return new ResilientError(
    `API Error: ${userMessage}`,
    category,
    severity,
    userMessage,
    suggestions,
    response.status
  );
}

// Enhanced API call wrapper
export async function callApiWithResilience<T>(
  apiCall: () => Promise<Response>,
  config: Partial<RetryConfig> = {},
  circuitBreaker?: CircuitBreaker
): Promise<T> {
  return retryWithBackoff(async () => {
    const response = await apiCall();
    
    if (!response.ok) {
      let responseData;
      try {
        responseData = await response.json();
      } catch {
        // If we can't parse the response, use the status text
        responseData = { message: response.statusText };
      }
      
      const error = parseApiError(response, responseData);
      throw error;
    }
    
    return response.json() as Promise<T>;
  }, config, circuitBreaker);
}

// Helper function for showing user-friendly error messages
export function handleApiError(error: any, defaultMessage: string = "An unexpected error occurred"): void {
  if (error instanceof ResilientError) {
    error.showToast();
  } else {
    const resilientError = convertToResilientError(error);
    resilientError.showToast();
  }
  
  // Log the full error for debugging
  console.error('API Error:', error);
}

// Hook for API calls with automatic error handling
export function useResilientApi() {
  return {
    callApi: callApiWithResilience,
    handleError: handleApiError,
    retryWithBackoff,
    circuitBreaker: apiCircuitBreaker
  };
}
