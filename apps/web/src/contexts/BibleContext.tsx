"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { BibleBook, BibleChapter } from "@/types/bible"
import { MAIN_BIBLE_VERSIONS } from "@/config/bible-versions"
import { bibleClientService } from "@/lib/services/bible-client.service"

interface BibleContextType {
  selectedBible: string
  setSelectedBible: (bibleId: string) => void
  books: BibleBook[]
  selectedBook: string
  setSelectedBook: (bookId: string) => void
  selectedChapter: number
  setSelectedChapter: (chapter: number) => void
  chapterContent: BibleChapter | null
  loading: boolean
  error: string | null
  verseRange?: { start: number; end: number }
  setVerseRange: (range: { start: number; end: number } | undefined) => void
}

const BibleContext = createContext<BibleContextType | undefined>(undefined)

export function BibleProvider({ children }: { children: ReactNode }) {
  const [selectedBible, setSelectedBible] = useState<string>(MAIN_BIBLE_VERSIONS[0].id)
  const [books, setBooks] = useState<BibleBook[]>([])
  const [selectedBook, setSelectedBook] = useState<string>("")
  const [selectedChapter, setSelectedChapter] = useState<number>(1)
  const [chapterContent, setChapterContent] = useState<BibleChapter | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [verseRange, setVerseRange] = useState<{ start: number; end: number } | undefined>()

  // Load books when Bible version changes
  useEffect(() => {
    const loadBooks = async () => {
      try {
        setLoading(true)
        setError(null)
        const booksData = await bibleClientService.getBooks(selectedBible)
        setBooks(booksData)
        
        // Select first book by default
        if (booksData.length > 0 && !selectedBook) {
          setSelectedBook(booksData[0].id)
        }
      } catch (err) {
        console.error("Error loading books:", err)
        setError("Failed to load books")
      } finally {
        setLoading(false)
      }
    }

    loadBooks()
  }, [selectedBible])

  // Load chapter content when book or chapter changes
  useEffect(() => {
    const loadChapter = async () => {
      if (!selectedBook) return

      try {
        setLoading(true)
        setError(null)
        
        // Find the book to get chapter count
        const book = books.find(b => b.id === selectedBook)
        if (!book) {
          console.error(`Book not found for ID: ${selectedBook}`)
          return
        }

        console.log('=== BibleContext Loading Chapter ===')
        console.log('Selected book:', selectedBook)
        console.log('Selected chapter:', selectedChapter)
        console.log('Verse range:', verseRange)
        console.log('Book info:', book)
        
        let chapter: BibleChapter;
        
        // If we have a verse range, fetch only those verses
        if (verseRange && verseRange.start && verseRange.end) {
          console.log('Fetching verse range:', verseRange)
          chapter = await bibleClientService.getVerseRange(
            selectedBible,
            selectedBook,
            selectedChapter,
            verseRange.start,
            verseRange.end,
            {
              contentType: 'html',
              includeVerseSpans: true,
              includeVerseNumbers: true
            }
          )
        } else {
          // Otherwise fetch the full chapter
          const chapterId = `${selectedBook}.${selectedChapter}`
          console.log('Fetching full chapter:', chapterId)
          chapter = await bibleClientService.getChapter(selectedBible, chapterId, {
            contentType: 'html',
            includeVerseSpans: true,
            includeVerseNumbers: true
          })
        }
        
        console.log('Chapter loaded successfully:', chapter.id)
        setChapterContent(chapter)
      } catch (err) {
        console.error("Error loading chapter:", err)
        setError("Failed to load chapter")
      } finally {
        setLoading(false)
      }
    }

    loadChapter()
  }, [selectedBible, selectedBook, selectedChapter, books, verseRange])

  const handleBibleChange = (bibleId: string) => {
    setSelectedBible(bibleId)
    setSelectedBook("")
    setSelectedChapter(1)
  }

  const handleBookChange = (bookId: string) => {
    setSelectedBook(bookId)
    setSelectedChapter(1)
  }

  return (
    <BibleContext.Provider
      value={{
        selectedBible,
        setSelectedBible: handleBibleChange,
        books,
        selectedBook,
        setSelectedBook: handleBookChange,
        selectedChapter,
        setSelectedChapter,
        chapterContent,
        loading,
        error,
        verseRange,
        setVerseRange,
      }}
    >
      {children}
    </BibleContext.Provider>
  )
}

export function useBible() {
  const context = useContext(BibleContext)
  if (context === undefined) {
    throw new Error("useBible must be used within a BibleProvider")
  }
  return context
}
