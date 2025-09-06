/**
 * Multi-Agent Orchestration System Types
 */

import { ObjectId } from 'mongodb';

// Model Selection Types
export type ModelName = 'gemini-2.5-pro' | 'gemini-2.5-flash' | 'gemini-2.5-flash-lite' | 'gemini-2.5-flash-image-preview';
export type TaskComplexity = 'simple' | 'moderate' | 'complex';
export type QualityRequirement = 'basic' | 'standard' | 'premium';
export type SpeedPriority = 'low' | 'medium' | 'high';
export type CostSensitivity = 'low' | 'medium' | 'high';

// Agent Types
export type AgentCategory = 
  | 'orchestrator'
  | 'research'
  | 'content'
  | 'visual'
  | 'domain'
  | 'quality';

export interface Agent {
  id: string;
  name: string;
  description: string;
  category: AgentCategory;
  modelName: ModelName;
  responsibilities: string[];
  capabilities?: string[];
  maxTokens?: number;
  temperature?: number;
}

// Orchestration Request/Response Types
export interface OrchestrationRequest {
  task: string;
  deliverableType?: DeliverableType;
  preferences?: UserPreferences;
  context?: any;
  userId: string;
  sessionId?: string;
}

export interface UserPreferences {
  qualityLevel?: QualityRequirement;
  speedPriority?: SpeedPriority;
  costSensitivity?: CostSensitivity;
  includeImages?: boolean;
  targetAudience?: string;
  tone?: string;
  length?: 'short' | 'medium' | 'long';
  disableGrounding?: boolean;
}

export type DeliverableType = 
  | 'presentation'
  | 'essay'
  | 'article'
  | 'sermon'
  | 'course'
  | 'general';

// Task Analysis Types
export interface TaskAnalysis {
  deliverableType: DeliverableType;
  requiredCapabilities: string[];
  estimatedComplexity: TaskComplexity;
  suggestedWorkflow: string;
  estimatedAgents: number;
  requiresImageGeneration: boolean;
  metadata: Record<string, any>;
}

// Execution Plan Types
export interface ExecutionPlan {
  planId: string;
  phases: ExecutionPhase[];
  estimatedDuration: number;
  estimatedCost: number;
  totalAgents: number;
}

export interface ExecutionPhase {
  phaseId: string;
  phaseName: string;
  parallel: boolean;
  tasks: AgentTask[];
  dependencies?: string[];
}

export interface AgentTask {
  taskId: string;
  agentId: string;
  task: string;
  model: ModelName;
  dependencies?: string[];
  maxRetries?: number;
  timeout?: number;
  priority?: number;
  context?: any;
}

// Agent Communication Types
export interface AgentHandoff {
  fromAgent: string;
  toAgent: string;
  taskId: string;
  context: {
    previousWork: any;
    requirements: string[];
    constraints: string[];
    metadata: Record<string, any>;
  };
  timestamp: Date;
}

export interface AgentResponse {
  agentId: string;
  taskId: string;
  success: boolean;
  output: any;
  error?: string;
  nextAgents?: string[];
  metadata: Record<string, any>;
  tokensUsed: number;
  executionTime: number;
}

// Orchestration Result Types
export interface OrchestrationResult {
  success: boolean;
  sessionId: string;
  deliverable: any;
  deliverableType: DeliverableType;
  agentTrace: AgentExecution[];
  cost: CostBreakdown;
  duration: number;
  metadata?: Record<string, any>;
}

export interface AgentExecution {
  executionId: string;
  agentId: string;
  agentName: string;
  model: ModelName;
  phase: string;
  input: any;
  output: any;
  success: boolean;
  error?: string;
  tokensUsed: number;
  executionTime: number;
  cost: number;
  timestamp: Date;
  metadata?: {
    sources?: string[];
    confidence?: number;
    toolsUsed?: string[];
  };
}

export interface CostBreakdown {
  total: number;
  byAgent: Record<string, number>;
  byModel: Record<ModelName, number>;
  byPhase: Record<string, number>;
}

// Model Selection Types
export interface ModelSelectionCriteria {
  taskComplexity: TaskComplexity;
  qualityRequirement: QualityRequirement;
  speedPriority: SpeedPriority;
  needsImageGeneration: boolean;
  costSensitivity: CostSensitivity;
}

// Workflow Types
export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  deliverableType: DeliverableType;
  phases: WorkflowPhase[];
  estimatedDuration: number;
  typicalCost: number;
}

export interface WorkflowPhase {
  phaseName: string;
  parallel: boolean;
  agents: WorkflowAgent[];
  repeat?: number;
}

export interface WorkflowAgent {
  agentId: string;
  taskTemplate: string;
  requiredContext?: string[];
}

// Database Schema Types
export interface OrchestrationSession {
  _id?: ObjectId;
  userId: string;
  sessionId: string;
  request: OrchestrationRequest;
  analysis: TaskAnalysis;
  plan: ExecutionPlan;
  status: 'planning' | 'executing' | 'completed' | 'failed';
  agentExecutions: AgentExecution[];
  result?: OrchestrationResult;
  cost: CostBreakdown;
  createdAt: Date;
  updatedAt: Date;
}

// Cost Monitoring Types
export interface CostMonitor {
  dailyLimit: number;
  monthlyLimit: number;
  alertThresholds: number[];
  currentDaily: number;
  currentMonthly: number;
  costByAgent: Record<string, number>;
  costByModel: Record<ModelName, number>;
}

// Agent Registry Types
export interface AgentRegistry {
  agents: Map<string, Agent>;
  agentsByCategory: Map<AgentCategory, Agent[]>;
  agentsByCapability: Map<string, Agent[]>;
}

// Error Types
export class OrchestrationError extends Error {
  constructor(
    message: string,
    public code: string,
    public agentId?: string,
    public taskId?: string,
    public phase?: string
  ) {
    super(message);
    this.name = 'OrchestrationError';
  }
}

// Feature Flags
export interface OrchestrationFeatureFlags {
  ORCHESTRATION_ENABLED: boolean;
  IMAGE_GENERATION_ENABLED: boolean;
  SMART_MODEL_SELECTION: boolean;
  WORKFLOW_TEMPLATES: boolean;
  PARALLEL_EXECUTION: boolean;
  COST_MONITORING: boolean;
  QUALITY_CONTROL: boolean;
}

// Agent Status Types
export interface AgentStatus {
  agentId: string;
  available: boolean;
  currentTasks: number;
  averageResponseTime: number;
  successRate: number;
  lastError?: string;
  lastActive: Date;
}

// Quality Control Types
export interface QualityCheckResult {
  passed: boolean;
  score: number;
  issues: QualityIssue[];
  suggestions: string[];
}

export interface QualityIssue {
  type: 'grammar' | 'style' | 'accuracy' | 'completeness' | 'formatting';
  severity: 'low' | 'medium' | 'high';
  description: string;
  location?: string;
}
