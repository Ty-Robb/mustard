import { NextRequest, NextResponse } from 'next/server';
import { bibleVectorService } from '@/lib/services/bible-vector.service';
import { MongoClient } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      return NextResponse.json({ error: 'MONGODB_URI not set' }, { status: 500 });
    }

    const client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db('mustard');
    const collection = db.collection('bible_vectors');

    // Generate embedding for test query
    const query = "Jesus teaches about the kingdom of heaven";
    const queryEmbedding = await bibleVectorService.generateEmbedding(query);

    // Test different pipeline configurations
    const tests: any = {};

    // Test 1: Raw vector search
    const rawPipeline = [
      {
        $vectorSearch: {
          index: "bible_vector_index",
          path: "embedding",
          queryVector: queryEmbedding,
          numCandidates: 50,
          limit: 3
        }
      }
    ];
    
    const rawResults = await collection.aggregate(rawPipeline).toArray();
    tests.raw = {
      count: rawResults.length,
      firstResult: rawResults[0] ? {
        reference: rawResults[0].reference,
        keys: Object.keys(rawResults[0]),
        hasScore: 'score' in rawResults[0],
        hasSearchScore: 'searchScore' in rawResults[0]
      } : null
    };

    // Test 2: With $addFields
    const addFieldsPipeline = [
      {
        $vectorSearch: {
          index: "bible_vector_index",
          path: "embedding",
          queryVector: queryEmbedding,
          numCandidates: 50,
          limit: 3
        }
      },
      {
        $addFields: {
          score: { $meta: "searchScore" }
        }
      }
    ];
    
    const addFieldsResults = await collection.aggregate(addFieldsPipeline).toArray();
    tests.withAddFields = {
      count: addFieldsResults.length,
      firstResult: addFieldsResults[0] ? {
        reference: addFieldsResults[0].reference,
        score: addFieldsResults[0].score,
        scoreType: typeof addFieldsResults[0].score
      } : null
    };

    // Test 3: Check document structure
    const sampleDoc = await collection.findOne({ reference: 'Matthew 1:1' });
    tests.documentStructure = {
      hasDoc: !!sampleDoc,
      keys: sampleDoc ? Object.keys(sampleDoc) : [],
      hasEmbedding: sampleDoc ? !!sampleDoc.embedding : false,
      embeddingLength: sampleDoc?.embedding?.length || 0
    };

    await client.close();

    return NextResponse.json({
      query,
      tests,
      message: 'Debug information collected'
    });

  } catch (error: any) {
    console.error('Debug error:', error);
    return NextResponse.json(
      { error: error.message || 'Debug failed' },
      { status: 500 }
    );
  }
}
