// Chat-related type definitions

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    model?: string;
    provider?: string;
    agentId?: string;
    tokens?: number;
    attachments?: ChatAttachment[];
    suggestions?: {
      followUpQuestions?: string[];
      actionChoices?: {
        label: string;
        action: string;
      }[];
      relatedTopics?: string[];
    };
    biblicalReferences?: {
      verse: string;
      text: string;
      relevance: string;
    }[];
    // Presentation-specific metadata
    isPresentation?: boolean;
    presentationTitle?: string;
  };
}

export interface ChatAttachment {
  id: string;
  type: 'image' | 'document' | 'code' | 'chart' | 'table';
  name: string;
  url?: string;
  content?: string;
  mimeType?: string;
  size?: number;
  data?: ChartData | TableData;
  config?: ChartConfig | TableConfig;
}

export interface ChartData {
  labels?: string[];
  datasets?: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
    fill?: boolean;
    tension?: number;
  }>;
  // For pie/doughnut charts
  values?: Array<{
    name: string;
    value: number;
    color?: string;
  }>;
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'area' | 'scatter' | 'radar';
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  showLegend?: boolean;
  showGrid?: boolean;
  stacked?: boolean;
  aspectRatio?: number;
  colors?: string[];
}

export interface TableData {
  headers: string[];
  rows: Array<Array<string | number | boolean>>;
  footer?: Array<string | number>;
}

export interface TableConfig {
  title?: string;
  sortable?: boolean;
  filterable?: boolean;
  pagination?: boolean;
  pageSize?: number;
  striped?: boolean;
  bordered?: boolean;
  hoverable?: boolean;
  dense?: boolean;
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    model?: string;
    provider?: string;
    agentId?: string;
    tags?: string[];
    summary?: string;
  };
  // LMS Context - when chat is initiated from LMS
  lmsContext?: {
    courseId: string;
    courseTitle: string;
    moduleId: string;
    moduleTitle: string;
    stepId: string;
    stepTitle: string;
    stepType: 'lesson' | 'quiz' | 'assignment' | 'discussion' | 'presentation';
    agentId: string;
    initialPrompt?: string;
    expectedOutcome?: string;
    resources?: Array<{
      id: string;
      title: string;
      type: string;
      url?: string;
    }>;
    startTime: Date;
    returnUrl?: string;
  };
}

export interface ChatAgent {
  id: string;
  name: string;
  description: string;
  provider: 'openai' | 'anthropic' | 'google' | 'vertex-ai';
  model?: string;
  systemPrompt?: string;
  capabilities?: string[];
  icon?: string;
}

export interface ChatProvider {
  id: string;
  name: string;
  models: ChatModel[];
}

export interface ChatModel {
  id: string;
  name: string;
  description?: string;
  contextWindow?: number;
  maxTokens?: number;
  supportsFunctions?: boolean;
  supportsVision?: boolean;
}

export interface ChatCompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stream?: boolean;
  functions?: ChatFunction[];
  functionCall?: 'auto' | 'none' | { name: string };
}

export interface ChatFunction {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export interface ChatStreamResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string;
      function_call?: {
        name?: string;
        arguments?: string;
      };
    };
    finish_reason?: string;
  }>;
}

export interface EssayMetadata {
  title?: string;
  type?: 'argumentative' | 'expository' | 'narrative' | 'descriptive' | 'persuasive';
  subject?: string;
  wordCount?: number;
  outline?: string[];
  thesis?: string;
  audience?: string;
  tone?: string;
  citations?: string[];
}

export interface ChatError {
  code: string;
  message: string;
  details?: any;
}

export interface ChatUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost?: number;
}
