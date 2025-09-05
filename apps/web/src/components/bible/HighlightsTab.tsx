'use client';

import { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Highlighter, Search, Share2, Calendar, MessageSquare } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import type { Highlight } from '@/types/highlights';

interface HighlightsTabProps {
  currentReference?: string;
  onHighlightClick?: (highlight: Highlight) => void;
}

export function HighlightsTab({ currentReference, onHighlightClick }: HighlightsTabProps) {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser && currentReference) {
      loadHighlights();
    }
  }, [currentUser, currentReference]);

  const debugHighlights = async () => {
    if (!currentUser) return;
    
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch('/api/debug-highlights', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 DEBUG HIGHLIGHTS:', data);
        alert(`Debug Info:\n\nTotal highlights: ${data.totalHighlights}\nManual highlights: ${data.manualHighlights}\nGenesis highlights: ${data.genesisHighlights}\n\nCheck console for full details.`);
      }
    } catch (error) {
      console.error('Debug failed:', error);
    }
  };

  const loadHighlights = async () => {
    if (!currentUser || !currentReference) return;

    setIsLoading(true);
    setError(null);

    try {
      const token = await currentUser.getIdToken();
      
      console.log('HighlightsTab: Current user ID:', currentUser.uid);
      console.log('HighlightsTab: Loading highlights for reference:', currentReference);
      
      // Encode the reference for URL
      const encodedReference = encodeURIComponent(currentReference);
      
      const response = await fetch(`/api/highlights?reference=${encodedReference}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('HighlightsTab: Received highlights:', data.highlights);
        console.log('HighlightsTab: Total highlights:', data.highlights?.length || 0);
        console.log('HighlightsTab: Highlight types:', data.highlights?.map((h: Highlight) => ({ type: h.type, ref: h.reference })));
        setHighlights(data.highlights || []);
      } else {
        const errorText = await response.text();
        console.error('HighlightsTab: API error:', response.status, errorText);
        throw new Error('Failed to load highlights');
      }
    } catch (err) {
      console.error('Error loading highlights:', err);
      setError('Failed to load highlights');
    } finally {
      setIsLoading(false);
    }
  };

  const getHighlightIcon = (type: Highlight['type']) => {
    switch (type) {
      case 'ai':
        return <Sparkles className="h-3 w-3" />;
      case 'manual':
        return <Highlighter className="h-3 w-3" />;
      case 'search':
        return <Search className="h-3 w-3" />;
      case 'shared':
        return <Share2 className="h-3 w-3" />;
      default:
        return <Highlighter className="h-3 w-3" />;
    }
  };

  const getHighlightTypeLabel = (type: Highlight['type']) => {
    switch (type) {
      case 'ai':
        return 'AI Insight';
      case 'manual':
        return 'Manual';
      case 'search':
        return 'Search Result';
      case 'shared':
        return 'Shared';
      default:
        return type;
    }
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    const now = new Date();
    const diffInHours = (now.getTime() - d.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) { // 7 days
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return d.toLocaleDateString();
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
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
          onClick={loadHighlights}
          className="mt-2"
        >
          Try Again
        </Button>
      </div>
    );
  }

  const aiHighlights = highlights.filter(h => h.type === 'ai');
  const otherHighlights = highlights.filter(h => h.type !== 'ai');

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        {highlights.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Highlighter className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-sm">No highlights for this passage yet</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={debugHighlights}
              className="mt-4"
            >
              Debug Highlights
            </Button>
          </div>
        ) : (
          <>
            {/* AI Insights Section */}
            {aiHighlights.length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Sparkles className="h-3 w-3" />
                  AI Insights ({aiHighlights.length})
                </h3>
                <div className="space-y-2">
                  {aiHighlights.map((highlight) => (
                    <Card
                      key={highlight._id?.toString()}
                      className="p-3 cursor-pointer hover:bg-accent transition-colors border-primary/20"
                      onClick={() => onHighlightClick?.(highlight)}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium line-clamp-2">
                            {highlight.text}
                          </p>
                          <Badge variant="secondary" className="flex items-center gap-1 shrink-0">
                            {getHighlightIcon(highlight.type)}
                            <span className="text-xs">{highlight.aiContext?.action || 'insight'}</span>
                          </Badge>
                        </div>
                        
                        {highlight.note && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {highlight.note}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(highlight.createdAt)}</span>
                          </div>
                          {highlight.aiContext?.sessionId && (
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              <span>View conversation</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Other Highlights Section */}
            {otherHighlights.length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Highlighter className="h-3 w-3" />
                  Other Highlights ({otherHighlights.length})
                </h3>
                <div className="space-y-2">
                  {otherHighlights.map((highlight) => (
                    <Card
                      key={highlight._id?.toString()}
                      className="p-3 cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => onHighlightClick?.(highlight)}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium line-clamp-2">
                            {highlight.text}
                          </p>
                          <Badge variant="outline" className="flex items-center gap-1 shrink-0">
                            {getHighlightIcon(highlight.type)}
                            <span className="text-xs">{getHighlightTypeLabel(highlight.type)}</span>
                          </Badge>
                        </div>
                        
                        {highlight.note && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {highlight.note}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(highlight.createdAt)}</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </ScrollArea>
  );
}
