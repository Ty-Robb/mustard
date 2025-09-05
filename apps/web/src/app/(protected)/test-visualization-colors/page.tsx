'use client';

import React from 'react';
import { ChartRenderer } from '@/components/chat/ChartRenderer';
import { TableRenderer } from '@/components/chat/TableRenderer';
import { Card } from '@/components/ui/card';

export default function TestVisualizationColors() {
  const chartData = {
    values: [
      { name: 'Traditional', value: 45, color: '#8B5CF6' },
      { name: 'Contemporary', value: 30, color: '#3B82F6' },
      { name: 'Blended', value: 25, color: '#10B981' }
    ]
  };

  const chartConfig = {
    type: 'pie' as const,
    title: 'Worship Style Preferences',
    showLegend: true
  };

  const tableData = {
    headers: ['Ministry', 'Description', 'Meeting Time'],
    rows: [
      ['LGBTQ+ Fellowship', 'A safe and affirming space for LGBTQ+ members and allies', 'Sundays, 2:00 PM'],
      ['Rainbow Choir', 'An inclusive choir that performs at special services', 'Wednesdays, 7:00 PM'],
      ['Pride Prayer Group', 'Weekly prayer and support group', 'Thursdays, 6:30 PM']
    ]
  };

  const tableConfig = {
    title: 'LGBTQ+ Ministries',
    sortable: true,
    filterable: true
  };

  return (
    <div className="container mx-auto p-8 space-y-8">
      <h1 className="text-2xl font-bold mb-4">Visualization Color Test</h1>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Color Reference</h2>
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4">
            <h3 className="font-medium mb-2">Default Card</h3>
            <p className="text-sm text-muted-foreground">Uses bg-card</p>
          </Card>
          
          <div className="p-4 bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl shadow-lg">
            <h3 className="font-medium mb-2">Chart/Table Card Style</h3>
            <p className="text-sm text-muted-foreground">Uses bg-card/50</p>
          </div>
          
          <div className="p-4 bg-muted rounded-xl">
            <h3 className="font-medium mb-2">Muted Background</h3>
            <p className="text-sm text-muted-foreground">Uses bg-muted</p>
          </div>
          
          <div className="p-4 bg-muted/30 backdrop-blur-sm border border-border/30 rounded-xl">
            <h3 className="font-medium mb-2">Inner Container Style</h3>
            <p className="text-sm text-muted-foreground">Uses bg-muted/30</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Current Implementation</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium mb-2">Chart Renderer</h3>
            <ChartRenderer data={chartData} config={chartConfig} />
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Table Renderer</h3>
            <TableRenderer data={tableData} config={tableConfig} />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">CSS Variable Values</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <Card className="p-4">
            <h3 className="font-medium mb-2">--card</h3>
            <div className="w-full h-8 bg-card rounded border"></div>
          </Card>
          
          <Card className="p-4">
            <h3 className="font-medium mb-2">--muted</h3>
            <div className="w-full h-8 bg-muted rounded border"></div>
          </Card>
        </div>
      </div>
    </div>
  );
}
