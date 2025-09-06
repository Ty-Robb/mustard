/**
 * Presentation Types - Type definitions for the multi-agent presentation system
 */

import { ObjectId } from 'mongodb';

/**
 * Request to create a presentation from chat content
 */
export interface PresentationRequest {
  sessionId: string;
  topic: string;
  chatHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  userId?: string;
}

/**
 * Narrative structure following hero's journey principles
 */
export interface NarrativeStructure {
  currentReality: string;
  visionOfPossibility: string;
  contrastPoints: string[];
  callToAction: string;
  futureState: string;
}

/**
 * Memorable moment types
 */
export type MemorableMomentType = 'visual' | 'story' | 'demo' | 'quote';

/**
 * Memorable moment in presentation
 */
export interface MemorableMoment {
  slideId: string;
  type: MemorableMomentType;
  description: string;
}

/**
 * Presentation metadata
 */
export interface PresentationMetadata {
  audienceCurrentState: string;
  transformationVision: string;
  memorableMoments: MemorableMoment[];
  narrativeStructure: NarrativeStructure;
}

/**
 * Speaker notes with delivery guidance
 */
export interface SpeakerNotes {
  script: string;
  deliveryCues: string[];
  timing: string;
  transitions: {
    in: string;
    out: string;
  };
  engagement: string[];
  emphasis: string[];
}

/**
 * Slide layout types
 */
export type SlideLayout = 
  | 'title'
  | 'content'
  | 'fullContent'
  | 'two-column'
  | 'twoColumn'
  | 'twoColumnReverse'
  | 'threeColumn'
  | 'image-left'
  | 'image-right'
  | 'full-image'
  | 'mediaFocus'
  | 'quote'
  | 'comparison'
  | 'timeline'
  | 'call-to-action'
  | 'splitHorizontal'
  | 'sidebar'
  | 'blank';

/**
 * Visual element types
 */
export interface VisualElement {
  type: 'image' | 'icon' | 'chart' | 'diagram';
  content: string;
  position?: 'center' | 'left' | 'right' | 'background';
  size?: 'small' | 'medium' | 'large' | 'full';
}

/**
 * Slide content
 */
export interface SlideContent {
  title?: string;
  subtitle?: string;
  body?: string;
  bulletPoints?: string[];
  quote?: {
    text: string;
    author?: string;
  };
  data?: any; // For charts/tables
  columns?: Array<{
    width: number;
    content: string;
  }>;
  images?: Array<{
    id: string;
    url: string;
    alt?: string;
    caption?: string;
  }>;
  charts?: Array<{
    data: any;
    config: any;
  }>;
  tables?: Array<{
    data: any;
    config?: any;
  }>;
}

/**
 * Individual slide
 */
export interface Slide {
  id: string;
  order: number;
  layout: SlideLayout;
  content: SlideContent;
  speakerNotes: SpeakerNotes;
  visualElements: VisualElement[];
}

/**
 * Complete presentation document
 */
export interface Presentation {
  _id?: ObjectId;
  sessionId: ObjectId;
  userId: string;
  title: string;
  coreMessage: string;
  presentationMetadata: PresentationMetadata;
  slides: Slide[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Presentation creation result
 */
export interface PresentationCreationResult {
  success: boolean;
  presentation?: Presentation;
  error?: string;
}

/**
 * Agent collaboration step
 */
export interface AgentCollaborationStep {
  agentId: string;
  input: any;
  output: any;
  timestamp: Date;
}

/**
 * Presentation workflow state
 */
export interface PresentationWorkflowState {
  requestId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  currentStep: string;
  steps: AgentCollaborationStep[];
  presentation?: Presentation;
  error?: string;
}
