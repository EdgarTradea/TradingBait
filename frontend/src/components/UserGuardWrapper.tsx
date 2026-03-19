import type { ReactNode } from "react";
import { UserGuard, useCurrentUser } from "app";
import { AuthLoadingScreen } from "components/AuthLoadingScreen";

interface UserGuardWrapperProps {
  children: ReactNode;
}

/**
 * A wrapper around UserGuard that provides proper loading state
 * while authentication is resolving
 */
export const UserGuardWrapper = ({ children }: UserGuardWrapperProps) => {
  const { loading } = useCurrentUser();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  return <UserGuard>{children}</UserGuard>;
};
