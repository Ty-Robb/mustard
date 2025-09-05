'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Sparkles, 
  Loader2, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Lightbulb,
  Maximize,
  Minimize,
  Move,
  Pin,
  PinOff,
  Settings,
  BookOpen,
  MessageSquare,
  Sliders,
  Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { AIAction } from './EditorSelectionToolbar';

export interface AIEditSuggestion {
  action: AIAction;
  original: string;
  suggestions: string[];
  explanation?: string;
}

interface EnhancedAIModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestion: AIEditSuggestion | null;
  onAccept: (text: string) => void;
  onReject: () => void;
  loading?: boolean;
  error?: string | null;
  editor?: any; // TipTap editor instance
  onAIAction?: (action: AIAction, text: string, customInstructions?: string) => void;
  selectedText?: string;
}

const BIBLE_TONES = [
  { value: 'devotional', label: 'Devotional', description: 'Personal and reflective' },
  { value: 'scholarly', label: 'Scholarly', description: 'Academic and analytical' },
  { value: 'pastoral', label: 'Pastoral', description: 'Caring and encouraging' },
  { value: 'evangelistic', label: 'Evangelistic', description: 'Outreach focused' },
  { value: 'teaching', label: 'Teaching', description: 'Educational and clear' },
];

const BIBLE_AUDIENCES = [
  { value: 'general', label: 'General Congregation' },
  { value: 'youth', label: 'Youth/Young Adults' },
  { value: 'children', label: 'Children' },
  { value: 'new-believers', label: 'New Believers' },
  { value: 'mature-believers', label: 'Mature Believers' },
  { value: 'seekers', label: 'Seekers/Non-believers' },
];

const TEMPLATE_PROMPTS = [
  { 
    id: 'sermon-outline',
    label: 'Sermon Outline',
    prompt: 'Create a sermon outline with introduction, main points, and application'
  },
  { 
    id: 'bible-study',
    label: 'Bible Study Guide',
    prompt: 'Format as a Bible study with observation, interpretation, and application questions'
  },
  { 
    id: 'devotional',
    label: 'Daily Devotional',
    prompt: 'Transform into a devotional with scripture, reflection, prayer, and practical application'
  },
  { 
    id: 'commentary',
    label: 'Biblical Commentary',
    prompt: 'Provide verse-by-verse commentary with historical context and theological insights'
  },
  { 
    id: 'cross-references',
    label: 'Add Cross-References',
    prompt: 'Include relevant Bible cross-references and supporting scriptures'
  },
];

export function EnhancedAIModal({
  isOpen,
  onClose,
  suggestion,
  onAccept,
  onReject,
  loading = false,
  error = null,
  editor,
  onAIAction,
  selectedText = '',
}: EnhancedAIModalProps) {
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const [showComparison, setShowComparison] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isPinned, setIsPinned] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);

  // AI Control States
  const [customInstructions, setCustomInstructions] = useState('');
  const [tone, setTone] = useState('devotional');
  const [audience, setAudience] = useState('general');
  const [lengthControl, setLengthControl] = useState('same');
  const [creativity, setCreativity] = useState([0.7]);
  const [includeReferences, setIncludeReferences] = useState(true);
  const [contextBackground, setContextBackground] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');

  useEffect(() => {
    if (suggestion) {
      setSelectedSuggestion(0);
    }
  }, [suggestion]);

  // Center modal on open
  useEffect(() => {
    if (isOpen && modalRef.current && !isPinned) {
      const rect = modalRef.current.getBoundingClientRect();
      setPosition({
        x: (window.innerWidth - rect.width) / 2,
        y: (window.innerHeight - rect.height) / 2,
      });
    }
  }, [isOpen, isPinned]);

  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isPinned) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || isPinned) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  const getActionTitle = (action: AIAction) => {
    const titles: Record<AIAction, string> = {
      enhance: 'Enhanced Version',
      expand: 'Expanded Content',
      summarize: 'Summarized Version',
      rephrase: 'Rephrased Content',
      ideas: 'Content Ideas',
    };
    return titles[action] || 'AI Suggestions';
  };

  const getActionDescription = (action: AIAction) => {
    const descriptions: Record<AIAction, string> = {
      enhance: 'Improved clarity, style, and fixed grammar',
      expand: 'Added more detail and context',
      summarize: 'Condensed to key points',
      rephrase: 'Alternative phrasing and tone',
      ideas: 'Suggestions for continuing or expanding',
    };
    return descriptions[action] || '';
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = TEMPLATE_PROMPTS.find(t => t.id === templateId);
    if (template) {
      setCustomInstructions(template.prompt);
      setSelectedTemplate(templateId);
    }
  };

  const buildCustomInstructions = () => {
    let instructions = customInstructions;
    
    // Add tone
    const selectedTone = BIBLE_TONES.find(t => t.value === tone);
    if (selectedTone) {
      instructions += `\nTone: ${selectedTone.label} - ${selectedTone.description}`;
    }
    
    // Add audience
    instructions += `\nTarget audience: ${BIBLE_AUDIENCES.find(a => a.value === audience)?.label}`;
    
    // Add length preference
    if (lengthControl !== 'same') {
      instructions += `\nLength: Make it ${lengthControl}`;
    }
    
    // Add Bible references preference
    if (includeReferences) {
      instructions += '\nInclude relevant Bible verse references';
    }
    
    // Add context if provided
    if (contextBackground) {
      instructions += `\nContext: ${contextBackground}`;
    }
    
    return instructions;
  };

  const AI_ACTIONS = [
    { action: 'enhance' as AIAction, icon: Sparkles, label: 'Enhance', description: 'Improve clarity & style' },
    { action: 'expand' as AIAction, icon: Maximize, label: 'Expand', description: 'Add more detail' },
    { action: 'summarize' as AIAction, icon: Minimize, label: 'Summarize', description: 'Make it concise' },
    { action: 'rephrase' as AIAction, icon: RefreshCw, label: 'Rephrase', description: 'Different tone/style' },
    { action: 'ideas' as AIAction, icon: Lightbulb, label: 'Ideas', description: 'Suggest continuations' },
  ];

  if (!isOpen) return null;

  return (
    <div className={cn(
      "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4",
      !isPinned && "pointer-events-none"
    )}>
      <div
        ref={modalRef}
        className={cn(
          "bg-background rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col pointer-events-auto",
          !isPinned && "absolute shadow-2xl",
          isDragging && "cursor-move"
        )}
        style={!isPinned ? { left: position.x, top: position.y } : {}}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-4 border-b cursor-move"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">AI Writing Assistant</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsPinned(!isPinned)}
              className="h-8 w-8"
              title={isPinned ? "Unpin modal" : "Pin modal"}
            >
              {isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <Tabs defaultValue="ai" className="flex-1 flex flex-col">
          <TabsList className="mx-4 mt-4">
            <TabsTrigger value="ai">AI Assistant</TabsTrigger>
            <TabsTrigger value="controls">AI Controls</TabsTrigger>
          </TabsList>

          {/* AI Assistant Tab */}
          <TabsContent value="ai" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full p-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground">Generating suggestions...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-destructive mb-4">{error}</p>
                  <Button onClick={onClose}>Close</Button>
                </div>
              ) : suggestion ? (
                <div className="space-y-4">
                  {/* Action Description */}
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      {getActionDescription(suggestion.action)}
                    </p>
                  </div>

                  {/* Comparison Toggle */}
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Review Changes</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowComparison(!showComparison)}
                    >
                      {showComparison ? (
                        <>
                          <EyeOff className="h-4 w-4 mr-2" />
                          Hide Original
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-2" />
                          Show Original
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Content Display */}
                  {showComparison ? (
                    <div className="grid grid-cols-2 gap-4">
                      {/* Original */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">Original</h4>
                          <Badge variant="secondary">Before</Badge>
                        </div>
                        <div className="bg-muted/30 p-4 rounded-lg">
                          <p className="text-sm whitespace-pre-wrap">{suggestion.original}</p>
                        </div>
                      </div>

                      {/* Suggestions */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">Suggested</h4>
                          <Badge variant="default">After</Badge>
                        </div>
                        {suggestion.suggestions.length > 1 ? (
                          <Tabs value={selectedSuggestion.toString()} onValueChange={(v) => setSelectedSuggestion(parseInt(v))}>
                            <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${suggestion.suggestions.length}, 1fr)` }}>
                              {suggestion.suggestions.map((_, index) => (
                                <TabsTrigger key={index} value={index.toString()}>
                                  Option {index + 1}
                                </TabsTrigger>
                              ))}
                            </TabsList>
                            {suggestion.suggestions.map((text, index) => (
                              <TabsContent key={index} value={index.toString()}>
                                <div className="bg-primary/10 p-4 rounded-lg relative">
                                  <p className="text-sm whitespace-pre-wrap">{text}</p>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCopy(text, index)}
                                    className="absolute top-2 right-2"
                                  >
                                    {copiedIndex === index ? (
                                      <Check className="h-4 w-4" />
                                    ) : (
                                      <Copy className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              </TabsContent>
                            ))}
                          </Tabs>
                        ) : (
                          <div className="bg-primary/10 p-4 rounded-lg relative">
                            <p className="text-sm whitespace-pre-wrap">{suggestion.suggestions[0]}</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopy(suggestion.suggestions[0], 0)}
                              className="absolute top-2 right-2"
                            >
                              {copiedIndex === 0 ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {suggestion.suggestions.length > 1 ? (
                        <Tabs value={selectedSuggestion.toString()} onValueChange={(v) => setSelectedSuggestion(parseInt(v))}>
                          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${suggestion.suggestions.length}, 1fr)` }}>
                            {suggestion.suggestions.map((_, index) => (
                              <TabsTrigger key={index} value={index.toString()}>
                                Option {index + 1}
                              </TabsTrigger>
                            ))}
                          </TabsList>
                          {suggestion.suggestions.map((text, index) => (
                            <TabsContent key={index} value={index.toString()}>
                              <div className="bg-primary/10 p-6 rounded-lg relative">
                                <p className="text-sm whitespace-pre-wrap leading-relaxed">{text}</p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCopy(text, index)}
                                  className="absolute top-2 right-2"
                                >
                                  {copiedIndex === index ? (
                                    <Check className="h-4 w-4" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </TabsContent>
                          ))}
                        </Tabs>
                      ) : (
                        <div className="bg-primary/10 p-6 rounded-lg relative">
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{suggestion.suggestions[0]}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopy(suggestion.suggestions[0], 0)}
                            className="absolute top-2 right-2"
                          >
                            {copiedIndex === 0 ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-muted-foreground text-center py-8">
                    Select text in your document and choose an AI action to get started.
                  </p>
                  
                  {/* Quick AI Actions */}
                  {selectedText && (
                    <div className="space-y-3">
                      <h3 className="font-semibold">Quick Actions</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {AI_ACTIONS.map((action) => {
                          const Icon = action.icon;
                          return (
                            <Button
                              key={action.action}
                              variant="outline"
                              onClick={() => {
                                const instructions = buildCustomInstructions();
                                onAIAction?.(action.action, selectedText, instructions);
                              }}
                              className="justify-start gap-2"
                            >
                              <Icon className="h-4 w-4" />
                              <div className="text-left">
                                <div className="font-medium">{action.label}</div>
                                <div className="text-xs text-muted-foreground">{action.description}</div>
                              </div>
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* AI Controls Tab */}
          <TabsContent value="controls" className="p-4 overflow-y-auto">
            <div className="space-y-6">
              {/* Custom Instructions */}
              <div className="space-y-2">
                <Label htmlFor="instructions" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Custom Instructions
                </Label>
                <Textarea
                  id="instructions"
                  placeholder="E.g., 'Make this suitable for a youth sermon with modern examples'"
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              {/* Template Prompts */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Quick Templates
                </Label>
                <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_PROMPTS.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Tone and Audience */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tone">Tone</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger id="tone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BIBLE_TONES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          <div>
                            <div className="font-medium">{t.label}</div>
                            <div className="text-xs text-muted-foreground">{t.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="audience">Target Audience</Label>
                  <Select value={audience} onValueChange={setAudience}>
                    <SelectTrigger id="audience">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BIBLE_AUDIENCES.map((a) => (
                        <SelectItem key={a.value} value={a.value}>
                          {a.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Length Control */}
              <div className="space-y-2">
                <Label htmlFor="length">Length Preference</Label>
                <Select value={lengthControl} onValueChange={setLengthControl}>
                  <SelectTrigger id="length">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shorter">Shorter</SelectItem>
                    <SelectItem value="same">Same Length</SelectItem>
                    <SelectItem value="longer">Longer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Advanced Options */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Sliders className="h-4 w-4" />
                  Advanced Options
                </h4>

                {/* Creativity Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="creativity">Creativity Level</Label>
                    <span className="text-sm text-muted-foreground">{creativity[0]}</span>
                  </div>
                  <Slider
                    id="creativity"
                    min={0}
                    max={1}
                    step={0.1}
                    value={creativity}
                    onValueChange={setCreativity}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Conservative</span>
                    <span>Creative</span>
                  </div>
                </div>

                {/* Include References */}
                <div className="flex items-center justify-between">
                  <Label htmlFor="references" className="cursor-pointer">
                    Include Bible References
                  </Label>
                  <Switch
                    id="references"
                    checked={includeReferences}
                    onCheckedChange={setIncludeReferences}
                  />
                </div>
              </div>

              <Separator />

              {/* Context/Background */}
              <div className="space-y-2">
                <Label htmlFor="context" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Context/Background (Optional)
                </Label>
                <Textarea
                  id="context"
                  placeholder="E.g., 'This is for a series on the Sermon on the Mount'"
                  value={contextBackground}
                  onChange={(e) => setContextBackground(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>

              {/* Save Settings Button */}
              <Button variant="outline" className="w-full" disabled>
                <Save className="h-4 w-4 mr-2" />
                Save as Default Settings
                <span className="text-xs text-muted-foreground ml-2">(Coming Soon)</span>
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="p-4 border-t">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Press <kbd className="px-2 py-1 text-xs border rounded">Esc</kbd> to close
            </p>
            {suggestion && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    onReject();
                    onClose();
                  }}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => {
                    if (suggestion) {
                      onAccept(suggestion.suggestions[selectedSuggestion]);
                      onClose();
                    }
                  }}
                  disabled={!suggestion}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Accept
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
