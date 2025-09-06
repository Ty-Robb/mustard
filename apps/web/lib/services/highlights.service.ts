import { Db, Collection, ObjectId } from 'mongodb';
import { getUserDatabase } from '../utils/user-db';
import type { Highlight, CreateHighlightInput, UpdateHighlightInput } from '@/types/highlights';

class HighlightsService {
  private userDbs: Map<string, Db> = new Map();
  
  // Clear cache method for debugging
  clearCache() {
    console.log('[v3] Clearing highlights service cache');
    this.userDbs.clear();
  }
  
  private async getUserDb(firebaseUid: string): Promise<Db> {
    if (!this.userDbs.has(firebaseUid)) {
      // Get user database directly using Firebase UID
      const db = await getUserDatabase(firebaseUid);
      this.userDbs.set(firebaseUid, db);
    }
    return this.userDbs.get(firebaseUid)!;
  }

  private async getHighlights(userId: string): Promise<Collection<Highlight>> {
    const db = await this.getUserDb(userId);
    return db.collection<Highlight>('highlights');
  }

  // Create a new highlight
  async createHighlight(userId: string, data: CreateHighlightInput): Promise<Highlight> {
    const highlights = await this.getHighlights(userId);
    
    const now = new Date();
    const highlight: Highlight = {
      ...data,
      tags: data.tags || [],
      createdAt: now,
      updatedAt: now,
    };

    const result = await highlights.insertOne(highlight);
    return { ...highlight, _id: result.insertedId };
  }

  // Get highlights for a specific reference
  async getHighlightsByReference(
    userId: string,
    reference: string
  ): Promise<Highlight[]> {
    const highlights = await this.getHighlights(userId);
    
    console.log('[v3] getHighlightsByReference called with:', { userId, reference });
    
    // Handle different reference formats
    // If reference is like "Genesis 1" or "GEN 1", find all verses in that chapter
    // If reference is like "GEN.1.3", find exact match
    
    let query: any;
    
    // Check if this is a chapter-level reference (no verse number)
    const chapterMatch = reference.match(/^([A-Za-z0-9\s]+)\s+(\d+)$/);
    if (chapterMatch) {
      // This is a chapter reference like "Genesis 1" or "1 John 1"
      const bookName = chapterMatch[1].trim();
      const chapter = chapterMatch[2];
      
      console.log('[v3] Searching for highlights - Book:', bookName, 'Chapter:', chapter);
      
      // Create book ID patterns for common book name variations
      const bookPatterns: string[] = [];
      
      // Handle numbered books (1 John, 2 Kings, etc.)
      const numberedBookMatch = bookName.match(/^(\d)\s*(.+)$/);
      if (numberedBookMatch) {
        const [, number, name] = numberedBookMatch;
        // Create patterns like "1JN", "1JO", "1JOHN"
        bookPatterns.push(`${number}${name.substring(0, 2).toUpperCase()}`);
        bookPatterns.push(`${number}${name.substring(0, 3).toUpperCase()}`);
        bookPatterns.push(`${number}${name.toUpperCase()}`);
      } else {
        // Regular books - create patterns like "GEN", "GENESIS"
        bookPatterns.push(bookName.substring(0, 3).toUpperCase());
        bookPatterns.push(bookName.toUpperCase());
      }
      
      // Build regex patterns for each book pattern
      const orConditions = [];
      
      // Add patterns for each book variation
      for (const bookPattern of bookPatterns) {
        // Match format like "GEN.1.3" or "1JN.1.3"
        orConditions.push({ reference: { $regex: `^${bookPattern}\\.${chapter}\\.`, $options: 'i' } });
      }
      
      // Also match the original book name formats
      orConditions.push(
        // Match format like "Genesis 1:3" or "1 John 1:3"
        { reference: { $regex: `^${bookName}\\s+${chapter}:`, $options: 'i' } },
        // Match format starting with book name and chapter
        { reference: { $regex: `^${bookName}\\s+${chapter}\\.`, $options: 'i' } },
        // Exact match for chapter-level highlights
        { reference: reference }
      );
      
      query = { $or: orConditions };
      
      console.log('Query conditions:', JSON.stringify(query, null, 2));
    } else {
      // For verse-specific references, do exact match
      query = { reference };
    }
    
    const results = await highlights
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
      
    console.log(`Found ${results.length} highlights for reference "${reference}"`);
    if (results.length > 0) {
      console.log('Sample highlights:', results.slice(0, 3).map(h => ({ ref: h.reference, text: h.text.substring(0, 50) })));
    }
    
    return results;
  }

  // Get all user highlights
  async getUserHighlights(
    userId: string,
    options?: {
      type?: Highlight['type'];
      tags?: string[];
      limit?: number;
      skip?: number;
    }
  ): Promise<Highlight[]> {
    const highlights = await this.getHighlights(userId);
    
    const query: any = {};
    
    if (options?.type) {
      query.type = options.type;
    }
    
    if (options?.tags && options.tags.length > 0) {
      query.tags = { $in: options.tags };
    }

    return highlights
      .find(query)
      .sort({ createdAt: -1 })
      .limit(options?.limit || 50)
      .skip(options?.skip || 0)
      .toArray();
  }

  // Get AI-generated highlights for a session
  async getHighlightsBySession(
    userId: string,
    sessionId: string
  ): Promise<Highlight[]> {
    const highlights = await this.getHighlights(userId);
    
    return highlights
      .find({ 
        type: 'ai',
        'aiContext.sessionId': sessionId 
      })
      .sort({ createdAt: -1 })
      .toArray();
  }

  // Update a highlight
  async updateHighlight(
    userId: string,
    highlightId: string,
    data: UpdateHighlightInput
  ): Promise<boolean> {
    const highlights = await this.getHighlights(userId);
    
    const result = await highlights.updateOne(
      { _id: new ObjectId(highlightId) },
      { 
        $set: { 
          ...data,
          updatedAt: new Date() 
        } 
      }
    );

    return result.modifiedCount > 0;
  }

  // Delete a highlight
  async deleteHighlight(userId: string, highlightId: string): Promise<boolean> {
    const highlights = await this.getHighlights(userId);
    
    const result = await highlights.deleteOne({ 
      _id: new ObjectId(highlightId) 
    });
    
    return result.deletedCount > 0;
  }

  // Search highlights by text content
  async searchHighlights(
    userId: string,
    searchTerm: string,
    limit: number = 20
  ): Promise<Highlight[]> {
    const highlights = await this.getHighlights(userId);
    
    return highlights
      .find({
        $or: [
          { text: { $regex: searchTerm, $options: 'i' } },
          { note: { $regex: searchTerm, $options: 'i' } }
        ]
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
  }

  // Get highlights by date range
  async getHighlightsByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Highlight[]> {
    const highlights = await this.getHighlights(userId);
    
    return highlights
      .find({
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      })
      .sort({ createdAt: -1 })
      .toArray();
  }

  // Create AI highlight from chat session
  async createAIHighlight(
    userId: string,
    data: CreateHighlightInput & {
      aiContext: {
        sessionId: string;
        messageId: string;
        action: string;
      };
    }
  ): Promise<Highlight> {
    return this.createHighlight(userId, {
      ...data,
      type: 'ai'
    });
  }

  // Get highlight statistics
  async getHighlightStats(userId: string): Promise<{
    total: number;
    byType: Record<Highlight['type'], number>;
    byBook: Record<string, number>;
  }> {
    const highlights = await this.getHighlights(userId);
    
    const allHighlights = await highlights.find({}).toArray();
    
    const stats = {
      total: allHighlights.length,
      byType: {
        manual: 0,
        ai: 0,
        search: 0,
        shared: 0
      },
      byBook: {} as Record<string, number>
    };

    allHighlights.forEach(highlight => {
      stats.byType[highlight.type]++;
      
      // Extract book from reference (e.g., "ROM.12.1" -> "ROM")
      const book = highlight.reference.split('.')[0];
      stats.byBook[book] = (stats.byBook[book] || 0) + 1;
    });

    return stats;
  }
}

export const highlightsService = new HighlightsService();
