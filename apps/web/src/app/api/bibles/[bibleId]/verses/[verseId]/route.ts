import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { BibleService } from '@/lib/services/bible.service';

const bibleService = new BibleService();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bibleId: string; verseId: string }> }
) {
  const { bibleId, verseId } = await params;
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
    // Fetch verse from the API
    const verse = await bibleService.getVerse(bibleId, verseId, {
      contentType,
      includeNotes,
      includeTitles,
      includeChapterNumbers,
      includeVerseNumbers,
      includeVerseSpans
    });

    // Cache the verse content with embeddings for future semantic search
    const cachedContent = await bibleService.cacheBibleContent(userId, {
      bibleId: bibleId,
      type: 'verse',
      content: verse.content || '',
      reference: verse.reference,
      metadata: {
        bookId: verse.bookId,
        chapterId: verse.chapterId,
        verseId: verse.id,
        copyright: verse.copyright
      },
      cachedAt: new Date(),
      lastAccessed: new Date()
    });

    return NextResponse.json({ 
      verse,
      cached: true,
      cacheId: cachedContent._id
    });
  } catch (error) {
    console.error('Error fetching verse:', error);
    
    if (error instanceof Error && error.message.includes('auth/id-token-expired')) {
      return NextResponse.json({ error: 'Token expired' }, { status: 401 });
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch verse' },
      { status: 500 }
    );
  }
}
