"use client"

import { useState, useCallback, useEffect } from "react"
import { BibleReader } from "@/components/bible/BibleReader"
import { useBible } from "@/contexts/BibleContext"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { ExpandableFAB } from "@/components/bible/ExpandableFAB"
import { SplitScreenLayout } from "@/components/SplitScreenLayout"
import { AIInsightsPanel } from "@/components/bible/AIInsightsPanel"
import { PanelProvider, usePanel } from "@/contexts/PanelContext"
import { useAuth } from "@/hooks/useAuth"
import { useTheme } from "@/contexts/ThemeContext"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { AIInsight } from "../../api/insights/route"
import type { Highlight } from "@/types/highlights"
import { useSearchParams } from 'next/navigation'
import { Card, CardContent } from "@/components/ui/card"
import { BookOpenCheck, ArrowLeft } from "lucide-react"
import Link from "next/link"

function BibleReaderContent() {
  const {
    selectedBible,
    books,
    selectedBook,
    selectedChapter,
    setSelectedChapter,
    setSelectedBook,
    chapterContent,
    loading,
    error,
    setVerseRange,
  } = useBible()

  const { currentUser } = useAuth()
  const { isLeftPanelCollapsed, toggleLeftPanel } = usePanel()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [highlights, setHighlights] = useState<Highlight[]>([])
  const [highlightsLoading, setHighlightsLoading] = useState(false)
  
  // Ensure resolvedTheme is properly typed for components
  const editorTheme = resolvedTheme as 'light' | 'dark' | 'sepia'
  
  // Reading plan context from URL params
  const searchParams = useSearchParams()
  const planId = searchParams.get('planId')
  const passagesParam = searchParams.get('passages')
  const dayParam = searchParams.get('day')
  const readingPlanPassages = passagesParam ? passagesParam.split(',') : null
  const [currentPassageIndex, setCurrentPassageIndex] = useState(0)
  
  // Reading preferences state
  const [fontSize, setFontSize] = useState(18)
  const [lineSpacing, setLineSpacing] = useState(1.75)
  const [focusMode, setFocusMode] = useState(false)
  
  const currentBook = books.find(b => b.id === selectedBook)

  // Parse verse range from URL params and update BibleContext
  useEffect(() => {
    const startVerse = searchParams.get('startVerse');
    const endVerse = searchParams.get('endVerse');

    if (startVerse && endVerse) {
      const range = { start: parseInt(startVerse), end: parseInt(endVerse) };
      console.log('Setting verse range from URL params:', range);
      setVerseRange(range);
    } else {
      setVerseRange(undefined);
    }
  }, [searchParams, setVerseRange]);

  // Parse and set the current passage when in reading plan mode
  useEffect(() => {
    if (readingPlanPassages && readingPlanPassages.length > 0 && books.length > 0) {
      const currentPassage = readingPlanPassages[currentPassageIndex];
      console.log('=== Reading Plan Navigation Debug ===');
      console.log('Current passage:', currentPassage);
      console.log('Current passage index:', currentPassageIndex);
      console.log('Available books:', books.map(b => ({ id: b.id, name: b.name })));
      
      // Parse passage reference - handle various formats:
      // "Genesis 1" (single chapter)
      // "Genesis 1-3" (chapter range)
      // "John 1:1-5" (verse range)
      // "John 3:16" (single verse)
      const match = currentPassage.match(/^((?:\d\s)?[A-Za-z]+)\s+(\d+)(?:[:.-](\d+))?(?:-(\d+))?(?::(\d+))?$/);
      if (match) {
        const [, bookName, chapter, startVerse, endChapterOrVerse, endVerse] = match;
        console.log('Parsed:', { bookName, chapter, startVerse, endChapterOrVerse, endVerse });
        
        // Find the book by name (handle abbreviations and exact matches)
        const book = books.find(b => {
          const nameMatch = b.name.toLowerCase() === bookName.toLowerCase() ||
                          b.id.toLowerCase() === bookName.toLowerCase() ||
                          b.name.toLowerCase().startsWith(bookName.toLowerCase()) ||
                          // Handle special cases like "Psalm" vs "Psalms"
                          (bookName.toLowerCase() === 'psalm' && b.name.toLowerCase() === 'psalms') ||
                          (bookName.toLowerCase() === 'psalms' && b.name.toLowerCase() === 'psalm');
          
          if (nameMatch) {
            console.log(`Book match found: ${b.name} (${b.id}) matches ${bookName}`);
          }
          return nameMatch;
        });
        
        if (book) {
          console.log(`Setting book: ${book.id}, chapter: ${chapter}`);
          setSelectedBook(book.id);
          setSelectedChapter(parseInt(chapter));
        } else {
          console.error(`No book found for: ${bookName}`);
          console.log('Available book names:', books.map(b => b.name));
        }
      } else {
        console.error(`Failed to parse passage: ${currentPassage}`);
      }
    }
  }, [readingPlanPassages, books, setSelectedBook, setSelectedChapter, currentPassageIndex]);

  // Load highlights when chapter changes
  useEffect(() => {
    const loadHighlights = async () => {
      if (!currentUser || !selectedBook || !selectedChapter) return

      setHighlightsLoading(true)
      try {
        const token = await currentUser.getIdToken()
        
        // Try multiple reference formats to find highlights
        const references = [
          `${selectedBook}.${selectedChapter}`,  // e.g., "1JN.1"
          `${currentBook?.name || selectedBook} ${selectedChapter}`,  // e.g., "1 John 1"
        ];
        
        console.log('Loading highlights for references:', references);
        
        let allHighlights: Highlight[] = [];
        
        // Try each reference format
        for (const ref of references) {
          const response = await fetch(`/api/highlights?reference=${encodeURIComponent(ref)}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          })

          if (response.ok) {
            const data = await response.json()
            if (data.highlights && data.highlights.length > 0) {
              console.log(`Found ${data.highlights.length} highlights for reference: ${ref}`);
              allHighlights = [...allHighlights, ...data.highlights];
            }
          }
        }
        
        // Also get all highlights and filter client-side for partial matches
        const allResponse = await fetch(`/api/highlights`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
        
        if (allResponse.ok) {
          const allData = await allResponse.json()
          const chapterHighlights = allData.highlights?.filter((h: Highlight) => {
            // Check if the highlight reference contains the current book and chapter
            const refLower = h.reference.toLowerCase();
            const bookMatch = refLower.includes(selectedBook.toLowerCase()) || 
                             refLower.includes(currentBook?.name?.toLowerCase() || '');
            const chapterMatch = refLower.includes(`.${selectedChapter}`) || 
                               refLower.includes(` ${selectedChapter}`);
            return bookMatch && chapterMatch;
          }) || [];
          
          console.log(`Found ${chapterHighlights.length} additional highlights by filtering`);
          
          // Merge and deduplicate
          const highlightIds = new Set(allHighlights.map(h => h._id));
          chapterHighlights.forEach((h: Highlight) => {
            if (!highlightIds.has(h._id)) {
              allHighlights.push(h);
            }
          });
        }
        
        console.log('Total highlights loaded:', allHighlights.length);
        console.log('Highlights:', allHighlights);
        setHighlights(allHighlights)
      } catch (error) {
        console.error('Failed to load highlights:', error)
      } finally {
        setHighlightsLoading(false)
      }
    }

    loadHighlights()
  }, [currentUser, selectedBook, selectedChapter, currentBook])

  const handlePreviousChapter = () => {
    if (readingPlanPassages) {
      // In reading plan mode, navigate through passages
      if (currentPassageIndex > 0) {
        setCurrentPassageIndex(currentPassageIndex - 1);
        const passage = readingPlanPassages[currentPassageIndex - 1];
        navigateToPassage(passage);
      }
    } else {
      // Normal navigation
      if (selectedChapter > 1) {
        setSelectedChapter(selectedChapter - 1)
      } else {
        // Go to previous book's last chapter
        const currentBookIndex = books.findIndex(b => b.id === selectedBook)
        if (currentBookIndex > 0) {
          const previousBook = books[currentBookIndex - 1]
          setSelectedBook(previousBook.id)
          setSelectedChapter(previousBook.chapters?.length || 1)
        }
      }
    }
  }

  const handleNextChapter = () => {
    if (readingPlanPassages) {
      // In reading plan mode, navigate through passages
      if (currentPassageIndex < readingPlanPassages.length - 1) {
        setCurrentPassageIndex(currentPassageIndex + 1);
        const passage = readingPlanPassages[currentPassageIndex + 1];
        navigateToPassage(passage);
      }
    } else {
      // Normal navigation
      const currentBook = books.find(b => b.id === selectedBook)
      if (!currentBook) return

      if (selectedChapter < (currentBook.chapters?.length || 0)) {
        setSelectedChapter(selectedChapter + 1)
      } else {
        // Go to next book's first chapter
        const currentBookIndex = books.findIndex(b => b.id === selectedBook)
        if (currentBookIndex < books.length - 1) {
          const nextBook = books[currentBookIndex + 1]
          setSelectedBook(nextBook.id)
          setSelectedChapter(1)
        }
      }
    }
  }

  const navigateToPassage = (passage: string) => {
    console.log('navigateToPassage called with:', passage);
    // Handle various passage formats:
    // "Genesis 1" (single chapter)
    // "Genesis 1-3" (chapter range)
    // "John 1:1-5" (verse range)
    // "John 3:16" (single verse)
    const match = passage.match(/^((?:\d\s)?[A-Za-z]+)\s+(\d+)(?:[:.-](\d+))?(?:-(\d+))?(?::(\d+))?$/);
    if (match) {
      const [, bookName, chapter, startVerse, endChapterOrVerse, endVerse] = match;
      
      const book = books.find(b => 
        b.name.toLowerCase() === bookName.toLowerCase() ||
        b.id.toLowerCase() === bookName.toLowerCase() ||
        b.name.toLowerCase().startsWith(bookName.toLowerCase()) ||
        // Handle special cases
        (bookName.toLowerCase() === 'psalm' && b.name.toLowerCase() === 'psalms') ||
        (bookName.toLowerCase() === 'psalms' && b.name.toLowerCase() === 'psalm')
      );
      
      if (book) {
        console.log(`navigateToPassage: Setting book ${book.id}, chapter ${chapter}`);
        setSelectedBook(book.id);
        setSelectedChapter(parseInt(chapter));
      } else {
        console.error(`navigateToPassage: No book found for ${bookName}`);
      }
    } else {
      console.error(`navigateToPassage: Failed to parse ${passage}`);
    }
  }

  const chapterCount = currentBook?.chapters?.length || 0
  const canGoPrevious = readingPlanPassages 
    ? currentPassageIndex > 0
    : selectedChapter > 1 || books.findIndex(b => b.id === selectedBook) > 0
  const canGoNext = readingPlanPassages
    ? currentPassageIndex < readingPlanPassages.length - 1
    : currentBook ? selectedChapter < chapterCount || books.findIndex(b => b.id === selectedBook) < books.length - 1 : false

  // AI Insights state
  const [selectedText, setSelectedText] = useState('')
  const [verseContext, setVerseContext] = useState<string | undefined>()
  const [reference, setReference] = useState<string | undefined>()
  const [actionType, setActionType] = useState<string | undefined>()
  const [actionPrompt, setActionPrompt] = useState<string | undefined>()
  const [aiPanelTab, setAiPanelTab] = useState<string>('chat')

  const generateAIInsights = useCallback(async (
    text: string,
    context?: string,
    ref?: string,
    action?: string
  ): Promise<AIInsight> => {
    console.log('generateAIInsights called with:', { text, context, ref, action })
    
    if (!currentUser) {
      throw new Error('You must be logged in to use AI insights')
    }

    const token = await currentUser.getIdToken()
    const response = await fetch('/api/insights', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        selectedText: text,
        verseContext: context,
        reference: ref,
        actionType: action,
      }),
    })

    console.log('API response status:', response.status)

    if (!response.ok) {
      const error = await response.json()
      console.error('API error response:', error)
      throw new Error(error.error || 'Failed to generate insights')
    }

    const data = await response.json()
    console.log('API response data:', data)
    return data
  }, [currentUser])

  // Handle highlight creation
  const handleHighlight = useCallback(async (verseId: string, color: string, selectedText: string) => {
    console.log('=== handleHighlight called in page.tsx ===')
    console.log('Parameters:', { verseId, color, selectedText })
    
    if (!currentUser) {
      console.error('User not authenticated')
      return
    }

    if (!selectedText) {
      console.error('No text selected')
      return
    }

    try {
      const token = await currentUser.getIdToken()
      console.log('Got auth token, sending to API...')

      const highlightData = {
        reference: verseId,
        text: selectedText,
        type: 'manual' as const,
        color: color,
        note: '',
        tags: ['manual-highlight'],
      }
      console.log('Highlight data to send:', highlightData)

      const response = await fetch('/api/highlights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(highlightData),
      })

      console.log('API response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        // Add the new highlight to the local state
        setHighlights(prev => [...prev, data.highlight])
        console.log('✅ Highlight saved successfully:', data.highlight)
      } else {
        const error = await response.json()
        console.error('❌ Failed to save highlight:', error)
      }
    } catch (error) {
      console.error('❌ Error saving highlight:', error)
    }
  }, [currentUser])

  const leftPanel = (
    <AIInsightsPanel
      selectedText={selectedText}
      verseContext={verseContext}
      reference={reference || `${currentBook?.name || ""} ${selectedChapter}`}
      actionType={actionType}
      actionPrompt={actionPrompt}
      onGenerate={generateAIInsights}
      activeTab={aiPanelTab}
      onTabChange={setAiPanelTab}
    />
  )

  const rightPanel = (
    <div className="relative h-full flex flex-col">
      {/* Reading Plan Header */}
      {readingPlanPassages && (
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href={`/library/plans/${planId}`}>
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Plan
              </Button>
            </Link>
            
            <div className="flex-1 flex justify-center">
              <div className="flex items-center gap-2">
                <BookOpenCheck className="h-5 w-5 text-primary" />
                <div className="text-center">
                  <h3 className="font-semibold">Day {dayParam || '1'} Reading</h3>
                  <p className="text-sm text-muted-foreground">
                    {currentPassageIndex + 1} of {readingPlanPassages.length}: {readingPlanPassages[currentPassageIndex]}
                  </p>
                </div>
              </div>
            </div>
            
            {readingPlanPassages.length > 1 ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousChapter}
                  disabled={!canGoPrevious}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  {currentPassageIndex + 1} / {readingPlanPassages.length}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextChapter}
                  disabled={!canGoNext}
                >
                  Next
                </Button>
              </div>
            ) : (
              <div className="w-[200px]"></div> // Spacer to keep center alignment
            )}
          </div>
        </div>
      )}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pb-24">
        {loading || highlightsLoading ? (
          <div className="space-y-4 max-w-4xl mx-auto">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500">{error}</p>
          </div>
        ) : chapterContent ? (
          <div className="max-w-4xl mx-auto">
            <BibleReader
              chapter={chapterContent}
              bookName={currentBook?.name || ""}
              highlights={highlights}
              onHighlight={handleHighlight}
              fontSize={fontSize}
              lineSpacing={lineSpacing}
              theme={editorTheme}
              focusMode={focusMode}
              onAIInsights={(text: string, context?: string, ref?: string, action?: string) => {
                setSelectedText(text)
                setVerseContext(context)
                setReference(ref || `${currentBook?.name || ""} ${selectedChapter}`)
                setActionType(action)
                
                // Set action-specific prompts
                const actionPrompts: Record<string, string> = {
                  'biography': `Tell me about ${text} - their life, character, and significance in the Bible.`,
                  'timeline': `Create a timeline of events related to ${text}.`,
                  'word-study': `Perform a detailed word study on "${text}".`,
                  'location': `Tell me about the location ${text} - its geography and Biblical significance.`,
                  'practical-application': `How can I apply "${text}" to my life today?`,
                  'cross-references': `Find cross-references for "${text}".`,
                  'commentary': `Provide commentary on "${text}".`,
                  'theology': `Explain the theological significance of "${text}".`,
                  'number-significance': `What is the Biblical significance of ${text}?`,
                  'related-verses': `Find verses related to ${text}.`,
                  'summarize': `Summarize the key points of this passage: "${text}".`,
                }
                
                setActionPrompt(actionPrompts[action || ''] || `Provide insights on: "${text}"`)
              }}
            />
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Select a book and chapter to start reading</p>
          </div>
        )}
      </div>
      
    </div>
  )

  return (
    <div className="h-full relative">
      <SplitScreenLayout
        leftPanel={leftPanel}
        rightPanel={rightPanel}
        defaultState="right"
      />
      
      {/* Expandable FAB */}
      {chapterContent && (
        <ExpandableFAB
          // Chapter navigation
          onPreviousChapter={handlePreviousChapter}
          onNextChapter={handleNextChapter}
          canGoPrevious={canGoPrevious}
          canGoNext={canGoNext}
          
          // Panel controls
          isLeftPanelCollapsed={isLeftPanelCollapsed}
          toggleLeftPanel={toggleLeftPanel}
          onViewHighlights={() => setAiPanelTab('highlights')}
          onViewChatHistory={() => setAiPanelTab('history')}
          
          // Reading preferences
          fontSize={fontSize}
          onFontSizeChange={setFontSize}
          lineSpacing={lineSpacing}
          onLineSpacingChange={setLineSpacing}
          theme={editorTheme}
          onThemeChange={(newTheme) => setTheme(newTheme)}
          onFocusMode={() => setFocusMode(!focusMode)}
        />
      )}
    </div>
  )
}

export default function BibleReaderPage() {
  return (
    <PanelProvider>
      <BibleReaderContent />
    </PanelProvider>
  )
}
