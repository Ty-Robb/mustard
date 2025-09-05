// Vector-related types for MongoDB Atlas Vector Search

export interface UserVector {
  _id?: string;
  userId: string;
  vectorNamespace: string;
  content: string;
  contentType: 'bible_note' | 'prayer' | 'study_note' | 'reflection';
  metadata: {
    reference?: string;
    tags?: string[];
    createdAt: Date;
    updatedAt: Date;
  };
  embedding: number[];
  embeddingModel: string;
  embeddingDate: Date;
}

export interface VectorSearchResult {
  _id: string;
  content: string;
  contentType: string;
  metadata: any;
  score: number;
}

export interface VectorIndexConfig {
  name: string;
  type: 'vectorSearch';
  definition: {
    fields: Array<{
      type: 'vector';
      path: string;
      numDimensions: number;
      similarity: 'euclidean' | 'cosine' | 'dotProduct';
    }>;
  };
}
