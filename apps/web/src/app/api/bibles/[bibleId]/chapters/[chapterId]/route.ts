import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { BibleService } from '@/lib/services/bible.service';

const bibleService = new BibleService();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bibleId: string; chapterId: string }> }
) {
  const { bibleId, chapterId } = await params;
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the Firebase ID token
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const contentType = searchParams.get('contentType') as 'html' | 'json' | 'text' | undefined;
    const includeNotes = searchParams.get('includeNotes') === 'true';
    const includeTitles = searchParams.get('includeTitles') === 'true';
    const includeChapterNumbers = searchParams.get('includeChapterNumbers') === 'true';
    const includeVerseNumbers = searchParams.get('includeVerseNumbers') === 'true';
    const includeVerseSpans = searchParams.get('includeVerseSpans') === 'true';

    // Fetch chapter from the API
    const chapter = await bibleService.getChapter(bibleId, chapterId, {
      contentType,
      includeNotes,
      includeTitles,
      includeChapterNumbers,
      includeVerseNumbers,
      includeVerseSpans
    });

    // Cache the chapter content with embeddings for future semantic search
    const cachedContent = await bibleService.cacheBibleContent(userId, {
      bibleId: bibleId,
      type: 'chapter',
      content: chapter.content || '',
      reference: chapter.reference,
      metadata: {
        bookId: chapter.bookId,
        chapterId: chapter.id,
        copyright: chapter.copyright
      },
      cachedAt: new Date(),
      lastAccessed: new Date()
    });

    return NextResponse.json(chapter);
  } catch (error) {
    console.error('Error fetching chapter:', error);
    
    if (error instanceof Error) {
      // Log more details about the error
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        bibleApiKey: process.env.BIBLE_API_KEY ? 'Set' : 'Not set'
      });
      
      if (error.message.includes('auth/id-token-expired')) {
        return NextResponse.json({ error: 'Token expired' }, { status: 401 });
      }
      
      if (error.message.includes('Bible API error')) {
        return NextResponse.json({ 
          error: 'Bible API error', 
          details: error.message 
        }, { status: 500 });
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch chapter' },
      { status: 500 }
    );
  }
}
