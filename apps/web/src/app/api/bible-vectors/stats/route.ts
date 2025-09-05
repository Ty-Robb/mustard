import { NextRequest, NextResponse } from 'next/server';
import { bibleVectorService } from '@/lib/services/bible-vector.service';

export async function GET(request: NextRequest) {
  try {
    // Log environment variables status (without exposing values)
    console.log('Stats API - Environment check:', {
      MONGODB_URI: !!process.env.MONGODB_URI,
      GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
    });

    const stats = await bibleVectorService.getStatistics();
    
    return NextResponse.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Bible vector stats error:', error);
    
    // Provide more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = {
      error: 'Failed to get Bible vector statistics',
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
    }
    
    return NextResponse.json(errorDetails, { status: 500 });
  }
}
