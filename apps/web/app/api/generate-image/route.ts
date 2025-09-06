import { NextRequest, NextResponse } from 'next/server';
import { getVertexAIService } from '@/lib/services/vertex-ai.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, style, aspectRatio } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    console.log('[Image Generation] Request:', { prompt, style, aspectRatio });

    // Get the VertexAI service
    const vertexAI = getVertexAIService();
    
    // Generate the image directly using the new method
    const result = await vertexAI.generateImage(prompt, style, aspectRatio);
    
    console.log('[Image Generation] Result:', {
      hasImageUrl: !!result.imageUrl,
      hasBase64: !!result.base64,
      error: result.error
    });
    
    if (result.error) {
      console.error('[Image Generation] Error:', result.error);
      
      // Return a placeholder for now
      const placeholderSvg = `
        <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
          <rect width="800" height="600" fill="#f0f0f0"/>
          <text x="400" y="280" text-anchor="middle" font-family="Arial" font-size="24" fill="#666">
            AI Generated Image: ${prompt.substring(0, 50)}...
          </text>
          <text x="400" y="320" text-anchor="middle" font-family="Arial" font-size="16" fill="#999">
            (Image generation in progress)
          </text>
        </svg>
      `;
      
      const imageUrl = `data:image/svg+xml;base64,${Buffer.from(placeholderSvg).toString('base64')}`;
      
      return NextResponse.json({
        url: imageUrl,
        alt: `AI generated image: ${prompt}`,
        prompt: prompt,
        error: result.error
      });
    }
    
    // Return the generated image
    const imageUrl = result.imageUrl || result.base64;
    
    if (!imageUrl) {
      // Fallback placeholder
      const placeholderSvg = `
        <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
          <rect width="800" height="600" fill="#f0f0f0"/>
          <text x="400" y="300" text-anchor="middle" font-family="Arial" font-size="24" fill="#666">
            AI Generated Image: ${prompt.substring(0, 50)}...
          </text>
        </svg>
      `;
      
      return NextResponse.json({
        url: `data:image/svg+xml;base64,${Buffer.from(placeholderSvg).toString('base64')}`,
        alt: `AI generated image: ${prompt}`,
        prompt: prompt,
      });
    }
    
    return NextResponse.json({
      url: imageUrl,
      alt: `AI generated image: ${prompt}`,
      prompt: prompt,
    });
  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate image' },
      { status: 500 }
    );
  }
}
