import { ChartData, ChartConfig, TableData, TableConfig } from '@/types/chat';

/**
 * Fallback visualization generator that creates sample data based on text analysis
 * This is used when Vertex AI is not available
 */
export function generateFallbackVisualization(
  text: string,
  type: string
): { type: 'chart' | 'table'; data: ChartData | TableData; config: ChartConfig | TableConfig } | null {
  const lowerText = text.toLowerCase();
  
  // Extract numbers from text
  const numbers = text.match(/\d+\.?\d*/g)?.map(n => parseFloat(n)) || [];
  
  // Extract potential labels (words before numbers or in quotes)
  const labelMatches = text.match(/(\w+)\s*[:=]\s*\d+|["']([^"']+)["']/g) || [];
  const labels = labelMatches.map(match => {
    const parts = match.split(/[:=]/);
    return parts[0].replace(/["']/g, '').trim();
  });

  if (type === 'table' || type === 'comparison') {
    // Generate a simple table
    const headers = ['Item', 'Value', 'Details'];
    const rows: string[][] = [];
    
    // Try to extract structured data
    if (labels.length > 0 && numbers.length > 0) {
      for (let i = 0; i < Math.min(labels.length, numbers.length); i++) {
        rows.push([labels[i], numbers[i].toString(), 'Sample data']);
      }
    } else {
      // Fallback sample data
      rows.push(['Sample Item 1', '100', 'Description 1']);
      rows.push(['Sample Item 2', '150', 'Description 2']);
      rows.push(['Sample Item 3', '200', 'Description 3']);
    }
    
    return {
      type: 'table',
      data: { headers, rows },
      config: {
        title: 'Data Table',
        sortable: true,
        filterable: true
      }
    };
  } else {
    // Generate a chart
    let chartType: 'bar' | 'line' | 'pie' = 'bar';
    let chartLabels = labels.length > 0 ? labels : ['Item 1', 'Item 2', 'Item 3', 'Item 4'];
    let chartData = numbers.length > 0 ? numbers : [30, 45, 60, 75];
    
    // Adjust based on keywords
    if (lowerText.includes('trend') || lowerText.includes('over time') || lowerText.includes('growth')) {
      chartType = 'line';
      chartLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      chartData = [100, 120, 115, 130, 145, 160];
    } else if (lowerText.includes('percentage') || lowerText.includes('breakdown') || lowerText.includes('distribution')) {
      chartType = 'pie';
      chartLabels = chartLabels.slice(0, 4);
      chartData = chartData.slice(0, 4);
    }
    
    const data: ChartData = chartType === 'pie' ? {
      values: chartLabels.map((label, i) => ({
        name: label,
        value: chartData[i] || 25,
        color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'][i % 4]
      }))
    } : {
      labels: chartLabels,
      datasets: [{
        label: 'Data',
        data: chartData,
        backgroundColor: '#3b82f6',  // Use solid color instead of rgba
        borderColor: '#2563eb',       // Use hex color instead of rgb
        borderWidth: 2
      }]
    };
    
    return {
      type: 'chart',
      data,
      config: {
        type: chartType,
        title: 'Visualization',
        showLegend: true,
        showGrid: chartType !== 'pie'
      }
    };
  }
}
