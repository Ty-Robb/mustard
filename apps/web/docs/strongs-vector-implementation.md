# Strong's Dictionary Vector Implementation

This document outlines the implementation plan for integrating Strong's Dictionary with MongoDB Atlas Vector Search to enable semantic Bible study features in Mustard.

## Overview

Strong's Concordance provides a numbered reference system for every word in the Bible, linking to original Hebrew (Old Testament) and Greek (New Testament) definitions. By implementing vector embeddings for these entries, we can enable:

- Semantic search across biblical languages
- Discovery of related theological concepts
- Enhanced AI-powered Bible study
- Cross-reference intelligence
- Thematic study paths

## Data Source

We'll use the open-source Strong's Dictionary from: https://github.com/openscriptures/strongs

## Technical Architecture

### 1. Database Schema

```typescript
// src/types/vectors.ts
export interface StrongsVector {
  _id: string;
  strongsNumber: string;        // e.g., "G26", "H2617"
  language: 'hebrew' | 'greek';
  word: string;                 // Original word in Hebrew/Greek
  transliteration: string;      // Romanized version
  definition: string;           // English definition
  usage: string;                // How it's used in scripture
  etymology?: string;           // Word origin/roots
  semanticDomains: string[];    // Conceptual categories
  
  // Vector fields
  embedding: number[];          // 1536-dimensional vector
  embeddingModel: string;       // Model used (e.g., "text-embedding-004")
  embeddingDate: Date;          // When embedding was generated
  
  // Metadata for filtering
  testament: 'old' | 'new';
  frequency: number;            // Usage count in Bible
  relatedNumbers: string[];     // Related Strong's numbers
}

export interface BibleVerseVector {
  _id: string;
  reference: string;            // e.g., "John 3:16"
  translation: string;          // e.g., "KJV", "NIV"
  text: string;                 // Verse text
  strongsNumbers: string[];     // Strong's numbers in this verse
  
  // Vector fields
  embedding: number[];
  embeddingModel: string;
  embeddingDate: Date;
  
  // Metadata
  book: string;
  chapter: number;
  verse: number;
  testament: 'old' | 'new';
}
```

### 2. MongoDB Atlas Vector Search Configuration

```json
// Atlas Search Index Configuration
{
  "name": "strongs_vector_index",
  "type": "vectorSearch",
  "definition": {
    "fields": [{
      "type": "vector",
      "path": "embedding",
      "numDimensions": 1536,
      "similarity": "cosine"
    }]
  }
}

// Additional index for filtering
{
  "name": "strongs_metadata_index",
  "type": "search",
  "definition": {
    "mappings": {
      "dynamic": false,
      "fields": {
        "language": { "type": "string" },
        "testament": { "type": "string" },
        "semanticDomains": { "type": "string" },
        "strongsNumber": { "type": "string" }
      }
    }
  }
}
```

### 3. Vector Service Implementation

```typescript
// src/lib/mongodb/services/vector.service.ts
import { Collection, Db } from 'mongodb';
import { GoogleGenerativeAI } from '@google/generative-ai';

export class VectorService {
  private strongsCollection: Collection<StrongsVector>;
  private verseCollection: Collection<BibleVerseVector>;
  private genAI: GoogleGenerativeAI;
  
  constructor(private db: Db) {
    this.strongsCollection = db.collection<StrongsVector>('strongs_vectors');
    this.verseCollection = db.collection<BibleVerseVector>('verse_vectors');
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  }
  
  // Generate embedding using Gemini
  async generateEmbedding(text: string): Promise<number[]> {
    const model = this.genAI.getGenerativeModel({ 
      model: 'text-embedding-004' 
    });
    
    const result = await model.embedContent(text);
    return result.embedding.values;
  }
  
  // Search for similar Strong's entries
  async searchSimilarStrongs(
    query: string, 
    options: {
      limit?: number;
      language?: 'hebrew' | 'greek';
      testament?: 'old' | 'new';
    } = {}
  ): Promise<StrongsVector[]> {
    const { limit = 10, language, testament } = options;
    
    // Generate embedding for query
    const queryEmbedding = await this.generateEmbedding(query);
    
    // Build aggregation pipeline
    const pipeline: any[] = [
      {
        $vectorSearch: {
          index: "strongs_vector_index",
          path: "embedding",
          queryVector: queryEmbedding,
          numCandidates: limit * 10,
          limit: limit,
        }
      }
    ];
    
    // Add filters if provided
    if (language || testament) {
      const matchStage: any = {};
      if (language) matchStage.language = language;
      if (testament) matchStage.testament = testament;
      pipeline.push({ $match: matchStage });
    }
    
    // Add score and project fields
    pipeline.push({
      $project: {
        score: { $meta: "searchScore" },
        strongsNumber: 1,
        word: 1,
        transliteration: 1,
        definition: 1,
        semanticDomains: 1,
        language: 1,
        testament: 1
      }
    });
    
    return await this.strongsCollection.aggregate(pipeline).toArray();
  }
  
  // Find conceptually related verses
  async findRelatedVerses(
    reference: string,
    limit: number = 10
  ): Promise<BibleVerseVector[]> {
    // Get the verse
    const verse = await this.verseCollection.findOne({ reference });
    if (!verse) throw new Error('Verse not found');
    
    // Search for similar verses
    const results = await this.verseCollection.aggregate([
      {
        $vectorSearch: {
          index: "verse_vector_index",
          path: "embedding",
          queryVector: verse.embedding,
          numCandidates: limit * 10,
          limit: limit + 1, // +1 to exclude self
        }
      },
      {
        $match: {
          reference: { $ne: reference } // Exclude the query verse
        }
      },
      {
        $limit: limit
      },
      {
        $project: {
          score: { $meta: "searchScore" },
          reference: 1,
          text: 1,
          translation: 1,
          strongsNumbers: 1
        }
      }
    ]).toArray();
    
    return results;
  }
  
  // Build thematic connections
  async findThematicConnections(
    theme: string,
    options: {
      limit?: number;
      includeVerses?: boolean;
    } = {}
  ): Promise<{
    strongsEntries: StrongsVector[];
    verses?: BibleVerseVector[];
  }> {
    const { limit = 20, includeVerses = true } = options;
    
    // Find Strong's entries related to the theme
    const strongsEntries = await this.searchSimilarStrongs(theme, { 
      limit: Math.floor(limit / 2) 
    });
    
    let verses: BibleVerseVector[] = [];
    
    if (includeVerses) {
      // Generate embedding for theme
      const themeEmbedding = await this.generateEmbedding(theme);
      
      // Find verses related to the theme
      verses = await this.verseCollection.aggregate([
        {
          $vectorSearch: {
            index: "verse_vector_index",
            path: "embedding",
            queryVector: themeEmbedding,
            numCandidates: limit * 5,
            limit: Math.floor(limit / 2),
          }
        },
        {
          $project: {
            score: { $meta: "searchScore" },
            reference: 1,
            text: 1,
            translation: 1,
            strongsNumbers: 1
          }
        }
      ]).toArray();
    }
    
    return { strongsEntries, verses };
  }
}
```

### 4. Data Import Pipeline

```typescript
// scripts/import-strongs-vectors.ts
import { MongoClient } from 'mongodb';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs/promises';

async function importStrongsToVectors() {
  const client = new MongoClient(process.env.MONGODB_URI!);
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
  
  try {
    await client.connect();
    const db = client.db('mustard');
    const collection = db.collection('strongs_vectors');
    
    // Load Strong's data from GitHub repo
    const hebrewData = await loadStrongsData('hebrew');
    const greekData = await loadStrongsData('greek');
    
    // Process entries in batches
    const batchSize = 100;
    const allEntries = [...hebrewData, ...greekData];
    
    for (let i = 0; i < allEntries.length; i += batchSize) {
      const batch = allEntries.slice(i, i + batchSize);
      
      const documents = await Promise.all(
        batch.map(async (entry) => {
          // Create text for embedding
          const embeddingText = `${entry.word} ${entry.transliteration} ${entry.definition} ${entry.usage}`;
          
          // Generate embedding
          const result = await model.embedContent(embeddingText);
          
          return {
            strongsNumber: entry.id,
            language: entry.language,
            word: entry.word,
            transliteration: entry.transliteration,
            definition: entry.definition,
            usage: entry.usage,
            etymology: entry.etymology,
            semanticDomains: extractSemanticDomains(entry),
            embedding: result.embedding.values,
            embeddingModel: 'text-embedding-004',
            embeddingDate: new Date(),
            testament: entry.language === 'hebrew' ? 'old' : 'new',
            frequency: entry.frequency || 0,
            relatedNumbers: entry.related || []
          };
        })
      );
      
      // Insert batch
      await collection.insertMany(documents);
      console.log(`Imported ${i + batch.length} of ${allEntries.length} entries`);
    }
    
    // Create indexes
    await collection.createIndex({ strongsNumber: 1 }, { unique: true });
    await collection.createIndex({ language: 1 });
    await collection.createIndex({ testament: 1 });
    await collection.createIndex({ semanticDomains: 1 });
    
    console.log('Import completed successfully');
  } finally {
    await client.close();
  }
}
```

## Integration Points

### 1. Enhanced Bible Verse Display

```typescript
// When displaying a verse, show Strong's annotations
interface EnhancedVerse {
  text: string;
  reference: string;
  strongsAnnotations: {
    word: string;
    strongsNumber: string;
    definition: string;
    similarConcepts?: StrongsVector[]; // From vector search
  }[];
}
```

### 2. AI-Enhanced Summaries

```typescript
// Provide theological context to Gemini
async function generateEnhancedSummary(
  verses: string[], 
  reference: string
) {
  // Extract key words and find related Strong's entries
  const keyWords = await extractKeyWords(verses);
  const theologicalContext = await vectorService.searchSimilarStrongs(
    keyWords.join(' ')
  );
  
  // Generate summary with enhanced context
  const prompt = `
    Summarize these Bible verses with awareness of the original language meanings:
    
    Verses: ${verses.join(' ')}
    Reference: ${reference}
    
    Key theological concepts from original languages:
    ${theologicalContext.map(s => 
      `- ${s.word} (${s.strongsNumber}): ${s.definition}`
    ).join('\n')}
  `;
  
  return await geminiService.generateContent(prompt);
}
```

### 3. Thematic Study Paths

```typescript
// Generate study paths based on semantic similarity
async function generateStudyPath(theme: string) {
  const connections = await vectorService.findThematicConnections(theme);
  
  return {
    theme,
    coreConceptswords: connections.strongsEntries,
    relatedVerses: connections.verses,
    suggestedReadings: generateReadingPlan(connections),
    discussionQuestions: await generateThematicQuestions(theme, connections)
  };
}
```

## Performance Considerations

1. **Embedding Generation**: 
   - Batch process during import
   - Cache embeddings to avoid regeneration
   - Use background jobs for large datasets

2. **Vector Search Optimization**:
   - Create appropriate indexes
   - Use pre-filtering when possible
   - Implement result caching for common queries

3. **Storage Requirements**:
   - ~6KB per Strong's entry (including 1536-dim vector)
   - ~8,800 entries total = ~53MB
   - Additional storage for verse vectors

## Implementation Timeline

1. **Week 1**: Set up MongoDB Atlas Vector Search
2. **Week 2**: Import Strong's Dictionary data
3. **Week 3**: Generate and store embeddings
4. **Week 4**: Implement vector search service
5. **Week 5**: Integrate with existing features
6. **Week 6**: Testing and optimization

## Future Enhancements

1. **Multi-language Support**: Add modern language translations to vector space
2. **Visual Concept Maps**: Generate visual representations of word relationships
3. **Personalized Learning**: Track user interests and suggest related concepts
4. **API Endpoints**: Expose vector search capabilities for third-party developers

---

*This implementation will significantly enhance the Bible study experience by providing deep linguistic and theological insights through modern AI technology.*
