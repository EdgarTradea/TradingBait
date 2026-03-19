import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import brain from 'utils/brain';
import { useCurrentUser } from 'app';

// Generate a unique session ID for tracking
const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Track user activity for historical analytics
export const useActivityTracking = () => {
  const location = useLocation();
  const { user } = useCurrentUser();
  const sessionIdRef = useRef<string>(generateSessionId());
  const lastActivityRef = useRef<number>(Date.now());

  // Track page views
  useEffect(() => {
    const trackPageView = async () => {
      try {
        await brain.track_user_event({
          user_id: user?.uid || `anonymous_${Date.now()}`,
          event_type: 'page_view',
          page_path: location.pathname,
          session_id: sessionIdRef.current,
          timestamp: new Date().toISOString(),
          metadata: {
            referrer: document.referrer,
            user_agent: navigator.userAgent.substring(0, 100)
          }
        });
      } catch (error) {
        // Silently fail - don't disrupt user experience
        console.debug('Activity tracking failed:', error);
      }
    };

    trackPageView();
    lastActivityRef.current = Date.now();
  }, [location.pathname, user?.uid]);

  // Track session start
  useEffect(() => {
    const trackSessionStart = async () => {
      try {
        await brain.track_user_event({
          user_id: user?.uid || `anonymous_${Date.now()}`,
          event_type: 'session_start',
          session_id: sessionIdRef.current,
          timestamp: new Date().toISOString(),
          metadata: {
            user_agent: navigator.userAgent.substring(0, 100),
            screen_resolution: `${window.screen.width}x${window.screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          }
        });
      } catch (error) {
        console.debug('Session tracking failed:', error);
      }
    };

    trackSessionStart();
  }, [user?.uid]);

  // Track authentication events
  useEffect(() => {
    if (user?.uid) {
      const trackAuth = async () => {
        try {
          await brain.track_user_event({
            user_id: user.uid,
            event_type: 'login',
            session_id: sessionIdRef.current,
            timestamp: new Date().toISOString(),
            metadata: {
              auth_provider: user.providerData?.[0]?.providerId || 'unknown'
            }
          });
        } catch (error) {
          console.debug('Auth tracking failed:', error);
        }
      };

      trackAuth();
    }
  }, [user?.uid]);

  // Track session end on page unload
  useEffect(() => {
    const trackSessionEnd = async () => {
      const sessionDuration = Math.round((Date.now() - lastActivityRef.current) / 1000 / 60); // minutes
      
      try {
        await brain.track_user_event({
          user_id: user?.uid || `anonymous_${Date.now()}`,
          event_type: 'session_duration',
          session_id: sessionIdRef.current,
          timestamp: new Date().toISOString(),
          metadata: {
            duration: sessionDuration
          }
        });
      } catch (error) {
        console.debug('Session end tracking failed:', error);
      }
    };

    const handleBeforeUnload = () => {
      trackSessionEnd();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      trackSessionEnd();
    };
  }, [user?.uid]);

  return {
    sessionId: sessionIdRef.current,
    trackCustomEvent: async (eventType: string, metadata?: Record<string, any>) => {
      try {
        await brain.track_user_event({
          user_id: user?.uid || `anonymous_${Date.now()}`,
          event_type: eventType,
          session_id: sessionIdRef.current,
          timestamp: new Date().toISOString(),
          metadata
        });
      } catch (error) {
        console.debug('Custom event tracking failed:', error);
      }
    }
  };
};
