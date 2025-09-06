import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { quizService } from '@/lib/services/quiz.service';
import { bibleService } from '@/lib/services/bible.service';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import type { QuizGenerationRequest } from '@/types/quiz';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Parse request body
    const body: QuizGenerationRequest = await request.json();
    
    // Validate request
    if (!body.type || !body.difficulty || !body.questionCount) {
      return NextResponse.json(
        { error: 'Missing required fields: type, difficulty, questionCount' },
        { status: 400 }
      );
    }

    if (body.questionCount < 1 || body.questionCount > 20) {
      return NextResponse.json(
        { error: 'Question count must be between 1 and 20' },
        { status: 400 }
      );
    }

    // If reference is provided, fetch the passage text
    let passageText: string | undefined;
    if (body.reference) {
      try {
        // Parse reference to get book, chapter, and verses
        const referenceMatch = body.reference.match(/^(.+?)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/);
        if (referenceMatch) {
          const [, book, chapter, startVerse, endVerse] = referenceMatch;
          
          // Get passage from Bible API using verse range
          const passage = await bibleService.getVerseRange(
            'de4e12af7f28f599-01', // KJV Bible ID
            book,
            parseInt(chapter),
            startVerse ? parseInt(startVerse) : 1,
            endVerse ? parseInt(endVerse) : parseInt(startVerse || '1')
          );

          if (passage && passage.content) {
            // Extract text content from HTML
            passageText = passage.content.replace(/<[^>]*>/g, ' ').trim();
          }
        }
      } catch (error) {
        console.error('Error fetching passage:', error);
        // Continue without passage text
      }
    }

    // Generate quiz
    const result = await quizService.generateQuiz(userId, body, passageText);

    // Get the full session for client-side storage
    const db = await getDatabase();
    const session = await db.collection('quizSessions').findOne({
      _id: new ObjectId(result.sessionId)
    });

    return NextResponse.json({
      success: true,
      sessionId: result.sessionId,
      questions: result.questions,
      session: session // Include full session for localStorage
    });
  } catch (error) {
    console.error('Error generating quiz:', error);
    return NextResponse.json(
      { error: 'Failed to generate quiz' },
      { status: 500 }
    );
  }
}
