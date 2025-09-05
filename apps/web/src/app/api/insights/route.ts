import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { adminAuth } from '@/lib/firebase-admin';
import { getModelForTask } from '@/lib/utils/gemini-models';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface AIInsightRequest {
  selectedText: string;
  verseContext?: string;
  reference?: string;
  actionType?: string;
}

export interface AIInsight {
  historicalContext: string;
  crossReferences: string[];
  keyThemes: string[];
  originalLanguage: {
    hebrew?: string;
    greek?: string;
    insights: string;
  };
  practicalApplication: string;
  theologicalInsights: string;
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

    // Parse request body
    const body: AIInsightRequest = await request.json();
    const { selectedText, verseContext, reference, actionType } = body;

    if (!selectedText) {
      return NextResponse.json(
        { error: 'Selected text is required' },
        { status: 400 }
      );
    }

    // Create the prompt for Gemini based on action type
    let prompt = '';
    
    if (actionType) {
      // Create specialized prompts based on action type
      switch (actionType) {
        case 'biography':
          prompt = `
You are a Biblical scholar specializing in biographical studies. Analyze this person mentioned in the Bible.

Person: "${selectedText}"
${verseContext ? `Context: "${verseContext}"` : ''}
${reference ? `Reference: ${reference}` : ''}

Please provide a comprehensive biography in the following JSON format:
{
  "historicalContext": "When and where did this person live?",
  "crossReferences": ["verse1 - explanation", "verse2 - explanation"],
  "keyThemes": ["Major life events", "Character traits", "Relationships"],
  "originalLanguage": {
    "hebrew": "Hebrew name if applicable",
    "greek": "Greek name if applicable",
    "insights": "Meaning of the name and its significance"
  },
  "practicalApplication": "What can modern believers learn from this person?",
  "theologicalInsights": "Their role in God's plan and Biblical timeline"
}`;
          break;
          
        case 'word-study':
          prompt = `
You are a Biblical linguist and theologian. Perform a detailed word study on this term.

Term: "${selectedText}"
${verseContext ? `Context: "${verseContext}"` : ''}
${reference ? `Reference: ${reference}` : ''}

Please provide the word study in the following JSON format:
{
  "historicalContext": "Historical and cultural context of this word",
  "crossReferences": ["verse1 - where this word appears", "verse2 - similar usage"],
  "keyThemes": ["Root meaning", "Usage patterns", "Related concepts"],
  "originalLanguage": {
    "hebrew": "Hebrew word and transliteration if applicable",
    "greek": "Greek word and transliteration if applicable",
    "insights": "Etymology and semantic range of the word"
  },
  "practicalApplication": "How this word's meaning applies to modern faith",
  "theologicalInsights": "Doctrinal significance and theological implications"
}`;
          break;
          
        case 'timeline':
          prompt = `
You are a Biblical historian. Create a timeline for the events related to this text.

Text: "${selectedText}"
${verseContext ? `Context: "${verseContext}"` : ''}
${reference ? `Reference: ${reference}` : ''}

Please provide the timeline analysis in the following JSON format:
{
  "historicalContext": "Historical dating and period (e.g., 1000 BC, during King David's reign)",
  "crossReferences": ["Related event 1 - reference", "Related event 2 - reference"],
  "keyThemes": ["Before this event", "During this event", "After this event"],
  "originalLanguage": {
    "insights": "Any time-related terms or cultural time markers in the original text"
  },
  "practicalApplication": "Lessons from God's timing and historical providence",
  "theologicalInsights": "How these events fit into God's redemptive timeline"
}`;
          break;
          
        case 'location':
          prompt = `
You are a Biblical geographer. Analyze this location mentioned in Scripture.

Location: "${selectedText}"
${verseContext ? `Context: "${verseContext}"` : ''}
${reference ? `Reference: ${reference}` : ''}

Please provide the geographical analysis in the following JSON format:
{
  "historicalContext": "Geographic location and historical period",
  "crossReferences": ["Other mentions of this place - reference", "Related locations - reference"],
  "keyThemes": ["Major events here", "Archaeological findings", "Modern location"],
  "originalLanguage": {
    "hebrew": "Hebrew name if applicable",
    "greek": "Greek name if applicable",
    "insights": "Meaning of the place name"
  },
  "practicalApplication": "Spiritual lessons from this location's history",
  "theologicalInsights": "Theological significance in Biblical narrative"
}`;
          break;
          
        case 'practical-application':
          prompt = `
You are a pastoral counselor and Biblical life coach. Help apply this passage to modern life.

Text: "${selectedText}"
${verseContext ? `Context: "${verseContext}"` : ''}
${reference ? `Reference: ${reference}` : ''}

Please provide practical application in the following JSON format:
{
  "historicalContext": "Original context and situation",
  "crossReferences": ["Supporting verse 1", "Supporting verse 2"],
  "keyThemes": ["Core principle", "Modern application", "Action steps"],
  "originalLanguage": {
    "insights": "Key words that enhance understanding of application"
  },
  "practicalApplication": "Specific ways to apply this in daily life, including challenges and solutions",
  "theologicalInsights": "How this teaching fits into Christian living and discipleship"
}`;
          break;
          
        default:
          // Fall back to general prompt
          prompt = `
You are a Biblical scholar and theologian. Analyze the following Bible text and provide comprehensive insights.

Selected Text: "${selectedText}"
${verseContext ? `Full Verse Context: "${verseContext}"` : ''}
${reference ? `Reference: ${reference}` : ''}

Please provide insights in the following categories:`;
      }
    } else {
      // Default general prompt
      prompt = `
You are a Biblical scholar and theologian. Analyze the following Bible text and provide comprehensive insights.

Selected Text: "${selectedText}"
${verseContext ? `Full Verse Context: "${verseContext}"` : ''}
${reference ? `Reference: ${reference}` : ''}

Please provide insights in the following categories:`;
    }
    
    // Add the standard format request for non-specialized prompts
    if (!actionType || !['biography', 'word-study', 'timeline', 'location', 'practical-application'].includes(actionType)) {
      prompt += `

1. Historical and Cultural Context: Explain the historical background, cultural practices, and social context relevant to this passage.

2. Cross-References: List 3-5 other Bible verses that relate to this passage, with brief explanations of how they connect.

3. Key Themes: Identify the main theological and spiritual themes present in this text.

4. Original Language Insights: If applicable, discuss any important Hebrew or Greek words and their meanings that enhance understanding.

5. Practical Application: Suggest how this passage can be applied to modern Christian life.

6. Theological Insights: Provide deeper theological analysis and doctrinal significance.

Format your response as a JSON object with the following structure:
{
  "historicalContext": "detailed explanation",
  "crossReferences": ["verse1 - explanation", "verse2 - explanation"],
  "keyThemes": ["theme1", "theme2"],
  "originalLanguage": {
    "hebrew": "relevant Hebrew words if applicable",
    "greek": "relevant Greek words if applicable",
    "insights": "explanation of language insights"
  },
  "practicalApplication": "detailed application",
  "theologicalInsights": "detailed theological analysis"
}`;
    }

    // Generate insights using Gemini with smart model selection
    const model = getModelForTask(genAI, actionType, 'insights');
    
    // Simplify the prompt for better JSON compliance
    const jsonPrompt = prompt + '\n\nReturn your response as valid JSON only.';
    
    let lastError: any;
    const maxRetries = 3;
    const baseDelay = 1000; // 1 second
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await model.generateContent(jsonPrompt);
        const response = await result.response;
        const text = response.text();
        
        // If successful, break out of retry loop
        lastError = null;
        var responseText = text;
        break;
      } catch (error) {
        lastError = error;
        console.error(`Attempt ${attempt + 1} failed:`, error);
        
        // If it's not the last attempt, wait before retrying
        if (attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // If all retries failed, throw the last error
    if (lastError) {
      throw lastError;
    }
    
    const text = responseText!;
    console.log('Raw Gemini response:', text);

    // Parse the JSON response
    let insights: AIInsight;
    try {
      // Try to clean the response first
      let cleanedText = text.trim();
      
      // Remove markdown code blocks if present
      cleanedText = cleanedText.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
      
      // Extract JSON from the response
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      insights = JSON.parse(jsonMatch[0]);
      console.log('Successfully parsed insights:', insights);
      
      // Validate the structure
      if (!insights.historicalContext || !insights.theologicalInsights) {
        throw new Error('Invalid insight structure');
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', text);
      console.error('Parse error:', parseError);
      
      // Better fallback: Try to extract meaningful content from the text response
      const fallbackInsights: AIInsight = {
        historicalContext: '',
        crossReferences: [],
        keyThemes: [],
        originalLanguage: {
          insights: ''
        },
        practicalApplication: '',
        theologicalInsights: ''
      };
      
      // Try to extract sections from the text
      const sections = text.split(/\n\n+/);
      
      for (const section of sections) {
        const lowerSection = section.toLowerCase();
        
        if (lowerSection.includes('historical') || lowerSection.includes('context')) {
          fallbackInsights.historicalContext = section.replace(/^.*?:/, '').trim();
        } else if (lowerSection.includes('theological')) {
          fallbackInsights.theologicalInsights = section.replace(/^.*?:/, '').trim();
        } else if (lowerSection.includes('practical') || lowerSection.includes('application')) {
          fallbackInsights.practicalApplication = section.replace(/^.*?:/, '').trim();
        } else if (lowerSection.includes('theme')) {
          const themes = section.split(/[,\n]/).map(t => t.trim()).filter(t => t && !t.includes(':'));
          fallbackInsights.keyThemes = themes.slice(0, 5);
        } else if (lowerSection.includes('reference')) {
          const refs = section.split(/[;\n]/).map(r => r.trim()).filter(r => r && r.includes(':'));
          fallbackInsights.crossReferences = refs.slice(0, 5);
        }
      }
      
      // If we still have no content, provide a meaningful message
      if (!fallbackInsights.historicalContext && !fallbackInsights.theologicalInsights) {
        fallbackInsights.theologicalInsights = `Analysis of "${selectedText}": ${text.slice(0, 500)}...`;
      }
      
      insights = fallbackInsights;
    }

    console.log('Returning insights to client:', insights);
    return NextResponse.json(insights);
  } catch (error) {
    console.error('Error generating AI insights:', error);
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    );
  }
}
