'use client';

import { useAuth as useAuthContext } from '@/contexts/AuthContext';

// Re-export the useAuth hook from the context
// This allows us to add additional functionality later if needed
export const useAuth = useAuthContext;

// Additional auth-related hooks can be added here
export function useRequireAuth(redirectUrl: string = '/login') {
  const { currentUser, loading } = useAuth();
  
  if (!loading && !currentUser && typeof window !== 'undefined') {
    window.location.href = redirectUrl;
  }
  
  return { currentUser, loading };
}

export function useIsAuthenticated() {
  const { currentUser, loading } = useAuth();
  return !loading && !!currentUser;
}

export function useIsEmailVerified() {
  const { currentUser, loading } = useAuth();
  return !loading && currentUser?.emailVerified === true;
}

export function useUserRole() {
  const { appUser, loading } = useAuth();
  return {
    role: appUser?.subscription?.tier || 'free',
    isLoading: loading,
    isPremium: appUser?.subscription?.tier === 'premium',
  };
}
