'use client';

import { ChartRenderer } from '@/components/chat/ChartRenderer';
import { ChartData, ChartConfig } from '@/types/chat';

export default function TestBarChartPage() {
  // Test data for bar chart - similar to what fallback generates
  const fallbackStyleData: ChartData = {
    labels: ['Item 1', 'Item 2', 'Item 3', 'Item 4'],
    datasets: [{
      label: 'Data',
      data: [30, 45, 60, 75],
      backgroundColor: 'rgba(59, 130, 246, 0.5)',
      borderColor: 'rgb(59, 130, 246)',
      borderWidth: 2
    }]
  };

  // Test data with array of colors
  const arrayColorsData: ChartData = {
    labels: ['Item 1', 'Item 2', 'Item 3', 'Item 4'],
    datasets: [{
      label: 'Data',
      data: [30, 45, 60, 75],
      backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
      borderColor: ['#2563eb', '#059669', '#d97706', '#dc2626'],
      borderWidth: 2
    }]
  };

  // Test data with multiple datasets
  const multiDatasetData: ChartData = {
    labels: ['January', 'February', 'March', 'April'],
    datasets: [
      {
        label: 'Sales 2024',
        data: [65, 59, 80, 81],
        backgroundColor: '#3b82f6',
        borderColor: '#2563eb',
      },
      {
        label: 'Sales 2023',
        data: [45, 49, 60, 71],
        backgroundColor: '#10b981',
        borderColor: '#059669',
      }
    ]
  };

  // Pie chart for comparison
  const pieData: ChartData = {
    values: [
      { name: 'Item 1', value: 30, color: '#3b82f6' },
      { name: 'Item 2', value: 45, color: '#10b981' },
      { name: 'Item 3', value: 60, color: '#f59e0b' },
      { name: 'Item 4', value: 75, color: '#ef4444' }
    ]
  };

  const barConfig: ChartConfig = {
    type: 'bar',
    title: 'Test Bar Chart',
    showLegend: true,
    showGrid: true
  };

  const pieConfig: ChartConfig = {
    type: 'pie',
    title: 'Test Pie Chart',
    showLegend: true
  };

  return (
    <div className="container mx-auto p-8 space-y-8">
      <h1 className="text-2xl font-bold mb-4">Bar Chart Testing</h1>
      
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold mb-2">1. Fallback Style (Single Color String)</h2>
          <ChartRenderer data={fallbackStyleData} config={barConfig} />
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">2. Array of Colors</h2>
          <ChartRenderer data={arrayColorsData} config={barConfig} />
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">3. Multiple Datasets</h2>
          <ChartRenderer data={multiDatasetData} config={barConfig} />
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">4. Pie Chart (Working Reference)</h2>
          <ChartRenderer data={pieData} config={pieConfig} />
        </div>
      </div>

      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold mb-2">Debug Info:</h3>
        <pre className="text-xs overflow-auto">
          {JSON.stringify({ fallbackStyleData, arrayColorsData, multiDatasetData }, null, 2)}
        </pre>
      </div>
    </div>
  );
}
