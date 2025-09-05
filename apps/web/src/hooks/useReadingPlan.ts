import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { ReadingPlan } from '@/types';

interface ReadingPlanProgress {
  totalEntries: number;
  completedEntries: number;
  percentageComplete: number;
  currentStreak: number;
  longestStreak: number;
}

interface UseReadingPlanReturn {
  plan: ReadingPlan | null;
  progress: ReadingPlanProgress | null;
  loading: boolean;
  error: string | null;
  refreshPlan: () => Promise<void>;
  markEntryComplete: (entryIndex: number, notes?: string) => Promise<boolean>;
  markEntryIncomplete: (entryIndex: number) => Promise<boolean>;
  updateEntryNotes: (entryIndex: number, notes: string) => Promise<boolean>;
}

export function useReadingPlan(planId: string | null): UseReadingPlanReturn {
  const { currentUser } = useAuth();
  const [plan, setPlan] = useState<ReadingPlan | null>(null);
  const [progress, setProgress] = useState<ReadingPlanProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlan = useCallback(async () => {
    if (!currentUser || !planId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = await currentUser.getIdToken();
      const response = await fetch(`/api/reading-plans/${planId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reading plan');
      }

      const data = await response.json();
      setPlan(data.plan);
      setProgress(data.progress);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setPlan(null);
      setProgress(null);
    } finally {
      setLoading(false);
    }
  }, [currentUser, planId]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  const updateEntry = async (
    entryIndex: number,
    action: 'complete' | 'incomplete' | 'updateNotes',
    notes?: string
  ): Promise<boolean> => {
    if (!currentUser || !planId) return false;

    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(
        `/api/reading-plans/${planId}/entries/${entryIndex}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action, notes }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update entry');
      }

      const data = await response.json();
      
      // Update local state with new progress
      if (data.progress) {
        setProgress(data.progress);
      }

      // Update the plan's entry locally
      if (plan) {
        const updatedPlan = { ...plan };
        if (action === 'complete') {
          updatedPlan.entries[entryIndex].completed = true;
          updatedPlan.entries[entryIndex].completedAt = new Date();
          if (notes !== undefined) {
            updatedPlan.entries[entryIndex].notes = notes;
          }
        } else if (action === 'incomplete') {
          updatedPlan.entries[entryIndex].completed = false;
          delete updatedPlan.entries[entryIndex].completedAt;
        } else if (action === 'updateNotes' && notes !== undefined) {
          updatedPlan.entries[entryIndex].notes = notes;
        }
        setPlan(updatedPlan);
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update entry');
      return false;
    }
  };

  const markEntryComplete = (entryIndex: number, notes?: string) => 
    updateEntry(entryIndex, 'complete', notes);

  const markEntryIncomplete = (entryIndex: number) => 
    updateEntry(entryIndex, 'incomplete');

  const updateEntryNotes = (entryIndex: number, notes: string) => 
    updateEntry(entryIndex, 'updateNotes', notes);

  return {
    plan,
    progress,
    loading,
    error,
    refreshPlan: fetchPlan,
    markEntryComplete,
    markEntryIncomplete,
    updateEntryNotes,
  };
}
