import { NextRequest, NextResponse } from 'next/server';
import { BibleService } from '@/lib/services/bible.service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bibleId: string }> }
) {
  const { bibleId } = await params;
  try {
    // Create service instance inside the handler to ensure env vars are loaded
    const bibleService = new BibleService();
    
    // This is a public endpoint for testing - no auth required
    const books = await bibleService.getBooks(bibleId);
    return NextResponse.json({ books });
  } catch (error) {
    console.error('Error fetching books:', error);
    
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        bibleApiKey: process.env.BIBLE_API_KEY ? 'Set' : 'Not set'
      });
      
      if (error.message.includes('Bible API error')) {
        return NextResponse.json({ 
          error: 'Bible API error', 
          details: error.message 
        }, { status: 500 });
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch books' },
      { status: 500 }
    );
  }
}
