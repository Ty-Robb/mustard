import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { NodeViewWrapper } from '@tiptap/react'
import React, { useState } from 'react'
import { TableRenderer } from '@/components/chat/TableRenderer'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Trash2, Edit, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TableData, TableConfig } from '@/types/chat'

interface DataTableNodeAttrs {
  data: TableData
  config?: TableConfig
}

const DataTableComponent = ({ node, updateAttributes, deleteNode }: any) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState(JSON.stringify(node.attrs.data, null, 2))
  const [editConfig, setEditConfig] = useState(JSON.stringify(node.attrs.config || {}, null, 2))
  const [isHovered, setIsHovered] = useState(false)

  const handleSave = () => {
    try {
      const newData = JSON.parse(editData)
      const newConfig = editConfig.trim() ? JSON.parse(editConfig) : undefined
      updateAttributes({ data: newData, config: newConfig })
      setIsEditing(false)
    } catch (error) {
      console.error('Invalid JSON:', error)
      alert('Invalid JSON format. Please check your data.')
    }
  }

  return (
    <>
      <NodeViewWrapper 
        className="relative my-4"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative">
          {/* Drag handle */}
          <div
            className={cn(
              "absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 transition-opacity cursor-grab active:cursor-grabbing",
              isHovered && "opacity-100"
            )}
            contentEditable={false}
            draggable
            data-drag-handle
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>

          {/* Table container */}
          <TableRenderer 
            data={node.attrs.data} 
            config={node.attrs.config}
          />

          {/* Hover toolbar */}
          <div
            className={cn(
              "absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity",
              isHovered && "opacity-100"
            )}
            contentEditable={false}
          >
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setIsEditing(true)}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={deleteNode}
              className="h-8 w-8 p-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </NodeViewWrapper>

      {/* Edit dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Table Data</DialogTitle>
            <DialogDescription>
              Modify the table data and configuration in JSON format
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="table-data">Table Data</Label>
              <Textarea
                id="table-data"
                value={editData}
                onChange={(e) => setEditData(e.target.value)}
                className="font-mono text-sm min-h-[200px]"
                placeholder='{"headers": ["Name", "Age"], "rows": [["John", 25], ["Jane", 30]]}'
              />
            </div>
            <div>
              <Label htmlFor="table-config">Configuration (Optional)</Label>
              <Textarea
                id="table-config"
                value={editConfig}
                onChange={(e) => setEditConfig(e.target.value)}
                className="font-mono text-sm min-h-[100px]"
                placeholder='{"sortable": true, "filterable": true, "pageSize": 10}'
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export const DataTableNode = Node.create({
  name: 'dataTable',

  group: 'block',

  atom: true,

  draggable: true,

  addAttributes() {
    return {
      data: {
        default: {
          headers: [],
          rows: []
        },
      },
      config: {
        default: null,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="data-table"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'data-table' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(DataTableComponent)
  },

  addCommands() {
    return {
      insertDataTable: (attrs: DataTableNodeAttrs) => ({ commands }: { commands: any }) => {
        return commands.insertContent({
          type: this.name,
          attrs,
        })
      },
    } as any
  },
})

// Helper function to insert a table from AI response
export const insertDataTableFromAI = (editor: any, tableData: TableData, tableConfig?: TableConfig) => {
  // Comprehensive validation
  if (!tableData) {
    console.error('[insertDataTableFromAI] Table data is null or undefined');
    return;
  }
  
  if (!tableData.headers || !Array.isArray(tableData.headers)) {
    console.error('[insertDataTableFromAI] Invalid headers:', tableData.headers);
    return;
  }
  
  if (!tableData.rows || !Array.isArray(tableData.rows)) {
    console.error('[insertDataTableFromAI] Invalid rows:', tableData.rows);
    return;
  }
  
  if (tableData.headers.length === 0) {
    console.error('[insertDataTableFromAI] Headers array is empty');
    return;
  }
  
  // Log successful validation
  console.log('[insertDataTableFromAI] Inserting table with', tableData.rows.length, 'rows and', tableData.headers.length, 'headers');
  
  editor.chain().focus().insertDataTable({
    data: tableData,
    config: tableConfig
  }).run()
}
