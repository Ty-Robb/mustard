import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { getVertexAIService } from '@/lib/services/vertex-ai.service';
import { detectVisualizationNeed } from '@/lib/utils/visualization-generator';
import { generateFallbackVisualization } from '@/lib/utils/visualization-fallback';

export async function POST(request: NextRequest) {
  console.log('[Visualization API] Request received');
  
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    console.log('[Visualization API] Auth header present:', !!authHeader);
    
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('[Visualization API] No valid auth header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    try {
      await adminAuth.verifyIdToken(token);
      console.log('[Visualization API] Token verified successfully');
    } catch (error) {
      console.error('[Visualization API] Token verification failed:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { text, type } = await request.json();
    console.log('[Visualization API] Request data:', { textLength: text?.length, type });

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Get Vertex AI service instance
    console.log('[Visualization API] Getting Vertex AI service...');
    const vertexAI = getVertexAIService();
    
    if (!vertexAI.isAvailable()) {
      const initError = vertexAI.getInitializationError();
      console.error('[Visualization API] Vertex AI service not available:', initError);
      console.log('[Visualization API] Using fallback visualization generator');
      
      // Use fallback visualization when Vertex AI is not available
      try {
        const fallbackData = generateFallbackVisualization(text, type);
        console.log('[Visualization API] Fallback visualization generated successfully');
        return NextResponse.json(fallbackData);
      } catch (fallbackError) {
        console.error('[Visualization API] Fallback generation failed:', fallbackError);
        return NextResponse.json(
          { 
            error: 'Failed to generate visualization',
            details: 'Both AI service and fallback generation failed.'
          },
          { status: 503 }
        );
      }
    }
    console.log('[Visualization API] Vertex AI service available');

    let prompt: string;
    
    if (type === 'auto') {
      // Auto-detect the best visualization type
      const detection = detectVisualizationNeed(text);
      
      prompt = `You are a Data Visualization Specialist. Analyze the following text and create an appropriate visualization.

Context: "${text}"

Based on this context, I detected that a ${detection.suggestedType || 'chart'} visualization would be most appropriate.

Please:
1. UNDERSTAND THE CONTEXT: Analyze what the user is describing
2. GENERATE REALISTIC DATA: Create contextually appropriate sample data that matches the topic
3. SELECT THE RIGHT VISUALIZATION: Choose ${detection.suggestedType || 'the best'} visualization type
4. FORMAT YOUR RESPONSE: Return ONLY a JSON object with this structure:

For charts:
{
  "type": "chart",
  "data": {
    "labels": ["Label1", "Label2", ...],
    "datasets": [{
      "label": "Dataset Name",
      "data": [value1, value2, ...],
      "backgroundColor": "color",
      "borderColor": "color"
    }]
  },
  "config": {
    "type": "line|bar|pie|doughnut|area|scatter|radar",
    "title": "Chart Title",
    "xAxisLabel": "X Axis",
    "yAxisLabel": "Y Axis",
    "showLegend": true,
    "showGrid": true
  }
}

For tables:
{
  "type": "table",
  "data": {
    "headers": ["Column1", "Column2", ...],
    "rows": [
      ["Value1", "Value2", ...],
      ["Value1", "Value2", ...]
    ]
  },
  "config": {
    "title": "Table Title",
    "sortable": true,
    "filterable": true
  }
}

IMPORTANT: Return ONLY the JSON object, no explanatory text.`;
    } else {
      // Generate specific type of visualization
      const visualizationType = type === 'timeline' ? 'line chart showing progression over time' :
                               type === 'comparison' ? 'bar chart comparing different items' :
                               type === 'table' ? 'data table' :
                               type;

      prompt = `You are a Data Visualization Specialist. Create a ${visualizationType} based on the following text.

Context: "${text}"

Please:
1. UNDERSTAND THE CONTEXT: Analyze what the user is describing
2. GENERATE REALISTIC DATA: Create contextually appropriate sample data
3. FORMAT YOUR RESPONSE: Return ONLY a JSON object

${type === 'table' ? `Return a table with this structure:
{
  "type": "table",
  "data": {
    "headers": ["Column1", "Column2", ...],
    "rows": [
      ["Value1", "Value2", ...],
      ["Value1", "Value2", ...]
    ]
  },
  "config": {
    "title": "Table Title",
    "sortable": true,
    "filterable": true
  }
}` : `Return a chart with this structure:
{
  "type": "chart",
  "data": {
    "labels": ["Label1", "Label2", ...],
    "datasets": [{
      "label": "Dataset Name",
      "data": [value1, value2, ...],
      "backgroundColor": "color",
      "borderColor": "color"
    }]
  },
  "config": {
    "type": "${type === 'timeline' ? 'line' : type === 'comparison' ? 'bar' : 'bar'}",
    "title": "Chart Title",
    "xAxisLabel": "X Axis",
    "yAxisLabel": "Y Axis",
    "showLegend": true,
    "showGrid": true
  }
}`}

IMPORTANT: Return ONLY the JSON object, no explanatory text.`;
    }

    // Get AI response using the data-visualization agent
    console.log('[Visualization API] Calling Vertex AI...');
    const response = await vertexAI.generateResponse(
      'data-visualization',
      [{ role: 'user', content: prompt }]
    );
    console.log('[Visualization API] AI response received, length:', response?.length);

    // Parse the response
    try {
      // Extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('[Visualization API] No JSON found in AI response');
        throw new Error('No JSON found in response');
      }
      
      const visualizationData = JSON.parse(jsonMatch[0]);
      console.log('[Visualization API] Successfully parsed visualization data');
      
      return NextResponse.json(visualizationData);
    } catch (parseError) {
      console.error('[Visualization API] Failed to parse AI response:', parseError);
      console.error('[Visualization API] Raw response:', response);
      
      // Return error instead of fallback data
      return NextResponse.json(
        { 
          error: 'Failed to generate visualization. The AI response could not be parsed correctly.',
          details: 'Please try again with a different text or visualization type.'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[Visualization API] Unexpected error:', error);
    console.error('[Visualization API] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // More detailed error response
    return NextResponse.json(
      { 
        error: 'Failed to generate visualization',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: error instanceof Error ? error.name : 'UnknownError'
      },
      { status: 500 }
    );
  }
}
