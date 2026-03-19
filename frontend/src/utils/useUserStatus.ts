import { useState, useEffect } from 'react';
import brain from 'utils/brain';
import { useCurrentUser } from 'app';

export interface UserStatus {
  has_access: boolean;
  status: 'free' | 'pending_payment' | 'pending_approval' | 'approved' | 'rejected';
  application_id?: string;
  payment_status?: string;
  subscription_active: boolean;
  access_reason: string;
}

export interface UseUserStatusReturn {
  userStatus: UserStatus | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to check if the current user has access to the main application
 * Returns user status including payment and approval state
 */
export function useUserStatus(): UseUserStatusReturn {
  const { user, loading: authLoading } = useCurrentUser();
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserStatus = async () => {
    if (!user) {
      setUserStatus(null);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching user status for:', user.email);
      const response = await brain.check_user_status();
      const data = await response.json();
      
      console.log('User status response:', data);
      setUserStatus(data);
    } catch (err) {
      console.error('Failed to fetch user status:', err);
      setError(err instanceof Error ? err.message : 'Failed to check user status');
      
      // Default to free tier on error to avoid breaking the app
      setUserStatus({
        has_access: false,
        status: 'free',
        subscription_active: false,
        access_reason: 'Error checking status - defaulting to free tier'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchUserStatus();
    }
  }, [user, authLoading]);

  return {
    userStatus,
    loading: loading || authLoading,
    error,
    refetch: fetchUserStatus
  };
}
