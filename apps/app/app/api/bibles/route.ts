import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { BibleService } from '@/lib/services/bible.service';
import { MAIN_BIBLE_VERSIONS, isMainBibleVersion } from '@/config/bible-versions';

const bibleService = new BibleService();

export async function GET(request: NextRequest) {
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
    const language = searchParams.get('language') || undefined;
    const abbreviation = searchParams.get('abbreviation') || undefined;
    const name = searchParams.get('name') || undefined;
    const ids = searchParams.get('ids') || undefined;
    const includeFullDetails = searchParams.get('includeFullDetails') === 'true';

    // If requesting main versions only (default behavior)
    const useMainVersionsOnly = searchParams.get('allVersions') !== 'true';
    
    if (useMainVersionsOnly && !ids) {
      // Return our curated list of main Bible versions
      return NextResponse.json({ bibles: MAIN_BIBLE_VERSIONS });
    }

    // Fetch Bibles from the API
    const bibles = await bibleService.getBibles({
      language: language || 'eng', // Default to English
      abbreviation,
      name,
      ids,
      includeFullDetails
    });

    // Filter to main versions if not requesting all
    const filteredBibles = useMainVersionsOnly 
      ? bibles.filter(bible => isMainBibleVersion(bible.id))
      : bibles;

    return NextResponse.json({ bibles: filteredBibles });
  } catch (error) {
    console.error('Error fetching Bibles:', error);
    
    if (error instanceof Error && error.message.includes('auth/id-token-expired')) {
      return NextResponse.json({ error: 'Token expired' }, { status: 401 });
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch Bibles' },
      { status: 500 }
    );
  }
}
