import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { BibleService } from '@/lib/services/bible.service';

const bibleService = new BibleService();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bibleId: string }> }
) {
  const { bibleId } = await params;
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
    const query = searchParams.get('query');
    
    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;
    const sort = searchParams.get('sort') as 'relevance' | 'canonical' | undefined;
    const range = searchParams.get('range') || undefined;
    const fuzziness = searchParams.get('fuzziness') || undefined;
    const useCache = searchParams.get('useCache') === 'true';

    let results;

    if (useCache) {
      // Search in cached content using vector similarity
      const cachedResults = await bibleService.searchCachedContent(userId, query, {
        limit: limit || 10,
        bibleId: bibleId,
        minScore: 0.7
      });

      results = cachedResults.map(cached => ({
        id: cached.reference,
        bibleId: cached.bibleId,
        reference: cached.reference,
        content: cached.content,
        bookId: cached.metadata.bookId,
        chapterId: cached.metadata.chapterId,
        verseId: cached.metadata.verseId,
        copyright: cached.metadata.copyright,
        cached: true,
        score: (cached as any).score
      }));
    } else {
      // Search using Bible API
      const verses = await bibleService.search(bibleId, query, {
        limit,
        offset,
        sort,
        range,
        fuzziness: fuzziness as any
      });

      // Optionally cache the results for future searches
      if (verses.length > 0) {
        // Cache in background (don't await)
        Promise.all(
          verses.slice(0, 5).map(verse => 
            bibleService.cacheBibleContent(userId, {
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
            })
          )
        ).catch(error => console.error('Error caching search results:', error));
      }

      results = verses;
    }

    return NextResponse.json({ 
      query,
      results,
      count: results.length,
      cached: useCache
    });
  } catch (error) {
    console.error('Error searching Bible:', error);
    
    if (error instanceof Error && error.message.includes('auth/id-token-expired')) {
      return NextResponse.json({ error: 'Token expired' }, { status: 401 });
    }
    
    return NextResponse.json(
      { error: 'Failed to search Bible' },
      { status: 500 }
    );
  }
}
