export interface ImageGenerationOptions {
  prompt: string;
  style?: 'realistic' | 'illustration' | 'diagram' | 'artistic';
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
}

export interface GeneratedImage {
  url: string;
  alt?: string;
  prompt: string;
}

/**
 * Generate an image using the orchestrator's image-generator agent via API
 */
export async function generateImage(
  options: ImageGenerationOptions
): Promise<GeneratedImage> {
  try {
    const response = await fetch('/api/generate-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: options.prompt,
        style: options.style,
        aspectRatio: options.aspectRatio,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate image');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Image generation error:', error);
    throw new Error(`Failed to generate image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Upload an image file and return its URL
 */
export async function uploadImage(file: File): Promise<{ url: string }> {
  // For now, we'll use a data URL
  // In production, you'd upload to a proper storage service
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      resolve({ url: dataUrl });
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Generate an image from selected text
 */
export async function generateImageFromText(
  text: string,
  context?: string
): Promise<GeneratedImage> {
  // Create a prompt that incorporates the selected text and any context
  let prompt = text;
  
  if (context) {
    prompt = `${context}: ${text}`;
  }
  
  // Analyze the text to determine the best style
  const style = determineImageStyle(text);
  
  return generateImage({
    prompt,
    style,
  });
}

/**
 * Determine the best image style based on the text content
 */
function determineImageStyle(text: string): 'realistic' | 'illustration' | 'diagram' | 'artistic' {
  const lowerText = text.toLowerCase();
  
  // Check for diagram-related keywords
  if (
    lowerText.includes('diagram') ||
    lowerText.includes('chart') ||
    lowerText.includes('graph') ||
    lowerText.includes('flow') ||
    lowerText.includes('process') ||
    lowerText.includes('structure')
  ) {
    return 'diagram';
  }
  
  // Check for illustration-related keywords
  if (
    lowerText.includes('illustration') ||
    lowerText.includes('cartoon') ||
    lowerText.includes('drawing') ||
    lowerText.includes('sketch')
  ) {
    return 'illustration';
  }
  
  // Check for artistic keywords
  if (
    lowerText.includes('artistic') ||
    lowerText.includes('abstract') ||
    lowerText.includes('creative') ||
    lowerText.includes('painting')
  ) {
    return 'artistic';
  }
  
  // Default to realistic
  return 'realistic';
}
