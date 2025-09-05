import { ChartData, ChartConfig, TableData, TableConfig } from '@/types/chat';
import { generateFallbackVisualization } from './visualization-fallback';

export type VisualizationType = 'chart' | 'table' | 'timeline' | 'comparison';

interface VisualizationResult {
  type: 'chart' | 'table';
  data: ChartData | TableData;
  config: ChartConfig | TableConfig;
  explanation?: string;
}

/**
 * Analyzes text to determine if it would benefit from a visualization
 */
export function detectVisualizationNeed(text: string): {
  needsVisualization: boolean;
  suggestedType?: VisualizationType;
  confidence: number;
} {
  const lowerText = text.toLowerCase();
  
  // Keywords that suggest visualization would be helpful
  const visualizationKeywords = {
    chart: [
      'growth', 'trend', 'increase', 'decrease', 'over time', 'since',
      'progress', 'evolution', 'development', 'trajectory', 'pattern'
    ],
    table: [
      'list', 'compare', 'breakdown', 'details', 'categories', 'groups',
      'distribution', 'allocation', 'summary', 'overview'
    ],
    timeline: [
      'history', 'timeline', 'chronology', 'sequence', 'events',
      'milestones', 'phases', 'periods', 'era', 'dates'
    ],
    comparison: [
      'versus', 'vs', 'compare', 'contrast', 'difference', 'between',
      'comparison', 'relative', 'against', 'than'
    ]
  };

  let maxScore = 0;
  let suggestedType: VisualizationType | undefined;

  // Check each visualization type
  for (const [type, keywords] of Object.entries(visualizationKeywords)) {
    const score = keywords.filter(keyword => lowerText.includes(keyword)).length;
    if (score > maxScore) {
      maxScore = score;
      suggestedType = type as VisualizationType;
    }
  }

  // Additional patterns
  const hasNumbers = /\d+/.test(text);
  const hasPercentages = /%/.test(text);
  const hasYears = /\b(19|20)\d{2}\b/.test(text);
  const hasCurrency = /\$|£|€/.test(text);

  // Boost confidence based on patterns
  let confidence = maxScore * 0.3;
  if (hasNumbers) confidence += 0.2;
  if (hasPercentages) confidence += 0.2;
  if (hasYears) confidence += 0.1;
  if (hasCurrency) confidence += 0.1;

  return {
    needsVisualization: confidence > 0.3,
    suggestedType,
    confidence: Math.min(confidence, 1)
  };
}

/**
 * Generates a visualization from selected text using AI
 */
export async function generateVisualizationFromText(
  text: string,
  preferredType?: VisualizationType
): Promise<VisualizationResult | null> {
  try {
    // Get the auth token (this should be handled by your auth context)
    const token = await getAuthToken();
    if (!token) {
      console.log('No auth token available, using fallback visualization');
      // Use fallback when no auth token is available
      try {
        const fallbackData = generateFallbackVisualization(text, preferredType || 'auto');
        if (!fallbackData) {
          console.error('Fallback returned null');
          return null;
        }
        return {
          type: fallbackData.type as 'chart' | 'table',
          data: fallbackData.data,
          config: fallbackData.config,
          explanation: 'Generated using fallback (no AI available)'
        };
      } catch (fallbackError) {
        console.error('Fallback generation failed:', fallbackError);
        return null;
      }
    }

    // Call the API route
    const response = await fetch('/api/visualizations/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        text,
        type: preferredType || 'auto'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Visualization API error:', errorData);
      
      // Try fallback on API error
      console.log('API failed, using fallback visualization');
      try {
        const fallbackData = generateFallbackVisualization(text, preferredType || 'auto');
        if (!fallbackData) {
          console.error('Fallback returned null');
          throw new Error('Fallback visualization failed');
        }
        return {
          type: fallbackData.type as 'chart' | 'table',
          data: fallbackData.data,
          config: fallbackData.config,
          explanation: 'Generated using fallback (API error)'
        };
      } catch (fallbackError) {
        console.error('Fallback generation also failed:', fallbackError);
        throw new Error(errorData.details || errorData.error || `API error: ${response.statusText}`);
      }
    }

    const visualizationData = await response.json();
    
    return {
      type: visualizationData.type,
      data: visualizationData.data,
      config: visualizationData.config
    };
  } catch (error) {
    console.error('Error generating visualization:', error);
    
    // Last resort: try fallback
    console.log('Unexpected error, trying fallback visualization');
    try {
      const fallbackData = generateFallbackVisualization(text, preferredType || 'auto');
      if (!fallbackData) {
        console.error('Fallback returned null');
        return null;
      }
      return {
        type: fallbackData.type as 'chart' | 'table',
        data: fallbackData.data,
        config: fallbackData.config,
        explanation: 'Generated using fallback (unexpected error)'
      };
    } catch (fallbackError) {
      console.error('All visualization methods failed:', fallbackError);
      return null;
    }
  }
}

/**
 * Helper function to get auth token
 * This should be replaced with your actual auth implementation
 */
async function getAuthToken(): Promise<string | null> {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return null;
  }

  // Try to get the token from Firebase Auth
  try {
    const { auth } = await import('@/lib/firebase');
    const user = auth.currentUser;
    if (user) {
      return await user.getIdToken();
    }
  } catch (error) {
    console.error('Error getting auth token:', error);
  }
  
  return null;
}
