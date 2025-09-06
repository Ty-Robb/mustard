export interface ResponseAnalysis {
  isEssayWorthy: boolean;
  isPresentationWorthy?: boolean;
  confidence: number;
  reasons: string[];
  suggestedTitle?: string;
  contentType?: 'essay' | 'list' | 'code' | 'definition' | 'presentation' | 'general';
  metadata?: {
    wordCount?: number;
    hasHeaders?: boolean;
    paragraphCount?: number;
    slideCount?: number;
  };
}

export class ResponseAnalyzer {
  private static readonly MIN_LENGTH_FOR_ESSAY = 500;
  private static readonly ESSAY_KEYWORDS = [
    'essay',
    'explain in detail',
    'write about',
    'describe',
    'analyze',
    'discuss',
    'elaborate',
    'comprehensive',
    'detailed explanation',
    'summary',
    'overview',
    'in-depth',
    'thorough',
    'plan',
    'outline',
    'structure',
    'framework',
  ];

  // Removed automatic presentation keywords - presentations should only be created on explicit request
  private static readonly PRESENTATION_KEYWORDS: string[] = [];

  private static readonly ESSAY_PATTERNS = [
    /write\s+(an?\s+)?essay/i,
    /explain\s+in\s+detail/i,
    /provide\s+a\s+(comprehensive|detailed|thorough)/i,
    /give\s+me\s+a\s+(full|complete|detailed)/i,
    /can\s+you\s+(write|create|draft)/i,
    /i\s+need\s+(an?\s+)?essay/i,
    /help\s+me\s+write/i,
    /create\s+a\s+plan/i,
    /outline\s+for/i,
  ];

  // Only match very explicit presentation requests
  private static readonly PRESENTATION_PATTERNS = [
    /create\s+(a\s+)?presentation\s+(about|on|for)/i,
    /make\s+(me\s+)?(a\s+)?presentation\s+(about|on|for)/i,
    /build\s+(a\s+)?presentation\s+(about|on|for)/i,
    /i\s+need\s+(a\s+)?presentation\s+(about|on|for)/i,
    /generate\s+(a\s+)?presentation\s+(about|on|for)/i,
    /create\s+(a\s+)?slide\s*deck\s+(about|on|for)/i,
    /make\s+(me\s+)?(a\s+)?slide\s*deck\s+(about|on|for)/i,
  ];

  static analyzeUserPrompt(prompt: string): { isEssay: boolean; isPresentation: boolean } {
    const lowerPrompt = prompt.toLowerCase();
    
    // Check for essay keywords and patterns
    const hasEssayKeyword = this.ESSAY_KEYWORDS.some(keyword => 
      lowerPrompt.includes(keyword)
    );
    const matchesEssayPattern = this.ESSAY_PATTERNS.some(pattern => 
      pattern.test(prompt)
    );
    
    // Check for presentation keywords and patterns
    const hasPresentationKeyword = this.PRESENTATION_KEYWORDS.some(keyword => 
      lowerPrompt.includes(keyword)
    );
    const matchesPresentationPattern = this.PRESENTATION_PATTERNS.some(pattern => 
      pattern.test(prompt)
    );
    
    return {
      isEssay: hasEssayKeyword || matchesEssayPattern,
      isPresentation: hasPresentationKeyword || matchesPresentationPattern
    };
  }

  static analyzeResponse(
    userPrompt: string, 
    response: string
  ): ResponseAnalysis {
    const reasons: string[] = [];
    let confidence = 0;
    let isPresentationWorthy = false;

    // Check user prompt first
    const promptAnalysis = this.analyzeUserPrompt(userPrompt);
    if (promptAnalysis.isEssay) {
      reasons.push('User requested detailed/essay-like content');
      confidence += 40;
    }
    if (promptAnalysis.isPresentation) {
      reasons.push('User requested presentation content');
      isPresentationWorthy = true;
      confidence += 50;
    }

    // Check response length
    const wordCount = response.split(/\s+/).length;
    if (response.length >= this.MIN_LENGTH_FOR_ESSAY) {
      reasons.push(`Response is long (${wordCount} words)`);
      confidence += 30;
    }

    // Check for structured content (headers, lists, etc.)
    const hasHeaders = /^#{1,3}\s+.+$/m.test(response);
    const hasBulletPoints = /^[\*\-]\s+.+$/m.test(response);
    const hasNumberedList = /^\d+\.\s+.+$/m.test(response);
    const hasParagraphs = response.split('\n\n').length > 3;

    if (hasHeaders) {
      reasons.push('Contains structured headers');
      confidence += 15;
    }
    if (hasBulletPoints || hasNumberedList) {
      reasons.push('Contains lists');
      confidence += 10;
    }
    if (hasParagraphs) {
      reasons.push('Multiple paragraphs');
      confidence += 5;
    }

    // Extract potential title
    let suggestedTitle: string | undefined;
    const firstLine = response.split('\n')[0];
    if (firstLine && firstLine.length < 100) {
      suggestedTitle = firstLine.replace(/^#+\s*/, '').trim();
    }

    // Check for presentation markers in response
    const hasPresentationMarkers = 
      /slide\s*\d+/i.test(response) ||
      /^#{1,3}\s*slide/im.test(response) ||
      response.toLowerCase().includes('presentation') ||
      response.toLowerCase().includes('slides');
    
    if (hasPresentationMarkers) {
      isPresentationWorthy = true;
      reasons.push('Response contains presentation markers');
    }

    // Determine content type
    let contentType: 'essay' | 'list' | 'code' | 'definition' | 'presentation' | 'general' = 'general';
    const hasCodeBlock = /```[\s\S]*```/.test(response);
    const isDefinition = response.toLowerCase().includes('definition') ||
                        response.match(/^.+\s+is\s+.+/i) !== null ||
                        response.match(/^.+\s+are\s+.+/i) !== null ||
                        response.match(/^.+\s+refers?\s+to\s+.+/i) !== null ||
                        (wordCount < 100 && !hasHeaders);
    
    // Check if it's primarily a list (not just has some lists)
    const listLines = response.split('\n').filter(line => /^[\*\-\d]+[\.\)]\s+/.test(line.trim()));
    const totalLines = response.split('\n').filter(line => line.trim()).length;
    const isPrimarilyList = listLines.length > totalLines * 0.6; // More than 60% of lines are list items
    
    if (isPresentationWorthy || hasPresentationMarkers) {
      contentType = 'presentation';
    } else if (hasCodeBlock) {
      contentType = 'code';
    } else if (isDefinition) {
      contentType = 'definition';
    } else if (hasHeaders && hasParagraphs && wordCount > 100) {
      // Essay/Document takes precedence over list if it has structure
      contentType = 'essay';
    } else if (isPrimarilyList) {
      // Only mark as list if it's primarily a list, not just contains some lists
      contentType = 'list';
    } else if (wordCount > 150) {
      // Default longer content to essay/document
      contentType = 'essay';
    }

    // Determine if essay-worthy
    const isEssayWorthy = (confidence >= 50 || 
      (response.length >= this.MIN_LENGTH_FOR_ESSAY && hasParagraphs)) && 
      contentType !== 'presentation';

    // Count potential slides
    const slideMatches = response.match(/slide\s*\d+/gi) || [];
    const slideCount = Math.max(slideMatches.length, response.split(/^#{1,3}\s+/m).length - 1);

    return {
      isEssayWorthy,
      isPresentationWorthy,
      confidence: Math.min(confidence, 100),
      reasons,
      suggestedTitle,
      contentType,
      metadata: {
        wordCount,
        hasHeaders,
        paragraphCount: response.split('\n\n').length,
        slideCount: slideCount > 0 ? slideCount : undefined,
      },
    };
  }

  static shouldShowInEditor(
    userPrompt: string,
    response: string,
    forceThreshold?: number
  ): boolean {
    const analysis = this.analyzeResponse(userPrompt, response);
    const threshold = forceThreshold ?? 50;
    
    return analysis.isEssayWorthy || analysis.confidence >= threshold;
  }

  /**
   * Analyze partial content during streaming to detect essay-worthy or presentation-worthy content early
   */
  static analyzeStreamingContent(
    userPrompt: string,
    partialResponse: string
  ): { 
    shouldOpenEditor: boolean; 
    shouldOpenPresentation: boolean;
    contentType: 'essay' | 'list' | 'code' | 'definition' | 'presentation' | 'general' 
  } {
    // Quick checks for early detection
    const promptAnalysis = this.analyzeUserPrompt(userPrompt);
    const hasEssayMarkers = /^#\s+.+/m.test(partialResponse) || 
                           /^##\s+.+/m.test(partialResponse);
    const hasPresentationMarkers = 
      /slide\s*\d+/i.test(partialResponse) ||
      /^#{1,3}\s*slide/im.test(partialResponse) ||
      partialResponse.toLowerCase().includes('presentation') ||
      partialResponse.toLowerCase().includes('slides');
    const hasCodeBlock = /```/.test(partialResponse);
    const hasList = /^[\*\-\d]+[\.\)]\s+/m.test(partialResponse);
    const isDefinition = partialResponse.toLowerCase().includes('definition') ||
                        partialResponse.match(/^.+\s+is\s+.+/i) !== null ||
                        partialResponse.match(/^.+\s+refers?\s+to\s+.+/i) !== null;
    
    let contentType: 'essay' | 'list' | 'code' | 'definition' | 'presentation' | 'general' = 'general';
    
    if (promptAnalysis.isPresentation || hasPresentationMarkers) {
      contentType = 'presentation';
    } else if (hasCodeBlock) {
      contentType = 'code';
    } else if (hasList) {
      contentType = 'list';
    } else if (isDefinition) {
      contentType = 'definition';
    } else if (hasEssayMarkers || (promptAnalysis.isEssay && partialResponse.length > 100)) {
      contentType = 'essay';
    }
    
    // Open editor early if we detect essay content or user requested it
    const shouldOpenEditor = contentType === 'essay' || 
                           (promptAnalysis.isEssay && partialResponse.length > 50);
    
    // Open presentation builder if we detect presentation content
    const shouldOpenPresentation = contentType === 'presentation' ||
                                  (promptAnalysis.isPresentation && partialResponse.length > 30);
    
    return { shouldOpenEditor, shouldOpenPresentation, contentType };
  }
}
