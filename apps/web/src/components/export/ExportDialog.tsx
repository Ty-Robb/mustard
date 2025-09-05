'use client';

import { useState, useEffect } from 'react';
import { useExport } from '@/hooks/useExport';
import { ExportType, ExportFormat, ExportStatus } from '@/types/export';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, FileDown, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

interface ExportDialogProps {
  children?: React.ReactNode;
}

export function ExportDialog({ children }: ExportDialogProps) {
  const { createExport, checkExportStatus, downloadExport, loading, error } = useExport();
  const [open, setOpen] = useState(false);
  const [exportType, setExportType] = useState<ExportType>(ExportType.ACTIVITY_HISTORY);
  const [exportFormat, setExportFormat] = useState<ExportFormat>(ExportFormat.CSV);
  const [currentJob, setCurrentJob] = useState<any>(null);
  const [polling, setPolling] = useState(false);

  // Poll for export status
  useEffect(() => {
    if (!currentJob || !polling) return;

    const interval = setInterval(async () => {
      const updatedJob = await checkExportStatus(currentJob.id);
      if (updatedJob) {
        setCurrentJob(updatedJob);
        
        if (updatedJob.status === ExportStatus.COMPLETED || 
            updatedJob.status === ExportStatus.FAILED) {
          setPolling(false);
        }
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [currentJob, polling, checkExportStatus]);

  const handleExport = async () => {
    const job = await createExport({
      type: exportType,
      format: exportFormat,
    });

    if (job) {
      setCurrentJob(job);
      setPolling(true);
    }
  };

  const handleDownload = () => {
    if (currentJob) {
      downloadExport(currentJob);
      setOpen(false);
      setCurrentJob(null);
    }
  };

  const getExportTypeLabel = (type: ExportType): string => {
    const labels: Record<ExportType, string> = {
      [ExportType.ACTIVITY_HISTORY]: 'Activity History',
      [ExportType.ACTIVITY_STATS]: 'Activity Statistics',
      [ExportType.CONTRIBUTION_GRAPH]: 'Contribution Graph Data',
      [ExportType.COURSE_PROGRESS]: 'Course Progress',
      [ExportType.QUIZ_RESULTS]: 'Quiz Results',
      [ExportType.STUDY_NOTES]: 'Study Notes',
      [ExportType.BIBLE_HIGHLIGHTS]: 'Bible Highlights',
      [ExportType.BIBLE_NOTES]: 'Bible Notes',
      [ExportType.READING_HISTORY]: 'Reading History',
      [ExportType.PAYMENT_HISTORY]: 'Payment History',
      [ExportType.INVOICES]: 'Invoices',
      [ExportType.ALL_DATA]: 'All Data',
    };
    return labels[type] || type;
  };

  const getFormatLabel = (format: ExportFormat): string => {
    const labels: Record<ExportFormat, string> = {
      [ExportFormat.CSV]: 'CSV (Spreadsheet)',
      [ExportFormat.JSON]: 'JSON (Raw Data)',
      [ExportFormat.PDF]: 'PDF (Document)',
      [ExportFormat.EXCEL]: 'Excel (Spreadsheet)',
    };
    return labels[format] || format;
  };

  const isExportTypeImplemented = (type: ExportType): boolean => {
    return [
      ExportType.ACTIVITY_HISTORY,
      ExportType.ACTIVITY_STATS,
      ExportType.CONTRIBUTION_GRAPH,
    ].includes(type);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export Your Data</DialogTitle>
          <DialogDescription>
            Select the type of data you want to export and the format.
          </DialogDescription>
        </DialogHeader>

        {!currentJob ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="export-type">Data Type</Label>
              <Select
                value={exportType}
                onValueChange={(value) => setExportType(value as ExportType)}
              >
                <SelectTrigger id="export-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(ExportType).map((type) => (
                    <SelectItem 
                      key={type} 
                      value={type}
                      disabled={!isExportTypeImplemented(type)}
                    >
                      {getExportTypeLabel(type)}
                      {!isExportTypeImplemented(type) && ' (Coming Soon)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="export-format">Format</Label>
              <Select
                value={exportFormat}
                onValueChange={(value) => setExportFormat(value as ExportFormat)}
              >
                <SelectTrigger id="export-format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(ExportFormat).map((format) => (
                    <SelectItem key={format} value={format}>
                      {getFormatLabel(format)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              onClick={handleExport} 
              disabled={loading || !isExportTypeImplemented(exportType)}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Export...
                </>
              ) : (
                <>
                  <FileDown className="h-4 w-4 mr-2" />
                  Start Export
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Export Status</span>
                <span className="text-sm text-muted-foreground">
                  {currentJob.status}
                </span>
              </div>

              {currentJob.status === ExportStatus.PROCESSING && (
                <Progress value={currentJob.progress || 0} className="h-2" />
              )}

              {currentJob.status === ExportStatus.COMPLETED && (
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-sm">Export completed successfully!</span>
                </div>
              )}

              {currentJob.status === ExportStatus.FAILED && (
                <div className="flex items-center space-x-2 text-red-600">
                  <XCircle className="h-5 w-5" />
                  <span className="text-sm">
                    {currentJob.error || 'Export failed'}
                  </span>
                </div>
              )}

              {currentJob.metadata && (
                <div className="space-y-1 text-sm text-muted-foreground">
                  {currentJob.metadata.recordCount !== undefined && (
                    <p>Records: {currentJob.metadata.recordCount}</p>
                  )}
                  {currentJob.metadata.fileSize && (
                    <p>Size: {(currentJob.metadata.fileSize / 1024).toFixed(2)} KB</p>
                  )}
                  {currentJob.completedAt && (
                    <p>
                      Completed: {format(new Date(currentJob.completedAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex space-x-2">
              {currentJob.status === ExportStatus.COMPLETED && (
                <Button onClick={handleDownload} className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentJob(null);
                  setPolling(false);
                }}
                className="flex-1"
              >
                {currentJob.status === ExportStatus.COMPLETED ? 'New Export' : 'Cancel'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
