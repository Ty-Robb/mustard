'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import { ChartData, ChartConfig } from '@/types/chat';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ChartRendererProps {
  data: ChartData;
  config: ChartConfig;
  className?: string;
}

// Default color palette - more vibrant for dark theme
const DEFAULT_COLORS = [
  '#60a5fa', // blue-400
  '#34d399', // emerald-400
  '#fbbf24', // amber-400
  '#f87171', // red-400
  '#a78bfa', // violet-400
  '#f472b6', // pink-400
  '#2dd4bf', // teal-400
  '#fb923c', // orange-400
];

// Custom tooltip styling
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover/95 backdrop-blur-sm border border-border/50 rounded-lg p-3 shadow-xl">
        <p className="text-sm font-medium mb-1 text-popover-foreground">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Get theme colors from CSS variables
const getThemeColor = (variable: string) => {
  if (typeof window === 'undefined') return '#9ca3af'; // Default fallback
  const root = document.documentElement;
  const style = getComputedStyle(root);
  const value = style.getPropertyValue(variable).trim();
  
  // If it's an oklch color, we need to convert it
  if (value.startsWith('oklch')) {
    // For now, return fallback colors based on the variable name
    if (variable === '--muted-foreground') return '#6b7280';
    if (variable === '--border') return '#374151';
    return '#9ca3af';
  }
  
  return value || '#9ca3af';
};

export function ChartRenderer({ data, config, className }: ChartRendererProps) {
  // State for theme colors
  const [axisColor, setAxisColor] = useState('#9ca3af');
  const [gridColor, setGridColor] = useState('#374151');

  useEffect(() => {
    // Update colors when theme changes
    const updateColors = () => {
      setAxisColor(getThemeColor('--muted-foreground'));
      setGridColor(getThemeColor('--border'));
    };

    updateColors();
    
    // Listen for theme changes
    const observer = new MutationObserver(updateColors);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  // Ensure config has a valid type, use bar as default if missing
  const chartType = config?.type || 'bar';
  const safeConfig = {
    ...config,
    type: chartType as ChartConfig['type']
  };
  
  const colors = safeConfig.colors || DEFAULT_COLORS;
  const aspectRatio = safeConfig.aspectRatio || 2;

  // Debug logging
  console.log('[ChartRenderer] Rendering chart with:', {
    data,
    config: safeConfig,
    hasLabels: !!data?.labels,
    hasDatasets: !!data?.datasets,
    hasValues: !!data?.values,
    datasetCount: data?.datasets?.length || 0
  });

  // Transform data for recharts format
  const transformDataForLineBar = () => {
    if (!data.labels || !data.datasets) return [];
    
    return data.labels.map((label, index) => {
      const point: any = { name: label };
      if (data.datasets) {
        data.datasets.forEach((dataset) => {
          point[dataset.label] = dataset.data[index];
        });
      }
      return point;
    });
  };

  // Transform data for pie/doughnut charts
  const transformDataForPie = () => {
    if (data.values) {
      return data.values;
    }
    // If using datasets format, convert first dataset to pie format
    if (data.labels && data.datasets?.[0]) {
      return data.labels.map((label, index) => ({
        name: label,
        value: data.datasets![0].data[index],
      }));
    }
    return [];
  };

  const renderChart = () => {
    switch (safeConfig.type) {
      case 'line':
        return (
          <LineChart data={transformDataForLineBar()}>
            {safeConfig.showGrid !== false && <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.3} />}
            <XAxis dataKey="name" stroke={axisColor} fontSize={12} />
            <YAxis stroke={axisColor} fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            {safeConfig.showLegend !== false && <Legend wrapperStyle={{ paddingTop: '20px' }} />}
            {data.datasets?.map((dataset, index) => (
              <Line
                key={dataset.label}
                type="monotone"
                dataKey={dataset.label}
                stroke={dataset.borderColor as string || colors[index % colors.length]}
                fill={dataset.backgroundColor as string || colors[index % colors.length]}
                strokeWidth={dataset.borderWidth || 2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        );

      case 'bar':
        return (
          <BarChart data={transformDataForLineBar()}>
            {safeConfig.showGrid !== false && <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.3} />}
            <XAxis dataKey="name" stroke={axisColor} fontSize={12} />
            <YAxis stroke={axisColor} fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            {safeConfig.showLegend !== false && <Legend wrapperStyle={{ paddingTop: '20px' }} />}
            {data.datasets?.map((dataset, index) => (
              <Bar
                key={dataset.label}
                dataKey={dataset.label}
                fill={dataset.backgroundColor as string || colors[index % colors.length]}
                stackId={safeConfig.stacked ? 'stack' : undefined}
              />
            ))}
          </BarChart>
        );

      case 'area':
        return (
          <AreaChart data={transformDataForLineBar()}>
            {safeConfig.showGrid !== false && <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.3} />}
            <XAxis dataKey="name" stroke={axisColor} fontSize={12} />
            <YAxis stroke={axisColor} fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            {safeConfig.showLegend !== false && <Legend wrapperStyle={{ paddingTop: '20px' }} />}
            {data.datasets?.map((dataset, index) => (
              <Area
                key={dataset.label}
                type="monotone"
                dataKey={dataset.label}
                stroke={dataset.borderColor as string || colors[index % colors.length]}
                fill={dataset.backgroundColor as string || colors[index % colors.length]}
                fillOpacity={0.6}
                stackId={safeConfig.stacked ? 'stack' : undefined}
              />
            ))}
          </AreaChart>
        );

      case 'pie':
      case 'doughnut':
        const pieData = transformDataForPie();
        const innerRadius = safeConfig.type === 'doughnut' ? '40%' : 0;
        
        // Custom legend content
        const renderCustomLegend = (props: any) => {
          const { payload } = props;
          const total = pieData.reduce((sum, item) => sum + (typeof item.value === 'number' ? item.value : 0), 0);
          
          return (
            <div className="flex flex-col gap-2 pl-8 border-l border-border/30 ml-4">
              {payload.map((entry: any, index: number) => {
                const data = pieData.find(item => item.name === entry.value);
                const value = data?.value || 0;
                return (
                  <div key={`item-${index}`} className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: entry.color }}
                    />
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">{entry.value}</span>
                      <span className="font-medium text-foreground">{typeof value === 'number' ? value.toLocaleString() : value}</span>
                    </div>
                  </div>
                );
              })}
              {/* Total summary */}
              <div className="mt-4 pt-4 border-t border-border/30">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground font-medium">Total:</span>
                  <span className="font-semibold text-foreground">{total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          );
        };
        
        return (
          <PieChart>
            <Pie
              data={pieData}
              cx="35%"
              cy="50%"
              labelLine={false}
              label={false}
              outerRadius="75%"
              innerRadius={innerRadius}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry: any, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color || colors[index % colors.length]} 
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            {safeConfig.showLegend !== false && (
              <Legend 
                layout="vertical" 
                align="right" 
                verticalAlign="middle"
                content={renderCustomLegend}
                wrapperStyle={{ paddingLeft: '20px' }}
              />
            )}
          </PieChart>
        );

      case 'radar':
        return (
          <RadarChart data={transformDataForLineBar()}>
            <PolarGrid />
            <PolarAngleAxis dataKey="name" />
            <PolarRadiusAxis />
            <Tooltip content={<CustomTooltip />} />
            {safeConfig.showLegend !== false && <Legend wrapperStyle={{ paddingTop: '20px' }} />}
            {data.datasets?.map((dataset, index) => (
              <Radar
                key={dataset.label}
                name={dataset.label}
                dataKey={dataset.label}
                stroke={dataset.borderColor as string || colors[index % colors.length]}
                fill={dataset.backgroundColor as string || colors[index % colors.length]}
                fillOpacity={0.6}
              />
            ))}
          </RadarChart>
        );

      case 'scatter':
        // For scatter plots, data needs to be in [{x, y}] format
        // This is a simplified version - you might need more complex transformation
        return (
          <ScatterChart>
            {safeConfig.showGrid !== false && <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.3} />}
            <XAxis type="number" dataKey="x" name={safeConfig.xAxisLabel} stroke={axisColor} fontSize={12} />
            <YAxis type="number" dataKey="y" name={safeConfig.yAxisLabel} stroke={axisColor} fontSize={12} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
            {safeConfig.showLegend !== false && <Legend wrapperStyle={{ paddingTop: '20px' }} />}
            {data.datasets?.map((dataset, index) => (
              <Scatter
                key={dataset.label}
                name={dataset.label}
                data={dataset.data.map((value, i) => ({ x: i, y: value }))}
                fill={dataset.backgroundColor as string || colors[index % colors.length]}
              />
            ))}
          </ScatterChart>
        );

      default:
        return <div>Unsupported chart type: {safeConfig.type}</div>;
    }
  };

  return (
    <div className={cn(
      "max-w-full overflow-hidden rounded-xl",
      "bg-card/50 backdrop-blur-sm",
      "border border-border/50",
      "shadow-lg",
      className
    )}>
      {config.title && (
        <div className="pb-3 px-6 pt-5">
          <h3 className="text-lg font-semibold text-card-foreground">{config.title}</h3>
          <div className="mt-2 border-b border-border/30" />
        </div>
      )}
      <div className="p-6 pt-2">
        <div className="rounded-lg bg-card/30 backdrop-blur-sm p-4 border border-border/30" style={{ width: '100%', height: 400 }}>
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
