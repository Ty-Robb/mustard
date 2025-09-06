import { getDatabase } from '@/lib/mongodb';
import { 
  ExportFormat, 
  ExportType, 
  ExportStatus, 
  ExportRequest, 
  ExportJob,
  ExportFilters,
  ExportOptions 
} from '@/types/export';
import { activityService } from './activity.service';
import { format } from 'date-fns';

export class ExportService {
  private static instance: ExportService;

  private constructor() {}

  static getInstance(): ExportService {
    if (!ExportService.instance) {
      ExportService.instance = new ExportService();
    }
    return ExportService.instance;
  }

  async createExportJob(request: ExportRequest): Promise<ExportJob> {
    const db = await getDatabase();
    const collection = db.collection('exportJobs');

    const job: ExportJob = {
      id: `export-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      userId: request.userId,
      type: request.type,
      format: request.format,
      status: ExportStatus.PENDING,
      progress: 0,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    };

    await collection.insertOne(job);
    
    // Process the export asynchronously
    this.processExport(job.id, request).catch(console.error);

    return job;
  }

  async getExportJob(jobId: string, userId: string): Promise<ExportJob | null> {
    const db = await getDatabase();
    const collection = db.collection('exportJobs');
    
    const job = await collection.findOne({ id: jobId, userId });
    return job as ExportJob | null;
  }

  async getUserExportJobs(userId: string): Promise<ExportJob[]> {
    const db = await getDatabase();
    const collection = db.collection('exportJobs');
    
    const jobs = await collection
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();
    
    return jobs as unknown as ExportJob[];
  }

  private async processExport(jobId: string, request: ExportRequest): Promise<void> {
    const db = await getDatabase();
    const collection = db.collection('exportJobs');

    try {
      // Update status to processing
      await collection.updateOne(
        { id: jobId },
        { $set: { status: ExportStatus.PROCESSING, progress: 10 } }
      );

      // Fetch the data based on export type
      const data = await this.fetchExportData(request);
      
      // Update progress
      await collection.updateOne(
        { id: jobId },
        { $set: { progress: 50 } }
      );

      // Format the data based on export format
      const { content, mimeType, fileName } = await this.formatExportData(
        data,
        request.type,
        request.format,
        request.options
      );

      // Update progress
      await collection.updateOne(
        { id: jobId },
        { $set: { progress: 80 } }
      );

      // Store the file (in production, upload to cloud storage)
      const downloadUrl = await this.storeExportFile(content, fileName, mimeType);

      // Update job as completed
      await collection.updateOne(
        { id: jobId },
        {
          $set: {
            status: ExportStatus.COMPLETED,
            progress: 100,
            downloadUrl,
            completedAt: new Date(),
            metadata: {
              recordCount: Array.isArray(data) ? data.length : 1,
              fileSize: content.length,
              fileName,
            },
          },
        }
      );
    } catch (error) {
      console.error('Export processing error:', error);
      await collection.updateOne(
        { id: jobId },
        {
          $set: {
            status: ExportStatus.FAILED,
            error: error instanceof Error ? error.message : 'Export failed',
            completedAt: new Date(),
          },
        }
      );
    }
  }

  private async fetchExportData(request: ExportRequest): Promise<any> {
    const { type, filters, userId } = request;

    switch (type) {
      case ExportType.ACTIVITY_HISTORY:
        return await activityService.getActivities({
          userId,
          startDate: filters?.startDate,
          endDate: filters?.endDate,
          types: filters?.activityTypes as any,
        });

      case ExportType.ACTIVITY_STATS:
        return await activityService.getActivityStats(userId);

      case ExportType.CONTRIBUTION_GRAPH:
        return await activityService.getContributionData(userId, 365);

      case ExportType.COURSE_PROGRESS:
        // TODO: Implement course progress export
        return [];

      case ExportType.QUIZ_RESULTS:
        // TODO: Implement quiz results export
        return [];

      case ExportType.BIBLE_HIGHLIGHTS:
        // TODO: Implement Bible highlights export
        return [];

      case ExportType.PAYMENT_HISTORY:
        // TODO: Implement payment history export
        return [];

      default:
        throw new Error(`Export type ${type} not implemented`);
    }
  }

  private async formatExportData(
    data: any,
    type: ExportType,
    exportFormat: ExportFormat,
    options?: ExportOptions
  ): Promise<{ content: string | Buffer; mimeType: string; fileName: string }> {
    const timestamp = format(new Date(), 'yyyy-MM-dd-HHmmss');
    const baseFileName = `${type}-${timestamp}`;

    switch (exportFormat) {
      case ExportFormat.JSON:
        return {
          content: JSON.stringify(data, null, 2),
          mimeType: 'application/json',
          fileName: `${baseFileName}.json`,
        };

      case ExportFormat.CSV:
        return this.formatAsCSV(data, type, baseFileName, options);

      case ExportFormat.PDF:
        // Simplified PDF - return as formatted text for now
        return {
          content: this.formatAsText(data, type),
          mimeType: 'text/plain',
          fileName: `${baseFileName}.txt`,
        };

      case ExportFormat.EXCEL:
        // For now, return CSV format for Excel
        return this.formatAsCSV(data, type, baseFileName, options);

      default:
        throw new Error(`Export format ${exportFormat} not supported`);
    }
  }

  private formatAsCSV(
    data: any,
    type: ExportType,
    baseFileName: string,
    options?: ExportOptions
  ): { content: string; mimeType: string; fileName: string } {
    let csvContent = '';
    
    switch (type) {
      case ExportType.ACTIVITY_HISTORY:
        // Headers
        csvContent = 'Date/Time,Type,Title,Description\n';
        // Data rows
        data.forEach((activity: any) => {
          const timestamp = format(new Date(activity.timestamp), options?.dateFormat || 'yyyy-MM-dd HH:mm:ss');
          const type = activity.type;
          const title = activity.metadata?.title || '';
          const description = activity.metadata?.description || '';
          csvContent += `"${timestamp}","${type}","${title}","${description}"\n`;
        });
        break;

      case ExportType.CONTRIBUTION_GRAPH:
        // Headers
        csvContent = 'Date,Count,Level\n';
        // Data rows
        data.forEach((item: any) => {
          csvContent += `"${item.date}",${item.count},${item.level}\n`;
        });
        break;

      case ExportType.ACTIVITY_STATS:
        // Headers
        csvContent = 'Metric,Value\n';
        // Data rows
        csvContent += `"Total Activities",${data.totalActivities}\n`;
        csvContent += `"Current Streak","${data.currentStreak} days"\n`;
        csvContent += `"Longest Streak","${data.longestStreak} days"\n`;
        csvContent += `"Active Days",${data.activeDays}\n`;
        break;

      default:
        // Generic CSV conversion
        if (Array.isArray(data) && data.length > 0) {
          const headers = Object.keys(data[0]);
          csvContent = headers.join(',') + '\n';
          data.forEach((row: any) => {
            const values = headers.map(header => {
              const value = row[header];
              return typeof value === 'string' ? `"${value}"` : value;
            });
            csvContent += values.join(',') + '\n';
          });
        }
    }

    return {
      content: csvContent,
      mimeType: 'text/csv',
      fileName: `${baseFileName}.csv`,
    };
  }

  private formatAsText(data: any, type: ExportType): string {
    let content = `${this.getExportTitle(type)}\n`;
    content += `Generated on: ${format(new Date(), 'MMMM dd, yyyy HH:mm')}\n`;
    content += '='.repeat(50) + '\n\n';

    switch (type) {
      case ExportType.ACTIVITY_HISTORY:
        data.forEach((activity: any) => {
          content += `Date/Time: ${format(new Date(activity.timestamp), 'MM/dd/yyyy HH:mm')}\n`;
          content += `Type: ${activity.type}\n`;
          content += `Title: ${activity.metadata?.title || 'N/A'}\n`;
          content += `Description: ${activity.metadata?.description || 'N/A'}\n`;
          content += '-'.repeat(30) + '\n';
        });
        break;

      case ExportType.ACTIVITY_STATS:
        content += `Total Activities: ${data.totalActivities}\n`;
        content += `Current Streak: ${data.currentStreak} days\n`;
        content += `Longest Streak: ${data.longestStreak} days\n`;
        content += `Active Days: ${data.activeDays}\n`;
        content += `Most Active Day: ${data.mostActiveDay}\n\n`;
        
        if (data.activityBreakdown) {
          content += 'Activity Breakdown:\n';
          Object.entries(data.activityBreakdown).forEach(([type, count]) => {
            content += `  ${type}: ${count}\n`;
          });
        }
        break;

      default:
        content += JSON.stringify(data, null, 2);
    }

    return content;
  }

  private async storeExportFile(
    content: string | Buffer,
    fileName: string,
    mimeType: string
  ): Promise<string> {
    // In production, upload to cloud storage (S3, GCS, etc.)
    // For now, we'll store in MongoDB GridFS or return a data URL
    
    // Convert to base64 data URL for temporary storage
    const base64 = Buffer.isBuffer(content) 
      ? content.toString('base64')
      : Buffer.from(content).toString('base64');
    
    return `data:${mimeType};base64,${base64}`;
  }

  private getExportTitle(type: ExportType): string {
    const titles: Record<ExportType, string> = {
      [ExportType.ACTIVITY_HISTORY]: 'Activity History Export',
      [ExportType.ACTIVITY_STATS]: 'Activity Statistics Export',
      [ExportType.CONTRIBUTION_GRAPH]: 'Contribution Graph Export',
      [ExportType.COURSE_PROGRESS]: 'Course Progress Export',
      [ExportType.QUIZ_RESULTS]: 'Quiz Results Export',
      [ExportType.STUDY_NOTES]: 'Study Notes Export',
      [ExportType.BIBLE_HIGHLIGHTS]: 'Bible Highlights Export',
      [ExportType.BIBLE_NOTES]: 'Bible Notes Export',
      [ExportType.READING_HISTORY]: 'Reading History Export',
      [ExportType.PAYMENT_HISTORY]: 'Payment History Export',
      [ExportType.INVOICES]: 'Invoices Export',
      [ExportType.ALL_DATA]: 'Complete Data Export',
    };
    return titles[type] || 'Data Export';
  }
}

export const exportService = ExportService.getInstance();
