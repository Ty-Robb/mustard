import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

interface ContextAction {
  id: string;
  label: string;
  icon: string;
  description?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    try {
      await adminAuth.verifyIdToken(token);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { text, context } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Analyze the text and determine context-aware actions
    const actions = analyzeTextForActions(text, context);

    return NextResponse.json({ actions });
  } catch (error) {
    console.error('Error analyzing text:', error);
    return NextResponse.json(
      { error: 'Failed to analyze text' },
      { status: 500 }
    );
  }
}

function analyzeTextForActions(text: string, context?: string): ContextAction[] {
  const actions: ContextAction[] = [];
  const lowerText = text.toLowerCase();

  // Check if it's a person's name (simple heuristic - starts with capital, single word or two words)
  const namePattern = /^[A-Z][a-z]+(\s[A-Z][a-z]+)?$/;
  if (namePattern.test(text.trim()) && text.split(' ').length <= 2) {
    actions.push(
      {
        id: 'biography',
        label: 'Biography',
        icon: 'User',
        description: `Learn about ${text}`
      },
      {
        id: 'timeline',
        label: 'Timeline',
        icon: 'Calendar',
        description: `View ${text}'s life events`
      },
      {
        id: 'related-verses',
        label: 'Related Verses',
        icon: 'BookOpen',
        description: `Find other mentions of ${text}`
      }
    );
  }

  // Check for place names (simple check - could be enhanced)
  const placeIndicators = ['jerusalem', 'egypt', 'israel', 'babylon', 'rome', 'galilee', 'nazareth'];
  if (placeIndicators.some(place => lowerText.includes(place))) {
    actions.push({
      id: 'location',
      label: 'View on Map',
      icon: 'MapPin',
      description: 'See biblical geography'
    });
  }

  // Check for numbers
  const numberPattern = /\b(one|two|three|four|five|six|seven|eight|nine|ten|\d+)\b/i;
  if (numberPattern.test(lowerText)) {
    actions.push({
      id: 'number-significance',
      label: 'Biblical Numerology',
      icon: 'Hash',
      description: 'Explore symbolic meaning'
    });
  }

  // Check for commandments or instructions
  const commandIndicators = ['shall', 'must', 'command', 'do not', "don't", 'thou shalt'];
  if (commandIndicators.some(cmd => lowerText.includes(cmd))) {
    actions.push({
      id: 'practical-application',
      label: 'How to Apply',
      icon: 'Target',
      description: 'Modern application'
    });
  }

  // Check for theological concepts
  const theologicalTerms = ['love', 'faith', 'hope', 'grace', 'mercy', 'salvation', 'redemption', 'forgiveness', 'sin', 'righteousness'];
  if (theologicalTerms.some(term => lowerText.includes(term))) {
    actions.push(
      {
        id: 'word-study',
        label: 'Word Study',
        icon: 'Search',
        description: 'Original language insights'
      },
      {
        id: 'theology',
        label: 'Theological Deep Dive',
        icon: 'GraduationCap',
        description: 'Doctrinal significance'
      }
    );
  }

  // Always include these general options
  actions.push(
    {
      id: 'cross-references',
      label: 'Cross References',
      icon: 'Link',
      description: 'Find related passages'
    },
    {
      id: 'commentary',
      label: 'Commentary',
      icon: 'MessageSquare',
      description: 'Expert insights'
    }
  );

  // If text is longer (more than 10 words), add summary option
  if (text.split(' ').length > 10) {
    actions.unshift({
      id: 'summarize',
      label: 'Summarize',
      icon: 'FileText',
      description: 'Get key points'
    });
  }

  // Limit to top 5 most relevant actions
  return actions.slice(0, 5);
}
