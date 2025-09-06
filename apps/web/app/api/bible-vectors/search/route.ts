import { NextRequest, NextResponse } from 'next/server';
import { bibleVectorService } from '@/lib/services/bible-vector.service';

export async function GET(request: NextRequest) {
  try {
    // Log environment variables status (without exposing values)
    console.log('Search API - Environment check:', {
      MONGODB_URI: !!process.env.MONGODB_URI,
      GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
    });

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    
    console.log('=== Bible Vector Search API ===');
    console.log('Query:', query);
    
    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      );
    }
    
    // Parse optional parameters
    const limit = parseInt(searchParams.get('limit') || '10');
    const book = searchParams.get('book') || undefined;
    const chapter = searchParams.get('chapter') 
      ? parseInt(searchParams.get('chapter')!) 
      : undefined;
    const translation = searchParams.get('translation') || undefined;
    const minScore = parseFloat(searchParams.get('minScore') || '0.7');
    const includeContext = searchParams.get('includeContext') === 'true';
    
    console.log('Search parameters:', {
      limit,
      book,
      chapter,
      translation,
      minScore,
      includeContext
    });
    
    // Perform semantic search
    const results = await bibleVectorService.searchBibleVectors(query, {
      limit,
      book,
      chapter,
      translation,
      minScore,
      includeContext
    });
    
    console.log('Search results count:', results.length);
    if (results.length > 0) {
      console.log('First result:', results[0]);
    }
    
    return NextResponse.json({
      query,
      results,
      count: results.length,
      filters: {
        book,
        chapter,
        translation,
        minScore
      }
    });
    
  } catch (error) {
    console.error('Bible vector search error:', error);
    
    // Provide more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = {
      error: 'Failed to search Bible vectors',
      message: errorMessage,
      type: error?.constructor?.name || 'UnknownError'
    };
    
    // Check for specific error types
    if (errorMessage.includes('MONGODB_URI')) {
      errorDetails.error = 'Database configuration error';
      errorDetails.message = 'MongoDB connection not configured';
    } else if (errorMessage.includes('GEMINI_API_KEY')) {
      errorDetails.error = 'API configuration error';
      errorDetails.message = 'Gemini API key not configured';
    } else if (errorMessage.includes('Database connection failed')) {
      errorDetails.error = 'Database connection error';
      errorDetails.message = 'Unable to connect to database';
    }
    
    return NextResponse.json(errorDetails, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, options = {} } = body;
    
    if (!query) {
      return NextResponse.json(
        { error: 'Query is required in request body' },
        { status: 400 }
      );
    }
    
    // Perform semantic search with provided options
    const results = await bibleVectorService.searchBibleVectors(query, options);
    
    return NextResponse.json({
      query,
      results,
      count: results.length,
      options
    });
    
  } catch (error) {
    console.error('Bible vector search error:', error);
    return NextResponse.json(
      { error: 'Failed to search Bible vectors' },
      { status: 500 }
    );
  }
}
