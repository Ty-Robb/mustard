export interface BibleVector {
  _id?: string;
  
  // Reference information
  reference: string;        // "Matthew 1:1"
  book: string;            // "MAT"
  bookName: string;        // "Matthew"
  chapter: number;         // 1
  verse: number;           // 1
  verseEnd?: number;       // For verse ranges
  
  // Content
  text: string;            // Verse text
  translation: string;     // "ESV", "NIV", etc.
  
  // Context for better embeddings
  chapterContext?: string; // Chapter summary/theme
  verseContext?: string;   // Previous + current + next verse
  
  // Vector data
  embedding: number[];     // 1536 dimensions
  embeddingModel: string;  // "text-embedding-004"
  embeddingDate: Date;
  
  // Metadata
  testament: 'old' | 'new';
  genre: string;           // 'gospel', 'epistle', 'prophecy', etc.
  themes?: string[];       // ["birth of Jesus", "genealogy"]
  
  // Search metadata
  searchableText?: string; // Combined text for fallback search
}

export interface BibleVectorSearchResult extends BibleVector {
  score: number;
}

export interface MatthewChapterTheme {
  chapter: number;
  theme: string;
  keyTopics: string[];
}
