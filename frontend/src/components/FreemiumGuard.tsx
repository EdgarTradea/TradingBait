import { UserGuard, useCurrentUser } from 'app';
import { useUserStatus } from 'utils/useUserStatus';
import { FreemiumLandingPage } from 'components/FreemiumLandingPage';
import { useLocation } from 'react-router-dom';
import React from 'react';

interface FreemiumGuardProps {
  children: React.ReactNode;
}

/**
 * Enhanced guard that combines Firebase authentication with payment status checking
 * Shows landing page for non-paying users, full app for paying users
 */
export function FreemiumGuard({ children }: FreemiumGuardProps) {
  const { user, loading: authLoading } = useCurrentUser();
  const { userStatus, loading: statusLoading, error } = useUserStatus();
  const { pathname } = useLocation();

  // Routes that should always be accessible regardless of payment status
  const alwaysAccessibleRoutes = [
    '/',
    '/logout',
    '/login',
    '/settings', // Allow access to settings for account management
    '/privacy-policy',
    '/privacypolicy',
    '/terms-of-service',
    '/termsofservice'
  ];

  // If user is not authenticated, let UserGuard handle the redirect to login
  if (!user) {
    return <UserGuard>{children}</UserGuard>;
  }

  // If user is on an always accessible route, let them through with normal UserGuard
  if (alwaysAccessibleRoutes.includes(pathname)) {
    return <UserGuard>{children}</UserGuard>;
  }

  // Show loading while checking user status
  if (authLoading || statusLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg">Loading...</div>
    </div>;
  }

  // If there's an error checking status, allow access by default to prevent app from being unusable
  // Only restrict access when we have confirmed the user doesn't have access
  if (error) {
    console.warn('Error checking user status, allowing access by default:', error);
    return <UserGuard>{children}</UserGuard>;
  }

  // If we have user status and user doesn't have access, show landing page
  if (userStatus && !userStatus.has_access) {
    console.log(`User ${user.email} doesn't have access - Status: ${userStatus.status}, Reason: ${userStatus.access_reason}`);
    try {
      return <FreemiumLandingPage />;
    } catch (renderError) {
      console.error('Error rendering FreemiumLandingPage:', renderError);
      return <UserGuard>{children}</UserGuard>;
    }
  }

  // If user has access (or we're still loading status), show the protected content with UserGuard
  return <UserGuard>{children}</UserGuard>;
}
