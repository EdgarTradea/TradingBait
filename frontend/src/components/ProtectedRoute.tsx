import type { ReactNode } from "react";
import { UserGuard } from "app";
import { SubscriptionGuard } from "components/SubscriptionGuard";

interface ProtectedRouteProps {
  children: ReactNode;
  requiresSubscription?: boolean;
}

/**
 * Combined guard that handles both authentication and subscription verification.
 * - Always requires authentication via UserGuard
 * - Optionally requires active subscription via SubscriptionGuard
 */
export const ProtectedRoute = ({ 
  children, 
  requiresSubscription = true 
}: ProtectedRouteProps) => {
  return (
    <UserGuard>
      {requiresSubscription ? (
        <SubscriptionGuard>
          {children}
        </SubscriptionGuard>
      ) : (
        children
      )}
    </UserGuard>
  );
};
