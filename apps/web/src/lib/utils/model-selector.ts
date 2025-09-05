/**
 * Model Selection Utility
 * Intelligently selects the appropriate Gemini model based on task requirements
 */

import { 
  ModelName, 
  ModelSelectionCriteria, 
  TaskComplexity,
  QualityRequirement,
  SpeedPriority,
  CostSensitivity,
  Agent
} from '@/types/orchestration';

// Model cost factors (relative)
const MODEL_COSTS: Record<ModelName, number> = {
  'gemini-2.5-pro': 1.0,
  'gemini-2.5-flash': 0.4,
  'gemini-2.5-flash-lite': 0.1,
  'gemini-2.5-flash-image-preview': 0.5 // Slightly higher than flash due to image capabilities
};

// Model speed factors (relative, lower is faster)
const MODEL_SPEEDS: Record<ModelName, number> = {
  'gemini-2.5-pro': 3.0,
  'gemini-2.5-flash': 1.0,
  'gemini-2.5-flash-lite': 0.5,
  'gemini-2.5-flash-image-preview': 1.2 // Slightly slower than flash due to image processing
};

// Model capabilities
const MODEL_CAPABILITIES: Record<ModelName, string[]> = {
  'gemini-2.5-pro': ['complex-reasoning', 'deep-analysis', 'nuanced-understanding'],
  'gemini-2.5-flash': ['balanced-performance', 'creative-tasks'],
  'gemini-2.5-flash-lite': ['simple-tasks', 'formatting', 'quick-responses'],
  'gemini-2.5-flash-image-preview': ['image-generation', 'visual-creation', 'creative-tasks']
};

/**
 * Select the most appropriate model based on criteria
 */
export function selectModel(criteria: ModelSelectionCriteria): ModelName {
  // Image generation requirement overrides all other criteria
  if (criteria.needsImageGeneration) {
    return 'gemini-2.5-flash-image-preview'; // Use dedicated image generation model
  }

  // Complex tasks or premium quality always use Pro
  if (criteria.taskComplexity === 'complex' || criteria.qualityRequirement === 'premium') {
    return 'gemini-2.5-pro';
  }

  // Simple tasks with high speed priority or cost sensitivity use Lite
  if (
    criteria.taskComplexity === 'simple' && 
    (criteria.speedPriority === 'high' || criteria.costSensitivity === 'high')
  ) {
    return 'gemini-2.5-flash-lite';
  }

  // Basic quality with cost sensitivity uses Lite
  if (criteria.qualityRequirement === 'basic' && criteria.costSensitivity !== 'low') {
    return 'gemini-2.5-flash-lite';
  }

  // Default to Flash for balanced performance
  return 'gemini-2.5-flash';
}

/**
 * Analyze task to determine complexity
 */
export function analyzeTaskComplexity(task: string, agent?: Agent): TaskComplexity {
  const taskLower = task.toLowerCase();
  
  // Complex indicators
  const complexIndicators = [
    'analyze deeply',
    'theological',
    'comprehensive',
    'detailed analysis',
    'complex',
    'nuanced',
    'in-depth',
    'scholarly',
    'academic',
    'research extensively'
  ];

  // Simple indicators
  const simpleIndicators = [
    'format',
    'title',
    'headline',
    'check',
    'verify',
    'simple',
    'quick',
    'brief',
    'short',
    'basic'
  ];

  // Check agent category for hints
  if (agent) {
    if (agent.category === 'domain' && agent.modelName === 'gemini-2.5-pro') {
      return 'complex';
    }
    if (agent.category === 'quality' && agent.modelName === 'gemini-2.5-flash-lite') {
      return 'simple';
    }
  }

  // Count indicators
  const complexCount = complexIndicators.filter(indicator => taskLower.includes(indicator)).length;
  const simpleCount = simpleIndicators.filter(indicator => taskLower.includes(indicator)).length;

  if (complexCount > simpleCount && complexCount > 0) {
    return 'complex';
  }
  if (simpleCount > complexCount && simpleCount > 0) {
    return 'simple';
  }

  return 'moderate';
}

/**
 * Determine quality requirement from user preferences or task
 */
export function determineQualityRequirement(
  task: string,
  userPreference?: QualityRequirement
): QualityRequirement {
  if (userPreference) {
    return userPreference;
  }

  const taskLower = task.toLowerCase();
  
  const premiumIndicators = ['professional', 'publication', 'formal', 'academic', 'scholarly'];
  const basicIndicators = ['draft', 'quick', 'rough', 'initial', 'basic'];

  if (premiumIndicators.some(indicator => taskLower.includes(indicator))) {
    return 'premium';
  }
  if (basicIndicators.some(indicator => taskLower.includes(indicator))) {
    return 'basic';
  }

  return 'standard';
}

/**
 * Calculate estimated cost for a model selection
 */
export function calculateEstimatedCost(
  model: ModelName,
  estimatedTokens: number = 1000
): number {
  const baseCost = MODEL_COSTS[model];
  // Rough cost calculation (simplified)
  return baseCost * (estimatedTokens / 1000) * 0.01; // $0.01 per 1K tokens at base rate
}

/**
 * Get model recommendation with reasoning
 */
export interface ModelRecommendation {
  model: ModelName;
  reasoning: string;
  estimatedCost: number;
  alternativeModels: Array<{
    model: ModelName;
    tradeoff: string;
  }>;
}

export function getModelRecommendation(
  criteria: ModelSelectionCriteria,
  task: string
): ModelRecommendation {
  const selectedModel = selectModel(criteria);
  const estimatedCost = calculateEstimatedCost(selectedModel);

  let reasoning = '';
  const alternatives: Array<{ model: ModelName; tradeoff: string }> = [];

  // Build reasoning
  if (criteria.needsImageGeneration) {
    reasoning = 'Gemini 2.5 Flash selected for native image generation capability.';
    alternatives.push({
      model: 'gemini-2.5-pro',
      tradeoff: 'Higher quality but no image generation'
    });
  } else if (selectedModel === 'gemini-2.5-pro') {
    reasoning = 'Gemini 2.5 Pro selected for complex reasoning and premium quality requirements.';
    alternatives.push({
      model: 'gemini-2.5-flash',
      tradeoff: '60% cost reduction with slightly lower quality'
    });
  } else if (selectedModel === 'gemini-2.5-flash-lite') {
    reasoning = 'Gemini 2.5 Flash Lite selected for simple task with cost/speed optimization.';
    alternatives.push({
      model: 'gemini-2.5-flash',
      tradeoff: 'Better quality at 4x the cost'
    });
  } else {
    reasoning = 'Gemini 2.5 Flash selected for balanced performance and cost efficiency.';
    alternatives.push({
      model: 'gemini-2.5-pro',
      tradeoff: 'Premium quality at 2.5x the cost'
    });
    alternatives.push({
      model: 'gemini-2.5-flash-lite',
      tradeoff: '75% cost reduction for simple tasks'
    });
  }

  return {
    model: selectedModel,
    reasoning,
    estimatedCost,
    alternativeModels: alternatives
  };
}

/**
 * Optimize model selection for a batch of tasks
 */
export interface BatchOptimizationResult {
  totalEstimatedCost: number;
  costSavings: number;
  modelDistribution: Record<ModelName, number>;
  recommendations: Array<{
    task: string;
    model: ModelName;
    cost: number;
  }>;
}

export function optimizeBatchModelSelection(
  tasks: Array<{ task: string; agent?: Agent }>,
  globalCriteria: Partial<ModelSelectionCriteria> = {}
): BatchOptimizationResult {
  const recommendations: Array<{ task: string; model: ModelName; cost: number }> = [];
  const modelCounts: Record<ModelName, number> = {
    'gemini-2.5-pro': 0,
    'gemini-2.5-flash': 0,
    'gemini-2.5-flash-lite': 0,
    'gemini-2.5-flash-image-preview': 0
  };

  let totalOptimizedCost = 0;
  let totalDefaultCost = 0;

  tasks.forEach(({ task, agent }) => {
    // Determine criteria for this task
    const complexity = analyzeTaskComplexity(task, agent);
    const quality = determineQualityRequirement(task, globalCriteria.qualityRequirement);
    
    const criteria: ModelSelectionCriteria = {
      taskComplexity: complexity,
      qualityRequirement: quality,
      speedPriority: globalCriteria.speedPriority || 'medium',
      needsImageGeneration: task.toLowerCase().includes('image') || task.toLowerCase().includes('visual'),
      costSensitivity: globalCriteria.costSensitivity || 'medium'
    };

    const model = selectModel(criteria);
    const cost = calculateEstimatedCost(model);

    recommendations.push({ task, model, cost });
    modelCounts[model]++;
    totalOptimizedCost += cost;

    // Calculate default cost (if always using Pro)
    totalDefaultCost += calculateEstimatedCost('gemini-2.5-pro');
  });

  return {
    totalEstimatedCost: totalOptimizedCost,
    costSavings: totalDefaultCost - totalOptimizedCost,
    modelDistribution: modelCounts,
    recommendations
  };
}

/**
 * Validate model selection against agent requirements
 */
export function validateModelForAgent(agent: Agent, selectedModel: ModelName): boolean {
  // Ensure the selected model meets or exceeds the agent's default model
  const modelHierarchy: Record<ModelName, number> = {
    'gemini-2.5-flash-lite': 1,
    'gemini-2.5-flash': 2,
    'gemini-2.5-flash-image-preview': 2, // Same level as flash
    'gemini-2.5-pro': 3
  };

  return modelHierarchy[selectedModel] >= modelHierarchy[agent.modelName];
}

/**
 * Get model-specific parameters
 */
export interface ModelParameters {
  maxTokens: number;
  temperature: number;
  topP: number;
  topK: number;
}

export function getModelParameters(
  model: ModelName,
  agent?: Agent,
  taskType?: string
): ModelParameters {
  // Base parameters by model
  const baseParams: Record<ModelName, ModelParameters> = {
    'gemini-2.5-pro': {
      maxTokens: 8192,
      temperature: 0.4,
      topP: 0.95,
      topK: 40
    },
    'gemini-2.5-flash': {
      maxTokens: 4096,
      temperature: 0.6,
      topP: 0.9,
      topK: 32
    },
    'gemini-2.5-flash-lite': {
      maxTokens: 2048,
      temperature: 0.3,
      topP: 0.85,
      topK: 20
    },
    'gemini-2.5-flash-image-preview': {
      maxTokens: 4096,
      temperature: 0.7, // Higher for creative image generation
      topP: 0.9,
      topK: 32
    }
  };

  let params = { ...baseParams[model] };

  // Override with agent-specific settings
  if (agent) {
    if (agent.temperature !== undefined) {
      params.temperature = agent.temperature;
    }
    if (agent.maxTokens !== undefined) {
      params.maxTokens = agent.maxTokens;
    }
  }

  // Adjust for specific task types
  if (taskType) {
    if (taskType === 'creative' || taskType === 'brainstorming') {
      params.temperature = Math.min(params.temperature + 0.2, 1.0);
    } else if (taskType === 'factual' || taskType === 'analysis') {
      params.temperature = Math.max(params.temperature - 0.2, 0.1);
    }
  }

  return params;
}
