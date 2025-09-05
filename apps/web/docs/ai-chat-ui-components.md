# AI Chat UI Components Guide

## Overview

This document provides detailed implementation guidance for the AI chat UI components, ensuring they integrate seamlessly with the existing Shadcn/ui design system and follow the established patterns in the application.

## Component Structure

```
src/components/chat/
├── ChatContainer.tsx       # Main chat container
├── ChatMessage.tsx         # Individual message component
├── ChatInput.tsx           # Message input with actions
├── ChatSidebar.tsx         # Agent/mode selector sidebar
├── AgentSelector.tsx       # Agent selection component
├── EssayToolbar.tsx        # Essay-specific toolbar
├── ChatHeader.tsx          # Chat header with actions
├── MessageActions.tsx      # Copy, edit, regenerate actions
├── StreamingIndicator.tsx  # Loading/streaming indicator
└── hooks/
    ├── useChat.ts          # Main chat hook
    ├── useAgents.ts        # Agent management hook
    └── useEssayTools.ts    # Essay-specific tools
```

## Detailed Component Implementations

### 1. ChatContainer Component

```tsx
// src/components/chat/ChatContainer.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { ChatHeader } from './ChatHeader'
import { StreamingIndicator } from './StreamingIndicator'
import { useChat } from './hooks/useChat'
import { cn } from '@/lib/utils'

interface ChatContainerProps {
  chatId?: string
  agentId?: string
  mode?: 'general' | 'essay' | 'agent'
  className?: string
}

export function ChatContainer({ 
  chatId,
  agentId,
  mode = 'general',
  className 
}: ChatContainerProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const { 
    messages, 
    isLoading, 
    sendMessage, 
    regenerateMessage,
    editMessage,
    deleteMessage 
  } = useChat({ chatId, agentId, mode })

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <ChatHeader 
        mode={mode}
        agentId={agentId}
        messageCount={messages.length}
      />
      
      <ScrollArea className="flex-1 px-4">
        <div className="max-w-4xl mx-auto py-8 space-y-6">
          {messages.map((message, index) => (
            <ChatMessage
              key={message.id}
              message={message}
              isLast={index === messages.length - 1}
              onEdit={editMessage}
              onRegenerate={regenerateMessage}
              onDelete={deleteMessage}
            />
          ))}
          
          {isLoading && <StreamingIndicator />}
          
          <div ref={scrollRef} />
        </div>
      </ScrollArea>
      
      <ChatInput 
        onSend={sendMessage}
        disabled={isLoading}
        mode={mode}
      />
    </div>
  )
}
```

### 2. ChatMessage Component

```tsx
// src/components/chat/ChatMessage.tsx
'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { 
  Copy, 
  Edit2, 
  RefreshCw, 
  Trash2, 
  Check,
  User,
  Bot
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { MessageActions } from './MessageActions'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface ChatMessageProps {
  message: {
    id: string
    role: 'user' | 'assistant' | 'system'
    content: string
    timestamp: Date
    agentId?: string
    isStreaming?: boolean
  }
  isLast: boolean
  onEdit?: (id: string, content: string) => void
  onRegenerate?: (id: string) => void
  onDelete?: (id: string) => void
}

export function ChatMessage({ 
  message, 
  isLast,
  onEdit,
  onRegenerate,
  onDelete 
}: ChatMessageProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content)
  const isUser = message.role === 'user'

  const handleSaveEdit = () => {
    onEdit?.(message.id, editContent)
    setIsEditing(false)
  }

  return (
    <div className={cn(
      "flex gap-3",
      isUser ? "flex-row-reverse" : "flex-row"
    )}>
      <Avatar className="h-8 w-8">
        {isUser ? (
          <>
            <AvatarImage src="/user-avatar.png" />
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </>
        ) : (
          <>
            <AvatarImage src="/ai-avatar.png" />
            <AvatarFallback>
              <Bot className="h-4 w-4" />
            </AvatarFallback>
          </>
        )}
      </Avatar>

      <div className={cn(
        "flex-1 space-y-2",
        isUser ? "items-end" : "items-start"
      )}>
        <Card className={cn(
          "p-4 max-w-[80%]",
          isUser 
            ? "bg-primary text-primary-foreground ml-auto" 
            : "bg-muted"
        )}>
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full min-h-[100px] p-2 bg-background rounded"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveEdit}>
                  Save
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown
                components={{
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '')
                    return !inline && match ? (
                      <SyntaxHighlighter
                        style={oneDark}
                        language={match[1]}
                        PreTag="div"
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    )
                  }
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </Card>

        {!isEditing && (
          <MessageActions
            messageId={message.id}
            isUser={isUser}
            isLast={isLast}
            onEdit={() => setIsEditing(true)}
            onRegenerate={() => onRegenerate?.(message.id)}
            onDelete={() => onDelete?.(message.id)}
            content={message.content}
          />
        )}
      </div>
    </div>
  )
}
```

### 3. ChatInput Component

```tsx
// src/components/chat/ChatInput.tsx
'use client'

import { useState, useRef, KeyboardEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { 
  Send, 
  Paperclip, 
  Mic, 
  StopCircle,
  FileText,
  Image as ImageIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface ChatInputProps {
  onSend: (message: string, attachments?: File[]) => void
  disabled?: boolean
  mode?: 'general' | 'essay' | 'agent'
  placeholder?: string
  className?: string
}

export function ChatInput({ 
  onSend, 
  disabled,
  mode = 'general',
  placeholder = "Type your message...",
  className 
}: ChatInputProps) {
  const [message, setMessage] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSend = () => {
    if (message.trim() || attachments.length > 0) {
      onSend(message, attachments)
      setMessage('')
      setAttachments([])
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setAttachments(prev => [...prev, ...files])
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className={cn("border-t p-4", className)}>
      <div className="max-w-4xl mx-auto space-y-2">
        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {attachments.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-3 py-1 bg-muted rounded-md"
              >
                {file.type.startsWith('image/') ? (
                  <ImageIcon className="h-4 w-4" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                <span className="text-sm truncate max-w-[200px]">
                  {file.name}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeAttachment(index)}
                  className="h-4 w-4 p-0"
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              className="min-h-[60px] max-h-[200px] pr-12 resize-none"
              rows={1}
            />
            
            {/* Character count for essay mode */}
            {mode === 'essay' && message.length > 0 && (
              <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                {message.length} chars
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled}
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Attach files</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setIsRecording(!isRecording)}
                    disabled={disabled}
                  >
                    {isRecording ? (
                      <StopCircle className="h-4 w-4 text-red-500" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isRecording ? 'Stop recording' : 'Voice input'}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    onClick={handleSend}
                    disabled={disabled || (!message.trim() && attachments.length === 0)}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Send message</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*,.pdf,.doc,.docx,.txt"
        />

        {/* Mode-specific hints */}
        {mode === 'essay' && (
          <p className="text-xs text-muted-foreground">
            Tip: Use /outline to generate an essay outline, /cite to add citations
          </p>
        )}
      </div>
    </div>
  )
}
```

### 4. Agent Selector Component

```tsx
// src/components/chat/AgentSelector.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Bot, 
  PenTool, 
  Search,
  Sparkles,
  BookOpen,
  Code,
  Briefcase
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Agent {
  id: string
  name: string
  description: string
  capabilities: string[]
  icon: React.ReactNode
  provider: 'openai' | 'anthropic' | 'vertex' | 'gemini'
  category: 'general' | 'writing' | 'research' | 'specialized'
}

const agents: Agent[] = [
  {
    id: 'general-assistant',
    name: 'General Assistant',
    description: 'Helpful AI for general questions and tasks',
    capabilities: ['General Q&A', 'Problem solving', 'Creative tasks'],
    icon: <Bot className="h-5 w-5" />,
    provider: 'openai',
    category: 'general'
  },
  {
    id: 'essay-writer',
    name: 'Essay Writer',
    description: 'Specialized in academic and creative writing',
    capabilities: ['Essay structure', 'Citations', 'Grammar check'],
    icon: <PenTool className="h-5 w-5" />,
    provider: 'anthropic',
    category: 'writing'
  },
  {
    id: 'bible-study',
    name: 'Bible Study Assistant',
    description: 'Expert in biblical interpretation and study',
    capabilities: ['Verse analysis', 'Historical context', 'Cross-references'],
    icon: <BookOpen className="h-5 w-5" />,
    provider: 'vertex',
    category: 'specialized'
  },
  {
    id: 'research-assistant',
    name: 'Research Assistant',
    description: 'Helps with research and fact-checking',
    capabilities: ['Source finding', 'Fact verification', 'Summaries'],
    icon: <Search className="h-5 w-5" />,
    provider: 'gemini',
    category: 'research'
  }
]

interface AgentSelectorProps {
  selectedAgentId?: string
  onSelect: (agentId: string) => void
  onModeChange: (mode: 'general' | 'essay' | 'agent') => void
  className?: string
}

export function AgentSelector({ 
  selectedAgentId,
  onSelect,
  onModeChange,
  className 
}: AgentSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         agent.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || agent.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleAgentSelect = (agent: Agent) => {
    onSelect(agent.id)
    
    // Set appropriate mode based on agent
    if (agent.id === 'essay-writer') {
      onModeChange('essay')
    } else if (agent.category === 'specialized') {
      onModeChange('agent')
    } else {
      onModeChange('general')
    }
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="p-4 space-y-4">
        <h2 className="text-lg font-semibold">AI Assistants</h2>
        
        <Input
          placeholder="Search assistants..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="writing">Writing</TabsTrigger>
            <TabsTrigger value="specialized">Special</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <ScrollArea className="flex-1 px-4">
        <div className="space-y-2 pb-4">
          {filteredAgents.map((agent) => (
            <Card
              key={agent.id}
              className={cn(
                "cursor-pointer transition-colors hover:bg-accent",
                selectedAgentId === agent.id && "border-primary"
              )}
              onClick={() => handleAgentSelect(agent)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {agent.icon}
                    <CardTitle className="text-sm">{agent.name}</CardTitle>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {agent.provider}
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  {agent.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-1">
                  {agent.capabilities.map((capability, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {capability}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <Button className="w-full" variant="outline">
          <Sparkles className="h-4 w-4 mr-2" />
          Create Custom Agent
        </Button>
      </div>
    </div>
  )
}
```

### 5. Essay Toolbar Component

```tsx
// src/components/chat/EssayToolbar.tsx
'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  FileText,
  Download,
  BookOpen,
  Quote,
  Target,
  BarChart3,
  ChevronDown
} from 'lucide-react'

interface EssayToolbarProps {
  wordCount: number
  targetWordCount?: number
  onTemplateSelect: (template: string) => void
  onOutlineGenerate: () => void
  onCitationAdd: () => void
  onExport: (format: 'md' | 'pdf' | 'docx') => void
  onAnalyze: () => void
}

const essayTemplates = [
  { id: 'argumentative', name: 'Argumentative Essay', icon: '💭' },
  { id: 'narrative', name: 'Narrative Essay', icon: '📖' },
  { id: 'expository', name: 'Expository Essay', icon: '📊' },
  { id: 'descriptive', name: 'Descriptive Essay', icon: '🎨' },
  { id: 'compare-contrast', name: 'Compare & Contrast', icon: '⚖️' },
  { id: 'cause-effect', name: 'Cause & Effect', icon: '🔄' },
]

export function EssayToolbar({
  wordCount,
  targetWordCount = 1000,
  onTemplateSelect,
  onOutlineGenerate,
  onCitationAdd,
  onExport,
  onAnalyze
}: EssayToolbarProps) {
  const progress = (wordCount / targetWordCount) * 100

  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left side - Essay tools */}
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Templates
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Essay Templates</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {essayTemplates.map((template) => (
                  <DropdownMenuItem
                    key={template.id}
                    onClick={() => onTemplateSelect(template.id)}
                  >
                    <span className="mr-2">{template.icon}</span>
                    {template.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              size="sm"
              onClick={onOutlineGenerate}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Outline
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onCitationAdd}
            >
              <Quote className="h-4 w-4 mr-2" />
              Citations
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onAnalyze}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Analyze
            </Button>
          </div>

          {/* Center - Word count progress */}
          <div className="flex-1 max-w-xs">
            <div className="flex items-center gap-2 text-sm">
              <Target className="h-4 w-4 text-muted-foreground" />
              <Progress value={progress} className="flex-1" />
              <span className="text-muted-foreground whitespace-nowrap">
                {wordCount} / {targetWordCount}
              </span>
            </div>
          </div>

          {/* Right side - Export */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onExport('md')}>
                Markdown (.md)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport('pdf')}>
                PDF Document
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport('docx')}>
                Word Document (.docx)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
```

### 6. Chat Hook Implementation

```tsx
// src/components/chat/hooks/useChat.ts
import { useState, useCallback, useEffect } from 'react'
import { useChat as useVercelChat } from 'ai/react'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'

interface UseChatOptions {
  chatId?: string
  agentId?: string
  mode?: 'general' | 'essay' | 'agent'
}

export function useChat({ chatId, agentId, mode = 'general' }: UseChatOptions = {}) {
  const { user } = useAuth()
  const [savedChatId, setSavedChatId] = useState(chatId)

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    reload,
    stop,
    append,
    setMessages
  } = useVercelChat({
    api: '/api/chat',
    body: {
      agentId,
      mode,
      chatId: savedChatId,
      userId: user?.uid
    },
    onError: (error) => {
      toast.error('Failed to send message')
      console.error('Chat error:', error)
    },
    onFinish: async (message) => {
      // Save chat after each message
      if (!savedChatId && messages.length > 0) {
        try {
          const response = await fetch('/api/chats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: [...messages, message],
              agentId,
              mode
            })
          })
          const { chatId: newChatId } = await response.json()
          setSavedChatId(newChatId)
        } catch (error) {
          console.error('Failed to save chat:', error)
        }
      }
    }
  })

  // Load existing chat
  useEffect(() => {
    if (chatId) {
      loadChat(chatId)
    }
  }, [chatId])

  const loadChat = async (id: string) => {
    try {
      const response = await fetch(`/api/chats/${id}`)
      const chat = await response.json()
      setMessages(chat.messages)
    } catch (error) {
      toast.error('Failed to load chat')
      console.error('Load chat error:', error)
    }
  }

  const sendMessage = useCallback(async (content: string, attachments?: File[]) => {
    // Handle attachments if provided
    if (attachments && attachments.length > 0) {
      // Upload attachments and get URLs
      const uploadedUrls = await uploadAttachments(attachments)
      content = `${content}\n\nAttachments: ${uploadedUrls.join(', ')}`
    }

    append({
      role: 'user',
      content
    })
  }, [append])

  const regenerateMessage = useCallback(async (messageId: string) => {
    const messageIndex = messages.findIndex(m => m.id === messageId)
    if (messageIndex === -1) return

    // Remove messages from this point forward
    const newMessages = messages.slice(0, messageIndex)
    setMessages(newMessages)

    // Regenerate from the last user message
    const lastUserMessage = newMessages.findLast(m => m.role === 'user')
    if (lastUserMessage) {
      append(lastUserMessage)
    }
  }, [messages, setMessages, append])

  const editMessage = useCallback(async (messageId: string, newContent: string) => {
    const messageIndex = messages.findIndex(m => m.id === messageId)
    if (messageIndex === -1) return

    const updatedMessages = [...messages]
    updatedMessages[messageIndex] = {
      ...updatedMessages[messageIndex],
      content: newContent
    }
    setMessages(updatedMessages)

    // If editing a user message, regenerate the response
    if (messages[messageIndex].role === 'user') {
      regenerateMessage(messageId)
    }
  }, [messages, setMessages, regenerateMessage])

  const deleteMessage = useCallback((messageId: string) => {
    setMessages(messages.filter(m => m.id !== messageId))
  }, [messages, setMessages])

  return {
    messages,
    input,
