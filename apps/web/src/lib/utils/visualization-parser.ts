import { ChartData, ChartConfig, TableData, TableConfig, ChatAttachment } from '@/types/chat';
import { detectVisualizationNeed } from './visualization-generator';

export interface VisualizationData {
  type: 'chart' | 'table';
  data: ChartData | TableData;
  config: ChartConfig | TableConfig;
}

export class VisualizationParser {
  /**
   * Analyzes text to determine if it should have visualizations added
   */
  static shouldAddVisualization(text: string): boolean {
    const detection = detectVisualizationNeed(text);
    return detection.needsVisualization && detection.confidence > 0.5;
  }

  /**
   * Suggests visualization type based on text content
   */
  static suggestVisualizationType(text: string): 'chart' | 'table' | null {
    const detection = detectVisualizationNeed(text);
    if (!detection.needsVisualization || !detection.suggestedType) {
      return null;
    }
    
    // Map visualization types to our supported types
    switch (detection.suggestedType) {
      case 'chart':
      case 'timeline':
      case 'comparison':
        return 'chart';
      case 'table':
        return 'table';
      default:
        return 'chart';
    }
  }
  /**
   * Detects if a response contains visualization data
   */
  static containsVisualization(content: string): boolean {
    // Check for chart/table blocks
    if (/```chart\s*\n[\s\S]*?```/i.test(content) || /```table\s*\n[\s\S]*?```/i.test(content)) {
      return true;
    }
    
    // Check for JSON blocks that might contain visualization data
    const jsonPattern = /```json\s*(\{[\s\S]*?\})\s*```/g;
    const matches = content.matchAll(jsonPattern);
    
    for (const match of matches) {
      try {
        const json = JSON.parse(match[1]);
        if (json.type === 'chart' || json.type === 'table') {
          return true;
        }
      } catch {
        // Not valid JSON or not visualization data
        continue;
      }
    }
    
    return false;
  }

  /**
   * Extracts visualization data from AI response
   */
  static extractVisualizations(content: string): VisualizationData[] {
    const visualizations: VisualizationData[] = [];
    
    // Extract chart blocks
    const chartPattern = /```chart\s*\n([\s\S]*?)```/gi;
    const chartMatches = content.matchAll(chartPattern);
    
    for (const match of chartMatches) {
      try {
        console.log('[VisualizationParser] Found chart block:', match[1]);
        const json = JSON.parse(match[1]);
        if (json.data && json.config) {
          visualizations.push({
            type: 'chart',
            data: json.data as ChartData,
            config: json.config as ChartConfig
          });
        }
      } catch (error) {
        console.error('[VisualizationParser] Failed to parse chart JSON:', error);
      }
    }
    
    // Extract table blocks
    const tablePattern = /```table\s*\n([\s\S]*?)```/gi;
    const tableMatches = content.matchAll(tablePattern);
    
    for (const match of tableMatches) {
      try {
        console.log('[VisualizationParser] Found table block:', match[1]);
        const json = JSON.parse(match[1]);
        
        // Handle both formats: with explicit data/config or just data at root
        let tableData: TableData;
        let tableConfig: TableConfig = {};
        
        if (json.data) {
          // Format: { data: {...}, config?: {...} }
          tableData = json.data as TableData;
          tableConfig = json.config || {};
        } else if (json.headers && json.rows) {
          // Format: { headers: [...], rows: [...] } - data at root level
          tableData = json as TableData;
        } else {
          console.warn('[VisualizationParser] Invalid table format');
          continue;
        }
        
        visualizations.push({
          type: 'table',
          data: tableData,
          config: tableConfig
        });
      } catch (error) {
        console.error('[VisualizationParser] Failed to parse table JSON:', error);
      }
    }
    
    // Also check for JSON blocks (backward compatibility)
    const jsonPattern = /```json\s*(\{[\s\S]*?\})\s*```/g;
    const jsonMatches = content.matchAll(jsonPattern);
    
    for (const match of jsonMatches) {
      try {
        const json = JSON.parse(match[1]);
        
        if (json.type === 'chart' && json.data && json.config) {
          visualizations.push({
            type: 'chart',
            data: json.data as ChartData,
            config: json.config as ChartConfig
          });
        } else if (json.type === 'table' && json.data && json.config) {
          visualizations.push({
            type: 'table',
            data: json.data as TableData,
            config: json.config as TableConfig
          });
        }
      } catch (error) {
        console.error('[VisualizationParser] Failed to parse JSON:', error);
      }
    }
    
    console.log('[VisualizationParser] Extracted visualizations:', visualizations.length);
    return visualizations;
  }

  /**
   * Removes visualization JSON blocks from content
   */
  static removeVisualizationBlocks(content: string): string {
    let cleanContent = content;
    
    // Remove chart blocks
    cleanContent = cleanContent.replace(/```chart\s*\n[\s\S]*?```/gi, '');
    
    // Remove table blocks
    cleanContent = cleanContent.replace(/```table\s*\n[\s\S]*?```/gi, '');
    
    // Remove JSON blocks that contain visualization data
    const jsonPattern = /```json\s*(\{[\s\S]*?\})\s*```/g;
    cleanContent = cleanContent.replace(jsonPattern, (match, jsonContent) => {
      try {
        const json = JSON.parse(jsonContent);
        if (json.type === 'chart' || json.type === 'table') {
          return ''; // Remove visualization blocks
        }
      } catch {
        // Keep non-visualization JSON blocks
      }
      return match;
    });
    
    return cleanContent.trim();
  }

  /**
   * Creates chat attachments from visualization data
   */
  static createAttachments(visualizations: VisualizationData[]): ChatAttachment[] {
    return visualizations.map((viz, index) => ({
      id: `viz-${Date.now()}-${index}`,
      type: viz.type,
      name: viz.config.title || `${viz.type} ${index + 1}`,
      data: viz.data,
      config: viz.config
    }));
  }

  /**
   * Processes AI response to extract visualizations and clean content
   */
  static processResponse(content: string): {
    cleanContent: string;
    attachments: ChatAttachment[];
  } {
    const visualizations = this.extractVisualizations(content);
    const cleanContent = this.removeVisualizationBlocks(content);
    const attachments = this.createAttachments(visualizations);
    
    return {
      cleanContent,
      attachments
    };
  }

  /**
   * Validates chart data structure
   */
  static validateChartData(data: any): data is ChartData {
    if (!data) return false;
    
    // Check for pie/doughnut format
    if (data.values && Array.isArray(data.values)) {
      return data.values.every((v: any) => 
        typeof v.name === 'string' && 
        typeof v.value === 'number'
      );
    }
    
    // Check for standard chart format
    if (data.labels && data.datasets) {
      return Array.isArray(data.labels) &&
        Array.isArray(data.datasets) &&
        data.datasets.every((ds: any) => 
          typeof ds.label === 'string' &&
          Array.isArray(ds.data)
        );
    }
    
    return false;
  }

  /**
   * Validates table data structure
   */
  static validateTableData(data: any): data is TableData {
    if (!data) return false;
    
    return Array.isArray(data.headers) &&
      Array.isArray(data.rows) &&
      data.headers.every((h: any) => typeof h === 'string') &&
      data.rows.every((row: any) => Array.isArray(row));
  }

  /**
   * Generates sample visualization data for testing
   */
  static generateSampleChart(type: ChartConfig['type']): VisualizationData {
    const baseData: ChartData = {
      labels: ['January', 'February', 'March', 'April', 'May'],
      datasets: [{
        label: 'Sample Data',
        data: [65, 59, 80, 81, 56],
        backgroundColor: '#3b82f6',
        borderColor: '#2563eb'
      }]
    };

    if (type === 'pie' || type === 'doughnut') {
      return {
        type: 'chart',
        data: {
          values: [
            { name: 'Category A', value: 30, color: '#3b82f6' },
            { name: 'Category B', value: 25, color: '#10b981' },
            { name: 'Category C', value: 20, color: '#f59e0b' },
            { name: 'Category D', value: 15, color: '#ef4444' },
            { name: 'Category E', value: 10, color: '#8b5cf6' }
          ]
        },
        config: {
          type,
          title: 'Sample ' + type.charAt(0).toUpperCase() + type.slice(1) + ' Chart',
          showLegend: true
        }
      };
    }

    return {
      type: 'chart',
      data: baseData,
      config: {
        type,
        title: 'Sample ' + type.charAt(0).toUpperCase() + type.slice(1) + ' Chart',
        xAxisLabel: 'Months',
        yAxisLabel: 'Values',
        showLegend: true,
        showGrid: true
      }
    };
  }

  /**
   * Generates sample table data for testing
   */
  static generateSampleTable(): VisualizationData {
    return {
      type: 'table',
      data: {
        headers: ['Name', 'Role', 'Department', 'Years'],
        rows: [
          ['John Smith', 'Pastor', 'Ministry', 15],
          ['Jane Doe', 'Worship Leader', 'Music', 8],
          ['Bob Johnson', 'Youth Pastor', 'Youth', 5],
          ['Mary Williams', 'Administrator', 'Operations', 12],
          ['David Brown', 'Elder', 'Leadership', 20]
        ]
      },
      config: {
        title: 'Church Staff Directory',
        sortable: true,
        filterable: true,
        pagination: true,
        pageSize: 10
      }
    };
  }
}
