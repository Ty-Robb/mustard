import { 
  Bible, 
  BibleApiListResponse, 
  BibleApiResponse, 
  BibleVerse, 
  BibleChapter,
  BibleBook,
  CachedBibleContent 
} from '@/types/bible';
import { getUserDatabase } from '@/lib/utils/user-db';
import { vectorService } from './vector.service';

const BIBLE_API_BASE_URL = 'https://api.scripture.api.bible/v1';

export class BibleService {
  private apiKey: string;
  private headers: HeadersInit;

  constructor() {
    this.apiKey = process.env.BIBLE_API_KEY!;
    
    // Debug logging
    console.log('[BibleService] Initializing with API key:', {
      exists: !!this.apiKey,
      length: this.apiKey?.length || 0,
      firstChars: this.apiKey?.substring(0, 8) + '...'
    });
    
    this.headers = {
      'api-key': this.apiKey,
      'Content-Type': 'application/json',
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

    const url = `${BIBLE_API_BASE_URL}/bibles${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error(`Bible API error: ${response.status} ${response.statusText}`);
    }

    const data: BibleApiListResponse<Bible> = await response.json();
    return data.data;
  }

  /**
   * Get a specific Bible by ID
   */
  async getBible(bibleId: string): Promise<Bible> {
    const response = await fetch(`${BIBLE_API_BASE_URL}/bibles/${bibleId}`, {
      method: 'GET',
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error(`Bible API error: ${response.status} ${response.statusText}`);
    }

    const data: BibleApiResponse<Bible> = await response.json();
    return data.data;
  }

  /**
   * Get books for a specific Bible
   */
  async getBooks(bibleId: string): Promise<BibleBook[]> {
    const response = await fetch(`${BIBLE_API_BASE_URL}/bibles/${bibleId}/books`, {
      method: 'GET',
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error(`Bible API error: ${response.status} ${response.statusText}`);
    }

    const data: BibleApiListResponse<BibleBook> = await response.json();
    return data.data;
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

    const url = `${BIBLE_API_BASE_URL}/bibles/${bibleId}/verses/${verseId}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error(`Bible API error: ${response.status} ${response.statusText}`);
    }

    const data: BibleApiResponse<BibleVerse> = await response.json();
    return data.data;
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

    const url = `${BIBLE_API_BASE_URL}/bibles/${bibleId}/chapters/${chapterId}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error(`Bible API error: ${response.status} ${response.statusText}`);
    }

    const data: BibleApiResponse<BibleChapter> = await response.json();
    return data.data;
  }

  /**
   * Get a verse range (e.g., John 1:1-5)
   * This fetches multiple verses and combines them into a single response
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
    console.log('[BibleService] getVerseRange called:', { bibleId, bookId, chapterNumber, startVerse, endVerse });
    
    // The Bible API supports passage queries using the format: bookId.chapter.startVerse-bookId.chapter.endVerse
    const passageId = `${bookId}.${chapterNumber}.${startVerse}-${bookId}.${chapterNumber}.${endVerse}`;
    
    const queryParams = new URLSearchParams();
    if (params?.contentType) queryParams.append('content-type', params.contentType);
    if (params?.includeNotes !== undefined) queryParams.append('include-notes', params.includeNotes.toString());
    if (params?.includeTitles !== undefined) queryParams.append('include-titles', params.includeTitles.toString());
    if (params?.includeChapterNumbers !== undefined) queryParams.append('include-chapter-numbers', params.includeChapterNumbers.toString());
    if (params?.includeVerseNumbers !== undefined) queryParams.append('include-verse-numbers', params.includeVerseNumbers.toString());
    if (params?.includeVerseSpans !== undefined) queryParams.append('include-verse-spans', params.includeVerseSpans.toString());

    // Use the passages endpoint for verse ranges
    const url = `${BIBLE_API_BASE_URL}/bibles/${bibleId}/passages/${passageId}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    console.log('[BibleService] Fetching passage from URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: this.headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[BibleService] API error response:', errorText);
      throw new Error(`Bible API error: ${response.status} ${response.statusText}`);
    }

    const data: BibleApiResponse<any> = await response.json();
    
    // Transform the passage response to match BibleChapter structure
    const passage = data.data;
    const chapterData: BibleChapter = {
      id: `${bookId}.${chapterNumber}`,
      bibleId: passage.bibleId,
      bookId: bookId,
      number: chapterNumber.toString(),
      reference: `${bookId} ${chapterNumber}:${startVerse}-${endVerse}`,
      content: passage.content,
      copyright: passage.copyright,
      next: passage.next,
      previous: passage.previous,
      verseCount: endVerse - startVerse + 1
    };
    
    return chapterData;
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

    const url = `${BIBLE_API_BASE_URL}/bibles/${bibleId}/search?${queryParams.toString()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error(`Bible API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.data.verses || [];
  }

  /**
   * Cache Bible content in user's database with embeddings
   */
  async cacheBibleContent(
    userId: string,
    content: CachedBibleContent
  ): Promise<CachedBibleContent> {
    const db = await getUserDatabase(userId);
    const collection = db.collection<CachedBibleContent>('bible_content');

    // Generate embedding for the content
    const embedding = await vectorService.generateEmbedding(content.content);

    const cachedContent: CachedBibleContent = {
      ...content,
      embedding,
      embeddingModel: 'text-embedding-004',
      embeddingDate: new Date(),
      cachedAt: new Date(),
      lastAccessed: new Date(),
    };

    // Check if already cached
    const existing = await collection.findOne({
      bibleId: content.bibleId,
      reference: content.reference,
    });

    if (existing) {
      // Update last accessed time
      await collection.updateOne(
        { _id: existing._id },
        { 
          $set: { 
            lastAccessed: new Date(),
            embedding,
            embeddingModel: 'text-embedding-004',
            embeddingDate: new Date(),
          } 
        }
      );
      return { ...existing, lastAccessed: new Date() };
    }

    // Insert new cached content
    const result = await collection.insertOne(cachedContent);
    return { ...cachedContent, _id: result.insertedId.toString() };
  }

  /**
   * Get cached Bible content from user's database
   */
  async getCachedContent(
    userId: string,
    bibleId: string,
    reference: string
  ): Promise<CachedBibleContent | null> {
    const db = await getUserDatabase(userId);
    const collection = db.collection<CachedBibleContent>('bible_content');

    const cached = await collection.findOne({
      bibleId,
      reference,
    });

    if (cached) {
      // Update last accessed time
      await collection.updateOne(
        { _id: cached._id },
        { $set: { lastAccessed: new Date() } }
      );
    }

    return cached;
  }

  /**
   * Search cached Bible content using vector similarity
   */
  async searchCachedContent(
    userId: string,
    query: string,
    options: {
      limit?: number;
      bibleId?: string;
      minScore?: number;
    } = {}
  ): Promise<CachedBibleContent[]> {
    const { limit = 10, bibleId, minScore = 0.7 } = options;
    
    const db = await getUserDatabase(userId);
    const collection = db.collection<CachedBibleContent>('bible_content');

    // Generate embedding for the query
    const queryEmbedding = await vectorService.generateEmbedding(query);

    // Build aggregation pipeline
    const pipeline: any[] = [
      {
        $vectorSearch: {
          index: "bible_content_vector_index",
          path: "embedding",
          queryVector: queryEmbedding,
          numCandidates: limit * 10,
          limit: limit,
        }
      },
      {
        $project: {
          _id: 1,
          bibleId: 1,
          reference: 1,
          content: 1,
          metadata: 1,
          score: { $meta: "searchScore" }
        }
      }
    ];

    // Add Bible ID filter if specified
    if (bibleId) {
      pipeline.splice(1, 0, {
        $match: { bibleId }
      });
    }

    // Add minimum score filter
    pipeline.push({
      $match: { score: { $gte: minScore } }
    });

    try {
      const results = await collection.aggregate<CachedBibleContent>(pipeline).toArray();
      return results;
    } catch (error) {
      console.warn('Vector search failed, falling back to text search:', error);
      
      // Fallback to text search
      const textQuery: any = {};
      if (bibleId) textQuery.bibleId = bibleId;
      if (query) {
        textQuery.$text = { $search: query };
      }

      const results = await collection
        .find(textQuery)
        .limit(limit)
        .toArray();

      return results;
    }
  }
}

// Export singleton instance
export const bibleService = new BibleService();
