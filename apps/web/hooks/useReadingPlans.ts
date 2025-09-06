import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { ReadingPlan } from '@/types';

interface UseReadingPlansReturn {
  userPlans: ReadingPlan[];
  publicPlans: ReadingPlan[];
  loading: boolean;
  error: string | null;
  refreshPlans: () => Promise<void>;
  createPlan: (data: any) => Promise<ReadingPlan | null>;
  updatePlan: (planId: string, updates: any) => Promise<boolean>;
  deletePlan: (planId: string) => Promise<boolean>;
  clonePlan: (planId: string, name?: string) => Promise<ReadingPlan | null>;
}

export function useReadingPlans(): UseReadingPlansReturn {
  const { currentUser } = useAuth();
  const [userPlans, setUserPlans] = useState<ReadingPlan[]>([]);
  const [publicPlans, setPublicPlans] = useState<ReadingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = await currentUser.getIdToken();
      const response = await fetch('/api/reading-plans?includePublic=true', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reading plans');
      }

      const data = await response.json();
      setUserPlans(data.userPlans || []);
      setPublicPlans(data.publicPlans || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const createPlan = async (data: any): Promise<ReadingPlan | null> => {
    if (!currentUser) return null;

    try {
      const token = await currentUser.getIdToken();
      const response = await fetch('/api/reading-plans', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create reading plan');
      }

      const newPlan = await response.json();
      setUserPlans(prev => [newPlan, ...prev]);
      return newPlan;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create plan');
      return null;
    }
  };

  const updatePlan = async (planId: string, updates: any): Promise<boolean> => {
    if (!currentUser) return false;

    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`/api/reading-plans/${planId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update reading plan');
      }

      // Refresh plans to get updated data
      await fetchPlans();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update plan');
      return false;
    }
  };

  const deletePlan = async (planId: string): Promise<boolean> => {
    if (!currentUser) return false;

    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`/api/reading-plans/${planId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete reading plan');
      }

      setUserPlans(prev => prev.filter(plan => plan._id !== planId));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete plan');
      return false;
    }
  };

  const clonePlan = async (planId: string, name?: string): Promise<ReadingPlan | null> => {
    if (!currentUser) return null;

    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`/api/reading-plans/${planId}/clone`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        throw new Error('Failed to clone reading plan');
      }

      const clonedPlan = await response.json();
      setUserPlans(prev => [clonedPlan, ...prev]);
      return clonedPlan;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clone plan');
      return null;
    }
  };

  return {
    userPlans,
    publicPlans,
    loading,
    error,
    refreshPlans: fetchPlans,
    createPlan,
    updatePlan,
    deletePlan,
    clonePlan,
  };
}
