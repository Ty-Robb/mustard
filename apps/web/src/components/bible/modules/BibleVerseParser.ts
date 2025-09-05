export interface ParsedVerse {
  verseId: string;
  verseNumber: string;
  text: string;
}

export class BibleVerseParser {
  static parseChapterContent(
    chapter: { bookId: string; number: string | number; content: string },
    focusMode: boolean = false
  ): string {
    let html = '';
    
    if (chapter.content) {
      // Check if content is already HTML with verse spans
      if (chapter.content.includes('<span') && chapter.content.includes('data-number')) {
        // Parse the HTML content to extract verses
        const parser = new DOMParser();
        const doc = parser.parseFromString(chapter.content, 'text/html');
        
        // Try different selectors for verse spans
        let verseSpans = doc.querySelectorAll('span.v[data-number]');
        if (verseSpans.length === 0) {
          verseSpans = doc.querySelectorAll('span[data-number]');
        }
        
        html = `<div class="bible-content">`;
        
        verseSpans.forEach((span) => {
          const verseNum = span.getAttribute('data-number');
          
          // Get all text content after this span until the next span
          let verseText = '';
          let nextNode = span.nextSibling;
          
          while (nextNode && !(nextNode.nodeType === 1 && (nextNode as Element).classList?.contains('v'))) {
            if (nextNode.nodeType === 3) { // Text node
              verseText += nextNode.textContent || '';
            } else if (nextNode.nodeType === 1) { // Element node
              verseText += (nextNode as Element).textContent || '';
            }
            nextNode = nextNode.nextSibling;
          }
          
          // Clean up the text
          verseText = verseText.trim();
          
          // Create a paragraph for each verse with proper spacing
          if (verseText) {
            html += `<p class="mb-3" data-verse-id="${chapter.bookId}.${chapter.number}.${verseNum}">`;
            if (!focusMode) {
              html += `<sup class="text-xs font-medium text-muted-foreground mr-1">${verseNum}</sup> `;
            }
            html += verseText;
            html += `</p>`;
          }
        });
        
        html += '</div>';
      } else {
        // Fallback to regex parsing for plain text
        html = `<div class="bible-content">`;
        
        // Split the content by verse numbers
        const verses = chapter.content.split(/(?=\b\d+\b(?:[A-Z]|\s+[A-Z]))/);
        
        verses.forEach((verse, index) => {
          if (verse.trim()) {
            // Extract verse number and text
            const verseMatch = verse.match(/^(\d+)\s*([\s\S]*)$/);
            if (verseMatch) {
              const [, verseNum, verseText] = verseMatch;
              
              // Create a paragraph for each verse with proper spacing
              html += `<p class="mb-3" data-verse-id="${chapter.bookId}.${chapter.number}.${verseNum}">`;
              if (!focusMode) {
                html += `<sup class="text-xs font-medium text-muted-foreground mr-1">${verseNum}</sup> `;
              }
              html += verseText.trim();
              html += `</p>`;
            } else if (index === 0) {
              // Handle any text before the first verse number
              html += `<p class="mb-3">${verse.trim()}</p>`;
            }
          }
        });
        
        html += '</div>';
      }
    }
    
    return html;
  }

  static extractVerseId(element: HTMLElement): string | null {
    // Walk up the DOM tree to find the element with data-verse-id
    let current: HTMLElement | null = element;
    
    while (current) {
      if (current.hasAttribute?.('data-verse-id')) {
        return current.getAttribute('data-verse-id');
      }
      current = current.parentElement;
    }
    
    return null;
  }

  static normalizeText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/['']/g, "'") // Normalize quotes
      .replace(/[""]/g, '"') // Normalize double quotes
      .trim();
  }
}
