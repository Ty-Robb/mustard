import { GoogleGenerativeAI, GenerativeModel, GenerationConfig } from '@google/generative-ai';

export type GeminiModelType = 
  | 'gemini-2.5-pro'
  | 'gemini-2.5-flash'
  | 'gemini-2.5-flash-lite'
  | 'gemini-1.5-flash' // Fallback for compatibility
  | 'gemini-live-2.5-flash-preview'
  | 'gemini-2.5-flash-preview-tts'
  | 'gemini-2.5-pro-preview-tts';

export interface ModelConfig {
  model: GeminiModelType;
  generationConfig: GenerationConfig;
  description: string;
}

// Model configurations for different use cases
export const MODEL_CONFIGS: Record<string, ModelConfig> = {
  // Most cost-efficient for simple tasks
  simple: {
    model: 'gemini-2.5-flash-lite',
    generationConfig: {
      temperature: 0.5,
      topK: 20,
      topP: 0.8,
      maxOutputTokens: 1024,
      responseMimeType: "application/json",
    },
    description: 'Cost-efficient model for simple categorization and analysis'
  },
  
  // Balanced performance and cost
  standard: {
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048,
      responseMimeType: "application/json",
    },
    description: 'Adaptive thinking model for standard analysis'
  },
  
  // Enhanced reasoning for complex tasks
  advanced: {
    model: 'gemini-2.5-pro',
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 4096,
      responseMimeType: "application/json",
    },
    description: 'Enhanced thinking and reasoning for complex analysis'
  },
  
  // Fallback for compatibility
  fallback: {
    model: 'gemini-1.5-flash',
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048,
      responseMimeType: "application/json",
    },
    description: 'Stable fallback model'
  }
};

// Task complexity mapping
export const TASK_COMPLEXITY: Record<string, 'simple' | 'standard' | 'advanced'> = {
  // Simple tasks - use flash-lite
  'related-verses': 'simple',
  'cross-references': 'simple',
  'summarize': 'simple',
  
  // Standard tasks - use flash
  'word-study': 'standard',
  'location': 'standard',
  'practical-application': 'standard',
  'commentary': 'standard',
  'number-significance': 'standard',
  
  // Complex tasks - use pro
  'biography': 'advanced',
  'theology': 'advanced',
  'timeline': 'advanced',
};

export function getModelForTask(
  genAI: GoogleGenerativeAI,
  taskType?: string,
  endpoint?: 'analyze' | 'insights'
): GenerativeModel {
  let configKey: string;
  
  if (endpoint === 'analyze') {
    // Text analysis is always simple
    configKey = 'simple';
  } else if (taskType && TASK_COMPLEXITY[taskType]) {
    // Use task-specific complexity
    configKey = TASK_COMPLEXITY[taskType];
  } else {
    // Default to standard for unknown tasks
    configKey = 'standard';
  }
  
  const config = MODEL_CONFIGS[configKey];
  
  try {
    console.log(`Using ${config.model} for ${taskType || 'general'} task (${config.description})`);
    return genAI.getGenerativeModel({
      model: config.model,
      generationConfig: config.generationConfig,
    });
  } catch (error) {
    console.error(`Failed to initialize ${config.model}, falling back to gemini-1.5-flash:`, error);
    // Fallback to stable model
    return genAI.getGenerativeModel({
      model: MODEL_CONFIGS.fallback.model,
      generationConfig: MODEL_CONFIGS.fallback.generationConfig,
    });
  }
}

export function getModelConfig(taskType?: string, endpoint?: 'analyze' | 'insights'): ModelConfig {
  if (endpoint === 'analyze') {
    return MODEL_CONFIGS.simple;
  } else if (taskType && TASK_COMPLEXITY[taskType]) {
    return MODEL_CONFIGS[TASK_COMPLEXITY[taskType]];
  }
  return MODEL_CONFIGS.standard;
}
