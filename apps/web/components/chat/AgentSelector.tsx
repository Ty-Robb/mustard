'use client';

import React from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ChatAgent } from '@/types/chat';
import { Bot, Brain, BookOpen, Heart, Users, BarChart3 } from 'lucide-react';

interface AgentSelectorProps {
  agents: ChatAgent[];
  selectedAgentId?: string;
  onSelectAgent: (agentId: string) => void;
  disabled?: boolean;
}

const agentIcons: Record<string, React.ReactNode> = {
  'general-assistant': <Bot className="h-4 w-4" />,
  'essay-writer': <BookOpen className="h-4 w-4" />,
  'code-assistant': <Brain className="h-4 w-4" />,
  'creative-writer': <BookOpen className="h-4 w-4" />,
  'biblical-scholar': <BookOpen className="h-4 w-4" />,
  'theology-assistant': <Brain className="h-4 w-4" />,
  'devotional-guide': <Heart className="h-4 w-4" />,
  'bible-study-leader': <Users className="h-4 w-4" />,
  'visual-content-creator': <BarChart3 className="h-4 w-4" />,
  'data-visualization': <BarChart3 className="h-4 w-4" />,
};

const providerColors: Record<string, string> = {
  openai: 'bg-green-500/10 text-green-700 dark:text-green-400',
  anthropic: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
  google: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  'vertex-ai': 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
};

export function AgentSelector({
  agents,
  selectedAgentId,
  onSelectAgent,
  disabled = false,
}: AgentSelectorProps) {
  // Group agents by provider
  const groupedAgents = agents.reduce((acc, agent) => {
    const provider = agent.provider;
    if (!acc[provider]) {
      acc[provider] = [];
    }
    acc[provider].push(agent);
    return acc;
  }, {} as Record<string, ChatAgent[]>);

  const providerLabels: Record<string, string> = {
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    google: 'Google AI',
    'vertex-ai': 'Vertex AI (Biblical)',
  };

  return (
    <Select
      value={selectedAgentId}
      onValueChange={onSelectAgent}
      disabled={disabled}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select an AI agent">
          {selectedAgentId && (
            <div className="flex items-center gap-2">
              {agentIcons[selectedAgentId] || <Bot className="h-4 w-4" />}
              <span>
                {agents.find(a => a.id === selectedAgentId)?.name}
              </span>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(groupedAgents).map(([provider, providerAgents]) => (
          <SelectGroup key={provider}>
            <SelectLabel className="flex items-center gap-2">
              {providerLabels[provider] || provider}
              <Badge
                variant="secondary"
                className={providerColors[provider] || ''}
              >
                {providerAgents.length}
              </Badge>
            </SelectLabel>
            {providerAgents.map((agent) => (
              <SelectItem key={agent.id} value={agent.id}>
                <div className="flex items-start gap-2">
                  <div className="mt-0.5">
                    {agentIcons[agent.id] || <Bot className="h-4 w-4" />}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{agent.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {agent.description}
                    </div>
                    {agent.capabilities && agent.capabilities.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {agent.capabilities.slice(0, 3).map((cap) => (
                          <Badge
                            key={cap}
                            variant="outline"
                            className="text-xs px-1 py-0"
                          >
                            {cap}
                          </Badge>
                        ))}
                        {agent.capabilities.length > 3 && (
                          <Badge
                            variant="outline"
                            className="text-xs px-1 py-0"
                          >
                            +{agent.capabilities.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
