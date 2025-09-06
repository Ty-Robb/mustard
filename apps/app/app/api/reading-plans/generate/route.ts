import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

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
    const body = await request.json();
    const { 
      goal, 
      timePerDay, 
      duration, 
      focusAreas, 
      experienceLevel 
    } = body;

    // Validate required fields
    if (!goal || !timePerDay || !duration) {
      return NextResponse.json(
        { error: 'Goal, time per day, and duration are required' },
        { status: 400 }
      );
    }

    // Create prompt for AI
    const prompt = `Create a Bible reading plan with the following requirements:

Goal: ${goal}
Time available per day: ${timePerDay} minutes
Plan duration: ${duration} days
Focus areas: ${focusAreas || 'General Bible reading'}
Experience level: ${experienceLevel || 'Intermediate'}

Generate a structured reading plan that:
1. Fits within the time constraints (approximately ${Math.floor(timePerDay / 5)} chapters per day based on average reading speed)
2. Covers the requested focus areas
3. Is appropriate for the experience level
4. Includes a good mix of Old and New Testament readings

Return the response as a JSON object with this exact structure:
{
  "name": "Plan name",
  "description": "Brief description of the plan",
  "entries": [
    {
      "day": 1,
      "passages": ["Genesis 1-3", "Matthew 1"],
      "theme": "Creation and the Genealogy of Christ",
      "reflection": "Brief reflection or question for the day"
    }
  ]
}

Create entries for all ${duration} days. Make sure passages are realistic for the time available.`;

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the AI response
    let planData;
    try {
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      planData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Failed to parse AI response:', text);
      return NextResponse.json(
        { error: 'Failed to generate valid plan structure' },
        { status: 500 }
      );
    }

    // Transform the AI-generated plan to match our schema
    const transformedPlan = {
      name: planData.name,
      description: planData.description,
      duration: parseInt(duration),
      entries: planData.entries.map((entry: any) => ({
        day: entry.day,
        passages: entry.passages,
        notes: entry.reflection || entry.theme || '',
      })),
      tags: [
        'ai-generated',
        experienceLevel?.toLowerCase() || 'intermediate',
        ...(focusAreas ? focusAreas.toLowerCase().split(',').map((area: string) => area.trim()) : [])
      ],
    };

    return NextResponse.json({
      success: true,
      plan: transformedPlan,
    });
  } catch (error) {
    console.error('Error generating reading plan:', error);
    return NextResponse.json(
      { error: 'Failed to generate reading plan' },
      { status: 500 }
    );
  }
}
