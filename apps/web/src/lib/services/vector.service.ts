import { Collection, Db } from 'mongodb';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { UserVector, VectorSearchResult } from '@/types/vectors';
import { getUserDatabase } from '@/lib/utils/user-db';

export class VectorService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set in environment variables. Please add your Google Gemini API key to .env.local');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
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
   * Get the vectors collection for a specific user
   */
  private async getUserVectorsCollection(userId: string): Promise<Collection<UserVector>> {
    const db = await getUserDatabase(userId);
    return db.collection<UserVector>('vectors');
  }

  /**
   * Store a vector for a user
   */
  async storeUserVector(
    userId: string,
    content: string,
    contentType: UserVector['contentType'],
    metadata: Partial<UserVector['metadata']> = {}
  ): Promise<UserVector> {
    // Get user's vectors collection
    const vectorsCollection = await this.getUserVectorsCollection(userId);

    // Generate embedding
    const embedding = await this.generateEmbedding(content);

    const userVector = {
      content,
      contentType,
      metadata: {
        ...metadata,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      embedding,
      embeddingModel: 'text-embedding-004',
      embeddingDate: new Date(),
    };

    const result = await vectorsCollection.insertOne(userVector as any);
    return { 
      ...userVector, 
      _id: result.insertedId.toString(),
      userId,
      vectorNamespace: `user_${userId}` // For compatibility
    };
  }

  /**
   * Search user's vectors using semantic similarity
   */
  async searchUserVectors(
    userId: string,
    query: string,
    options: {
      limit?: number;
      contentType?: UserVector['contentType'];
      minScore?: number;
    } = {}
  ): Promise<VectorSearchResult[]> {
    const { limit = 10, contentType, minScore = 0.7 } = options;

    // Get user's vectors collection
    const vectorsCollection = await this.getUserVectorsCollection(userId);

    // Generate embedding for the query
    const queryEmbedding = await this.generateEmbedding(query);

    // Build aggregation pipeline for vector search
    const pipeline: any[] = [
      {
        $vectorSearch: {
          index: "vector_index", // This index must be created in Atlas for each user DB
          path: "embedding",
          queryVector: queryEmbedding,
          numCandidates: limit * 10,
          limit: limit
        }
      },
      {
        $project: {
          _id: 1,
          content: 1,
          contentType: 1,
          metadata: 1,
          score: { $meta: "searchScore" }
        }
      }
    ];

    // Add content type filter if specified
    if (contentType) {
      pipeline.splice(1, 0, {
        $match: { contentType }
      });
    }

    // Add minimum score filter
    pipeline.push({
      $match: { score: { $gte: minScore } }
    });

    try {
      const results = await vectorsCollection.aggregate<VectorSearchResult>(pipeline).toArray();
      return results;
    } catch (error) {
      // If vector search fails (e.g., index not created), fall back to text search
      console.warn('Vector search failed, falling back to text search:', error);
      
      const textQuery: any = {};
      if (contentType) textQuery.contentType = contentType;
      if (query) {
        textQuery.$text = { $search: query };
      }

      const results = await vectorsCollection
        .find(textQuery)
        .limit(limit)
        .toArray();

      return results.map((doc: any) => ({
        _id: doc._id!.toString(),
        content: doc.content,
        contentType: doc.contentType,
        metadata: doc.metadata,
        score: 1.0 // Default score for text search
      }));
    }
  }

  /**
   * Get all vectors for a user
   */
  async getUserVectors(
    userId: string,
    options: {
      limit?: number;
      skip?: number;
      contentType?: UserVector['contentType'];
    } = {}
  ): Promise<UserVector[]> {
    const { limit = 50, skip = 0, contentType } = options;

    // Get user's vectors collection
    const vectorsCollection = await this.getUserVectorsCollection(userId);

    const query: any = {};
    if (contentType) query.contentType = contentType;

    const results = await vectorsCollection
      .find(query)
      .sort({ 'metadata.createdAt': -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Add userId and vectorNamespace for compatibility
    return results.map((doc: any) => ({
      ...doc,
      _id: doc._id.toString(),
      userId,
      vectorNamespace: `user_${userId}`
    }));
  }

  /**
   * Delete a user vector
   */
  async deleteUserVector(userId: string, vectorId: string): Promise<boolean> {
    const vectorsCollection = await this.getUserVectorsCollection(userId);
    
    const result = await vectorsCollection.deleteOne({
      _id: vectorId as any
    });

    return result.deletedCount > 0;
  }

  /**
   * Update a user vector (regenerates embedding)
   */
  async updateUserVector(
    userId: string,
    vectorId: string,
    content: string,
    metadata?: Partial<UserVector['metadata']>
  ): Promise<UserVector | null> {
    const vectorsCollection = await this.getUserVectorsCollection(userId);

    // Generate new embedding
    const embedding = await this.generateEmbedding(content);

    const updateData: any = {
      content,
      embedding,
      embeddingDate: new Date(),
      'metadata.updatedAt': new Date()
    };

    if (metadata) {
      Object.keys(metadata).forEach(key => {
        updateData[`metadata.${key}`] = metadata[key as keyof typeof metadata];
      });
    }

    const result = await vectorsCollection.findOneAndUpdate(
      { _id: vectorId as any },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (result) {
      return {
        ...result,
        _id: result._id.toString(),
        userId,
        vectorNamespace: `user_${userId}`
      };
    }

    return null;
  }

  /**
   * Find similar content within a user's vectors
   */
  async findSimilarContent(
    userId: string,
    vectorId: string,
    limit: number = 5
  ): Promise<VectorSearchResult[]> {
    const vectorsCollection = await this.getUserVectorsCollection(userId);

    // Get the source vector
    const sourceVector = await vectorsCollection.findOne({
      _id: vectorId as any
    });

    if (!sourceVector) {
      throw new Error('Vector not found');
    }

    // Search using the source vector's embedding
    const pipeline: any[] = [
      {
        $vectorSearch: {
          index: "vector_index",
          path: "embedding",
          queryVector: sourceVector.embedding,
          numCandidates: (limit + 1) * 10,
          limit: limit + 1 // +1 to exclude self
        }
      },
      {
        $match: {
          _id: { $ne: sourceVector._id } // Exclude the source vector
        }
      },
      {
        $limit: limit
      },
      {
        $project: {
          _id: 1,
          content: 1,
          contentType: 1,
          metadata: 1,
          score: { $meta: "searchScore" }
        }
      }
    ];

    try {
      return await vectorsCollection.aggregate<VectorSearchResult>(pipeline).toArray();
    } catch (error) {
      console.warn('Similar content search failed:', error);
      return [];
    }
  }
}

// Export a singleton instance
export const vectorService = new VectorService();
