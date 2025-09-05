/**
 * Genkit Service - Provides flow orchestration with tool support
 * Integrates with Google's Genkit framework for AI flow orchestration
 */

import { genkit, z } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { VertexAIService } from './vertex-ai.service';
import { Agent } from '@/types/orchestration';
import { getModelParameters } from '@/lib/utils/model-selector';

// Lazy initialization to avoid accessing process.env at module load time
let ai: any;

const getGenkitInstance = () => {
  if (!ai) {
    const apiKey = typeof window === 'undefined' 
      ? (process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '')
      : '';
    
    ai = genkit({
      plugins: [
        googleAI({
          apiKey,
        }),
      ],
    });
  }
  return ai;
};

// Define schemas for flow inputs and outputs
const flowInputSchema = z.object({
  task: z.string(),
  context: z.any().optional(),
  agent: z.any().optional(),
});

const flowOutputSchema = z.object({
  result: z.string(),
  metadata: z.object({
    sources: z.array(z.string()).optional(),
    confidence: z.number().optional(),
    toolsUsed: z.array(z.string()).optional(),
  }).optional(),
});

const searchResultSchema = z.object({
  title: z.string(),
  snippet: z.string(),
  link: z.string(),
});

export interface GenkitFlowInput {
  task: string;
  context?: any;
  agent?: Agent;
}

export interface GenkitFlowOutput {
  result: string;
  metadata?: {
    sources?: string[];
    confidence?: number;
    toolsUsed?: string[];
  };
}

export interface GoogleSearchResult {
  title: string;
  snippet: string;
  link: string;
}

export class GenkitService {
  private vertexAI: VertexAIService;
  private googleSearchApiKey?: string;
  private googleSearchEngineId?: string;
  private researchFlow: any;
  private criticalAppraisalFlow: any;
  private dataAnalysisFlow: any;
  private contentCreationFlow: any;
  private visualDesignFlow: any;
  private qualityEnhancementFlow: any;
  private domainSpecificFlow: any;

  constructor() {
    this.vertexAI = new VertexAIService();
    
    // Only access environment variables on the server side
    if (typeof window === 'undefined') {
      this.googleSearchApiKey = process.env.GOOGLE_SEARCH_API_KEY;
      this.googleSearchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
    }
    
    // Initialize flows
    this.initializeFlows();
  }

  /**
   * Initialize Genkit flows
   */
  private initializeFlows() {
    const genkitAI = getGenkitInstance();
    
    // Research Flow
    this.researchFlow = genkitAI.defineFlow(
      {
        name: 'researchFlow',
        inputSchema: flowInputSchema,
        outputSchema: flowOutputSchema,
      },
      async (input: any) => {
        const { task, context, agent } = input;
        
        // Step 1: Search for relevant information
        const searchResults = await this.performGoogleSearch(task);
        
        // Step 2: Generate research with grounded data
        const prompt = this.buildResearchPrompt(task, searchResults, context);
        
        // Use Genkit's model if available, otherwise fall back to VertexAI
        let result: string;
        try {
          const modelName = agent?.modelName || 'gemini-2.0-flash-exp';
          const response = await genkitAI.generate({
            model: modelName,
            prompt,
            config: {
              temperature: agent?.temperature || 0.7,
              maxOutputTokens: agent?.maxOutputTokens || 2048,
            },
          });
          result = response.text;
        } catch (error) {
          // Fallback to VertexAI service
          console.log('[GenkitService] Falling back to VertexAI service');
          const modelName = agent?.modelName || 'gemini-2.0-flash-exp';
          result = await this.vertexAI.generateContent(
            prompt,
            modelName,
            getModelParameters(modelName, agent)
          );
        }

        return {
          result,
          metadata: {
            sources: searchResults.map(r => r.link),
            toolsUsed: ['google-search']
          }
        };
      }
    );

    // Critical Appraisal Flow
    this.criticalAppraisalFlow = genkitAI.defineFlow(
      {
        name: 'criticalAppraisalFlow',
        inputSchema: flowInputSchema,
        outputSchema: flowOutputSchema,
      },
      async (input: any) => {
        const { task, context, agent } = input;
        
        // Step 1: Search for multiple perspectives
        const searchQueries = [
          task,
          `${task} criticism`,
          `${task} advantages disadvantages`,
          `${task} different perspectives`
        ];
        
        const allSearchResults: GoogleSearchResult[] = [];
        for (const query of searchQueries) {
          const results = await this.performGoogleSearch(query);
          allSearchResults.push(...results);
        }
        
        // Step 2: Generate critical appraisal with diverse sources
        const prompt = this.buildCriticalAppraisalPrompt(task, allSearchResults, context);
        
        let result: string;
        try {
          const modelName = agent?.modelName || 'gemini-2.0-flash-exp';
          const response = await genkitAI.generate({
            model: modelName,
            prompt,
            config: {
              temperature: agent?.temperature || 0.8,
              maxOutputTokens: agent?.maxOutputTokens || 4096,
            },
          });
          result = response.text;
        } catch (error) {
          // Fallback to VertexAI service
          console.log('[GenkitService] Falling back to VertexAI service');
          const modelName = agent?.modelName || 'gemini-2.0-flash-exp';
          result = await this.vertexAI.generateContent(
            prompt,
            modelName,
            getModelParameters(modelName, agent)
          );
        }

        return {
          result,
          metadata: {
            sources: allSearchResults.map(r => r.link),
            toolsUsed: ['google-search'],
            confidence: 0.85
          }
        };
      }
    );

    // Data Analysis Flow
    this.dataAnalysisFlow = genkitAI.defineFlow(
      {
        name: 'dataAnalysisFlow',
        inputSchema: flowInputSchema,
        outputSchema: flowOutputSchema,
      },
      async (input: any) => {
        const { task, context, agent } = input;
        
        // Search for relevant data and benchmarks
        const searchResults = await this.performGoogleSearch(`${task} statistics data benchmarks`);
        
        const prompt = this.buildDataAnalysisPrompt(task, searchResults, context);
        
        let result: string;
        try {
          const modelName = agent?.modelName || 'gemini-2.0-flash-exp';
          const response = await genkitAI.generate({
            model: modelName,
            prompt,
            config: {
              temperature: agent?.temperature || 0.5,
              maxOutputTokens: agent?.maxOutputTokens || 2048,
            },
          });
          result = response.text;
        } catch (error) {
          // Fallback to VertexAI service
          console.log('[GenkitService] Falling back to VertexAI service');
          const modelName = agent?.modelName || 'gemini-2.0-flash-exp';
          result = await this.vertexAI.generateContent(
            prompt,
            modelName,
            getModelParameters(modelName, agent)
          );
        }

        return {
          result,
          metadata: {
            sources: searchResults.map(r => r.link),
            toolsUsed: ['google-search']
          }
        };
      }
    );

    // Content Creation Flow
    this.contentCreationFlow = genkitAI.defineFlow(
      {
        name: 'contentCreationFlow',
        inputSchema: flowInputSchema,
        outputSchema: flowOutputSchema,
      },
      async (input: any) => {
        const { task, context, agent } = input;
        
        // For content creation, we may optionally search for inspiration or examples
        let searchResults: GoogleSearchResult[] = [];
        if (agent?.capabilities?.includes('research')) {
          searchResults = await this.performGoogleSearch(`${task} examples best practices`);
        }
        
        const prompt = this.buildContentCreationPrompt(task, searchResults, context, agent);
        
        let result: string;
        try {
          const modelName = agent?.modelName || 'gemini-2.5-flash';
          const response = await genkitAI.generate({
            model: modelName,
            prompt,
            config: {
              temperature: agent?.temperature || 0.7,
              maxOutputTokens: agent?.maxOutputTokens || 4096,
            },
          });
          result = response.text;
        } catch (error) {
          console.log('[GenkitService] Falling back to VertexAI service');
          const modelName = agent?.modelName || 'gemini-2.5-flash';
          result = await this.vertexAI.generateContent(
            prompt,
            modelName,
            getModelParameters(modelName, agent)
          );
        }

        return {
          result,
          metadata: {
            sources: searchResults.map(r => r.link),
            toolsUsed: searchResults.length > 0 ? ['google-search'] : []
          }
        };
      }
    );

    // Visual Design Flow
    this.visualDesignFlow = genkitAI.defineFlow(
      {
        name: 'visualDesignFlow',
        inputSchema: flowInputSchema,
        outputSchema: flowOutputSchema,
      },
      async (input: any) => {
        const { task, context, agent } = input;
        
        // Special handling for image-generator agent
        if (agent?.id === 'image-generator') {
          console.log('[GenkitService] Image generation requested');
          
          // Extract style and aspect ratio from context if available
          const style = context?.style || 'realistic';
          const aspectRatio = context?.aspectRatio || '16:9';
          
          // Use the VertexAI service's generateImage method
          const imageResult = await this.vertexAI.generateImage(task, style, aspectRatio);
          
          if (imageResult.error) {
            // Return error message if image generation failed
            return {
              result: `Failed to generate image: ${imageResult.error}. Please try again with a different prompt.`,
              metadata: {
                error: imageResult.error,
                toolsUsed: ['image-generation']
              }
            };
          }
          
          // Return the image URL or base64 data
          const imageUrl = imageResult.imageUrl || imageResult.base64;
          if (imageUrl) {
            return {
              result: imageUrl,
              metadata: {
                type: 'image',
                toolsUsed: ['image-generation']
              }
            };
          }
          
          // Fallback if no image was generated
          return {
            result: 'Image generation completed but no image URL was returned.',
            metadata: {
              toolsUsed: ['image-generation']
            }
          };
        }
        
        // For other visual design agents, continue with normal flow
        let searchResults: GoogleSearchResult[] = [];
        searchResults = await this.performGoogleSearch(`${task} design trends inspiration`);
        
        const prompt = this.buildVisualDesignPrompt(task, searchResults, context, agent);
        
        let result: string;
        try {
          const modelName = agent?.modelName || 'gemini-2.5-flash';
          const response = await genkitAI.generate({
            model: modelName,
            prompt,
            config: {
              temperature: agent?.temperature || 0.8,
              maxOutputTokens: agent?.maxOutputTokens || 2048,
            },
          });
          result = response.text;
        } catch (error) {
          console.log('[GenkitService] Falling back to VertexAI service');
          const modelName = agent?.modelName || 'gemini-2.5-flash';
          result = await this.vertexAI.generateContent(
            prompt,
            modelName,
            getModelParameters(modelName, agent)
          );
        }

        return {
          result,
          metadata: {
            sources: searchResults.map(r => r.link),
            toolsUsed: searchResults.length > 0 ? ['google-search'] : []
          }
        };
      }
    );

    // Quality Enhancement Flow
    this.qualityEnhancementFlow = genkitAI.defineFlow(
      {
        name: 'qualityEnhancementFlow',
        inputSchema: flowInputSchema,
        outputSchema: flowOutputSchema,
      },
      async (input: any) => {
        const { task, context, agent } = input;
        
        // Search for best practices if it's an SEO or accessibility task
        let searchResults: GoogleSearchResult[] = [];
        if (agent?.id === 'seo-optimizer' || agent?.id === 'accessibility-checker') {
          searchResults = await this.performGoogleSearch(`${task} best practices 2024`);
        }
        
        const prompt = this.buildQualityEnhancementPrompt(task, searchResults, context, agent);
        
        let result: string;
        try {
          const modelName = agent?.modelName || 'gemini-2.5-flash';
          const response = await genkitAI.generate({
            model: modelName,
            prompt,
            config: {
              temperature: agent?.temperature || 0.3,
              maxOutputTokens: agent?.maxOutputTokens || 2048,
            },
          });
          result = response.text;
        } catch (error) {
          console.log('[GenkitService] Falling back to VertexAI service');
          const modelName = agent?.modelName || 'gemini-2.5-flash';
          result = await this.vertexAI.generateContent(
            prompt,
            modelName,
            getModelParameters(modelName, agent)
          );
        }

        return {
          result,
          metadata: {
            sources: searchResults.map(r => r.link),
            toolsUsed: searchResults.length > 0 ? ['google-search'] : []
          }
        };
      }
    );

    // Domain Specific Flow
    this.domainSpecificFlow = genkitAI.defineFlow(
      {
        name: 'domainSpecificFlow',
        inputSchema: flowInputSchema,
        outputSchema: flowOutputSchema,
      },
      async (input: any) => {
        const { task, context, agent } = input;
        
        // Search for domain-specific resources
        let searchResults: GoogleSearchResult[] = [];
        if (agent?.capabilities?.includes('theology') || agent?.capabilities?.includes('biblical-analysis')) {
          searchResults = await this.performGoogleSearch(`${task} biblical theological resources`);
        } else if (agent?.id === 'youth-specialist') {
          searchResults = await this.performGoogleSearch(`${task} youth ministry ideas`);
        }
        
        const prompt = this.buildDomainSpecificPrompt(task, searchResults, context, agent);
        
        let result: string;
        try {
          const modelName = agent?.modelName || 'gemini-2.5-pro';
          const response = await genkitAI.generate({
            model: modelName,
            prompt,
            config: {
              temperature: agent?.temperature || 0.5,
              maxOutputTokens: agent?.maxOutputTokens || 4096,
            },
          });
          result = response.text;
        } catch (error) {
          console.log('[GenkitService] Falling back to VertexAI service');
          const modelName = agent?.modelName || 'gemini-2.5-pro';
          result = await this.vertexAI.generateContent(
            prompt,
            modelName,
            getModelParameters(modelName, agent)
          );
        }

        return {
          result,
          metadata: {
            sources: searchResults.map(r => r.link),
            toolsUsed: searchResults.length > 0 ? ['google-search'] : []
          }
        };
      }
    );
  }

  /**
   * Create a research flow with Google Search grounding
   */
  async createResearchFlow(): Promise<(input: GenkitFlowInput) => Promise<GenkitFlowOutput>> {
    return async (input: GenkitFlowInput) => {
      return await this.researchFlow(input);
    };
  }

  /**
   * Create a critical appraisal flow with search capabilities
   */
  async createCriticalAppraisalFlow(): Promise<(input: GenkitFlowInput) => Promise<GenkitFlowOutput>> {
    return async (input: GenkitFlowInput) => {
      return await this.criticalAppraisalFlow(input);
    };
  }

  /**
   * Create a data analysis flow with search for benchmarks
   */
  async createDataAnalysisFlow(): Promise<(input: GenkitFlowInput) => Promise<GenkitFlowOutput>> {
    return async (input: GenkitFlowInput) => {
      return await this.dataAnalysisFlow(input);
    };
  }

  /**
   * Execute a flow by agent ID
   */
  async executeFlow(agentId: string, input: GenkitFlowInput): Promise<GenkitFlowOutput> {
    const agent = input.agent;
    
    if (!agent) {
      // If no agent provided, fallback to standard execution
      return {
        result: await this.executeStandardAgent(input),
        metadata: {}
      };
    }

    // Route based on agent category
    switch (agent.category) {
      case 'research':
        // Special handling for specific research agents
        if (agentId === 'critical-appraiser' || agentId === 'theology-analyst') {
          return await this.criticalAppraisalFlow(input);
        } else if (agentId === 'data-analyst') {
          return await this.dataAnalysisFlow(input);
        }
        // Default research flow for other research agents
        return await this.researchFlow(input);
      
      case 'content':
        return await this.contentCreationFlow(input);
      
      case 'visual':
        return await this.visualDesignFlow(input);
      
      case 'domain':
        // Special handling for theology-analyst if categorized as domain
        if (agentId === 'theology-analyst') {
          return await this.criticalAppraisalFlow(input);
        }
        return await this.domainSpecificFlow(input);
      
      case 'quality':
        return await this.qualityEnhancementFlow(input);
      
      case 'orchestrator':
        // Orchestrator doesn't need grounding, use standard execution
        return {
          result: await this.executeStandardAgent(input),
          metadata: {}
        };
      
      default:
        // Fallback to standard execution for unknown categories
        return {
          result: await this.executeStandardAgent(input),
          metadata: {}
        };
    }
  }

  /**
   * Perform Google Search using Vertex AI Search grounding
   */
  private async performGoogleSearch(query: string): Promise<GoogleSearchResult[]> {
    try {
      console.log(`[GenkitService] Using Vertex AI Search for: "${query}"`);
      
      // Use Vertex AI Search grounding
      const searchPrompt = `Search for information about: ${query}
      
Please provide the top 5 most relevant search results with:
1. Title of the source
2. A brief snippet or summary
3. The source URL (if available)

Format the response as a list of search results.`;

      const searchResponse = await this.vertexAI.generateContentWithSearch(
        searchPrompt,
        'gemini-2.5-flash',
        { temperature: 0.3, maxTokens: 1024 }
      );

      // Parse the response to extract search results
      // The AI will return grounded results with source information
      const results = this.parseSearchResults(searchResponse);
      
      if (results.length > 0) {
        return results;
      }
      
      // Fallback to mock data if parsing fails
      console.log('[GenkitService] Failed to parse search results, using mock data');
      return this.getMockSearchResults(query);
      
    } catch (error) {
      console.error('[GenkitService] Vertex AI Search error:', error);
      // Fallback to mock data
      return this.getMockSearchResults(query);
    }
  }

  /**
   * Parse search results from Vertex AI response
   */
  private parseSearchResults(response: string): GoogleSearchResult[] {
    const results: GoogleSearchResult[] = [];
    
    try {
      // Simple parsing logic - can be enhanced based on actual response format
      const lines = response.split('\n');
      let currentResult: Partial<GoogleSearchResult> = {};
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Look for numbered results (e.g., "1. Title here")
        const numberMatch = trimmedLine.match(/^\d+\.\s+(.+)/);
        if (numberMatch) {
          if (currentResult.title) {
            // Save previous result if exists
            results.push({
              title: currentResult.title || 'Untitled',
              snippet: currentResult.snippet || '',
              link: currentResult.link || '#'
            });
          }
          currentResult = { title: numberMatch[1] };
        }
        
        // Look for snippets (lines that start with description-like text)
        else if (trimmedLine && !trimmedLine.startsWith('http') && currentResult.title && !currentResult.snippet) {
          currentResult.snippet = trimmedLine;
        }
        
        // Look for URLs
        else if (trimmedLine.startsWith('http') || trimmedLine.includes('Source:')) {
          const urlMatch = trimmedLine.match(/https?:\/\/[^\s]+/);
          if (urlMatch) {
            currentResult.link = urlMatch[0];
          }
        }
      }
      
      // Add the last result if exists
      if (currentResult.title) {
        results.push({
          title: currentResult.title || 'Untitled',
          snippet: currentResult.snippet || '',
          link: currentResult.link || '#'
        });
      }
      
      // If we couldn't parse structured results, create simple results from the response
      if (results.length === 0 && response.length > 100) {
        // Split response into chunks and create basic results
        const chunks = response.split(/\n\n+/).filter(chunk => chunk.trim().length > 20);
        for (let i = 0; i < Math.min(chunks.length, 3); i++) {
          const chunk = chunks[i];
          const firstLine = chunk.split('\n')[0];
          results.push({
            title: firstLine.substring(0, 100) + (firstLine.length > 100 ? '...' : ''),
            snippet: chunk.substring(0, 200) + (chunk.length > 200 ? '...' : ''),
            link: '#'
          });
        }
      }
      
    } catch (error) {
      console.error('[GenkitService] Error parsing search results:', error);
    }
    
    return results;
  }

  /**
   * Get mock search results for testing
   */
  private getMockSearchResults(query: string): GoogleSearchResult[] {
    return [
      {
        title: `Understanding ${query}`,
        snippet: `Comprehensive overview of ${query} with latest research and insights...`,
        link: `https://example.com/${query.replace(/\s+/g, '-')}`
      },
      {
        title: `${query}: A Critical Analysis`,
        snippet: `In-depth analysis examining various perspectives on ${query}...`,
        link: `https://academic.example.com/${query.replace(/\s+/g, '-')}`
      },
      {
        title: `Latest Developments in ${query}`,
        snippet: `Recent updates and trends related to ${query} from authoritative sources...`,
        link: `https://news.example.com/${query.replace(/\s+/g, '-')}`
      }
    ];
  }

  /**
   * Build research prompt with search results
   */
  private buildResearchPrompt(task: string, searchResults: GoogleSearchResult[], context?: any): string {
    const sourcesSection = searchResults.map((result, index) => 
      `Source ${index + 1}: ${result.title}\n${result.snippet}\nURL: ${result.link}`
    ).join('\n\n');

    return `
You are a research specialist with access to web search results. Your task is to provide comprehensive research based on the following sources and context.

Task: ${task}

${context ? `Additional Context: ${JSON.stringify(context, null, 2)}` : ''}

Web Search Results:
${sourcesSection}

Please provide a thorough research response that:
1. Synthesizes information from the provided sources
2. Identifies key themes and patterns
3. Highlights important findings
4. Notes any conflicting information or gaps
5. Provides citations to specific sources when making claims

Format your response with clear sections and cite sources using [Source N] notation.
`;
  }

  /**
   * Build critical appraisal prompt with diverse sources
   */
  private buildCriticalAppraisalPrompt(task: string, searchResults: GoogleSearchResult[], context?: any): string {
    const sourcesSection = searchResults.map((result, index) => 
      `Source ${index + 1}: ${result.title}\n${result.snippet}\nURL: ${result.link}`
    ).join('\n\n');

    return `
You are a critical appraisal specialist tasked with providing a balanced, thorough evaluation. You have access to diverse sources representing multiple perspectives.

Task: ${task}

${context ? `Additional Context: ${JSON.stringify(context, null, 2)}` : ''}

Diverse Sources:
${sourcesSection}

Provide a comprehensive critical appraisal that:
1. Identifies key strengths and weaknesses from multiple perspectives
2. Evaluates the quality and reliability of different viewpoints
3. Presents conflicting opinions fairly and objectively
4. Highlights assumptions, biases, and limitations in various arguments
5. Suggests areas for improvement or further investigation
6. Provides a balanced conclusion that acknowledges complexity

Structure your response with:
- Executive Summary
- Strengths (with sources)
- Weaknesses (with sources)
- Alternative Perspectives
- Critical Evaluation
- Recommendations
- Balanced Conclusion

Cite sources using [Source N] notation and maintain objectivity throughout.
`;
  }

  /**
   * Build data analysis prompt with benchmarks
   */
  private buildDataAnalysisPrompt(task: string, searchResults: GoogleSearchResult[], context?: any): string {
    const sourcesSection = searchResults.map((result, index) => 
      `Source ${index + 1}: ${result.title}\n${result.snippet}\nURL: ${result.link}`
    ).join('\n\n');

    return `
You are a data analysis specialist with access to industry benchmarks and statistics. Analyze the following task using available data sources.

Task: ${task}

${context ? `Additional Context: ${JSON.stringify(context, null, 2)}` : ''}

Data Sources and Benchmarks:
${sourcesSection}

Provide a data-driven analysis that:
1. Identifies relevant statistics and metrics
2. Compares findings against industry benchmarks
3. Highlights trends and patterns
4. Notes data limitations and confidence levels
5. Provides actionable insights based on the data

Include specific numbers, percentages, and comparisons where available. Cite sources using [Source N] notation.
`;
  }

  /**
   * Build content creation prompt
   */
  private buildContentCreationPrompt(task: string, searchResults: GoogleSearchResult[], context: any, agent?: Agent): string {
    const sourcesSection = searchResults.length > 0 
      ? `\nInspiration and Examples:\n${searchResults.map((result, index) => 
          `Source ${index + 1}: ${result.title}\n${result.snippet}\nURL: ${result.link}`
        ).join('\n\n')}`
      : '';

    return `
You are ${agent?.name || 'a content creator'}, ${agent?.description || 'specializing in creating high-quality content'}.

Your responsibilities include:
${agent?.responsibilities?.map(r => `- ${r}`).join('\n') || '- Creating engaging content'}

Task: ${task}

${context ? `Additional Context: ${JSON.stringify(context, null, 2)}` : ''}
${sourcesSection}

Please create content that:
1. Addresses the task requirements completely
2. Maintains appropriate tone and style
3. Engages the target audience effectively
4. Follows best practices for the content type
5. Is well-structured and easy to follow

${searchResults.length > 0 ? 'Reference sources where appropriate using [Source N] notation.' : ''}
`;
  }

  /**
   * Build visual design prompt
   */
  private buildVisualDesignPrompt(task: string, searchResults: GoogleSearchResult[], context: any, agent?: Agent): string {
    const sourcesSection = searchResults.length > 0 
      ? `\nDesign Inspiration and Trends:\n${searchResults.map((result, index) => 
          `Source ${index + 1}: ${result.title}\n${result.snippet}\nURL: ${result.link}`
        ).join('\n\n')}`
      : '';

    return `
You are ${agent?.name || 'a visual design specialist'}, ${agent?.description || 'creating compelling visual solutions'}.

Your responsibilities include:
${agent?.responsibilities?.map(r => `- ${r}`).join('\n') || '- Creating visual designs'}

Task: ${task}

${context ? `Additional Context: ${JSON.stringify(context, null, 2)}` : ''}
${sourcesSection}

Please provide design recommendations that:
1. Address the visual requirements of the task
2. Follow current design best practices
3. Consider user experience and accessibility
4. Maintain brand consistency where applicable
5. Include specific implementation details

${agent?.id === 'image-generator' ? 'Generate detailed image descriptions or prompts.' : ''}
${searchResults.length > 0 ? 'Reference design trends from sources using [Source N] notation.' : ''}
`;
  }

  /**
   * Build quality enhancement prompt
   */
  private buildQualityEnhancementPrompt(task: string, searchResults: GoogleSearchResult[], context: any, agent?: Agent): string {
    const sourcesSection = searchResults.length > 0 
      ? `\nBest Practices and Standards:\n${searchResults.map((result, index) => 
          `Source ${index + 1}: ${result.title}\n${result.snippet}\nURL: ${result.link}`
        ).join('\n\n')}`
      : '';

    return `
You are ${agent?.name || 'a quality specialist'}, ${agent?.description || 'ensuring high standards and best practices'}.

Your responsibilities include:
${agent?.responsibilities?.map(r => `- ${r}`).join('\n') || '- Quality enhancement'}

Task: ${task}

${context ? `Additional Context: ${JSON.stringify(context, null, 2)}` : ''}
${sourcesSection}

Please provide quality enhancements that:
1. Improve the overall quality of the content/output
2. Follow industry standards and best practices
3. Address specific quality metrics relevant to the task
4. Provide actionable recommendations
5. Include measurable improvements where possible

${searchResults.length > 0 ? 'Reference current best practices using [Source N] notation.' : ''}
`;
  }

  /**
   * Build domain-specific prompt
   */
  private buildDomainSpecificPrompt(task: string, searchResults: GoogleSearchResult[], context: any, agent?: Agent): string {
    const sourcesSection = searchResults.length > 0 
      ? `\nDomain-Specific Resources:\n${searchResults.map((result, index) => 
          `Source ${index + 1}: ${result.title}\n${result.snippet}\nURL: ${result.link}`
        ).join('\n\n')}`
      : '';

    return `
You are ${agent?.name || 'a domain specialist'}, ${agent?.description || 'with deep expertise in your field'}.

Your responsibilities include:
${agent?.responsibilities?.map(r => `- ${r}`).join('\n') || '- Domain-specific expertise'}

Task: ${task}

${context ? `Additional Context: ${JSON.stringify(context, null, 2)}` : ''}
${sourcesSection}

Please provide domain-specific insights that:
1. Apply specialized knowledge to the task
2. Consider domain-specific best practices
3. Address unique requirements of the field
4. Provide expert-level analysis and recommendations
5. Include relevant terminology and concepts

${searchResults.length > 0 ? 'Reference authoritative sources using [Source N] notation.' : ''}
`;
  }

  /**
   * Execute standard agent without grounding (fallback)
   */
  private async executeStandardAgent(input: GenkitFlowInput): Promise<string> {
    const { task, context, agent } = input;
    
    const prompt = `
${agent ? `You are ${agent.name}, ${agent.description}.` : 'You are an AI assistant.'}

Task: ${task}

${context ? `Context: ${JSON.stringify(context, null, 2)}` : ''}

Please complete this task according to your specialization.
`;

    const modelName = agent?.modelName || 'gemini-2.5-flash';
    return await this.vertexAI.generateContent(
      prompt,
      modelName,
      getModelParameters(modelName, agent)
    );
  }
}

// Export singleton instance
export const genkitService = new GenkitService();
