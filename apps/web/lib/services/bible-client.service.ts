// Client-side Bible service that only makes API calls
// This doesn't import any server-side dependencies like MongoDB

import type { Bible, BibleBook, BibleChapter, BibleVerse } from '@/types/bible';
import { auth } from '@/lib/firebase';

class BibleClientService {
  private async getAuthHeaders(): Promise<HeadersInit> {
    const user = auth.currentUser;
    if (!user) {
      return {};
    }
    
    const token = await user.getIdToken();
    return {
      'Authorization': `Bearer ${token}`,
    };
  }
  /**
   * Fetch all available Bibles
   */
  async getBibles(params?: {
    language?: string;
    abbreviation?: string;
    name?: string;
    ids?: string;
    includeFullDetails?: boolean;
  }): Promise<Bible[]> {
    const queryParams = new URLSearchParams();
    
    if (params?.language) queryParams.append('language', params.language);
    if (params?.abbreviation) queryParams.append('abbreviation', params.abbreviation);
    if (params?.name) queryParams.append('name', params.name);
    if (params?.ids) queryParams.append('ids', params.ids);
    if (params?.includeFullDetails) queryParams.append('include-full-details', 'true');

    const url = `/api/bibles${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    const headers = await this.getAuthHeaders();
    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`Bible API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.bibles;
  }

  /**
   * Get a specific Bible by ID
   */
  async getBible(bibleId: string): Promise<Bible> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`/api/bibles/${bibleId}`, { headers });

    if (!response.ok) {
      throw new Error(`Bible API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  }

  /**
   * Get books for a specific Bible
   */
  async getBooks(bibleId: string): Promise<BibleBook[]> {
    // Using public endpoint temporarily
    const response = await fetch(`/api/bibles/${bibleId}/books/public`);

    if (!response.ok) {
      throw new Error(`Bible API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.books;
  }

  /**
   * Get a specific verse
   */
  async getVerse(
    bibleId: string, 
    verseId: string,
    params?: {
      contentType?: 'html' | 'json' | 'text';
      includeNotes?: boolean;
      includeTitles?: boolean;
      includeChapterNumbers?: boolean;
      includeVerseNumbers?: boolean;
      includeVerseSpans?: boolean;
    }
  ): Promise<BibleVerse> {
    const queryParams = new URLSearchParams();
    
    if (params?.contentType) queryParams.append('content-type', params.contentType);
    if (params?.includeNotes !== undefined) queryParams.append('include-notes', params.includeNotes.toString());
    if (params?.includeTitles !== undefined) queryParams.append('include-titles', params.includeTitles.toString());
    if (params?.includeChapterNumbers !== undefined) queryParams.append('include-chapter-numbers', params.includeChapterNumbers.toString());
    if (params?.includeVerseNumbers !== undefined) queryParams.append('include-verse-numbers', params.includeVerseNumbers.toString());
    if (params?.includeVerseSpans !== undefined) queryParams.append('include-verse-spans', params.includeVerseSpans.toString());

    const url = `/api/bibles/${bibleId}/verses/${verseId}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    const headers = await this.getAuthHeaders();
    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`Bible API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  }

  /**
   * Get a verse range (e.g., John 1:1-5)
   */
  async getVerseRange(
    bibleId: string,
    bookId: string,
    chapterNumber: number,
    startVerse: number,
    endVerse: number,
    params?: {
      contentType?: 'html' | 'json' | 'text';
      includeNotes?: boolean;
      includeTitles?: boolean;
      includeChapterNumbers?: boolean;
      includeVerseNumbers?: boolean;
      includeVerseSpans?: boolean;
    }
  ): Promise<BibleChapter> {
    // Construct passage ID
    const passageId = `${bookId}.${chapterNumber}.${startVerse}-${endVerse}`;
    
    const queryParams = new URLSearchParams();
    
    if (params?.contentType) queryParams.append('content-type', params.contentType);
    if (params?.includeNotes !== undefined) queryParams.append('include-notes', params.includeNotes.toString());
    if (params?.includeTitles !== undefined) queryParams.append('include-titles', params.includeTitles.toString());
    if (params?.includeChapterNumbers !== undefined) queryParams.append('include-chapter-numbers', params.includeChapterNumbers.toString());
    if (params?.includeVerseNumbers !== undefined) queryParams.append('include-verse-numbers', params.includeVerseNumbers.toString());
    if (params?.includeVerseSpans !== undefined) queryParams.append('include-verse-spans', params.includeVerseSpans.toString());

    const url = `/api/bibles/${bibleId}/passages/${passageId}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    const headers = await this.getAuthHeaders();
    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`Bible API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  }

  /**
   * Get a chapter
   */
  async getChapter(
    bibleId: string, 
    chapterId: string,
    params?: {
      contentType?: 'html' | 'json' | 'text';
      includeNotes?: boolean;
      includeTitles?: boolean;
      includeChapterNumbers?: boolean;
      includeVerseNumbers?: boolean;
      includeVerseSpans?: boolean;
    }
  ): Promise<BibleChapter> {
    const queryParams = new URLSearchParams();
    
    if (params?.contentType) queryParams.append('content-type', params.contentType);
    if (params?.includeNotes !== undefined) queryParams.append('include-notes', params.includeNotes.toString());
    if (params?.includeTitles !== undefined) queryParams.append('include-titles', params.includeTitles.toString());
    if (params?.includeChapterNumbers !== undefined) queryParams.append('include-chapter-numbers', params.includeChapterNumbers.toString());
    if (params?.includeVerseNumbers !== undefined) queryParams.append('include-verse-numbers', params.includeVerseNumbers.toString());
    if (params?.includeVerseSpans !== undefined) queryParams.append('include-verse-spans', params.includeVerseSpans.toString());

    const url = `/api/bibles/${bibleId}/chapters/${chapterId}/public${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    // Using public endpoint temporarily
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Bible API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  }

  /**
   * Search Bible content
   */
  async search(
    bibleId: string,
    query: string,
    params?: {
      limit?: number;
      offset?: number;
      sort?: 'relevance' | 'canonical';
      range?: string;
      fuzziness?: 'AUTO' | 'NONE' | number;
    }
  ): Promise<BibleVerse[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('query', query);
    
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.sort) queryParams.append('sort', params.sort);
    if (params?.range) queryParams.append('range', params.range);
    if (params?.fuzziness !== undefined) queryParams.append('fuzziness', params.fuzziness.toString());

    const url = `/api/bibles/${bibleId}/search?${queryParams.toString()}`;
    
    const headers = await this.getAuthHeaders();
    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`Bible API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.results || [];
  }
}

// Export singleton instance
export const bibleClientService = new BibleClientService();
