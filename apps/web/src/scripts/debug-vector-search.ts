import { MongoClient } from 'mongodb';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function debugVectorSearch() {
  const uri = process.env.MONGODB_URI;
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!uri || !apiKey) {
    console.error('Missing MONGODB_URI or GEMINI_API_KEY');
    process.exit(1);
  }

  const client = new MongoClient(uri);
  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('mustard');
    const collection = db.collection('bible_vectors');

    // Generate embedding for query
    const query = "Jesus teaches about the kingdom of heaven";
    console.log(`\nGenerating embedding for: "${query}"`);
    
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    const result = await model.embedContent(query);
    const queryEmbedding = result.embedding.values;
    console.log('Embedding generated, length:', queryEmbedding.length);

    // Test 1: Basic vector search
    console.log('\n=== Test 1: Basic Vector Search ===');
    const basicPipeline = [
      {
        $vectorSearch: {
          index: "bible_vector_index",
          path: "embedding",
          queryVector: queryEmbedding,
          numCandidates: 50,
          limit: 5
        }
      }
    ];

    const basicResults = await collection.aggregate(basicPipeline).toArray();
    console.log('Basic results count:', basicResults.length);
    if (basicResults.length > 0) {
      console.log('First result keys:', Object.keys(basicResults[0]));
      console.log('First result sample:', {
        reference: basicResults[0].reference,
        _id: basicResults[0]._id,
        // Check if score is already included
        score: basicResults[0].score,
        searchScore: basicResults[0].searchScore,
      });
    }

    // Test 2: With $addFields
    console.log('\n=== Test 2: With $addFields ===');
    const addFieldsPipeline = [
      {
        $vectorSearch: {
          index: "bible_vector_index",
          path: "embedding",
          queryVector: queryEmbedding,
          numCandidates: 50,
          limit: 5
        }
      },
      {
        $addFields: {
          score: { $meta: "searchScore" }
        }
      }
    ];

    const addFieldsResults = await collection.aggregate(addFieldsPipeline).toArray();
    console.log('AddFields results count:', addFieldsResults.length);
    if (addFieldsResults.length > 0) {
      console.log('First result with addFields:', {
        reference: addFieldsResults[0].reference,
        score: addFieldsResults[0].score,
        scoreType: typeof addFieldsResults[0].score
      });
    }

    // Test 3: With $set instead of $addFields
    console.log('\n=== Test 3: With $set ===');
    const setPipeline = [
      {
        $vectorSearch: {
          index: "bible_vector_index",
          path: "embedding",
          queryVector: queryEmbedding,
          numCandidates: 50,
          limit: 5
        }
      },
      {
        $set: {
          score: { $meta: "searchScore" }
        }
      }
    ];

    const setResults = await collection.aggregate(setPipeline).toArray();
    console.log('Set results count:', setResults.length);
    if (setResults.length > 0) {
      console.log('First result with $set:', {
        reference: setResults[0].reference,
        score: setResults[0].score,
        scoreType: typeof setResults[0].score
      });
    }

    // Test 4: Check what fields are actually stored
    console.log('\n=== Test 4: Sample Document Structure ===');
    const sampleDoc = await collection.findOne({ reference: 'Matthew 1:1' });
    if (sampleDoc) {
      console.log('Sample document keys:', Object.keys(sampleDoc));
      console.log('Has embedding?', !!sampleDoc.embedding);
      console.log('Embedding length:', sampleDoc.embedding?.length);
      console.log('Has themes?', !!sampleDoc.themes);
      console.log('Has verseContext?', !!sampleDoc.verseContext);
      console.log('Has chapterContext?', !!sampleDoc.chapterContext);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('\nConnection closed');
  }
}

// Run the debug script
debugVectorSearch();
