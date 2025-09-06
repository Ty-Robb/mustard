import { NextResponse } from 'next/server';
import { testConnection, initializeIndexes } from '@/lib/mongodb';

export async function GET() {
  try {
    // Test the connection
    const isConnected = await testConnection();
    
    if (!isConnected) {
      return NextResponse.json(
        { error: 'Failed to connect to MongoDB' },
        { status: 500 }
      );
    }
    
    // Initialize indexes (this is idempotent, so it's safe to call multiple times)
    await initializeIndexes();
    
    return NextResponse.json({
      success: true,
      message: 'MongoDB connection successful and indexes initialized',
      database: 'mustard',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json(
      { 
        error: 'Database test failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
