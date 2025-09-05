import { NextRequest, NextResponse } from 'next/server';
import { BibleService } from '@/lib/services/bible.service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bibleId: string; chapterId: string }> }
) {
  try {
    const { bibleId, chapterId } = await params;
    
    // Create service instance inside the handler to ensure env vars are loaded
    const bibleService = new BibleService();
    
    console.log('[Public Chapter API] Fetching chapter:', {
      bibleId,
      chapterId,
      apiKeySet: !!process.env.BIBLE_API_KEY
    });

    const chapter = await bibleService.getChapter(bibleId, chapterId);
    
    return NextResponse.json(chapter);
  } catch (error) {
    console.error('[Public Chapter API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chapter' },
      { status: 500 }
    );
  }
}
