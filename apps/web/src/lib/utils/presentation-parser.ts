import { Slide, SlideLayout } from '@/types/presentation';

export interface ParsedPresentation {
  title: string;
  slides: Slide[];
  metadata?: {
    totalSlides: number;
    estimatedDuration?: number;
    tags?: string[];
  };
}

export class PresentationParser {
  /**
   * Parse AI response content into presentation slides
   */
  static parsePresentation(content: string): ParsedPresentation | null {
    // Check if content contains presentation markers
    if (!this.isPresentationContent(content)) {
      return null;
    }

    // Extract content between PRESENTATION START/END if present
    let presentationContent = content;
    const startMatch = content.match(/\[PRESENTATION START\]([\s\S]*?)\[PRESENTATION END\]/i);
    if (startMatch) {
      presentationContent = startMatch[1].trim();
      console.log('[PresentationParser] Extracted content between PRESENTATION markers');
    }

    const slides: Slide[] = [];
    let presentationTitle = 'Presentation';
    let slideId = 1;

    // Split content by slide markers
    const slideBlocks = this.extractSlideBlocks(presentationContent);

    slideBlocks.forEach((block, index) => {
      const slide = this.parseSlideBlock(block, slideId.toString(), index);
      if (slide) {
        slides.push(slide);
        slideId++;

        // Extract presentation title from first title slide
        if (index === 0 && slide.layout === 'title' && slide.content.title) {
          presentationTitle = slide.content.title;
        }
      }
    });

    // If no slides were parsed, return null
    if (slides.length === 0) {
      return null;
    }

    return {
      title: presentationTitle,
      slides,
      metadata: {
        totalSlides: slides.length,
        estimatedDuration: Math.ceil(slides.length * 2), // 2 minutes per slide estimate
      },
    };
  }

  /**
   * Check if content contains presentation markers
   */
  static isPresentationContent(content: string): boolean {
    // Check for explicit presentation markers FIRST
    if (/\[PRESENTATION START\]/i.test(content) && /\[PRESENTATION END\]/i.test(content)) {
      console.log('[PresentationParser] Found explicit PRESENTATION START/END markers');
      return true;
    }
    
    // First, exclude orchestrator/system messages (but not if they have presentation markers)
    const excludePatterns = [
      /orchestrat/i,
      /\[system\]/i,
      /\[agent:/i,
      /gathering information/i,
      /analyzing your question/i,
      /organizing response/i,
      /finalizing content/i,
      /please wait/i,
      /loading/i,
    ];
    
    // Only exclude if no presentation markers are found
    const hasExcludePattern = excludePatterns.some(pattern => pattern.test(content));
    
    const presentationMarkers = [
      /\[presentation\]/i,
      /\[slides?\s*\d+\]/i,
      /^#{1,2}\s*slide\s*\d+/im,
      /^slide\s*\d+:/im,
      /\[title\s*slide\]/i,
      /---\s*slide\s*---/i,
      /^\*\*\*slide/im,
      /^---$/gm, // Three dashes on their own line (common slide separator)
      /\[presentation\s*start\]/i, // More explicit presentation start marker
    ];

    // Debug logging
    console.log('[PresentationParser] Checking content for presentation markers:', {
      contentLength: content.length,
      contentPreview: content.substring(0, 200),
    });

    // Check for explicit markers
    const hasExplicitMarkers = presentationMarkers.some(marker => {
      const matches = marker.test(content);
      if (matches) {
        console.log('[PresentationParser] Found marker:', marker.toString());
      }
      return matches;
    });
    
    // If we have explicit markers, ignore exclude patterns
    if (hasExplicitMarkers) {
      console.log('[PresentationParser] Explicit markers found, returning true');
      return true;
    }
    
    // Only apply exclusion if no markers found
    if (hasExcludePattern) {
      console.log('[PresentationParser] Excluded due to pattern and no presentation markers');
      return false;
    }
    
    // Check for numbered content that looks like slides
    const numberedSlidePattern = /^(slide\s*)?(\d+\.|\d+\))\s*[A-Z]/gm;
    const matches = content.match(numberedSlidePattern);
    if (matches && matches.length >= 3) {
      console.log('[PresentationParser] Found numbered slides pattern:', matches);
      return true;
    }
    
    // Check for content with multiple sections that look like slides
    const sections = content.split(/\n\n+/);
    if (sections.length >= 3) {
      // Check if sections have consistent structure (title + content)
      let titleCount = 0;
      for (const section of sections) {
        if (/^(#{1,3}\s*.+|[A-Z].+:)/.test(section.trim())) {
          titleCount++;
        }
      }
      // If most sections have titles, likely a presentation
      if (titleCount >= sections.length * 0.7) {
        console.log('[PresentationParser] Detected presentation by section structure:', {
          sections: sections.length,
          titleCount,
        });
        return true;
      }
    }
    
    console.log('[PresentationParser] No presentation markers found');
    return false;
  }

  /**
   * Extract slide blocks from content
   */
  static extractSlideBlocks(content: string): string[] {
    // Try different slide separators
    const separators = [
      /---\s*slide\s*---/i,
      /\[slide\s*\d+\]/i,
      /^#{1,2}\s*slide\s*\d+/im,
      /^slide\s*\d+:/im,
      /^\*\*\*slide/im,
    ];

    for (const separator of separators) {
      const blocks = content.split(separator).filter(block => block.trim());
      if (blocks.length > 1) {
        return blocks;
      }
    }

    // Try simple --- separator (three or more dashes on their own line)
    const dashSeparatorPattern = /^-{3,}$/gm;
    if (dashSeparatorPattern.test(content)) {
      const blocks = content.split(dashSeparatorPattern).filter(block => block.trim());
      if (blocks.length > 1) {
        return blocks;
      }
    }

    // Try numbered slides pattern
    const numberedPattern = /^(?:slide\s*)?(\d+\.|\d+\))\s*/gim;
    const numberedBlocks = content.split(numberedPattern).filter(block => block.trim());
    if (numberedBlocks.length > 2) {
      // Group blocks properly (number + content)
      const slides = [];
      for (let i = 0; i < numberedBlocks.length; i += 2) {
        if (i + 1 < numberedBlocks.length) {
          slides.push(numberedBlocks[i] + numberedBlocks[i + 1]);
        }
      }
      if (slides.length > 1) return slides;
    }

    // If no explicit separators, try to split by major headings
    const headingBlocks = content.split(/^#{1,2}\s+/m).filter(block => block.trim());
    if (headingBlocks.length > 2) {
      // Re-add the heading markers
      return headingBlocks.map((block, index) => {
        if (index === 0) return block; // First block might not have a heading
        return '## ' + block;
      });
    }

    // Try to split by double newlines if we have multiple sections
    const doubleNewlineBlocks = content.split(/\n\n+/).filter(block => block.trim());
    if (doubleNewlineBlocks.length >= 3) {
      // Check if blocks have consistent structure
      let validBlocks = 0;
      for (const block of doubleNewlineBlocks) {
        if (/^(#{1,3}\s*.+|[A-Z].+:|.+\n[-=]+$)/m.test(block.trim())) {
          validBlocks++;
        }
      }
      if (validBlocks >= doubleNewlineBlocks.length * 0.6) {
        return doubleNewlineBlocks;
      }
    }

    // If no separators found, treat entire content as one slide
    return [content];
  }

  /**
   * Parse a single slide block
   */
  static parseSlideBlock(block: string, id: string, order: number): Slide | null {
    const lines = block.trim().split('\n').filter(line => line.trim());
    if (lines.length === 0) return null;

    // Force first slide to always be a title slide
    const layout = order === 0 ? 'title' : this.detectSlideLayout(block);
    const content = this.extractSlideContent(block, layout);

    return {
      id,
      order,
      layout,
      content,
      speakerNotes: {
        script: '',
        deliveryCues: [],
        timing: '',
        transitions: { in: '', out: '' },
        engagement: [],
        emphasis: []
      },
      visualElements: []
    };
  }

  /**
   * Detect slide layout from content
   */
  static detectSlideLayout(block: string): SlideLayout {
    const lowerBlock = block.toLowerCase();

    // Check for explicit layout markers
    if (/\[title\s*slide\]/i.test(block) || /\[layout:\s*title\]/i.test(block)) {
      return 'title';
    }
    if (/\[quote\]/i.test(block) || /^>\s*.+/m.test(block)) {
      return 'quote';
    }
    if (/\[two\s*column\]/i.test(block) || /\|\s*.*\s*\|\s*.*\s*\|/m.test(block)) {
      return 'two-column';
    }
    if (/\[image\]/i.test(block) || /!\[.*\]\(.*\)/m.test(block)) {
      return 'full-image';
    }
    if (/\[chart\]/i.test(block) || /```chart/i.test(block)) {
      return 'two-column'; // Chart will be in column with text
    }
    if (/\[table\]/i.test(block) || /\|.*\|.*\|/m.test(block)) {
      return 'two-column'; // Table will be in column with text
    }

    // Auto-detect based on content structure
    const lines = block.trim().split('\n');
    const hasTitle = /^#{1,3}\s*.+/m.test(block);
    const hasBullets = /^[\*\-]\s+.+/m.test(block);
    const hasSubtitle = lines.length >= 2 && !hasBullets;

    if (hasTitle && hasSubtitle && lines.length <= 3) {
      return 'title';
    }

    return 'content';
  }

  /**
   * Extract content based on layout
   */
  static extractSlideContent(block: string, layout: SlideLayout): any {
    const content: any = {};
    
    // Clean up common tags from the content
    block = block
      .replace(/\[SUMMARY\]/gi, '')
      .replace(/\[CONTENT\]/gi, '')
      .replace(/\[VISUAL:\s*([^\]]+)\]/gi, '[image: $1]')
      .replace(/\[layout:\s*([^\]]+)\]/gi, '[layout: $1]')
      .trim();
    
    const lines = block.trim().split('\n').filter(line => line.trim());

    switch (layout) {
      case 'title':
        // Extract title and subtitle only - no body paragraphs
        const titleMatch = block.match(/^#{1,3}\s*(.+)$/m);
        if (titleMatch) {
          content.title = titleMatch[1].trim();
          // Look for subtitle in the next non-empty line
          const remainingLines = block.substring(titleMatch.index! + titleMatch[0].length)
            .trim()
            .split('\n')
            .filter(line => line.trim());
          if (remainingLines.length > 0) {
            // Only use the first line as subtitle, ignore any additional paragraphs
            const potentialSubtitle = remainingLines[0].trim();
            // Check if it's not a paragraph (not too long)
            if (potentialSubtitle.length <= 100) {
              content.subtitle = potentialSubtitle;
            }
          }
        } else if (lines.length > 0) {
          content.title = lines[0].trim();
          if (lines.length > 1) {
            // Only use second line as subtitle if it's not too long
            const potentialSubtitle = lines[1].trim();
            if (potentialSubtitle.length <= 100) {
              content.subtitle = potentialSubtitle;
            }
          }
        }
        // Explicitly do not include any body content for title slides
        break;

      case 'quote':
        // Extract quote text
        const quoteMatch = block.match(/^>\s*(.+)$/m);
        if (quoteMatch) {
          content.body = quoteMatch[1].trim();
          // Look for attribution
          const attributionMatch = block.match(/[-—]\s*(.+)$/m);
          if (attributionMatch) {
            content.subtitle = attributionMatch[1].trim();
          }
        } else {
          content.body = block.trim().replace(/["""]/g, '');
        }
        break;

      case 'two-column':
        // Extract title and columns
        const titleLine = lines.find(line => /^#{1,3}\s*.+/.test(line));
        if (titleLine) {
          content.title = titleLine.replace(/^#{1,3}\s*/, '').trim();
        }

        // Simple column detection (split by | or look for clear separation)
        const columnSeparator = block.includes('|') ? '|' : '\n\n';
        const parts = block.split(columnSeparator).filter(part => part.trim());
        if (parts.length >= 2) {
          content.columns = [
            { width: 50, content: this.parseMarkdown(parts[0].trim()) },
            { width: 50, content: this.parseMarkdown(parts[1].trim()) },
          ];
        }
        break;

      case 'full-image':
        // Extract image URL and caption
        const imageMatch = block.match(/!\[([^\]]*)\]\(([^)]+)\)/);
        if (imageMatch) {
          content.images = [{
            id: '1',
            url: imageMatch[2],
            alt: imageMatch[1],
            caption: imageMatch[1],
          }];
        }
        // Extract title if present
        const imageTitleMatch = block.match(/^#{1,3}\s*(.+)$/m);
        if (imageTitleMatch) {
          content.title = imageTitleMatch[1].trim();
        }
        break;

      default:
        // Standard content extraction
        const standardTitleMatch = block.match(/^#{1,3}\s*(.+)$/m);
        if (standardTitleMatch) {
          content.title = standardTitleMatch[1].trim();
          block = block.substring(standardTitleMatch.index! + standardTitleMatch[0].length).trim();
        } else if (lines.length > 0 && !lines[0].startsWith('-') && !lines[0].startsWith('*')) {
          // If no markdown header, use first line as title
          content.title = lines[0].trim();
          block = lines.slice(1).join('\n').trim();
        }

        // Extract bullet points
        const bulletMatches = block.match(/^[\*\-]\s+(.+)$/gm);
        if (bulletMatches && bulletMatches.length > 0) {
          content.bulletPoints = bulletMatches.map(bullet => 
            bullet.replace(/^[\*\-]\s+/, '').trim()
          );
          // Remove bullets from remaining content
          bulletMatches.forEach(bullet => {
            block = block.replace(bullet, '');
          });
        } else {
          // If no bullet points found, try to create them from lines
          const remainingLines = block.split('\n').filter(line => line.trim());
          if (remainingLines.length > 0 && remainingLines.length <= 5) {
            content.bulletPoints = remainingLines.map(line => line.trim());
            block = ''; // Clear block since we used all lines as bullets
          }
        }

        // Remaining content as body
        const remainingContent = block.trim();
        if (remainingContent && !content.bulletPoints) {
          content.body = remainingContent;
        }
    }

    return content;
  }

  /**
   * Simple markdown to HTML converter
   */
  static parseMarkdown(text: string): string {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br />');
  }

  /**
   * Check if a message should show presentation
   */
  static shouldShowPresentation(userPrompt: string, content: string): boolean {
    // Don't show presentation for user prompts asking to create presentations
    // Only show when the AI response actually contains presentation content
    return this.isPresentationContent(content);
  }

  /**
   * Convert parsed presentation to TipTap editor format
   */
  static toTipTapFormat(presentation: ParsedPresentation): any {
    const content: any[] = [];

    presentation.slides.forEach((slide, index) => {
      const slideContent: any[] = [];

      // Add slide content based on layout
      switch (slide.layout) {
        case 'title':
          if (slide.content.title) {
            slideContent.push({
              type: 'heading',
              attrs: { level: 1 },
              content: [{ type: 'text', text: slide.content.title }],
            });
          }
          if (slide.content.subtitle) {
            slideContent.push({
              type: 'heading',
              attrs: { level: 2 },
              content: [{ type: 'text', text: slide.content.subtitle }],
            });
          }
          break;

        case 'quote':
          slideContent.push({
            type: 'blockquote',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: slide.content.body || '' }],
              },
            ],
          });
          if (slide.content.subtitle) {
            slideContent.push({
              type: 'paragraph',
              content: [{ type: 'text', text: `— ${slide.content.subtitle}` }],
            });
          }
          break;

        case 'two-column':
          if (slide.content.title) {
            slideContent.push({
              type: 'heading',
              attrs: { level: 2 },
              content: [{ type: 'text', text: slide.content.title }],
            });
          }
          // For two columns, add as separate paragraphs for now
          if (slide.content.columns) {
            slide.content.columns.forEach((col: any) => {
              slideContent.push({
                type: 'paragraph',
                content: [{ type: 'text', text: col.content.replace(/<[^>]*>/g, '') }], // Strip HTML
              });
            });
          }
          break;

        default:
          // Standard content slide
          if (slide.content.title) {
            slideContent.push({
              type: 'heading',
              attrs: { level: 2 },
              content: [{ type: 'text', text: slide.content.title }],
            });
          }
          if (slide.content.body) {
            slideContent.push({
              type: 'paragraph',
              content: [{ type: 'text', text: slide.content.body }],
            });
          }
          if (slide.content.bulletPoints && slide.content.bulletPoints.length > 0) {
            slideContent.push({
              type: 'bulletList',
              content: slide.content.bulletPoints.map((point: string) => ({
                type: 'listItem',
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: point }],
                  },
                ],
              })),
            });
          }
      }

      // Add slide node
      content.push({
        type: 'slide',
        attrs: {
          layout: slide.layout,
          slideNumber: index + 1,
        },
        content: slideContent,
      });

      // Add slide break between slides (except after last slide)
      if (index < presentation.slides.length - 1) {
        content.push({
          type: 'slideBreak',
        });
      }
    });

    return {
      type: 'doc',
      content,
    };
  }

  /**
   * Convert presentation to HTML for TipTap editor
   */
  static toTipTapHTML(presentation: ParsedPresentation): string {
    let html = '';

    presentation.slides.forEach((slide, index) => {
      html += `<div data-slide data-layout="${slide.layout}" data-slide-number="${index + 1}">`;

      switch (slide.layout) {
        case 'title':
          if (slide.content.title) {
            html += `<h1>${slide.content.title}</h1>`;
          }
          if (slide.content.subtitle) {
            html += `<h2>${slide.content.subtitle}</h2>`;
          }
          break;

        case 'quote':
          html += '<blockquote>';
          html += `<p>${slide.content.body || ''}</p>`;
          html += '</blockquote>';
          if (slide.content.subtitle) {
            html += `<p>— ${slide.content.subtitle}</p>`;
          }
          break;

        case 'two-column':
          if (slide.content.title) {
            html += `<h2>${slide.content.title}</h2>`;
          }
          if (slide.content.columns) {
            slide.content.columns.forEach((col: any) => {
              html += `<p>${col.content}</p>`;
            });
          }
          break;

        default:
          if (slide.content.title) {
            html += `<h2>${slide.content.title}</h2>`;
          }
          if (slide.content.body) {
            html += `<p>${slide.content.body}</p>`;
          }
          if (slide.content.bulletPoints && slide.content.bulletPoints.length > 0) {
            html += '<ul>';
            slide.content.bulletPoints.forEach((point: string) => {
              html += `<li>${point}</li>`;
            });
            html += '</ul>';
          }
      }

      html += '</div>';

      // Add slide break
      if (index < presentation.slides.length - 1) {
        html += '<hr data-slide-break />';
      }
    });

    return html;
  }

  /**
   * Convert a ParsedPresentation back to markdown format
   */
  static presentationToMarkdown(presentation: ParsedPresentation): string {
    let markdown = '[PRESENTATION START]\n\n';

    presentation.slides.forEach((slide, index) => {
      // Add slide separator (except for first slide)
      if (index > 0) {
        markdown += '\n---\n\n';
      }

      // Add slide content based on layout
      switch (slide.layout) {
        case 'title':
          if (slide.content.title) {
            markdown += `# ${slide.content.title}\n`;
          }
          if (slide.content.subtitle) {
            markdown += `\n${slide.content.subtitle}\n`;
          }
          break;

        case 'quote':
          if (slide.content.body) {
            markdown += `> ${slide.content.body}\n`;
          }
          if (slide.content.subtitle) {
            markdown += `\n— ${slide.content.subtitle}\n`;
          }
          break;

        case 'two-column':
          if (slide.content.title) {
            markdown += `## ${slide.content.title}\n\n`;
          }
          if (slide.content.columns && slide.content.columns.length >= 2) {
            // Simple representation of columns
            markdown += `${slide.content.columns[0].content} | ${slide.content.columns[1].content}\n`;
          }
          break;

        case 'full-image':
          if (slide.content.title) {
            markdown += `## ${slide.content.title}\n\n`;
          }
          if (slide.content.images && slide.content.images.length > 0) {
            const img = slide.content.images[0];
            markdown += `![${img.alt || img.caption || ''}](${img.url})\n`;
          }
          break;

        default:
          // Standard content slide
          if (slide.content.title) {
            markdown += `## ${slide.content.title}\n\n`;
          }
          if (slide.content.body) {
            markdown += `${slide.content.body}\n\n`;
          }
          if (slide.content.bulletPoints && slide.content.bulletPoints.length > 0) {
            slide.content.bulletPoints.forEach((point: string) => {
              markdown += `- ${point}\n`;
            });
          }
      }

      // Add speaker notes if present
      if (slide.speakerNotes && slide.speakerNotes.script) {
        markdown += `\n[Speaker Notes: ${slide.speakerNotes.script}]\n`;
      }
    });

    markdown += '\n[PRESENTATION END]';
    return markdown;
  }
}
