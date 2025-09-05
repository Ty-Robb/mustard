import { NextRequest, NextResponse } from 'next/server';
import { bibleService } from '@/lib/services/bible.service';
import { verifyIdToken } from '@/lib/firebase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bibleId: string; passageId: string }> }
) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyIdToken(token);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { bibleId, passageId } = await params;
    
    // Parse passage ID to extract book, chapter, and verse range
    // Format: bookId.chapter.startVerse-bookId.chapter.endVerse or bookId.chapter.startVerse-endVerse
    const passageMatch = passageId.match(/^([A-Z0-9]+)\.(\d+)\.(\d+)(?:-(?:[A-Z0-9]+\.)?(?:\d+\.)?(\d+))?$/);
    
    if (!passageMatch) {
      return NextResponse.json({ error: 'Invalid passage format' }, { status: 400 });
    }
    
    const [, bookId, chapter, startVerse, endVerse] = passageMatch;
    const chapterNumber = parseInt(chapter);
    const startVerseNumber = parseInt(startVerse);
    const endVerseNumber = endVerse ? parseInt(endVerse) : startVerseNumber;
    
    console.log('[API] Parsed passage:', { bookId, chapterNumber, startVerseNumber, endVerseNumber });

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      contentType: (searchParams.get('content-type') || 'html') as 'html' | 'json' | 'text',
      includeNotes: searchParams.get('include-notes') === 'true',
      includeTitles: searchParams.get('include-titles') === 'true',
      includeChapterNumbers: searchParams.get('include-chapter-numbers') === 'true',
      includeVerseNumbers: searchParams.get('include-verse-numbers') === 'true',
      includeVerseSpans: searchParams.get('include-verse-spans') === 'true',
    };

    // Fetch verse range from Bible API
    const verseRange = await bibleService.getVerseRange(
      bibleId,
      bookId,
      chapterNumber,
      startVerseNumber,
      endVerseNumber,
      queryParams
    );

    // Cache the content for future use
    try {
      await bibleService.cacheBibleContent(decodedToken.uid, {
        bibleId,
        reference: passageId,
        type: 'passage',
        content: verseRange.content || '',
        metadata: {
          bookId,
          chapterId: `${bookId}.${chapter}`,
          copyright: verseRange.copyright,
        },
        cachedAt: new Date(),
        lastAccessed: new Date()
      });
    } catch (cacheError) {
      console.error('Failed to cache Bible content:', cacheError);
      // Continue even if caching fails
    }

    return NextResponse.json(verseRange);
  } catch (error) {
    console.error('Error fetching verse range:', error);
    return NextResponse.json(
      { error: 'Failed to fetch verse range' },
      { status: 500 }
    );
  }
}
