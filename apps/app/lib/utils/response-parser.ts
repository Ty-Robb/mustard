import { ResponseAnalysis } from './response-analyzer';

export interface ParsedResponse {
  conversational: string;
  content: string;
  summary?: string;
  contentType: 'essay' | 'list' | 'code' | 'definition' | 'presentation' | 'general';
  metadata: {
    title?: string;
    wordCount?: number;
    hasHeaders?: boolean;
    paragraphCount?: number;
  };
}

export class ResponseParser {
  // Patterns that indicate the start of generated content
  private static readonly CONTENT_START_PATTERNS = [
    /Here(?:'s| is) (?:a |an |the |your |my )?(.+?):\s*$/im,
    /Below (?:is |are |you'll find |you will find )(.+?):\s*$/im,
    /Following (?:is |are )(.+?):\s*$/im,
    /I've (?:created|prepared|written|drafted|put together) (.+?):\s*$/im,
    /This (?:is |contains )(.+?):\s*$/im,
    /^#{1,3}\s+.+$/m, // Markdown headers
    /^\d+\.\s+.+$/m, // Numbered lists
    /^[\*\-]\s+.+$/m, // Bullet lists
  ];

  // Phrases that typically end conversational preambles
  private static readonly TRANSITION_PHRASES = [
    'here is',
    'here\'s',
    'below is',
    'below are',
    'following is',
    'following are',
    'as follows',
    'the following',
    'i\'ve created',
    'i\'ve prepared',
    'i\'ve written',
    'i\'ve drafted',
    'let me provide',
    'let me share',
    'let me present',
  ];

  /**
   * Parse an AI response to separate conversational content from generated content
   */
  static parseResponse(response: string, analysis?: ResponseAnalysis): ParsedResponse {
    // Handle empty or very short responses
    if (!response || response.trim().length < 50) {
      return {
        conversational: response,
        content: '',
        contentType: 'general',
        metadata: {},
      };
    }

    // First, check for new format with [SUMMARY] and [CONTENT] tags
    const summaryMatch = response.match(/\[SUMMARY\]([\s\S]*?)\[\/SUMMARY\]/);
    const contentMatch = response.match(/\[CONTENT\]([\s\S]*?)\[\/CONTENT\]/);
    
    if (summaryMatch && contentMatch) {
      // New format with explicit tags
      const summary = summaryMatch[1].trim();
      const content = contentMatch[1].trim();
      
      // Extract any conversational text before the summary
      const summaryIndex = response.indexOf('[SUMMARY]');
      const beforeSummary = summaryIndex > 0 ? response.substring(0, summaryIndex).trim() : '';
      
      // Analyze the content
      const contentAnalysis = this.analyzeContent(content);
      
      return {
        conversational: beforeSummary,
        content,
        summary,
        contentType: contentAnalysis.contentType,
        metadata: contentAnalysis.metadata,
      };
    }

    // Fallback to old parsing logic
    const contentStartIndex = this.findContentStart(response);
    
    if (contentStartIndex === -1) {
      // No clear separation found, treat entire response as content if it's essay-worthy
      if (analysis?.isEssayWorthy) {
        return {
          conversational: '',
          content: response,
          contentType: analysis.contentType || 'general',
          metadata: analysis.metadata || {},
        };
      }
      
      // Otherwise, treat as conversational
      return {
        conversational: response,
        content: '',
        contentType: 'general',
        metadata: {},
      };
    }

    // Split the response
    let conversational = response.substring(0, contentStartIndex).trim();
    let content = response.substring(contentStartIndex).trim();

    // Check for transition sentences that should be removed
    // This handles cases where the transition sentence might not be at the very beginning
    const transitionSentencePattern = /(^|\n)(Here is|Here's|Below is|Following is|I've created|I've prepared|This is)\s+[^.!?]+[.!?]\s*/gi;
    
    // Remove all transition sentences from the content
    content = content.replace(transitionSentencePattern, (match, prefix) => {
      // Keep the newline prefix if it exists, otherwise return empty string
      return prefix === '\n' ? '\n' : '';
    }).trim();
    
    // Also check if the entire first paragraph is a transition
    const firstParagraph = content.split('\n\n')[0];
    const startsWithTransition = /^(Here is|Here's|Below is|Following is|I've created|I've prepared|This is)\s+/i.test(firstParagraph);
    
    if (startsWithTransition && firstParagraph.endsWith('.')) {
      // Remove the entire first paragraph if it's just a transition sentence
      const remainingContent = content.substring(firstParagraph.length).trim();
      if (remainingContent) {
        content = remainingContent;
      }
    }

    // Analyze the content
    const contentAnalysis = this.analyzeContent(content);

    return {
      conversational,
      content,
      contentType: contentAnalysis.contentType,
      metadata: contentAnalysis.metadata,
    };
  }

  /**
   * Find where the actual content starts in the response
   */
  private static findContentStart(response: string): number {
    const lines = response.split('\n');
    let currentIndex = 0;

    // Look for a line that starts with a transition phrase followed by content
    // This handles multi-sentence conversational parts before the transition
    const transitionLinePattern = /^(Here is|Here's|Below is|Following is|I've created|I've prepared|This is)\s+/i;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if this line starts with a transition phrase
      if (transitionLinePattern.test(line)) {
        // Content starts after this transition line
        return currentIndex;
      }
      
      currentIndex += lines[i].length + 1; // +1 for newline
    }
    
    // Fallback to the old logic if no transition line is found
    currentIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim().toLowerCase();

      // Check if this line contains a transition phrase
      for (const phrase of this.TRANSITION_PHRASES) {
        if (trimmedLine.includes(phrase) && 
            (trimmedLine.endsWith(':') || (i + 1 < lines.length && lines[i + 1].trim() === ''))) {
          // Found a transition, content starts after this line
          currentIndex += line.length + 1; // +1 for newline
          
          // Skip any empty lines after the transition
          let j = i + 1;
          while (j < lines.length && lines[j].trim() === '') {
            currentIndex += lines[j].length + 1;
            j++;
          }
          
          return currentIndex;
        }
      }

      // Check if this line matches a content start pattern
      for (const pattern of this.CONTENT_START_PATTERNS) {
        if (pattern.test(line)) {
          // If it's a header or list at the beginning, include it
          if (i === 0 || (i === 1 && lines[0].trim() === '')) {
            return 0;
          }
          
          // Otherwise, content starts here
          return currentIndex;
        }
      }

      currentIndex += line.length + 1; // +1 for newline
    }

    return -1; // No clear content start found
  }

  /**
   * Analyze the extracted content
   */
  private static analyzeContent(content: string): {
    contentType: 'essay' | 'list' | 'code' | 'definition' | 'presentation' | 'general';
    metadata: ParsedResponse['metadata'];
  } {
    const hasHeaders = /^#{1,3}\s+.+$/m.test(content);
    const hasCodeBlock = /```[\s\S]*```/.test(content);
    const hasBulletList = /^[\*\-]\s+.+$/m.test(content);
    const hasNumberedList = /^\d+\.\s+.+$/m.test(content);
    
    // Extract title from first header if present
    let title: string | undefined;
    const headerMatch = content.match(/^#\s+(.+)$/m);
    if (headerMatch) {
      title = headerMatch[1].trim();
    }

    // Count words and paragraphs
    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
    const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 0);
    const paragraphCount = paragraphs.length;

    // Determine content type
    let contentType: 'essay' | 'list' | 'code' | 'definition' | 'presentation' | 'general' = 'general';
    
    const isDefinition = content.toLowerCase().includes('definition') ||
                        content.match(/^.+\s+is\s+.+/i) !== null ||
                        content.match(/^.+\s+are\s+.+/i) !== null ||
                        content.match(/^.+\s+refers?\s+to\s+.+/i) !== null ||
                        (wordCount < 100 && !hasHeaders);
    
    const isPresentation = /slide\s*\d+/i.test(content) ||
                          /^#{1,3}\s*slide/im.test(content) ||
                          content.toLowerCase().includes('presentation') ||
                          content.toLowerCase().includes('slides');
    
    if (hasCodeBlock) {
      contentType = 'code';
    } else if (isPresentation) {
      contentType = 'presentation';
    } else if (hasBulletList || hasNumberedList) {
      contentType = 'list';
    } else if (isDefinition) {
      contentType = 'definition';
    } else if (hasHeaders && paragraphCount > 2 && wordCount > 100) {
      contentType = 'essay';
    }

    return {
      contentType,
      metadata: {
        title,
        wordCount,
        hasHeaders,
        paragraphCount,
      },
    };
  }

  /**
   * Check if a response has separable content
   */
  static hasSeparableContent(response: string): boolean {
    return this.findContentStart(response) !== -1;
  }

  /**
   * Extract just the content from a response (no conversational part)
   */
  static extractContent(response: string): string {
    const parsed = this.parseResponse(response);
    return parsed.content || parsed.conversational;
  }

  /**
   * Extract a preview of the content for display
   */
  static getContentPreview(content: string, maxLength: number = 150): string {
    // Skip headers and get to the actual content
    const lines = content.split('\n');
    const contentLines = lines.filter(line => {
      const trimmed = line.trim();
      return trimmed && !trimmed.startsWith('#') && !trimmed.match(/^[\*\-\d]+[\.\)]\s/);
    });

    const preview = contentLines.join(' ').trim();
    
    if (preview.length <= maxLength) {
      return preview;
    }

    // Try to cut at a word boundary
    const cut = preview.lastIndexOf(' ', maxLength);
    return preview.substring(0, cut > 0 ? cut : maxLength) + '...';
  }

  /**
   * Generate an executive summary that describes what content is available
   * rather than showing the actual content
   */
  static generateExecutiveSummary(content: string, contentType: string): string {
    // First, try to extract key themes and main points from the content
    const lines = content.split('\n').filter(line => line.trim());
    const paragraphs = content.split(/\n\n+/).filter(p => p.trim() && !p.startsWith('#'));
    
    // Extract headers for topic identification
    const headers = lines.filter(line => line.startsWith('#')).map(h => h.replace(/^#+\s*/, ''));
    
    // Extract key concepts and themes
    const mainTopic = this.extractMainTopic(content, headers);
    const keyThemes = this.extractKeyThemes(content, lines);
    const purpose = this.extractPurpose(content, contentType);
    
    // Count important elements
    const listItems = lines.filter(line => /^[\*\-\d]+[\.\)]\s+/.test(line));
    const bibleRefs = content.match(/\b(?:[1-3]\s)?[A-Z][a-z]+\s+\d+:\d+/g) || [];
    const hasSteps = /\b(?:step|process|method|approach|way)\b/i.test(content);
    const hasPrinciples = /\b(?:principle|foundation|basis|fundamental)\b/i.test(content);
    
    // Build the executive summary based on content type and extracted information
    switch (contentType) {
      case 'definition':
        return this.createDefinitionSummary(mainTopic, keyThemes, content);
      
      case 'essay':
      case 'general':
        return this.createEssaySummary(mainTopic, keyThemes, purpose, {
          headers,
          bibleRefs,
          hasSteps,
          hasPrinciples,
          listCount: listItems.length
        });
      
      case 'list':
        return this.createListSummary(mainTopic, listItems, purpose);
      
      case 'code':
        return this.createCodeSummary(content);
      
      case 'presentation':
        return this.createPresentationSummary(content, headers);
      
      default:
        return this.createGenericSummary(mainTopic, keyThemes, purpose);
    }
  }
  
  /**
   * Extract the main topic from content
   */
  private static extractMainTopic(content: string, headers: string[]): string {
    // First try headers
    if (headers.length > 0) {
      return headers[0];
    }
    
    // Look for topic in first paragraph
    const firstPara = content.split('\n\n')[0];
    const topicMatch = firstPara.match(/(?:about|regarding|concerning|explores?|discusses?|covers?)\s+(.+?)(?:\.|,|;|$)/i);
    if (topicMatch) {
      return topicMatch[1].trim();
    }
    
    // Extract from "is/are" definitions
    const defMatch = firstPara.match(/^(.+?)\s+(?:is|are)\s+/i);
    if (defMatch) {
      return defMatch[1].trim();
    }
    
    return 'the topic';
  }
  
  /**
   * Extract key themes from content
   */
  private static extractKeyThemes(content: string, lines: string[]): string[] {
    const themes: string[] = [];
    
    // Look for theme indicators
    const themePatterns = [
      /\b(?:includes?|covers?|explores?|examines?|discusses?)\s+(.+?)(?:\.|,|;|and|$)/gi,
      /\b(?:key|main|primary|essential|important)\s+(?:aspects?|points?|themes?|topics?|areas?)\s+(?:are|include)\s+(.+?)(?:\.|;|$)/gi,
      /\b(?:focuses?\s+on|centered\s+on|based\s+on)\s+(.+?)(?:\.|,|;|$)/gi,
    ];
    
    for (const pattern of themePatterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const theme = match[1].trim();
        if (theme.length < 100) { // Avoid overly long extractions
          themes.push(theme);
        }
      }
    }
    
    // Extract from subheaders
    const subHeaders = lines.filter(line => line.startsWith('##')).map(h => h.replace(/^#+\s*/, ''));
    themes.push(...subHeaders.slice(0, 3));
    
    // Deduplicate and limit
    return [...new Set(themes)].slice(0, 4);
  }
  
  /**
   * Extract the purpose or goal of the content
   */
  private static extractPurpose(content: string, contentType: string): string {
    // Look for purpose indicators
    const purposeMatch = content.match(/\b(?:to|helps?|guides?|teaches?|shows?|explains?|provides?)\s+(.+?)(?:\.|,|;|$)/i);
    if (purposeMatch) {
      return purposeMatch[1].trim();
    }
    
    // Default purposes by content type
    const defaultPurposes: Record<string, string> = {
      definition: 'define and explain the concept',
      essay: 'provide comprehensive understanding',
      list: 'outline key points and practices',
      code: 'demonstrate implementation',
      presentation: 'present information visually',
      general: 'share insights and information'
    };
    
    return defaultPurposes[contentType] || defaultPurposes.general;
  }
  
  /**
   * Create a summary for definition content
   */
  private static createDefinitionSummary(topic: string, themes: string[], content: string): string {
    const defLine = content.split('\n').find(line => 
      /\b(?:is|are|means|refers?\s+to)\b/i.test(line) && line.length < 200
    );
    
    if (defLine) {
      const cleanDef = defLine.replace(/^[^:]+:\s*/, '').replace(/^.+?\s+(is|are|means)\s+/i, '');
      return `Defines ${topic.toLowerCase()} as ${cleanDef.toLowerCase()}`;
    }
    
    if (themes.length > 0) {
      return `Explains ${topic.toLowerCase()} covering ${themes.slice(0, 2).join(' and ')}`;
    }
    
    return `Provides a comprehensive definition of ${topic.toLowerCase()}`;
  }
  
  /**
   * Create a summary for essay/general content
   */
  private static createEssaySummary(
    topic: string, 
    themes: string[], 
    purpose: string,
    metadata: {
      headers: string[];
      bibleRefs: string[];
      hasSteps: boolean;
      hasPrinciples: boolean;
      listCount: number;
    }
  ): string {
    let summary = `Explores ${topic.toLowerCase()}`;
    
    // Add purpose if meaningful
    if (purpose && !purpose.includes(topic.toLowerCase())) {
      summary += ` to ${purpose}`;
    }
    
    // Add key aspects
    if (themes.length > 0) {
      summary += `. Covers ${themes.slice(0, 2).join(', ')}`;
    } else if (metadata.headers.length > 1) {
      summary += `. Discusses ${metadata.headers.slice(1, 3).join(' and ').toLowerCase()}`;
    }
    
    // Add special elements
    const elements: string[] = [];
    if (metadata.hasSteps) elements.push('practical steps');
    if (metadata.hasPrinciples) elements.push('key principles');
    if (metadata.bibleRefs.length > 0) elements.push('biblical references');
    if (metadata.listCount > 3) elements.push(`${metadata.listCount} key points`);
    
    if (elements.length > 0) {
      summary += ` with ${elements.join(', ')}`;
    }
    
    return this.cleanSummary(summary);
  }
  
  /**
   * Create a summary for list content
   */
  private static createListSummary(topic: string, listItems: string[], purpose: string): string {
    const itemCount = listItems.length;
    const itemType = this.detectListType(listItems);
    
    let summary = `Presents ${itemCount} ${itemType}`;
    
    if (topic && topic !== 'the topic') {
      summary += ` for ${topic.toLowerCase()}`;
    }
    
    if (purpose) {
      summary += ` to ${purpose}`;
    }
    
    // Add preview of first few items
    if (listItems.length > 0) {
      const firstItems = listItems.slice(0, 2).map(item => 
        item.replace(/^[\*\-\d]+[\.\)]\s+/, '').toLowerCase().split(/[,.]/)[0]
      );
      summary += ` including ${firstItems.join(' and ')}`;
    }
    
    return this.cleanSummary(summary);
  }
  
  /**
   * Detect the type of list items
   */
  private static detectListType(items: string[]): string {
    if (items.some(item => /\bstep\b/i.test(item))) return 'steps';
    if (items.some(item => /\btip\b/i.test(item))) return 'tips';
    if (items.some(item => /\bprinciple\b/i.test(item))) return 'principles';
    if (items.some(item => /\bexample\b/i.test(item))) return 'examples';
    if (items.some(item => /\bway\b/i.test(item))) return 'ways';
    if (items.some(item => /\bmethod\b/i.test(item))) return 'methods';
    if (items.some(item => /\bpractice\b/i.test(item))) return 'practices';
    return 'key points';
  }
  
  /**
   * Create a summary for code content
   */
  private static createCodeSummary(content: string): string {
    const languages = content.match(/```(\w+)/g)?.map(m => m.replace('```', '')) || [];
    const hasFunction = /function|def|func/i.test(content);
    const hasClass = /class|interface|struct/i.test(content);
    
    let summary = 'Provides ';
    
    if (languages.length > 0) {
      summary += `${languages[0]} code`;
    } else {
      summary += 'code implementation';
    }
    
    if (hasClass) {
      summary += ' with class definitions';
    } else if (hasFunction) {
      summary += ' with function implementations';
    }
    
    return summary;
  }
  
  /**
   * Create a summary for presentation content
   */
  private static createPresentationSummary(content: string, headers: string[]): string {
    const slideCount = (content.match(/slide\s*\d+/gi) || []).length;
    const topic = headers[0] || 'the topic';
    
    return `Presentation on ${topic.toLowerCase()} with ${slideCount} slides covering key concepts and insights`;
  }
  
  /**
   * Create a generic summary
   */
  private static createGenericSummary(topic: string, themes: string[], purpose: string): string {
    let summary = `Information about ${topic.toLowerCase()}`;
    
    if (themes.length > 0) {
      summary += ` covering ${themes.slice(0, 2).join(' and ')}`;
    }
    
    if (purpose) {
      summary += ` to ${purpose}`;
    }
    
    return this.cleanSummary(summary);
  }
  
  /**
   * Extract the main idea from a sentence, removing unnecessary prefixes
   */
  private static extractMainIdea(sentence: string): string {
    // Remove common prefixes and clean up the sentence
    const cleaned = sentence
      .replace(/^(?:First|Second|Third|Finally|Most importantly),?\s*/i, '')
      .replace(/^(?:The|A|An)\s+/i, '')
      .replace(/^(?:Key|Main|Primary|Essential|Important)\s+/i, '');
    
    // Ensure first letter is capitalized
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
  
  /**
   * Clean up a summary sentence for display
   */
  private static cleanSummary(text: string): string {
    // Remove extra whitespace and ensure proper ending
    let cleaned = text.trim();
    
    // Ensure it ends with proper punctuation
    if (!/[.!?]$/.test(cleaned)) {
      cleaned += '.';
    }
    
    // Remove any markdown formatting
    cleaned = cleaned.replace(/[*_`#]/g, '');
    
    // Limit length if too long
    if (cleaned.length > 200) {
      const cutPoint = cleaned.lastIndexOf(' ', 180);
      cleaned = cleaned.substring(0, cutPoint > 0 ? cutPoint : 180) + '...';
    }
    
    return cleaned;
  }
}
