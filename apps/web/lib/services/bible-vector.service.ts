import { Collection, Db } from 'mongodb';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { BibleVector, BibleSearchResult } from '@/types/bible-vectors';
import clientPromise from '@/lib/mongodb';

export class BibleVectorService {
  private genAI: GoogleGenerativeAI;
  private bibleVectorCollection: Collection<BibleVector> | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  /**
   * Initialize MongoDB connection and get the bible vectors collection
   */
  private async ensureConnection(): Promise<Collection<BibleVector>> {
    if (!this.bibleVectorCollection) {
      try {
        const client = await clientPromise;
        const db = client.db('mustard');
        this.bibleVectorCollection = db.collection<BibleVector>('bible_vectors');
      } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        throw new Error('Database connection failed');
      }
    }
    
    return this.bibleVectorCollection;
  }

  /**
   * Generate embedding using Google's text-embedding model
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const model = this.genAI.getGenerativeModel({ 
      model: 'text-embedding-004' 
    });
    
    const result = await model.embedContent(text);
    return result.embedding.values;
  }

  /**
   * Create contextual text for better embeddings
   */
  createContextualText(
    verse: {
      reference: string;
      text: string;
      chapter: number;
      verseNumber: number;
    },
    bookInfo: {
      name: string;
      description: string;
      chapterTheme: string;
      themes: string[];
    },
    prevVerse?: string,
    nextVerse?: string
  ): string {
    return `
Book: ${bookInfo.name} (${bookInfo.description})
Chapter ${verse.chapter}: ${bookInfo.chapterTheme}
Themes: ${bookInfo.themes.join(', ')}

Context:
${prevVerse ? `[Previous verse] ${prevVerse}` : ''}
[${verse.reference}] ${verse.text}
${nextVerse ? `[Next verse] ${nextVerse}` : ''}

This verse is part of ${bookInfo.name}, ${bookInfo.description}.
    `.trim();
  }

  /**
   * Store a Bible vector
   */
  async storeBibleVector(vector: BibleVector): Promise<BibleVector> {
    const collection = await this.ensureConnection();
    
    // Create searchable text for fallback
    vector.searchableText = `${vector.reference} ${vector.text} ${vector.themes?.join(' ') || ''}`.toLowerCase();
    
    // Check if already exists
    const existing = await collection.findOne({
      reference: vector.reference,
      translation: vector.translation
    });

    if (existing) {
      // Update existing
      await collection.updateOne(
        { _id: existing._id },
        { 
          $set: {
            ...vector,
            _id: existing._id
          }
        }
      );
      return { ...vector, _id: existing._id.toString() };
    }

    // Insert new
    const result = await collection.insertOne(vector as any);
    return { ...vector, _id: result.insertedId.toString() };
  }

  /**
   * Store multiple Bible vectors in batch
   */
  async storeBibleVectorsBatch(vectors: BibleVector[]): Promise<void> {
    const collection = await this.ensureConnection();
    
    // Add searchable text to all vectors
    const vectorsWithSearch = vectors.map(v => ({
      ...v,
      searchableText: `${v.reference} ${v.text} ${v.themes?.join(' ') || ''}`.toLowerCase()
    }));
    
    // Use bulkWrite for efficient upsert
    const operations = vectorsWithSearch.map(vector => ({
      updateOne: {
        filter: {
          reference: vector.reference,
          translation: vector.translation
        },
        update: { $set: vector },
        upsert: true
      }
    }));
    
    await collection.bulkWrite(operations);
  }

  /**
   * Search Bible vectors using semantic similarity
   */
  async searchBibleVectors(
    query: string,
    options: {
      limit?: number;
      book?: string;
      chapter?: number;
      translation?: string;
      minScore?: number;
      includeContext?: boolean;
    } = {}
  ): Promise<BibleSearchResult[]> {
    const { 
      limit = 10, 
      book, 
      chapter, 
      translation,
      minScore = 0.5,
      includeContext = false 
    } = options;

    console.log('=== BibleVectorService.searchBibleVectors ===');
    console.log('Query:', query);
    console.log('Options:', options);

    const collection = await this.ensureConnection();

    // Generate embedding for the query
    console.log('Generating embedding for query...');
    const queryEmbedding = await this.generateEmbedding(query);
    console.log('Embedding generated, length:', queryEmbedding.length);

    // Build aggregation pipeline for vector search
    const pipeline: any[] = [
      {
        $vectorSearch: {
          index: "bible_vector_index",
          path: "embedding",
          queryVector: queryEmbedding,
          numCandidates: limit * 10,
          limit: limit
        }
      }
    ];

    console.log('Vector search stage:', JSON.stringify(pipeline[0], null, 2));

    // MongoDB Atlas vector search returns score in a special way
    // We need to use $project to access it properly
    pipeline.push({
      $project: {
        _id: 1,
        reference: 1,
        book: 1,
        bookName: 1,
        chapter: 1,
        verse: 1,
        text: 1,
        translation: 1,
        themes: 1,
        verseContext: 1,
        chapterContext: 1,
        searchableText: 1,
        score: { $meta: "vectorSearchScore" }
      }
    });

    // Add filters
    const matchConditions: any = {};
    if (book) matchConditions.book = book;
    if (chapter) matchConditions.chapter = chapter;
    if (translation) matchConditions.translation = translation;
    
    // Add score filter to match conditions
    if (minScore > 0) {
      matchConditions.score = { $gte: minScore };
    }
    
    if (Object.keys(matchConditions).length > 0) {
      pipeline.push({ $match: matchConditions });
      console.log('Added match conditions:', matchConditions);
    }

    // Project fields
    pipeline.push({
      $project: {
        _id: 1,
        reference: 1,
        book: 1,
        bookName: 1,
        chapter: 1,
        verse: 1,
        text: 1,
        translation: 1,
        themes: 1,
        score: 1,
        ...(includeContext ? { verseContext: 1, chapterContext: 1 } : {})
      }
    });

    console.log('Full pipeline:', JSON.stringify(pipeline, null, 2));

    try {
      console.log('Executing vector search...');
      const results = await collection.aggregate<BibleSearchResult>(pipeline).toArray();
      console.log('Vector search completed. Results count:', results.length);
      
      if (results.length > 0) {
        console.log('First result:', {
          reference: results[0].reference,
          score: results[0].score,
          text: results[0].text.substring(0, 50) + '...'
        });
      }
      
      return results;
    } catch (error) {
      // If vector search fails, fall back to text search
      console.warn('Vector search failed, falling back to text search:', error);
      
      return this.fallbackTextSearch(query, options);
    }
  }

  /**
   * Fallback text search when vector search is unavailable
   */
  private async fallbackTextSearch(
    query: string,
    options: {
      limit?: number;
      book?: string;
      chapter?: number;
      translation?: string;
    } = {}
  ): Promise<BibleSearchResult[]> {
    const { limit = 10, book, chapter, translation } = options;
    const collection = await this.ensureConnection();

    const searchQuery: any = {
      $text: { $search: query }
    };

    if (book) searchQuery.book = book;
    if (chapter) searchQuery.chapter = chapter;
    if (translation) searchQuery.translation = translation;

    const results = await collection
      .find(searchQuery)
      .project({ score: { $meta: "textScore" } })
      .sort({ score: { $meta: "textScore" } })
      .limit(limit)
      .toArray();

    return results.map((doc: any) => ({
      ...doc,
      _id: doc._id.toString(),
      score: doc.score / 10 // Normalize text score to be similar to vector score
    }));
  }

  /**
   * Find verses similar to a given verse
   */
  async findSimilarVerses(
    reference: string,
    translation: string,
    limit: number = 5
  ): Promise<BibleSearchResult[]> {
    const collection = await this.ensureConnection();

    // Get the source verse
    const sourceVerse = await collection.findOne({
      reference,
      translation
    });

    if (!sourceVerse) {
      throw new Error('Verse not found');
    }

    // Search using the source verse's embedding
    const pipeline: any[] = [
      {
        $vectorSearch: {
          index: "bible_vector_index",
          path: "embedding",
          queryVector: sourceVerse.embedding,
          numCandidates: (limit + 1) * 10,
          limit: limit + 1 // +1 to exclude self
        }
      },
      {
        $match: {
          _id: { $ne: sourceVerse._id } // Exclude the source verse
        }
      },
      {
        $limit: limit
      },
      {
        $project: {
          _id: 1,
          reference: 1,
          text: 1,
          translation: 1,
          themes: 1,
          score: { $meta: "searchScore" }
        }
      }
    ];

    try {
      return await collection.aggregate<BibleSearchResult>(pipeline).toArray();
    } catch (error) {
      console.warn('Similar verse search failed:', error);
      return [];
    }
  }

  /**
   * Create indexes for the bible vectors collection
   */
  async createIndexes(): Promise<void> {
    const collection = await this.ensureConnection();

    // Create compound index for reference lookups
    await collection.createIndex(
      { reference: 1, translation: 1 },
      { unique: true }
    );

    // Create indexes for filtering
    await collection.createIndex({ book: 1 });
    await collection.createIndex({ chapter: 1 });
    await collection.createIndex({ translation: 1 });
    await collection.createIndex({ testament: 1 });
    await collection.createIndex({ genre: 1 });

    // Create text index for fallback search
    await collection.createIndex(
      { searchableText: "text" },
      { name: "text_search_index" }
    );

    console.log('Bible vector indexes created successfully');
  }

  /**
   * Get statistics about the vectorized Bible content
   */
  async getStatistics(): Promise<{
    totalVerses: number;
    byTranslation: { [key: string]: number };
    byBook: { [key: string]: number };
  }> {
    const collection = await this.ensureConnection();

    const totalVerses = await collection.countDocuments();

    const byTranslation = await collection.aggregate([
      { $group: { _id: "$translation", count: { $sum: 1 } } }
    ]).toArray();

    const byBook = await collection.aggregate([
      { $group: { _id: "$bookName", count: { $sum: 1 } } }
    ]).toArray();

    return {
      totalVerses,
      byTranslation: Object.fromEntries(
        byTranslation.map(item => [item._id, item.count])
      ),
      byBook: Object.fromEntries(
        byBook.map(item => [item._id, item.count])
      )
    };
  }

  /**
   * Close the MongoDB connection
   */
  async close(): Promise<void> {
    // Since we're using the shared connection from clientPromise,
    // we don't close it here. Just clear the collection reference.
    this.bibleVectorCollection = null;
  }
}

// Export singleton instance
export const bibleVectorService = new BibleVectorService();
