# AI Chat Implementation Guide

## Overview

This document outlines the implementation of a comprehensive AI chat interface that supports both general AI models (GPT-4, Claude) for essay writing and specialized Vertex AI agents. The chat page will provide a unified interface similar to Vercel's AI chatbot but integrated with our existing design system.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Features](#features)
3. [Technical Stack](#technical-stack)
4. [Implementation Plan](#implementation-plan)
5. [UI Components](#ui-components)
6. [API Design](#api-design)
7. [Database Schema](#database-schema)
8. [Agent Configuration](#agent-configuration)
9. [Essay Writing Features](#essay-writing-features)
10. [Security & Rate Limiting](#security--rate-limiting)

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Chat Interface                        │
├─────────────────────────┬───────────────────────────────────┤
│   General AI Provider   │        Vertex AI Agents          │
├─────────────────────────┼───────────────────────────────────┤
│  • GPT-4 (OpenAI)      │  • Bible Study Agent             │
│  • Claude (Anthropic)   │  • Research Agent                │
│  • Gemini (Google)      │  • Writing Coach Agent           │
│                         │  • Custom Domain Agents          │
└─────────────────────────┴───────────────────────────────────┘
```

## Features

### Core Features
- **Multi-Provider Support**: Switch between different AI providers and agents
- **Streaming Responses**: Real-time response streaming using Vercel AI SDK
- **Chat Persistence**: Save and resume conversations
- **Context Management**: Maintain context across messages and agent switches
- **Export Functionality**: Export chats as markdown, PDF, or Word documents

### Essay Writing Features
- Essay type templates (argumentative, narrative, expository, descriptive)
- Outline generation and structure assistance
- Citation management (APA, MLA, Chicago styles)
- Grammar and style checking
- Word count tracking
- Paragraph improvement suggestions
- Thesis statement generator

### Vertex AI Agent Features
- Agent selection interface
- Agent-specific prompts and capabilities
- Context switching between agents
- Agent memory and conversation threading

## Technical Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **UI Library**: Shadcn/ui components
- **Streaming**: Vercel AI SDK
- **State Management**: React Context + Zustand
- **Styling**: Tailwind CSS

### Backend
- **API Routes**: Next.js API routes
- **AI Providers**:
  - OpenAI API (GPT-4)
  - Anthropic API (Claude)
  - Google Vertex AI
  - Google Gemini API
- **Database**: MongoDB for chat persistence
- **Authentication**: Firebase Auth (existing)

## Implementation Plan

### Phase 1: Core Chat Interface
1. Create base chat UI components
2. Implement message streaming
3. Add chat persistence
4. Integrate with existing auth

### Phase 2: Multi-Provider Support
1. Abstract AI provider interface
2. Implement provider switching
3. Add Vertex AI agent integration
4. Create agent selection UI

### Phase 3: Essay Writing Features
1. Add essay templates
2. Implement outline generator
3. Add citation tools
4. Create export functionality

### Phase 4: Advanced Features
1. Implement smart routing
2. Add conversation threading
3. Create agent memory system
4. Add collaborative features

## UI Components

### 1. Chat Container Component

```typescript
// src/components/chat/ChatContainer.tsx
interface ChatContainerProps {
  initialMessages?: Message[]
  agentId?: string
  mode?: 'general' | 'essay' | 'agent'
}

export function ChatContainer({ 
  initialMessages = [], 
  agentId,
  mode = 'general' 
}: ChatContainerProps) {
  // Implementation
}
```

### 2. Message Component

```typescript
// src/components/chat/Message.tsx
interface MessageProps {
  message: {
    id: string
    role: 'user' | 'assistant' | 'system'
    content: string
    timestamp: Date
    agentId?: string
    metadata?: Record<string, any>
  }
  isStreaming?: boolean
}
```

### 3. Agent Selector Component

```typescript
// src/components/chat/AgentSelector.tsx
interface Agent {
  id: string
  name: string
  description: string
  capabilities: string[]
  icon?: string
  provider: 'openai' | 'anthropic' | 'vertex' | 'gemini'
}
```

### 4. Essay Toolbar Component

```typescript
// src/components/chat/EssayToolbar.tsx
interface EssayToolbarProps {
  onTemplateSelect: (template: EssayTemplate) => void
  onOutlineGenerate: () => void
  onCitationAdd: () => void
  onExport: (format: 'md' | 'pdf' | 'docx') => void
  wordCount: number
}
```

## API Design

### 1. Chat Completion API

```typescript
// src/app/api/chat/route.ts
export async function POST(req: Request) {
  const { messages, provider, agentId, mode } = await req.json()
  
  // Route to appropriate provider
  switch (provider) {
    case 'openai':
      return handleOpenAI(messages)
    case 'anthropic':
      return handleAnthropic(messages)
    case 'vertex':
      return handleVertexAI(messages, agentId)
    case 'gemini':
      return handleGemini(messages)
  }
}
```

### 2. Agent Management API

```typescript
// src/app/api/agents/route.ts
export async function GET() {
  // Return available agents
}

export async function POST(req: Request) {
  // Create custom agent
}
```

### 3. Chat Persistence API

```typescript
// src/app/api/chats/route.ts
export async function GET() {
  // Get user's chat history
}

export async function POST(req: Request) {
  // Save new chat
}

export async function PUT(req: Request) {
  // Update existing chat
}
```

## Database Schema

### Chat Collection

```typescript
interface Chat {
  _id: ObjectId
  userId: string
  title: string
  messages: Message[]
  agentId?: string
  provider: string
  mode: 'general' | 'essay' | 'agent'
  metadata: {
    essayType?: string
    wordCount?: number
    citations?: Citation[]
  }
  createdAt: Date
  updatedAt: Date
}
```

### Message Schema

```typescript
interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  agentId?: string
  provider?: string
  metadata?: {
    model?: string
    tokens?: number
    finishReason?: string
  }
}
```

### Agent Configuration

```typescript
interface AgentConfig {
  _id: ObjectId
  agentId: string
  name: string
  description: string
  systemPrompt: string
  capabilities: string[]
  provider: 'vertex' | 'custom'
  modelConfig: {
    model: string
    temperature?: number
    maxTokens?: number
  }
  metadata: Record<string, any>
}
```

## Essay Writing Features

### 1. Essay Templates

```typescript
const essayTemplates = {
  argumentative: {
    name: 'Argumentative Essay',
    structure: ['Introduction', 'Thesis', 'Body Arguments', 'Counter-arguments', 'Conclusion'],
    prompts: [
      'What is your main argument?',
      'What evidence supports your position?',
      'What are potential counter-arguments?'
    ]
  },
  narrative: {
    name: 'Narrative Essay',
    structure: ['Introduction', 'Setting', 'Characters', 'Plot', 'Climax', 'Resolution'],
    prompts: [
      'What story are you telling?',
      'Who are the main characters?',
      'What is the central conflict?'
    ]
  },
  // ... more templates
}
```

### 2. Citation Management

```typescript
interface Citation {
  id: string
  type: 'book' | 'article' | 'website' | 'journal'
  authors: string[]
  title: string
  year: number
  publisher?: string
  url?: string
  accessDate?: Date
  style: 'apa' | 'mla' | 'chicago'
}
```

### 3. Essay Analysis Tools

```typescript
interface EssayAnalysis {
  wordCount: number
  sentenceCount: number
  paragraphCount: number
  readabilityScore: number
  gradeLevel: number
  suggestions: {
    grammar: Suggestion[]
    style: Suggestion[]
    structure: Suggestion[]
  }
}
```

## Security & Rate Limiting

### 1. Authentication
- All chat endpoints require authenticated users
- User ID from Firebase Auth token
- Agent access based on user subscription level

### 2. Rate Limiting
```typescript
const rateLimits = {
  free: {
    messagesPerDay: 50,
    tokensPerDay: 10000,
    agents: ['general', 'essay']
  },
  premium: {
    messagesPerDay: 500,
    tokensPerDay: 100000,
    agents: ['all']
  }
}
```

### 3. Content Filtering
- Implement content moderation for user inputs
- Filter inappropriate content
- Academic integrity checks for essays

## Example Implementation

### Chat Page Component

```typescript
// src/app/(protected)/chat/page.tsx
'use client'

import { useState } from 'react'
import { ChatContainer } from '@/components/chat/ChatContainer'
import { AgentSelector } from '@/components/chat/AgentSelector'
import { EssayToolbar } from '@/components/chat/EssayToolbar'
import { useChat } from '@/hooks/useChat'

export default function ChatPage() {
  const [mode, setMode] = useState<'general' | 'essay' | 'agent'>('general')
  const [selectedAgent, setSelectedAgent] = useState<string>()
  const { messages, sendMessage, isLoading } = useChat()

  return (
    <div className="flex h-screen">
      <aside className="w-64 border-r">
        <AgentSelector 
          onSelect={setSelectedAgent}
          onModeChange={setMode}
        />
      </aside>
      
      <main className="flex-1 flex flex-col">
        {mode === 'essay' && (
          <EssayToolbar 
            onTemplateSelect={handleTemplateSelect}
            onExport={handleExport}
            wordCount={calculateWordCount(messages)}
          />
        )}
        
        <ChatContainer
          messages={messages}
          onSendMessage={sendMessage}
          isLoading={isLoading}
          mode={mode}
          agentId={selectedAgent}
        />
      </main>
    </div>
  )
}
```

## Next Steps

1. **Set up Vercel AI SDK**
   ```bash
   npm install ai openai @anthropic-ai/sdk
   ```

2. **Create base chat components**
   - Message component with markdown support
   - Input component with file attachments
   - Streaming indicator

3. **Implement provider abstraction**
   - Create unified interface for all AI providers
   - Handle provider-specific configurations

4. **Add Vertex AI integration**
   - Set up Google Cloud credentials
   - Implement Vertex AI client
   - Create agent management system

5. **Build essay writing tools**
   - Template selector
   - Outline generator
   - Citation manager
   - Export functionality

## Conclusion

This AI chat implementation provides a powerful, flexible system for both general AI interactions and specialized agent-based conversations. The modular architecture allows for easy extension and the addition of new providers or features as needed.
