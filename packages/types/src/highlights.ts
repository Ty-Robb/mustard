import { ObjectId } from 'mongodb';

export interface Highlight {
  _id?: ObjectId;
  reference: string;           // Bible reference (e.g., "ROM.12.1-2")
  text: string;               // The highlighted text
  type: 'manual' | 'ai' | 'search' | 'shared';
  color?: string;             // For manual highlights (hex color)
  note?: string;              // User's note
  aiContext?: {               // For AI-generated highlights
    sessionId: string;
    messageId: string;
    action: string;           // 'analyze', 'context', 'explore', etc.
  };
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateHighlightInput {
  reference: string;
  text: string;
  type: 'manual' | 'ai' | 'search' | 'shared';
  color?: string;
  note?: string;
  aiContext?: {
    sessionId: string;
    messageId: string;
    action: string;
  };
  tags?: string[];
}

export interface UpdateHighlightInput {
  note?: string;
  tags?: string[];
  color?: string;
}
