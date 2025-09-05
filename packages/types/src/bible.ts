// Bible API types

export interface BibleLanguage {
  id: string;
  name: string;
  nameLocal: string;
  script: string;
  scriptDirection: 'ltr' | 'rtl';
}

export interface Country {
  id: string;
  name: string;
  nameLocal: string;
}

export interface AudioBible {
  id: string;
  name: string;
  nameLocal: string;
  description: string;
  descriptionLocal: string;
}

export interface Bible {
  id: string;
  dblId: string;
  abbreviation: string;
  abbreviationLocal: string;
  language: BibleLanguage;
  countries: Country[];
  name: string;
  nameLocal: string;
  description: string;
  descriptionLocal: string;
  relatedDbl?: string;
  type: string;
  updatedAt: string;
  audioBibles?: AudioBible[];
}

export interface BibleBook {
  id: string;
  bibleId: string;
  abbreviation: string;
  name: string;
  nameLong: string;
  chapters: BibleChapterSummary[];
}

export interface BibleChapterSummary {
  id: string;
  bibleId: string;
  bookId: string;
  number: string;
  reference: string;
}

export interface BibleChapter {
  id: string;
  bibleId: string;
  bookId: string;
  number: string;
  reference: string;
  content: string;
  verseCount: number;
  next?: { id: string; bookId: string; number: string };
  previous?: { id: string; bookId: string; number: string };
  copyright?: string;
}

export interface BibleVerse {
  id: string;
  bibleId: string;
  bookId: string;
  chapterId: string;
  reference: string;
  content: string;
  verseCount?: number;
  next?: { id: string; bookId: string };
  previous?: { id: string; bookId: string };
  copyright?: string;
}

export interface BiblePassage {
  id: string;
  bibleId: string;
  reference: string;
  content: string;
  verseCount: number;
  verses: BibleVerse[];
  copyright?: string;
}

export interface BibleSearchResult {
  query: string;
  data: {
    query: string;
    limit: number;
    offset: number;
    total: number;
    verseCount: number;
    verses: BibleVerse[];
    passages: BiblePassage[];
  };
}

// API Response types
export interface BibleApiResponse<T> {
  data: T;
}

export interface BibleApiListResponse<T> {
  data: T[];
}

// Cache types for storing in MongoDB
export interface CachedBibleContent {
  _id?: string;
  bibleId: string;
  reference: string;
  type: 'verse' | 'chapter' | 'passage';
  content: string;
  metadata: {
    bookId?: string;
    chapterId?: string;
    verseId?: string;
    copyright?: string;
  };
  embedding?: number[];
  embeddingModel?: string;
  embeddingDate?: Date;
  cachedAt: Date;
  lastAccessed: Date;
}
