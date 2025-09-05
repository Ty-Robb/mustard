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

    // Fetch books from the API
    const books = await bibleService.getBooks(bibleId);

    return NextResponse.json({ books });
  } catch (error) {
    console.error('Error fetching books:', error);
    
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
      { error: 'Failed to fetch books' },
      { status: 500 }
    );
  }
}
