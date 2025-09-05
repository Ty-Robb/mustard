import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { ExportRequest, ExportJob, ExportStatus } from '@/types/export';

interface UseExportReturn {
  createExport: (request: Omit<ExportRequest, 'userId'>) => Promise<ExportJob | null>;
  getExportJobs: () => Promise<ExportJob[]>;
  getExportJob: (jobId: string) => Promise<ExportJob | null>;
  checkExportStatus: (jobId: string) => Promise<ExportJob | null>;
  downloadExport: (job: ExportJob) => void;
  loading: boolean;
  error: string | null;
}

export function useExport(): UseExportReturn {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeaders = useCallback(async () => {
    if (!currentUser) return null;
    const token = await currentUser.getIdToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }, [currentUser]);

  const createExport = useCallback(async (
    request: Omit<ExportRequest, 'userId'>
  ): Promise<ExportJob | null> => {
    setLoading(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();
      if (!headers) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/exports', {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create export');
      }

      const { job } = await response.json();
      return job;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create export');
      return null;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  const getExportJobs = useCallback(async (): Promise<ExportJob[]> => {
    setLoading(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();
      if (!headers) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/exports', {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch exports');
      }

      const { jobs } = await response.json();
      return jobs;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch exports');
      return [];
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  const getExportJob = useCallback(async (jobId: string): Promise<ExportJob | null> => {
    setLoading(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();
      if (!headers) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/exports/${jobId}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch export job');
      }

      const { job } = await response.json();
      return job;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch export job');
      return null;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  const checkExportStatus = useCallback(async (jobId: string): Promise<ExportJob | null> => {
    // Poll for export status without showing loading state
    try {
      const headers = await getAuthHeaders();
      if (!headers) return null;

      const response = await fetch(`/api/exports/${jobId}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) return null;

      const { job } = await response.json();
      return job;
    } catch {
      return null;
    }
  }, [getAuthHeaders]);

  const downloadExport = useCallback((job: ExportJob) => {
    if (job.status !== ExportStatus.COMPLETED || !job.downloadUrl) {
      setError('Export is not ready for download');
      return;
    }

    // Handle data URL downloads
    if (job.downloadUrl.startsWith('data:')) {
      const link = document.createElement('a');
      link.href = job.downloadUrl;
      link.download = job.metadata?.fileName || `export-${job.id}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Handle regular URL downloads
      window.open(job.downloadUrl, '_blank');
    }
  }, []);

  return {
    createExport,
    getExportJobs,
    getExportJob,
    checkExportStatus,
    downloadExport,
    loading,
    error,
  };
}
