import { GoogleGenerativeAI } from '@google/generative-ai';
import { bibleService } from '@/lib/services/bible.service';
import { getUnvectorizedBooks, BibleBookMetadata } from '@/lib/data/bible-books-metadata';
import * as fs from 'fs/promises';
import * as path from 'path';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Helper to add delay between API calls
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface ChapterTheme {
  chapter: number;
  theme: string;
  keyTopics: string[];
}

interface BookThemeData {
  bookInfo: {
    name: string;
    description: string;
    testament: 'old' | 'new';
    genre: string;
    author: string;
    chapters: number;
    verses: number;
    themes: string[];
  };
  chapterThemes: ChapterTheme[];
  verseThemes: { [key: string]: string[] };
}

async function generateBookThemes(book: BibleBookMetadata, sampleChapterText?: string): Promise<BookThemeData> {
  const prompt = `
You are a biblical scholar tasked with creating comprehensive theme data for the book of ${book.name}.

Book Information:
- Name: ${book.name}
- Code: ${book.code}
- Testament: ${book.testament}
- Genre: ${book.genre}
- Author: ${book.author}
- Chapters: ${book.chapters}
- Verses: ${book.verses}
- General Themes: ${book.themes.join(', ')}

${sampleChapterText ? `Sample text from Chapter 1:\n${sampleChapterText}\n` : ''}

Please provide a comprehensive theme analysis in the following JSON format:

{
  "bookInfo": {
    "name": "${book.name}",
    "description": "A concise description of the book's purpose and message",
    "testament": "${book.testament}",
    "genre": "${book.genre}",
    "author": "${book.author}",
    "chapters": ${book.chapters},
    "verses": ${book.verses},
    "themes": ["theme1", "theme2", "theme3", "theme4", "theme5", "theme6", "theme7", "theme8"]
  },
  "chapterThemes": [
    {
      "chapter": 1,
      "theme": "The main theme of chapter 1",
      "keyTopics": ["topic1", "topic2", "topic3", "topic4", "topic5"]
    },
    // ... for all ${book.chapters} chapters
  ],
  "verseThemes": {
    "1:1": ["specific theme 1", "specific theme 2", "specific theme 3"],
    // Add 10-15 of the most significant verses with their specific themes
  }
}

Requirements:
1. Provide a theme and 5-7 key topics for EACH of the ${book.chapters} chapters
2. Chapter themes should be descriptive and capture the main message
3. Key topics should be specific concepts, events, or teachings in that chapter
4. Include 10-15 of the most theologically significant verses with their specific themes
5. All themes and topics should be relevant for semantic search
6. Be historically and theologically accurate

Return ONLY the JSON object, no additional text.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    const themeData = JSON.parse(jsonMatch[0]) as BookThemeData;
    
    // Validate the response
    if (!themeData.bookInfo || !themeData.chapterThemes || themeData.chapterThemes.length !== book.chapters) {
      throw new Error('Invalid theme data structure');
    }
    
    return themeData;
  } catch (error) {
    console.error(`Error generating themes for ${book.name}:`, error);
    throw error;
  }
}

function generateThemeFileContent(book: BibleBookMetadata, themeData: BookThemeData): string {
  const bookNameLower = book.name.toLowerCase().replace(/\s+/g, '-');
  const bookNameCamel = book.name.replace(/\s+/g, '');
  
  return `import { MatthewChapterTheme } from '@/types/bible-vectors';

// Using the same interface structure as Matthew for consistency
export const ${bookNameLower}ChapterThemes: MatthewChapterTheme[] = [
${themeData.chapterThemes.map(theme => `  {
    chapter: ${theme.chapter},
    theme: "${theme.theme}",
    keyTopics: ${JSON.stringify(theme.keyTopics)}
  }`).join(',\n')}
];

export function get${bookNameCamel}ChapterTheme(chapter: number): string {
  const theme = ${bookNameLower}ChapterThemes.find(t => t.chapter === chapter);
  return theme ? theme.theme : \`Chapter \${chapter}\`;
}

export function get${bookNameCamel}ChapterKeyTopics(chapter: number): string[] {
  const theme = ${bookNameLower}ChapterThemes.find(t => t.chapter === chapter);
  return theme ? theme.keyTopics : [];
}

export function get${bookNameCamel}VerseThemes(chapter: number, verse: number): string[] {
  // This is a simplified version - in a full implementation, 
  // you might have verse-specific themes
  const chapterTopics = get${bookNameCamel}ChapterKeyTopics(chapter);
  
  // Special cases for well-known verses
  const verseRef = \`\${chapter}:\${verse}\`;
  const specificThemes: { [key: string]: string[] } = ${JSON.stringify(themeData.verseThemes, null, 4)};
  
  if (specificThemes[verseRef]) {
    return [...new Set([...specificThemes[verseRef], ...chapterTopics.slice(0, 3)])];
  }
  
  return chapterTopics.slice(0, 3);
}

// Book metadata for ${book.name}
export const ${bookNameLower}BookInfo = ${JSON.stringify(themeData.bookInfo, null, 2)};
`;
}

async function generateThemesForBook(book: BibleBookMetadata, bibleId: string) {
  console.log(`\nGenerating themes for ${book.name}...`);
  
  try {
    // Get sample text from first chapter if available
    let sampleText = '';
    try {
      const books = await bibleService.getBooks(bibleId);
      const targetBook = books.find(b => b.id.startsWith(book.code));
      
      if (targetBook) {
        const chapterId = `${targetBook.id}.1`;
        const chapter = await bibleService.getChapter(bibleId, chapterId, {
          contentType: 'text',
          includeVerseNumbers: true,
          includeChapterNumbers: false,
          includeTitles: false,
          includeNotes: false
        });
        sampleText = chapter.content || '';
      }
    } catch (error) {
      console.warn(`Could not fetch sample text for ${book.name}:`, error);
    }
    
    // Generate themes using AI
    const themeData = await generateBookThemes(book, sampleText);
    
    // Generate the TypeScript file content
    const fileContent = generateThemeFileContent(book, themeData);
    
    // Write to file
    const fileName = `${book.name.toLowerCase().replace(/\s+/g, '-')}-themes.ts`;
    const filePath = path.join(process.cwd(), 'src', 'lib', 'data', fileName);
    
    await fs.writeFile(filePath, fileContent, 'utf-8');
    console.log(`✓ Created ${fileName}`);
    
    return { success: true, fileName };
  } catch (error) {
    console.error(`✗ Failed to generate themes for ${book.name}:`, error);
    return { success: false, error };
  }
}

async function generateAllThemes() {
  console.log('Bible Theme Generation Script');
  console.log('=============================\n');
  
  try {
    // Get available Bibles
    const bibles = await bibleService.getBibles({ language: 'eng' });
    const selectedBible = bibles.find(b => 
      b.abbreviation === 'ESV' || 
      b.abbreviation === 'KJV' || 
      b.abbreviation === 'NIV'
    ) || bibles[0];
    
    if (!selectedBible) {
      throw new Error('No English Bible translation found');
    }
    
    console.log(`Using Bible: ${selectedBible.name} (${selectedBible.abbreviation})\n`);
    
    // Get unvectorized books
    const unvectorizedBooks = getUnvectorizedBooks();
    console.log(`Found ${unvectorizedBooks.length} books needing theme files\n`);
    
    // Process books by section
    const sections = ['Pentateuch', 'Historical', 'Wisdom', 'Major Prophets', 'Minor Prophets', 
                     'Gospels', 'History', 'Pauline Epistles', 'General Epistles', 'Apocalyptic'];
    
    const results = {
      success: [] as string[],
      failed: [] as string[]
    };
    
    for (const section of sections) {
      const sectionBooks = unvectorizedBooks.filter(book => book.section === section);
      if (sectionBooks.length === 0) continue;
      
      console.log(`\n=== Processing ${section} (${sectionBooks.length} books) ===`);
      
      for (const book of sectionBooks) {
        const result = await generateThemesForBook(book, selectedBible.id);
        
        if (result.success) {
          results.success.push(book.name);
        } else {
          results.failed.push(book.name);
        }
        
        // Delay to avoid rate limiting
        await delay(2000);
      }
    }
    
    // Summary
    console.log('\n\n=== Generation Complete ===');
    console.log(`Successfully generated: ${results.success.length} theme files`);
    console.log(`Failed: ${results.failed.length} books`);
    
    if (results.failed.length > 0) {
      console.log('\nFailed books:');
      results.failed.forEach(book => console.log(`  - ${book}`));
    }
    
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Command line interface
const command = process.argv[2];
const bookCode = process.argv[3];

async function main() {
  if (command === 'single' && bookCode) {
    // Generate theme for a single book
    const book = getUnvectorizedBooks().find(b => b.code === bookCode.toUpperCase());
    if (!book) {
      console.error(`Book with code ${bookCode} not found or already vectorized`);
      process.exit(1);
    }
    
    const bibles = await bibleService.getBibles({ language: 'eng' });
    const bible = bibles[0];
    
    await generateThemesForBook(book, bible.id);
  } else if (command === 'all') {
    // Generate themes for all unvectorized books
    await generateAllThemes();
  } else {
    console.log('Usage:');
    console.log('  Generate theme for single book: npm run generate-themes single <BOOK_CODE>');
    console.log('  Generate themes for all books:  npm run generate-themes all');
    console.log('\nExample:');
    console.log('  npm run generate-themes single EXO');
    process.exit(1);
  }
}

if (require.main === module) {
  main()
    .then(() => {
      console.log('\nDone!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\nScript failed:', error);
      process.exit(1);
    });
}

export { generateThemesForBook, generateAllThemes };
