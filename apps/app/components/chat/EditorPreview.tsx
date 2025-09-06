import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, ChevronRight, List, Code, BookOpen, HelpCircle } from 'lucide-react';
import { ChatMessage } from '@/types/chat';
import { cn } from '@/lib/utils';
import { ResponseParser } from '@/lib/utils/response-parser';
import { ResponseAnalyzer } from '@/lib/utils/response-analyzer';

interface EditorPreviewProps {
  message: ChatMessage;
  onClick: () => void;
  isActive?: boolean;
  previousMessage?: ChatMessage;
}

// Content type configuration
const CONTENT_TYPE_CONFIG = {
  essay: {
    label: 'Document',  // Changed from 'Essay' to 'Document'
    icon: FileText,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  list: {
    label: 'List',
    icon: List,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  code: {
    label: 'Code',
    icon: Code,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  definition: {
    label: 'Definition',
    icon: BookOpen,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  general: {
    label: 'Response',
    icon: HelpCircle,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
  },
};

// Generate a meaningful description of the document's value and content
function generateContentStructureDescription(
  content: string, 
  contentType: string,
  analysis?: any,
  userPrompt?: string
): string {
  const lines = content.split('\n').filter(line => line.trim());
  const headers = lines.filter(line => line.startsWith('#')).map(h => h.replace(/^#+\s*/, ''));
  const listItems = lines.filter(line => /^[\*\-\d]+[\.\)]\s+/.test(line));
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim() && !p.startsWith('#'));
  const bibleRefs = content.match(/\b(?:[1-3]\s)?[A-Z][a-z]+\s+\d+:\d+/g) || [];
  const hasCodeBlocks = /```[\s\S]*```/.test(content);
  
  // Extract key themes from headers and content
  const keyThemes: string[] = [];
  if (headers.length > 0) {
    // Use first few headers as key themes
    keyThemes.push(...headers.slice(0, 3).map(h => h.toLowerCase()));
  }
  
  // Analyze the user's question to provide context
  const questionTopic = userPrompt ? extractTopicFromQuestion(userPrompt) : null;
  
  // Build meaningful descriptions based on content type and actual content
  switch (contentType) {
    case 'definition':
      if (questionTopic) {
        return `In-depth exploration of ${questionTopic} with biblical context and practical applications`;
      }
      return `Comprehensive definition with theological insights and practical understanding`;
    
    case 'essay':
      if (headers.length > 2) {
        const topics = headers.slice(0, 3).join(', ');
        return `Detailed guide covering ${topics.toLowerCase()}${bibleRefs.length > 0 ? ' with scriptural support' : ''}`;
      } else if (questionTopic) {
        return `Comprehensive exploration of ${questionTopic} with ${paragraphs.length > 5 ? 'extensive' : 'detailed'} analysis`;
      }
      return `In-depth document with thorough analysis and practical insights`;
    
    case 'list':
      const listType = detectListType(listItems);
      if (listType === 'steps') {
        return `Step-by-step guide with practical instructions and clear progression`;
      } else if (listType === 'principles') {
        return `Key principles and insights for deeper understanding and application`;
      }
      return `Organized collection of important points and practical guidance`;
    
    case 'code':
      return `Complete implementation with examples and technical documentation`;
    
    case 'presentation':
      const slideCount = (content.match(/slide\s*\d+/gi) || []).length || headers.length;
      return `Presentation-ready content organized into ${slideCount} focused sections`;
    
    default:
      if (questionTopic) {
        return `Complete response about ${questionTopic} with practical insights`;
      }
      return `Comprehensive content with valuable insights and practical applications`;
  }
}

// Helper function to extract topic from user's question
function extractTopicFromQuestion(question: string): string | null {
  const lowerQuestion = question.toLowerCase();
  
  // Remove common question words
  const cleaned = lowerQuestion
    .replace(/^(what|how|why|when|where|who|can you|could you|please|help me|explain|tell me about)\s+/gi, '')
    .replace(/\?$/, '')
    .trim();
  
  // Extract the main topic (first few meaningful words)
  const words = cleaned.split(/\s+/);
  if (words.length <= 3) {
    return cleaned;
  }
  
  // Look for key phrases
  if (cleaned.includes('difference between')) {
    const match = cleaned.match(/difference between (.+?) and (.+)/);
    if (match) return `${match[1]} vs ${match[2]}`;
  }
  
  // Return first meaningful phrase
  return words.slice(0, 4).join(' ');
}

// Helper function to detect the type of list
function detectListType(listItems: string[]): 'steps' | 'principles' | 'items' {
  const joinedItems = listItems.join(' ').toLowerCase();
  
  if (joinedItems.includes('step') || joinedItems.includes('first') || joinedItems.includes('then') || joinedItems.includes('finally')) {
    return 'steps';
  } else if (joinedItems.includes('principle') || joinedItems.includes('key') || joinedItems.includes('important')) {
    return 'principles';
  }
  
  return 'items';
}

export function EditorPreview({ message, onClick, isActive, previousMessage }: EditorPreviewProps) {
  // Extract metadata and determine content type
  const getContentMetadata = () => {
    try {
      const content = message.content || '';
      
      // Parse the content to get the actual content (without conversational part)
      const parsed = ResponseParser.parseResponse(content);
      const actualContent = parsed.content || content;
      
      // Analyze the content to determine its type
      const userPrompt = previousMessage?.role === 'user' ? previousMessage.content : '';
      const analysis = ResponseAnalyzer.analyzeResponse(userPrompt, actualContent);
      
      // Determine content type with more specific detection
      let contentType = analysis.contentType || 'general';
      
      // Check for definition-style content
      const isDefinition = actualContent.toLowerCase().includes('definition') ||
                          actualContent.match(/^.+\s+is\s+.+/i) ||
                          actualContent.match(/^.+\s+are\s+.+/i) ||
                          actualContent.match(/^.+\s+refers?\s+to\s+.+/i) ||
                          (actualContent.length < 500 && !analysis.metadata?.hasHeaders);
      
      if (isDefinition && contentType === 'general') {
        contentType = 'definition';
      }
      
      // Validate contentType is a valid key early
      const validContentType = (contentType in CONTENT_TYPE_CONFIG) 
        ? contentType as keyof typeof CONTENT_TYPE_CONFIG 
        : 'general';
      
      // Extract metadata from the parsed content
      const lines = actualContent.split('\n');
      
      // Initialize all variables before using them
      let title: string;
      let wordCount: number;
      let preview: string;
      
      // Set title with fallbacks
      title = parsed.metadata?.title || 
              lines.find(line => line.startsWith('# '))?.replace('# ', '') || 
              CONTENT_TYPE_CONFIG[validContentType]?.label ||
              'Response';
      
      // Set word count - use the full message content, not just parsed sections
      wordCount = message.content.split(/\s+/).filter(w => w).length || 0;
      
      // Set preview - generate content structure description
      preview = generateContentStructureDescription(actualContent, validContentType, analysis, userPrompt);
      
      return { 
        title, 
        wordCount, 
        preview, 
        contentType: validContentType,
        hasSummary: !!parsed.summary
      };
    } catch (error) {
      console.error('Error in getContentMetadata:', error);
      // Return safe defaults if any error occurs
      return {
        title: 'Response',
        wordCount: 0,
        preview: '',
        contentType: 'general' as keyof typeof CONTENT_TYPE_CONFIG,
        hasSummary: false
      };
    }
  };

  const { title, wordCount, preview, contentType } = getContentMetadata();
  // Ensure we have a valid config, fallback to 'general' if contentType is invalid
  const config = CONTENT_TYPE_CONFIG[contentType] || CONTENT_TYPE_CONFIG.general;
  const Icon = config.icon;

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md m-2", // Changed to m-2 for margin on all sides
        isActive ? "ring-2 ring-muted-foreground/20 border-muted-foreground/30" : "border-muted-foreground/10"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn("p-2 rounded-lg", config.bgColor)}>
            <Icon className={cn("h-5 w-5", config.color)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-sm truncate">{config.label}</h3>
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              {wordCount} words
            </p>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {preview}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Click to open in editor</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
