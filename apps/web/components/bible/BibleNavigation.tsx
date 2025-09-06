'use client';

import { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, Search, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import type { BibleBook } from '@/types/bible';

interface BibleNavigationProps {
  books: BibleBook[];
  currentBookId: string;
  currentChapter: number;
  onNavigate: (bookId: string, chapter: string) => void;
}

export function BibleNavigation({
  books,
  currentBookId,
  currentChapter,
  onNavigate
}: BibleNavigationProps) {
  const [expandedBooks, setExpandedBooks] = useState<Set<string>>(
    new Set([currentBookId])
  );
  const [searchQuery, setSearchQuery] = useState('');

  const toggleBook = (bookId: string) => {
    const newExpanded = new Set(expandedBooks);
    if (newExpanded.has(bookId)) {
      newExpanded.delete(bookId);
    } else {
      newExpanded.add(bookId);
    }
    setExpandedBooks(newExpanded);
  };

  const getChapterCount = (book: BibleBook): number => {
    // Parse chapter count from the last chapter ID
    if (book.chapters && book.chapters.length > 0) {
      const lastChapter = book.chapters[book.chapters.length - 1];
      const chapterNum = parseInt(lastChapter.number || lastChapter.id.split('.').pop() || '1');
      return chapterNum;
    }
    return 1;
  };

  // Filter books based on search query
  const filteredBooks = useMemo(() => {
    if (!searchQuery) return books;
    return books.filter(book => 
      book.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [books, searchQuery]);

  // Group books by testament
  const groupedBooks = useMemo(() => {
    const oldTestament: BibleBook[] = [];
    const newTestament: BibleBook[] = [];
    
    filteredBooks.forEach(book => {
      // Simple logic: if book ID starts with MAT or later, it's NT
      const ntBooks = ['MAT', 'MRK', 'LUK', 'JHN', 'ACT', 'ROM', '1CO', '2CO', 'GAL', 'EPH', 'PHP', 'COL', '1TH', '2TH', '1TI', '2TI', 'TIT', 'PHM', 'HEB', 'JAS', '1PE', '2PE', '1JN', '2JN', '3JN', 'JUD', 'REV'];
      if (ntBooks.some(nt => book.id.startsWith(nt))) {
        newTestament.push(book);
      } else {
        oldTestament.push(book);
      }
    });
    
    return { oldTestament, newTestament };
  }, [filteredBooks]);

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          Books & Chapters
        </h3>
        
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search books..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-4 pr-4">
          {/* Old Testament */}
          {groupedBooks.oldTestament.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Old Testament
              </h4>
              <div className="space-y-1">
                {groupedBooks.oldTestament.map((book) => {
                  const isExpanded = expandedBooks.has(book.id);
                  const isCurrentBook = book.id === currentBookId;
                  const chapterCount = getChapterCount(book);

                  return (
                    <div key={book.id}>
                      <Button
                        variant="ghost"
                        className={`w-full justify-start px-2 py-1.5 h-auto hover:bg-accent/50 ${
                          isCurrentBook ? 'bg-accent font-medium' : ''
                        }`}
                        onClick={() => toggleBook(book.id)}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-3 w-3 mr-1.5" />
                        ) : (
                          <ChevronRight className="h-3 w-3 mr-1.5" />
                        )}
                        <span className="text-sm">{book.name}</span>
                      </Button>

                      {isExpanded && (
                        <div className="ml-5 grid grid-cols-5 gap-1 py-2">
                          {Array.from({ length: chapterCount }, (_, i) => i + 1).map(
                            (chapter) => (
                              <Button
                                key={chapter}
                                variant={
                                  isCurrentBook && chapter === currentChapter
                                    ? 'default'
                                    : 'ghost'
                                }
                                size="sm"
                                className={`h-7 text-xs ${
                                  isCurrentBook && chapter === currentChapter
                                    ? ''
                                    : 'hover:bg-accent/50'
                                }`}
                                onClick={() => onNavigate(book.id, chapter.toString())}
                              >
                                {chapter}
                              </Button>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* New Testament */}
          {groupedBooks.newTestament.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                New Testament
              </h4>
              <div className="space-y-1">
                {groupedBooks.newTestament.map((book) => {
                  const isExpanded = expandedBooks.has(book.id);
                  const isCurrentBook = book.id === currentBookId;
                  const chapterCount = getChapterCount(book);

                  return (
                    <div key={book.id}>
                      <Button
                        variant="ghost"
                        className={`w-full justify-start px-2 py-1.5 h-auto hover:bg-accent/50 ${
                          isCurrentBook ? 'bg-accent font-medium' : ''
                        }`}
                        onClick={() => toggleBook(book.id)}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-3 w-3 mr-1.5" />
                        ) : (
                          <ChevronRight className="h-3 w-3 mr-1.5" />
                        )}
                        <span className="text-sm">{book.name}</span>
                      </Button>

                      {isExpanded && (
                        <div className="ml-5 grid grid-cols-5 gap-1 py-2">
                          {Array.from({ length: chapterCount }, (_, i) => i + 1).map(
                            (chapter) => (
                              <Button
                                key={chapter}
                                variant={
                                  isCurrentBook && chapter === currentChapter
                                    ? 'default'
                                    : 'ghost'
                                }
                                size="sm"
                                className={`h-7 text-xs ${
                                  isCurrentBook && chapter === currentChapter
                                    ? ''
                                    : 'hover:bg-accent/50'
                                }`}
                                onClick={() => onNavigate(book.id, chapter.toString())}
                              >
                                {chapter}
                              </Button>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* No results message */}
          {filteredBooks.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No books found matching "{searchQuery}"</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
