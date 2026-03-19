import React, { useEffect, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserGuardContext, firebaseAuth } from 'app';
import brain from 'utils/brain';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, CreditCard, AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { toast } from 'sonner';

interface SubscriptionGuardProps {
  children: ReactNode;
}

interface UserStatus {
  has_access: boolean;
  status: string;
  subscription_active: boolean;
  access_reason: string;
}

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

const RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 8000   // 8 seconds max
};

/**
 * Subscription guard that ensures only users with active subscriptions can access protected content.
 * Must be used inside a UserGuard component.
 * Includes resilient error handling for infrastructure failures.
 */
export const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({ children }) => {
  const { user } = useUserGuardContext();
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkSubscriptionStatus();
  }, [user]);

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const calculateRetryDelay = (attempt: number): number => {
    const delay = Math.min(
      RETRY_CONFIG.baseDelay * Math.pow(2, attempt),
      RETRY_CONFIG.maxDelay
    );
    return delay + Math.random() * 1000; // Add jitter
  };

  const categorizeError = (error: any): { type: string; message: string; isRetryable: boolean } => {
    const errorMessage = error?.message || String(error);
    
    // Network/Infrastructure errors
    if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('Failed to fetch')) {
      return {
        type: 'network',
        message: 'Network connectivity issue detected. This may be temporary.',
        isRetryable: true
      };
    }
    
    // Server errors (500, 502, 503, 504)
    if (error?.status >= 500 && error?.status < 600) {
      return {
        type: 'server',
        message: 'Server temporarily unavailable. Our team has been notified.',
        isRetryable: true
      };
    }
    
    // Timeout errors
    if (errorMessage.includes('timeout') || errorMessage.includes('aborted')) {
      return {
        type: 'timeout',
        message: 'Request timed out. The service may be experiencing high load.',
        isRetryable: true
      };
    }
    
    // Authentication errors (401, 403)
    if (error?.status === 401 || error?.status === 403) {
      return {
        type: 'auth',
        message: 'Authentication issue. Please refresh the page or log in again.',
        isRetryable: false
      };
    }
    
    // Client errors (400, 404)
    if (error?.status >= 400 && error?.status < 500) {
      return {
        type: 'client',
        message: 'There was an issue with your request. Please refresh the page.',
        isRetryable: false
      };
    }
    
    // Unknown errors
    return {
      type: 'unknown',
      message: 'An unexpected error occurred. Please try again.',
      isRetryable: true
    };
  };

  const checkSubscriptionStatus = async (isRetry: boolean = false) => {
    try {
      if (!isRetry) {
        setLoading(true);
        setRetryCount(0);
      } else {
        setIsRetrying(true);
      }
      
      setError(null);
      
      // Add cache-busting timestamp to force fresh subscription check
      const cacheBuster = Date.now();
      const response = await brain.check_user_status({ _t: cacheBuster });
      
      if (response.ok) {
        const status: UserStatus = await response.json();
        setUserStatus(status);
        setRetryCount(0); // Reset retry count on success
        
        if (isRetry) {
          toast.success('Connection restored successfully!');
        }
      } else {
        console.error('❌ Subscription check failed:', {
          status: response.status,
          statusText: response.statusText,
        });
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      console.error('Error checking subscription status:', err);
      
      const errorInfo = categorizeError(err);
      
      // Only retry if the error is retryable and we haven't exceeded max retries
      if (errorInfo.isRetryable && retryCount < RETRY_CONFIG.maxRetries) {
        const delay = calculateRetryDelay(retryCount);
        console.log(`Retrying subscription check in ${delay}ms (attempt ${retryCount + 1}/${RETRY_CONFIG.maxRetries})`);
        
        setTimeout(async () => {
          setRetryCount(prev => prev + 1);
          await checkSubscriptionStatus(true);
        }, delay);
        
        if (retryCount === 0) {
          setError(`${errorInfo.message} Retrying automatically...`);
        }
      } else {
        // Max retries reached or non-retryable error
        setError(errorInfo.message);
      }
    } finally {
      setLoading(false);
      setIsRetrying(false);
    }
  }

  const handleRetry = async () => {
    setRetryCount(0); // Reset retry count for manual retry
    await checkSubscriptionStatus();
  };

  const handleSubscribe = async () => {
    try {
      setIsCreatingCheckout(true);
      // Use correct domain based on environment
      const baseUrl = window.location.hostname.endsWith('riff.new')
        ? 'https://www.tradingbait.com'
        : window.location.origin;

      const response = await brain.create_stripe_checkout({
        customer_email: user.email || '',
        success_url: baseUrl + '/dashboard?subscribed=true',
        cancel_url: baseUrl + '/renew',
        referral_code: null,
        include_pro_waitlist: false
      });

      if (response.ok) {
        const data = await response.json();
        window.location.href = data.checkout_url;
      } else {
        toast.error('Failed to create checkout session');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      toast.error('Failed to start checkout process');
    } finally {
      setIsCreatingCheckout(false);
    }
  };

  const handleLogout = async () => {
    try {
      await firebaseAuth.signOut();
      navigate('/');
    } catch (e) {
      console.error('Logout failed:', e);
      toast.error('Failed to log out. Please try again.');
    }
  };

  // Show loading state
  if (loading) {
    return (
      <>
        <Button
          variant="outline"
          onClick={handleLogout}
          className="fixed top-4 right-4 z-50 bg-zinc-900/60 border-zinc-700 hover:bg-zinc-800"
        >
          Log out
        </Button>
        <div className="flex h-screen bg-black">
          {/* Sidebar skeleton */}
          <div className="w-64 border-r border-zinc-800 bg-zinc-900/50 p-6">
            <div className="space-y-4">
              <Skeleton className="h-8 w-32 bg-zinc-800" />
              <div className="space-y-2">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full bg-zinc-800" />
                ))}
              </div>
            </div>
          </div>
          
          {/* Main content skeleton */}
          <div className="flex-1 p-8">
            <div className="space-y-6">
              <Skeleton className="h-8 w-64 bg-zinc-800" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-32 bg-zinc-800" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Show error state with enhanced retry and diagnostic info
  if (error) {
    const isNetworkError = error.includes('Network') || error.includes('network');
    const canRetry = retryCount < RETRY_CONFIG.maxRetries;
    
    return (
      <>
        <Button
          variant="outline"
          onClick={handleLogout}
          className="fixed top-4 right-4 z-50 bg-zinc-900/60 border-zinc-700 hover:bg-zinc-800"
        >
          Log out
        </Button>
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <Card className="max-w-md w-full bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-red-400 flex items-center gap-2">
                {isNetworkError ? <WifiOff className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                Connection Error
              </CardTitle>
              <CardDescription className="text-gray-400">
                Unable to verify your subscription status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-zinc-800/50 p-3 rounded-lg border border-zinc-700/50">
                <p className="text-gray-300 text-sm">{error}</p>
                
                {retryCount > 0 && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                    <RefreshCw className="h-3 w-3" />
                    <span>Retry attempt {retryCount}/{RETRY_CONFIG.maxRetries}</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Button 
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                >
                  {isRetrying ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Retrying...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Try Again
                    </>
                  )}
                </Button>
                
                {isNetworkError && (
                  <Button 
                    variant="outline"
                    onClick={() => window.location.reload()}
                    className="w-full bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
                  >
                    <Wifi className="h-4 w-4 mr-2" />
                    Refresh Page
                  </Button>
                )}
                
                <Button 
                  variant="ghost"
                  onClick={() => navigate('/renew')}
                  className="w-full text-gray-400 hover:text-white"
                >
                  Go to Renew
                </Button>
              </div>
              
              {/* Diagnostic info for support */}
              {retryCount >= RETRY_CONFIG.maxRetries && (
                <div className="mt-4 p-2 bg-red-900/20 border border-red-800/30 rounded-lg">
                  <p className="text-xs text-red-300">
                    If this problem persists, please contact support with error code: SUB-{Date.now().toString(36).toUpperCase()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // Check if user has access
  if (userStatus && !userStatus.has_access) {
    return (
      <>
        <Button
          variant="outline"
          onClick={handleLogout}
          className="fixed top-4 right-4 z-50 bg-zinc-900/60 border-zinc-700 hover:bg-zinc-800"
        >
          Log out
        </Button>
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <Card className="max-w-lg w-full bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-orange-400 flex items-center gap-2">
                <CreditCard className="h-6 w-6" />
                Subscription Required
              </CardTitle>
              <CardDescription className="text-gray-400">
                Access to TradingBait requires an active subscription
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-zinc-800/50 p-4 rounded-lg">
                <p className="text-gray-300 text-sm mb-2">
                  <strong>Current Status:</strong> {userStatus.status}
                </p>
                <p className="text-gray-400 text-sm">
                  {userStatus.access_reason}
                </p>
              </div>
              
              <div className="space-y-3">
                <Button 
                  onClick={handleSubscribe}
                  disabled={isCreatingCheckout}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                >
                  {isCreatingCheckout ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Redirecting to Checkout...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Subscribe Now - $24.99/month
                    </>
                  )}
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={checkSubscriptionStatus}
                  className="w-full bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
                >
                  Refresh Status
                </Button>
                
                <Button 
                  variant="ghost"
                  onClick={() => navigate('/renew')}
                  className="w-full text-gray-400 hover:text-white"
                >
                  Go to Renew
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // User has access, render children
  return <>{children}</>;
};
