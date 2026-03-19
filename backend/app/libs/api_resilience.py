"""API Resilience utilities for robust error handling and retry logic."""

import asyncio
import functools
import logging
import random
import time
from enum import Enum
from typing import Any, Callable, Optional, Type, Union, Dict, List
from fastapi import HTTPException
from dataclasses import dataclass


class ErrorSeverity(Enum):
    """Classification of error severity levels."""
    LOW = "low"           # User input errors, validation failures
    MEDIUM = "medium"     # Network timeouts, temporary service issues
    HIGH = "high"         # Database connection failures, external API failures
    CRITICAL = "critical" # Security errors, data corruption


class ErrorCategory(Enum):
    """Categories of errors for different handling strategies."""
    USER_ERROR = "user_error"           # 400-level errors caused by user input
    NETWORK_ERROR = "network_error"     # Network connectivity issues
    SERVICE_ERROR = "service_error"     # External service failures
    DATABASE_ERROR = "database_error"   # Database-related failures
    SYSTEM_ERROR = "system_error"       # Internal system errors
    SECURITY_ERROR = "security_error"   # Authentication/authorization errors


@dataclass
class RetryConfig:
    """Configuration for retry behavior."""
    max_attempts: int = 3
    base_delay: float = 1.0  # Base delay in seconds
    max_delay: float = 60.0  # Maximum delay in seconds
    exponential_backoff: bool = True
    jitter: bool = True  # Add randomness to prevent thundering herd
    retryable_errors: List[Type[Exception]] = None
    
    def __post_init__(self):
        if self.retryable_errors is None:
            self.retryable_errors = [
                ConnectionError,
                TimeoutError,
                OSError,  # Network-related errors
            ]


@dataclass
class ErrorContext:
    """Context information for error handling."""
    operation: str
    user_id: Optional[str] = None
    request_id: Optional[str] = None
    additional_data: Optional[Dict] = None


class ResilientError(Exception):
    """Enhanced error class with context and categorization."""
    
    def __init__(
        self,
        message: str,
        category: ErrorCategory = ErrorCategory.SYSTEM_ERROR,
        severity: ErrorSeverity = ErrorSeverity.MEDIUM,
        user_message: Optional[str] = None,
        suggestions: Optional[List[str]] = None,
        context: Optional[ErrorContext] = None,
        original_error: Optional[Exception] = None
    ):
        super().__init__(message)
        self.category = category
        self.severity = severity
        self.user_message = user_message or self._generate_user_message()
        self.suggestions = suggestions or []
        self.context = context
        self.original_error = original_error
        self.timestamp = time.time()
    
    def _generate_user_message(self) -> str:
        """Generate user-friendly error message based on category."""
        messages = {
            ErrorCategory.USER_ERROR: "Please check your input and try again.",
            ErrorCategory.NETWORK_ERROR: "Network connection issue. Please check your internet and try again.",
            ErrorCategory.SERVICE_ERROR: "External service temporarily unavailable. Please try again later.",
            ErrorCategory.DATABASE_ERROR: "Data access issue. Please try again in a moment.",
            ErrorCategory.SYSTEM_ERROR: "System error occurred. Our team has been notified.",
            ErrorCategory.SECURITY_ERROR: "Authentication required. Please log in and try again."
        }
        return messages.get(self.category, "An unexpected error occurred.")
    
    def to_http_exception(self) -> HTTPException:
        """Convert to FastAPI HTTPException with appropriate status code."""
        status_codes = {
            ErrorCategory.USER_ERROR: 400,
            ErrorCategory.NETWORK_ERROR: 503,
            ErrorCategory.SERVICE_ERROR: 502,
            ErrorCategory.DATABASE_ERROR: 503,
            ErrorCategory.SYSTEM_ERROR: 500,
            ErrorCategory.SECURITY_ERROR: 401
        }
        
        status_code = status_codes.get(self.category, 500)
        
        detail = {
            "message": self.user_message,
            "category": self.category.value,
            "severity": self.severity.value,
            "suggestions": self.suggestions
        }
        
        # Add context if available and not sensitive
        if self.context and self.category != ErrorCategory.SECURITY_ERROR:
            detail["operation"] = self.context.operation
            if self.context.request_id:
                detail["request_id"] = self.context.request_id
        
        return HTTPException(status_code=status_code, detail=detail)


def retry_with_backoff(config: RetryConfig = None):
    """Decorator for adding retry logic with exponential backoff."""
    if config is None:
        config = RetryConfig()
    
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs):
            last_exception = None
            
            for attempt in range(config.max_attempts):
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    last_exception = e
                    
                    # Check if error is retryable
                    if not any(isinstance(e, error_type) for error_type in config.retryable_errors):
                        # If it's an HTTPException with 4xx status, don't retry
                        if isinstance(e, HTTPException) and 400 <= e.status_code < 500:
                            raise
                        # If it's a ResilientError with user error category, don't retry
                        if isinstance(e, ResilientError) and e.category == ErrorCategory.USER_ERROR:
                            raise
                        # For other non-retryable errors, convert and raise
                        if not isinstance(e, ResilientError):
                            resilient_error = ResilientError(
                                str(e),
                                category=ErrorCategory.SYSTEM_ERROR,
                                original_error=e
                            )
                            raise resilient_error.to_http_exception()
                        raise
                    
                    # Don't retry on last attempt
                    if attempt == config.max_attempts - 1:
                        break
                    
                    # Calculate delay
                    if config.exponential_backoff:
                        delay = min(config.base_delay * (2 ** attempt), config.max_delay)
                    else:
                        delay = config.base_delay
                    
                    # Add jitter to prevent thundering herd
                    if config.jitter:
                        delay *= (0.5 + random.random() * 0.5)  # 50-100% of calculated delay
                    
                    pass
                    await asyncio.sleep(delay)
            
            # If we get here, all retries failed
            if isinstance(last_exception, ResilientError):
                raise last_exception.to_http_exception()
            
            resilient_error = ResilientError(
                f"Operation failed after {config.max_attempts} attempts: {str(last_exception)}",
                category=ErrorCategory.SERVICE_ERROR,
                suggestions=["Please try again later", "Contact support if the issue persists"],
                original_error=last_exception
            )
            raise resilient_error.to_http_exception()
        
        @functools.wraps(func)
        def sync_wrapper(*args, **kwargs):
            last_exception = None
            
            for attempt in range(config.max_attempts):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    last_exception = e
                    
                    # Same retry logic as async version
                    if not any(isinstance(e, error_type) for error_type in config.retryable_errors):
                        if isinstance(e, HTTPException) and 400 <= e.status_code < 500:
                            raise
                        if isinstance(e, ResilientError) and e.category == ErrorCategory.USER_ERROR:
                            raise
                        if not isinstance(e, ResilientError):
                            resilient_error = ResilientError(
                                str(e),
                                category=ErrorCategory.SYSTEM_ERROR,
                                original_error=e
                            )
                            raise resilient_error.to_http_exception()
                        raise
                    
                    if attempt == config.max_attempts - 1:
                        break
                    
                    if config.exponential_backoff:
                        delay = min(config.base_delay * (2 ** attempt), config.max_delay)
                    else:
                        delay = config.base_delay
                    
                    if config.jitter:
                        delay *= (0.5 + random.random() * 0.5)
                    
                    pass
                    time.sleep(delay)
            
            if isinstance(last_exception, ResilientError):
                raise last_exception.to_http_exception()
            
            resilient_error = ResilientError(
                f"Operation failed after {config.max_attempts} attempts: {str(last_exception)}",
                category=ErrorCategory.SERVICE_ERROR,
                suggestions=["Please try again later", "Contact support if the issue persists"],
                original_error=last_exception
            )
            raise resilient_error.to_http_exception()
        
        # Return appropriate wrapper based on function type
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper
    
    return decorator


def handle_external_service_error(service_name: str, operation: str):
    """Decorator for handling external service errors (OpenAI, Stripe, etc.)."""
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs):
            try:
                return await func(*args, **kwargs)
            except Exception as e:
                error_message = f"{service_name} {operation} failed: {str(e)}"
                
                # Categorize error based on the exception type and message
                if "rate limit" in str(e).lower() or "429" in str(e):
                    category = ErrorCategory.SERVICE_ERROR
                    suggestions = ["Please wait a moment and try again", "Consider upgrading your plan for higher limits"]
                elif "authentication" in str(e).lower() or "401" in str(e) or "403" in str(e):
                    category = ErrorCategory.SECURITY_ERROR
                    suggestions = ["Check your API credentials", "Ensure your account has the required permissions"]
                elif "timeout" in str(e).lower() or "connection" in str(e).lower():
                    category = ErrorCategory.NETWORK_ERROR
                    suggestions = ["Check your internet connection", "Try again in a few moments"]
                else:
                    category = ErrorCategory.SERVICE_ERROR
                    suggestions = [f"Try again later", f"Contact {service_name} support if the issue persists"]
                
                resilient_error = ResilientError(
                    error_message,
                    category=category,
                    severity=ErrorSeverity.MEDIUM,
                    suggestions=suggestions,
                    context=ErrorContext(operation=f"{service_name}:{operation}"),
                    original_error=e
                )
                
                raise resilient_error.to_http_exception()
        
        @functools.wraps(func)
        def sync_wrapper(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                error_message = f"{service_name} {operation} failed: {str(e)}"
                
                if "rate limit" in str(e).lower() or "429" in str(e):
                    category = ErrorCategory.SERVICE_ERROR
                    suggestions = ["Please wait a moment and try again", "Consider upgrading your plan for higher limits"]
                elif "authentication" in str(e).lower() or "401" in str(e) or "403" in str(e):
                    category = ErrorCategory.SECURITY_ERROR
                    suggestions = ["Check your API credentials", "Ensure your account has the required permissions"]
                elif "timeout" in str(e).lower() or "connection" in str(e).lower():
                    category = ErrorCategory.NETWORK_ERROR
                    suggestions = ["Check your internet connection", "Try again in a few moments"]
                else:
                    category = ErrorCategory.SERVICE_ERROR
                    suggestions = [f"Try again later", f"Contact {service_name} support if the issue persists"]
                
                resilient_error = ResilientError(
                    error_message,
                    category=category,
                    severity=ErrorSeverity.MEDIUM,
                    suggestions=suggestions,
                    context=ErrorContext(operation=f"{service_name}:{operation}"),
                    original_error=e
                )
                
                raise resilient_error.to_http_exception()
        
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper
    
    return decorator


def validate_input(validation_fn: Callable, error_message: str = None):
    """Decorator for input validation with user-friendly errors."""
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            try:
                # Run validation
                validation_result = validation_fn(*args, **kwargs)
                if validation_result is False:
                    raise ValueError(error_message or "Invalid input provided")
                
                return func(*args, **kwargs)
            except ValueError as e:
                resilient_error = ResilientError(
                    str(e),
                    category=ErrorCategory.USER_ERROR,
                    severity=ErrorSeverity.LOW,
                    suggestions=["Please check your input and try again", "Ensure all required fields are filled correctly"]
                )
                raise resilient_error.to_http_exception()
        
        return wrapper
    return decorator


class CircuitBreaker:
    """Circuit breaker pattern implementation for external service calls."""
    
    def __init__(self, failure_threshold: int = 5, timeout: float = 60.0):
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.failure_count = 0
        self.last_failure_time = None
        self.state = "closed"  # closed, open, half-open
    
    def can_execute(self) -> bool:
        """Check if the circuit breaker allows execution."""
        if self.state == "closed":
            return True
        elif self.state == "open":
            if time.time() - self.last_failure_time >= self.timeout:
                self.state = "half-open"
                return True
            return False
        else:  # half-open
            return True
    
    def record_success(self):
        """Record a successful execution."""
        self.failure_count = 0
        self.state = "closed"
    
    def record_failure(self):
        """Record a failed execution."""
        self.failure_count += 1
        self.last_failure_time = time.time()
        
        if self.failure_count >= self.failure_threshold:
            self.state = "open"
    
    def __call__(self, func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            if not self.can_execute():
                resilient_error = ResilientError(
                    "Service temporarily unavailable",
                    category=ErrorCategory.SERVICE_ERROR,
                    severity=ErrorSeverity.HIGH,
                    suggestions=["Please try again later", "The service will be available again shortly"]
                )
                raise resilient_error.to_http_exception()
            
            try:
                result = func(*args, **kwargs)
                self.record_success()
                return result
            except Exception as e:
                self.record_failure()
                raise
        
        return wrapper


# Common circuit breakers for external services
openai_circuit_breaker = CircuitBreaker(failure_threshold=3, timeout=30.0)
stripe_circuit_breaker = CircuitBreaker(failure_threshold=5, timeout=60.0)
firebase_circuit_breaker = CircuitBreaker(failure_threshold=3, timeout=30.0)
