"use client"

import { ChevronRight, PanelLeftOpen, PanelLeftClose } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { BibleBook } from "@/types/bible"
import { MAIN_BIBLE_VERSIONS } from "@/config/bible-versions"

interface BibleHeaderNavigationProps {
  selectedBible: string
  onBibleChange: (bibleId: string) => void
  books: BibleBook[]
  selectedBook: string
  onBookChange: (bookId: string) => void
  selectedChapter: number
  onChapterChange: (chapter: number) => void
  loading?: boolean
  isLeftPanelCollapsed?: boolean
  toggleLeftPanel?: () => void
}

export function BibleHeaderNavigation({
  selectedBible,
  onBibleChange,
  books,
  selectedBook,
  onBookChange,
  selectedChapter,
  onChapterChange,
  loading = false,
  isLeftPanelCollapsed,
  toggleLeftPanel,
}: BibleHeaderNavigationProps) {
  const currentBook = books.find(b => b.id === selectedBook)
  const currentBibleVersion = MAIN_BIBLE_VERSIONS.find(v => v.id === selectedBible)

  return (
    <div className="flex items-center gap-1 text-sm">
      <span className="font-medium">Bible:</span>
      
      {/* Bible Version Selector */}
      <Select value={selectedBible} onValueChange={onBibleChange} disabled={loading}>
        <SelectTrigger className="h-8 w-auto border-0 px-2 hover:bg-accent">
          <SelectValue>
            {currentBibleVersion?.abbreviation || "Select Version"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {MAIN_BIBLE_VERSIONS.map((version) => (
            <SelectItem key={version.id} value={version.id}>
              {version.abbreviation} - {version.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <ChevronRight className="h-4 w-4 text-muted-foreground" />

      {/* Book Selector */}
      <Select value={selectedBook} onValueChange={onBookChange} disabled={loading || books.length === 0}>
        <SelectTrigger className="h-8 w-auto border-0 px-2 hover:bg-accent">
          <SelectValue placeholder="Select Book">
            {currentBook?.name || "Select Book"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <ScrollArea className="h-[300px]">
            {books.map((book) => (
              <SelectItem key={book.id} value={book.id}>
                {book.name}
              </SelectItem>
            ))}
          </ScrollArea>
        </SelectContent>
      </Select>

      <ChevronRight className="h-4 w-4 text-muted-foreground" />

      {/* Chapter Selector */}
      <Select 
        value={selectedChapter.toString()} 
        onValueChange={(value) => onChapterChange(parseInt(value))}
        disabled={loading || !currentBook}
      >
        <SelectTrigger className="h-8 w-auto border-0 px-2 hover:bg-accent">
          <SelectValue>
            Chapter {selectedChapter}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <ScrollArea className="h-[200px]">
            {currentBook && Array.from(
              { length: currentBook.chapters?.length || 0 }, 
              (_, i) => i + 1
            ).map((chapter) => (
              <SelectItem key={chapter} value={chapter.toString()}>
                Chapter {chapter}
              </SelectItem>
            ))}
          </ScrollArea>
        </SelectContent>
      </Select>

      {/* Panel Toggle Button */}
      {toggleLeftPanel && (
        <>
          <Separator orientation="vertical" className="h-6 mx-2" />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleLeftPanel}
                  className="h-8 px-2 hover:bg-accent"
                >
                  {isLeftPanelCollapsed ? (
                    <PanelLeftOpen className="h-4 w-4" />
                  ) : (
                    <PanelLeftClose className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle AI Insights Panel</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </>
      )}
    </div>
  )
}
