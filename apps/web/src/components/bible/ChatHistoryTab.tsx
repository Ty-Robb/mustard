'use client';

import { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Calendar, MessageSquare, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import type { ChatSession } from '@/types/chat';

interface ChatHistoryTabProps {
  onSessionSelect: (sessionId: string) => void;
}

export function ChatHistoryTab({ onSessionSelect }: ChatHistoryTabProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<ChatSession[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  const formatRelativeTime = (date: Date | string) => {
    const d = new Date(date);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return d.toLocaleDateString();
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadSessions();
    }
  }, [currentUser]);

  const loadSessions = async () => {
    if (!currentUser) return;

    setIsLoading(true);
    setError(null);

    try {
      const token = await currentUser.getIdToken();
      
      // Load all sessions without any filtering
      const response = await fetch('/api/chat/sessions', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
        setFilteredSessions(data.sessions || []);
      } else {
        throw new Error('Failed to load chat history');
      }
    } catch (err) {
      console.error('Error loading sessions:', err);
      setError('Failed to load chat history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    
    if (!term.trim()) {
      setFilteredSessions(sessions);
      return;
    }

    const filtered = sessions.filter(session => 
      session.title.toLowerCase().includes(term.toLowerCase()) ||
      session.messages.some(msg => msg.content.toLowerCase().includes(term.toLowerCase()))
    );
    
    setFilteredSessions(filtered);
  };

  const groupSessionsByDate = (sessions: ChatSession[]) => {
    const groups: Record<string, ChatSession[]> = {
      'Today': [],
      'Yesterday': [],
      'This Week': [],
      'This Month': [],
      'Older': []
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    sessions.forEach(session => {
      const sessionDate = new Date(session.createdAt);
      
      if (sessionDate >= today) {
        groups['Today'].push(session);
      } else if (sessionDate >= yesterday) {
        groups['Yesterday'].push(session);
      } else if (sessionDate >= weekAgo) {
        groups['This Week'].push(session);
      } else if (sessionDate >= monthAgo) {
        groups['This Month'].push(session);
      } else {
        groups['Older'].push(session);
      }
    });

    return groups;
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="space-y-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p className="text-sm">{error}</p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={loadSessions}
          className="mt-2"
        >
          Try Again
        </Button>
      </div>
    );
  }

  const groupedSessions = groupSessionsByDate(filteredSessions);

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search conversations..."
            className="pl-9 pr-9"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
              onClick={() => handleSearch('')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Sessions List */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {filteredSessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="text-sm">
                {searchTerm ? 'No conversations found' : 'No chat history yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedSessions).map(([group, sessions]) => {
                if (sessions.length === 0) return null;
                
                return (
                  <div key={group}>
                    <h3 className="text-xs font-medium text-muted-foreground mb-2">
                      {group}
                    </h3>
                    <div className="space-y-2">
                      {sessions.map((session) => (
                        <Card
                          key={session.id}
                          className="p-3 cursor-pointer hover:bg-accent transition-colors"
                          onClick={() => onSessionSelect(session.id)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {session.title}
                              </p>
                              {session.messages.length > 0 && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {session.messages[0].content}
                                </p>
                              )}
                              {session.metadata?.tags && session.metadata.tags.length > 0 && (
                                <div className="flex gap-1 mt-2">
                                  {session.metadata.tags.slice(0, 3).map((tag, i) => (
                                    <span
                                      key={i}
                                      className="text-xs bg-muted px-2 py-0.5 rounded-full"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {formatRelativeTime(session.createdAt)}
                              </span>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
