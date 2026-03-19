import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from 'utils/analytics';

/**
 * Hook to automatically track page views when route changes
 */
export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    // Track page view on route change
    trackPageView(location.pathname + location.search);
  }, [location]);
};

export default usePageTracking;
