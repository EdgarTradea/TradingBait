import type { ReactNode } from "react";
// Import React polyfill to fix preview loading issues
import "../polyfills/react-polyfill";
import { MobileNavigation } from "components/MobileNavigation";
import { PWAInstallPrompt } from "components/PWAInstallPrompt";
import { ErrorBoundary } from "components/ErrorBoundary";
import { DailyIntentionsReminder } from 'components/DailyIntentionsReminder';
import { FloatingIntentionsWidget } from 'components/FloatingIntentionsWidget';
import { SupportChatWidget } from 'components/SupportChatWidget';
import { useEffect, useRef } from "react";
import { optimizeForTouch, handleSafeArea } from "utils/touchOptimizations";
import { initGA } from "utils/analytics";
import { usePageTracking } from "utils/usePageTracking";
import { Toaster } from "@/components/ui/sonner";
import { Footer } from "components/Footer";
import { CookieConsent } from "components/CookieConsent";
import { trackUserAction } from "utils/errorTracking";
import { useCurrentUser } from "app";
import { useLocation } from "react-router-dom";
import { AuthLoadingScreen } from "components/AuthLoadingScreen";
import { useActivityTracking } from "utils/useActivityTracking";
import brain from "utils/brain";


interface Props {
  children: ReactNode;
}

/**
 * A provider wrapping the whole app.
 *
 * You can add multiple providers here by nesting them,
 * and they will all be applied to the app.
 *
 * Note: ThemeProvider is already included in AppWrapper.tsx and does not need to be added here.
 */
export const AppProvider = ({ children }: Props) => {
  // ALL HOOKS MUST BE CALLED AT THE TOP LEVEL - BEFORE ANY EARLY RETURNS
  const { user, loading } = useCurrentUser();
  const location = useLocation();
  const profileInitializedRef = useRef(new Set<string>());
  
  // Initialize activity tracking for real historical data
  const { trackCustomEvent } = useActivityTracking();
  
  // Initialize automatic page tracking for GA4
  usePageTracking();

  // Initialize touch optimizations
  useEffect(() => {
    optimizeForTouch();
    handleSafeArea();
    initGA(); // Initialize Google Analytics 4
  }, []);

  // Auto-create user profile on first authentication
  useEffect(() => {
    if (user && !profileInitializedRef.current.has(user.uid)) {
      profileInitializedRef.current.add(user.uid);
      
      const initializeUserProfile = async () => {
        try {
          await brain.auto_initialize_user();
          console.log("✅ User profile ensured in database for:", user.uid);
        } catch (error: any) {
          // Only log actual errors, not "user already exists" responses
          if (error?.status !== 409) {
            console.log("ℹ️ User profile initialization note:", error?.message || error);
          }
          // Non-critical error, don't block user experience
        }
      };
      
      initializeUserProfile();
    }
  }, [user]);

  // Initialize user analytics tracking with rate limiting
  useEffect(() => {
    if (user) {
      trackUserAction('app_initialized', {
        userId: user.uid,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });
      
      // Track app initialization for historical analytics
      trackCustomEvent('app_initialized', {
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString()
      });
    }
  }, [user, trackCustomEvent]);

  // Track user engagement
  useEffect(() => {
    if (!user) return;

    let isActive = true;
    let lastActivity = Date.now();
    
    const trackActivity = () => {
      lastActivity = Date.now();
      if (!isActive) {
        isActive = true;
        trackUserAction('user_returned', {
          userId: user.uid,
          timestamp: lastActivity
        });
      }
    };
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isActive = false;
        trackUserAction('user_left', {
          userId: user.uid,
          timestamp: Date.now(),
          timeSpent: Date.now() - lastActivity
        });
      } else {
        trackActivity();
      }
    };
    
    // Track mouse movements, clicks, and key presses
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, trackActivity, { passive: true });
    });
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Track session duration
    const sessionTracker = setInterval(() => {
      if (isActive && Date.now() - lastActivity < 30000) { // Active in last 30 seconds
        trackUserAction('session_heartbeat', {
          userId: user.uid,
          timestamp: Date.now()
        });
      }
    }, 60000); // Every minute
    
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, trackActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(sessionTracker);
    };
  }, [user]);

  // NOW THAT ALL HOOKS ARE CALLED, WE CAN DO CONDITIONAL RENDERING
  // Show auth loading screen for protected routes while authentication is loading
  if (loading && location.pathname !== '/' && location.pathname !== '/login') {
    return <AuthLoadingScreen />;
  }

  return (
    <ErrorBoundary
      componentName="AppProvider"
      userId={user?.uid}
      context={{
        page: location.pathname,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      }}
      onError={(error, errorInfo) => {
        // Log errors to console in development
        console.error('App-level error caught:', error, errorInfo);
        
        // Track error in analytics
        trackUserAction('app_error', {
          userId: user?.uid,
          error: error.message,
          stack: error.stack,
          page: location.pathname,
          timestamp: Date.now()
        });
      }}
    >
      {children}
      <ErrorBoundary>
        <DailyIntentionsReminder />
      </ErrorBoundary>
      <ErrorBoundary>
        <FloatingIntentionsWidget />
      </ErrorBoundary>
      <ErrorBoundary>
        <SupportChatWidget />
      </ErrorBoundary>
      <ErrorBoundary>
        <MobileNavigation />
      </ErrorBoundary>
      <ErrorBoundary>
        <PWAInstallPrompt />
      </ErrorBoundary>
      <ErrorBoundary>
        <Footer />
      </ErrorBoundary>
      <ErrorBoundary>
        <CookieConsent />
      </ErrorBoundary>
      <Toaster />
    </ErrorBoundary>
  );
};
