'use client';

import { useState, useEffect, useCallback } from 'react';
import { TipTapEditor } from '@/components/editor/TipTapEditor';
import { Button } from '@/components/ui/button';
import { X, Maximize2, Minimize2, FileText, Presentation } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/types/chat';
import { ResponseParser } from '@/lib/utils/response-parser';
import { EditorSelectionToolbar, type AIAction, type VisualizationAction } from '@/components/editor/EditorSelectionToolbar';
import { SimplifiedAIModal, type AIEditSuggestion } from '@/components/editor/SimplifiedAIModal';
import { useChat } from '@/hooks/useChat';
import { generateVisualizationFromText } from '@/lib/utils/visualization-generator';
import { insertChartFromAI } from '@/components/editor/extensions/ChartNode';
import { insertDataTableFromAI } from '@/components/editor/extensions/DataTableNode';
import { ShimmerCard } from '@/components/ui/shimmer';
import { PresentationParser } from '@/lib/utils/presentation-parser';
import { PresentationEditorView } from './PresentationEditorView';

interface EditorProps {
  message: ChatMessage | null;
  streamingContent?: string;
  isStreaming?: boolean;
  onClose: () => void;
  onSave?: (content: string) => void;
  className?: string;
}

export function Editor({ 
  message, 
  streamingContent,
  isStreaming,
  onClose, 
  onSave,
  className 
}: EditorProps) {
  const [content, setContent] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [showSelectionToolbar, setShowSelectionToolbar] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiSuggestion, setAISuggestion] = useState<AIEditSuggestion | null>(null);
  const [aiLoading, setAILoading] = useState(false);
  const [aiError, setAIError] = useState<string | null>(null);
  const [editor, setEditor] = useState<any>(null);
  const [mode, setMode] = useState<'document' | 'presentation'>('document');
  const [parsedPresentation, setParsedPresentation] = useState<any>(null);
  
  const { sendMessage } = useChat();

  // Detect content type
  useEffect(() => {
    if (message && message.content) {
      const parsed = ResponseParser.parseResponse(message.content);
      const contentToCheck = parsed.content || message.content;
      
      if (PresentationParser.isPresentationContent(contentToCheck)) {
        setMode('presentation');
        const presentation = PresentationParser.parsePresentation(contentToCheck);
        setParsedPresentation(presentation);
      } else {
        setMode('document');
        setParsedPresentation(null);
      }
    }
  }, [message]);

  // Handle streaming content updates
  useEffect(() => {
    if (isStreaming && streamingContent) {
      // Parse the streaming content
      const parsed = ResponseParser.parseResponse(streamingContent);
      const contentToEdit = parsed.content || streamingContent;
      
      // Convert markdown to HTML for the editor
      const htmlContent = convertMarkdownToHtml(contentToEdit);
      setContent(htmlContent);
    } else if (!isStreaming && message && message.content) {
      // Parse the final message content
      const parsed = ResponseParser.parseResponse(message.content);
      const contentToEdit = parsed.content || message.content;
      
      // Convert markdown to HTML for the editor
      const htmlContent = convertMarkdownToHtml(contentToEdit);
      setContent(htmlContent);
      setHasChanges(false);
    }
  }, [message, streamingContent, isStreaming]);

  // Load visualizations after editor is ready
  useEffect(() => {
    if (editor && message?.metadata?.attachments && message.metadata.attachments.length > 0) {
      // Wait a bit for the editor to be fully initialized with content
      setTimeout(() => {
        console.log('[Editor] Loading attachments:', message.metadata!.attachments);
        
        // Insert each attachment at the end of the document
        message.metadata!.attachments!.forEach((attachment) => {
          if (attachment.type === 'chart' && attachment.data && attachment.config) {
            console.log('[Editor] Inserting chart:', attachment);
            // Move cursor to end of document
            editor.commands.focus('end');
            // Insert a new line before the chart
            editor.commands.insertContent('<p></p>');
            // Insert the chart
            insertChartFromAI(editor, attachment.data as any, attachment.config as any);
          } else if (attachment.type === 'table' && attachment.data) {
            console.log('[Editor] Inserting table:', attachment);
            
            // Validate table data structure
            const tableData = attachment.data as any;
            if (!tableData.headers || !tableData.rows) {
              console.error('[Editor] Invalid table data structure - missing headers or rows:', tableData);
              return; // Skip this attachment
            }
            
            // Move cursor to end of document
            editor.commands.focus('end');
            // Insert a new line before the table
            editor.commands.insertContent('<p></p>');
            // Insert the table
            insertDataTableFromAI(editor, tableData, attachment.config as any);
          }
        });
      }, 500); // Give editor time to initialize with text content
    }
  }, [editor, message]);

  // Convert markdown to HTML using a simple approach
  const convertMarkdownToHtml = (markdown: string) => {
    // Basic markdown to HTML conversion
    let html = markdown
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Bold
      .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Line breaks
      .replace(/\n\n/g, '</p><p>')
      // Lists
      .replace(/^\* (.+)$/gim, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>')
      // Clean up
      .replace(/---/g, '<hr>');
    
    // Wrap in paragraph tags if not already wrapped
    if (!html.startsWith('<')) {
      html = `<p>${html}</p>`;
    }
    
    return html;
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setHasChanges(newContent !== message?.content);
  };

  const handleSave = (savedContent: string) => {
    if (onSave) {
      onSave(savedContent);
    }
    setHasChanges(false);
  };

  // Handle text selection in the editor
  const handleEditorReady = useCallback((editorInstance: any) => {
    setEditor(editorInstance);
    
    // Add selection change listener
    editorInstance.on('selectionUpdate', () => {
      const { from, to } = editorInstance.state.selection;
      const text = editorInstance.state.doc.textBetween(from, to, ' ');
      
      if (text && text.trim().length > 0) {
        setSelectedText(text);
        setShowSelectionToolbar(true);
      } else {
        setSelectedText('');
        setShowSelectionToolbar(false);
      }
    });
  }, []);

  // Handle AI action selection
  const handleAIAction = useCallback(async (action: AIAction, text: string, customInstructions?: string) => {
    setShowAIModal(true);
    setAILoading(true);
    setAIError(null);
    
    try {
      // Create a prompt based on the action
      const basePrompts: Record<AIAction, string> = {
        enhance: `Please enhance the following text for better clarity, style, and readability. Fix any grammar or spelling errors. Maintain the original meaning while improving the writing quality`,
        expand: `Please expand on the following text by adding more detail, context, and depth. Keep the same tone and style`,
        summarize: `Please summarize the following text concisely while keeping the key points`,
        rephrase: `Please rephrase the following text with a different style or tone. Provide 2-3 variations`,
        ideas: `Based on the following text, suggest ideas for how to continue or expand this content`,
      };
      
      // Build the full prompt with custom instructions
      let fullPrompt = basePrompts[action];
      if (customInstructions && customInstructions.trim()) {
        fullPrompt += `\n\nAdditional instructions: ${customInstructions}`;
      }
      fullPrompt += `\n\nText to process:\n"${text}"`;
      
      // For now, we'll use a simpler approach - just show the original text with a placeholder
      // In a real implementation, you would integrate with your AI service here
      const mockSuggestions = {
        enhance: [`${text} (enhanced version with improved clarity and fixed grammar would appear here)`],
        expand: [`${text}\n\nAdditional context and details would be added here...`],
        summarize: [`Summary: ${text.substring(0, 50)}...`],
        rephrase: [`Version 1: ${text}`, `Version 2: ${text} (rephrased)`],
        ideas: [`• Continue with...\n• Consider adding...\n• You might explore...`],
      };
      
      setAISuggestion({
        action,
        original: text,
        suggestions: mockSuggestions[action],
        explanation: `AI has ${action === 'enhance' ? 'enhanced and corrected' : action === 'expand' ? 'expanded' : action === 'summarize' ? 'summarized' : action === 'rephrase' ? 'rephrased' : 'suggested ideas for'} your text.`,
      });
      
      setAILoading(false);
    } catch (error) {
      console.error('AI action error:', error);
      setAIError('Failed to generate AI suggestions. Please try again.');
      setAILoading(false);
    }
  }, []);

  // Handle accepting AI suggestion
  const handleAcceptSuggestion = useCallback((newText: string) => {
    if (editor && selectedText) {
      // Replace the selected text with the AI suggestion
      const { from, to } = editor.state.selection;
      editor.chain().focus().deleteRange({ from, to }).insertContent(newText).run();
      
      // Clear selection
      setSelectedText('');
      setShowSelectionToolbar(false);
    }
  }, [editor, selectedText]);

  // Handle rejecting AI suggestion
  const handleRejectSuggestion = useCallback(() => {
    setAISuggestion(null);
    setSelectedText('');
    setShowSelectionToolbar(false);
  }, []);

  // Handle visualization action
  const handleVisualizationAction = useCallback(async (action: VisualizationAction, text: string) => {
    if (!editor) return;
    
    try {
      // Show loading state
      setAILoading(true);
      setShowAIModal(true);
      setAIError(null);
      
      // Always use AI to generate visualizations based on the text
      const visualizationData = await generateVisualizationFromText(text, action === 'auto' ? undefined : action);
      
      // Hide loading modal
      setAILoading(false);
      setShowAIModal(false);
      
      // Insert the visualization into the editor
      if (visualizationData) {
        if (visualizationData.type === 'table' && visualizationData.data) {
          // For tables, the data should have headers and rows
          const tableData = visualizationData.data as any;
          if (tableData.headers && tableData.rows) {
            insertDataTableFromAI(editor, tableData, visualizationData.config);
          } else {
            console.error('Invalid table data structure:', tableData);
            setAIError('Failed to generate table: Invalid data structure');
            setShowAIModal(true);
          }
        } else if (visualizationData.type === 'chart' && visualizationData.data) {
          // For charts, we need both data and config
          const chartData = visualizationData.data as any;
          const chartConfig = (visualizationData.config as any) || {
            type: 'bar',
            title: 'Generated Chart',
            showLegend: true,
            showGrid: true
          };
          
          console.log('Inserting chart with data:', chartData);
          console.log('Inserting chart with config:', chartConfig);
          
          insertChartFromAI(editor, chartData, chartConfig);
        } else {
          console.error('Unknown visualization type or missing data:', visualizationData);
          setAIError('Failed to generate visualization: Unknown type or missing data');
          setShowAIModal(true);
        }
      } else {
        setAIError('Failed to generate visualization. Please try again.');
        setShowAIModal(true);
      }
      
      // Clear selection
      setSelectedText('');
      setShowSelectionToolbar(false);
    } catch (error) {
      console.error('Failed to generate visualization:', error);
      setAILoading(false);
      setAIError(error instanceof Error ? error.message : 'Failed to generate visualization');
      setShowAIModal(true);
    }
  }, [editor]);

  // Close modals on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showAIModal) {
          setShowAIModal(false);
        }
        if (showSelectionToolbar) {
          setShowSelectionToolbar(false);
        }
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showAIModal, showSelectionToolbar]);

  const getDocumentTitle = () => {
    if (!message) return 'Document';
    
    // Parse the message to get the actual content
    const parsed = ResponseParser.parseResponse(message.content);
    const contentToUse = parsed.content || message.content;
    
    // Try to extract a title from the parsed content
    if (parsed.metadata?.title) {
      return parsed.metadata.title;
    }
    
    const lines = contentToUse.split('\n');
    const firstLine = lines[0]?.trim();
    
    if (firstLine && firstLine.length < 100) {
      return firstLine.replace(/^#+\s*/, ''); // Remove markdown headers
    }
    
    return `Document - ${new Date(message.timestamp).toLocaleDateString()}`;
  };

  if (!message) return null;

  return (
    <div className={cn(
      "flex flex-col h-full bg-background",
      isFullscreen && "fixed inset-0 z-50",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          {mode === 'presentation' ? (
            <Presentation className="h-5 w-5" />
          ) : (
            <FileText className="h-5 w-5" />
          )}
          <h2 className="text-lg font-semibold">
            {mode === 'presentation' ? 'Presentation Editor' : 'Document Editor'}
          </h2>
          {hasChanges && (
            <span className="text-sm text-muted-foreground">(unsaved changes)</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto relative">
        {isStreaming && !streamingContent ? (
          // Show shimmer while waiting for content to start streaming
          <div className="p-8">
            <div className="max-w-4xl mx-auto space-y-4">
              <ShimmerCard className="h-8 w-3/4" />
              <ShimmerCard className="h-4 w-full" />
              <ShimmerCard className="h-4 w-5/6" />
              <ShimmerCard className="h-4 w-full" />
              <ShimmerCard className="h-4 w-4/5" />
              <div className="pt-4">
                <ShimmerCard className="h-4 w-full" />
                <ShimmerCard className="h-4 w-3/4 mt-2" />
                <ShimmerCard className="h-4 w-5/6 mt-2" />
              </div>
            </div>
          </div>
        ) : mode === 'presentation' && parsedPresentation ? (
          // Render presentation editor
          <PresentationEditorView
            presentation={parsedPresentation}
            onChange={(updatedPresentation) => {
              // Track changes
              setHasChanges(true);
              // Update the parsed presentation
              setParsedPresentation(updatedPresentation);
            }}
            onSave={() => {
              // Convert presentation back to markdown format
              const presentationContent = PresentationParser.presentationToMarkdown(parsedPresentation);
              handleSave(presentationContent);
            }}
            isStreaming={isStreaming}
          />
        ) : (
          // Render document editor
          <TipTapEditor
            content={content}
            onContentChange={handleContentChange}
            onSave={handleSave}
            showToolbar={true}
            editable={!isStreaming} // Disable editing while streaming
            documentTitle={getDocumentTitle()}
            fontSize={18}
            lineSpacing={1.75}
            theme="light"
            placeholder={isStreaming ? "Content is loading..." : "Start editing your document..."}
            minHeight="600px"
            onEditorReady={handleEditorReady}
          />
        )}
        
        {/* Selection Toolbar with formatting controls - only for document mode */}
        {mode === 'document' && (
          <EditorSelectionToolbar
            selectedText={selectedText}
            onAIAction={handleAIAction}
            onVisualizationAction={handleVisualizationAction}
            onClose={() => setShowSelectionToolbar(false)}
            editor={editor}
          />
        )}
        
        {/* Simplified AI Modal with formatting controls - only for document mode */}
        {mode === 'document' && (
          <SimplifiedAIModal
            isOpen={showAIModal}
            onClose={() => setShowAIModal(false)}
            suggestion={aiSuggestion}
            onAccept={handleAcceptSuggestion}
            onReject={handleRejectSuggestion}
            loading={aiLoading}
            error={aiError}
            editor={editor}
            onAIAction={handleAIAction}
            selectedText={selectedText}
          />
        )}
      </div>
    </div>
  );
}
