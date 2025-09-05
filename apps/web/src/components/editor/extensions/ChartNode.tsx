import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import React, { useState } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { ChartRenderer } from '@/components/chat/ChartRenderer';
import { ChartData, ChartConfig } from '@/types/chat';
import { Button } from '@/components/ui/button';
import { BarChart3, Edit2, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Chart Node View Component
const ChartNodeView = ({ node, updateAttributes, deleteNode, selected }: any) => {
  const { data, config } = node.attrs;
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(data ? JSON.stringify(data, null, 2) : '{}');
  const [editConfig, setEditConfig] = useState(config ? JSON.stringify(config, null, 2) : '{}');

  const handleSave = () => {
    try {
      const newData = JSON.parse(editData);
      const newConfig = JSON.parse(editConfig);
      updateAttributes({ data: newData, config: newConfig });
      setIsEditing(false);
    } catch (error) {
      alert('Invalid JSON format. Please check your data.');
    }
  };

  const handleQuickTypeChange = (newType: ChartConfig['type']) => {
    updateAttributes({ 
      config: { ...(config || {}), type: newType } 
    });
  };

  return (
    <NodeViewWrapper className="chart-node-wrapper">
      <div className={`relative group ${selected ? 'ring-2 ring-primary' : ''}`}>
        {/* Toolbar */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 z-10">
          <Select value={config?.type || 'bar'} onValueChange={handleQuickTypeChange}>
            <SelectTrigger className="w-[100px] h-8 bg-background/80 backdrop-blur">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="line">Line</SelectItem>
              <SelectItem value="bar">Bar</SelectItem>
              <SelectItem value="area">Area</SelectItem>
              <SelectItem value="pie">Pie</SelectItem>
              <SelectItem value="doughnut">Doughnut</SelectItem>
              <SelectItem value="radar">Radar</SelectItem>
              <SelectItem value="scatter">Scatter</SelectItem>
            </SelectContent>
          </Select>
          
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogTrigger asChild>
              <Button size="sm" variant="secondary" className="h-8">
                <Edit2 className="h-3 w-3" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Chart</DialogTitle>
                <DialogDescription>
                  Modify the chart data and configuration in JSON format.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Chart Data</Label>
                  <Textarea
                    value={editData}
                    onChange={(e) => setEditData(e.target.value)}
                    className="font-mono text-sm h-64"
                    placeholder="Enter chart data in JSON format"
                  />
                </div>
                <div>
                  <Label>Chart Configuration</Label>
                  <Textarea
                    value={editConfig}
                    onChange={(e) => setEditConfig(e.target.value)}
                    className="font-mono text-sm h-32"
                    placeholder="Enter chart configuration in JSON format"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>Save Changes</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button
            size="sm"
            variant="destructive"
            className="h-8"
            onClick={deleteNode}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>

        {/* Chart */}
        <div className="pointer-events-none min-h-[400px]">
          {data && config ? (
            <ChartRenderer data={data} config={config} />
          ) : (
            <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
              <div className="text-center text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No chart data available</p>
                {/* Debug info */}
                <div className="text-xs mt-2">
                  <p>Data: {data ? 'Present' : 'Missing'}</p>
                  <p>Config: {config ? 'Present' : 'Missing'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </NodeViewWrapper>
  );
};

// Chart Node Extension
export const ChartNode = Node.create({
  name: 'chart',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      data: {
        default: null,
      },
      config: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="chart"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'chart' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ChartNodeView);
  },

  addCommands() {
    return {
      insertChart: (attributes?: { data?: ChartData; config?: ChartConfig }) => ({ commands }: any) => {
        return commands.insertContent({
          type: this.name,
          attrs: attributes,
        });
      },
    } as any;
  },
});

// Helper function to insert a chart from AI response
export const insertChartFromAI = (editor: any, data: ChartData, config: ChartConfig) => {
  if (!data || !config) {
    console.error('Cannot insert chart without data and config');
    return;
  }
  editor.chain().focus().insertChart({ data, config }).run();
};
