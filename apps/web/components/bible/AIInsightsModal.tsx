'use client';

import { useState, useEffect } from 'react';
import { X, Sparkles, BookOpen, Link, Lightbulb, Languages, Heart, Brain, Loader2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { AIInsight } from '../../app/api/insights/route';

interface AIInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedText: string;
  verseContext?: string;
  reference?: string;
  onGenerate: (text: string, context?: string, ref?: string) => Promise<AIInsight>;
}

export function AIInsightsModal({
  isOpen,
  onClose,
  selectedText,
  verseContext,
  reference,
  onGenerate,
}: AIInsightsModalProps) {
  const [insights, setInsights] = useState<AIInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && selectedText) {
      generateInsights();
    }
  }, [isOpen, selectedText]);

  const generateInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await onGenerate(selectedText, verseContext, reference);
      setInsights(result);
    } catch (err) {
      setError('Failed to generate insights. Please try again.');
      console.error('Error generating insights:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, section: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(section);
      setTimeout(() => setCopiedSection(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-semibold">AI Biblical Insights</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Generating insights...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={generateInsights}>Try Again</Button>
            </div>
          ) : insights ? (
            <div className="space-y-6">
              {/* Selected Text */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Selected Text:</p>
                <p className="font-medium italic">"{selectedText}"</p>
                {reference && (
                  <p className="text-sm text-muted-foreground mt-2">{reference}</p>
                )}
              </div>

              {/* Historical Context */}
              <InsightSection
                icon={<BookOpen className="h-5 w-5" />}
                title="Historical & Cultural Context"
                content={insights.historicalContext}
                onCopy={() => copyToClipboard(insights.historicalContext, 'historical')}
                copied={copiedSection === 'historical'}
              />

              {/* Cross References */}
              {insights.crossReferences.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-3">
                    <Link className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-lg">Cross References</h3>
                  </div>
                  <div className="space-y-2">
                    {insights.crossReferences.map((ref, index) => (
                      <div key={index} className="bg-muted/30 p-3 rounded-lg">
                        <p className="text-sm">{ref}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Themes */}
              {insights.keyThemes.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-lg">Key Themes</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {insights.keyThemes.map((theme, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                      >
                        {theme}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Original Language */}
              {insights.originalLanguage.insights && (
                <InsightSection
                  icon={<Languages className="h-5 w-5" />}
                  title="Original Language Insights"
                  content={insights.originalLanguage.insights}
                  onCopy={() => copyToClipboard(insights.originalLanguage.insights, 'language')}
                  copied={copiedSection === 'language'}
                  additionalContent={
                    <>
                      {insights.originalLanguage.hebrew && (
                        <p className="text-sm text-muted-foreground mt-2">
                          <strong>Hebrew:</strong> {insights.originalLanguage.hebrew}
                        </p>
                      )}
                      {insights.originalLanguage.greek && (
                        <p className="text-sm text-muted-foreground mt-2">
                          <strong>Greek:</strong> {insights.originalLanguage.greek}
                        </p>
                      )}
                    </>
                  }
                />
              )}

              {/* Practical Application */}
              <InsightSection
                icon={<Heart className="h-5 w-5" />}
                title="Practical Application"
                content={insights.practicalApplication}
                onCopy={() => copyToClipboard(insights.practicalApplication, 'practical')}
                copied={copiedSection === 'practical'}
              />

              {/* Theological Insights */}
              <InsightSection
                icon={<Brain className="h-5 w-5" />}
                title="Theological Insights"
                content={insights.theologicalInsights}
                onCopy={() => copyToClipboard(insights.theologicalInsights, 'theological')}
                copied={copiedSection === 'theological'}
              />
            </div>
          ) : null}
        </ScrollArea>

        {/* Footer */}
        <div className="p-6 border-t">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Press <kbd className="px-2 py-1 text-xs border rounded">Esc</kbd> to close
            </p>
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface InsightSectionProps {
  icon: React.ReactNode;
  title: string;
  content: string;
  onCopy: () => void;
  copied: boolean;
  additionalContent?: React.ReactNode;
}

function InsightSection({ icon, title, content, onCopy, copied, additionalContent }: InsightSectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-primary">{icon}</span>
          <h3 className="font-semibold text-lg">{title}</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCopy}
          className="text-muted-foreground hover:text-foreground"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-1" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-1" />
              Copy
            </>
          )}
        </Button>
      </div>
      <div className="bg-muted/30 p-4 rounded-lg">
        <p className="text-sm leading-relaxed">{content}</p>
        {additionalContent}
      </div>
    </div>
  );
}
