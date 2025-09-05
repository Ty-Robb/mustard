import { bibleBooks } from '@/lib/data/bible-books-metadata';
import fs from 'fs';
import path from 'path';

// Progress file path
const PROGRESS_FILE = path.join(process.cwd(), 'vectorization-progress.json');

// Load progress
function loadProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    const data = fs.readFileSync(PROGRESS_FILE, 'utf-8');
    return JSON.parse(data);
  }
  return null;
}

console.log('🔍 Testing Vectorization Setup');
console.log('==============================\n');

// Check progress file
console.log('📄 Checking progress file...');
const progress = loadProgress();
if (progress) {
  console.log('✅ Progress file found:');
  console.log(`   - Completed books: ${progress.completedBooks.join(', ')}`);
  console.log(`   - Total verses: ${progress.totalVersesProcessed}`);
  console.log(`   - Last completed: ${progress.lastCompleted}`);
} else {
  console.log('❌ No progress file found');
}

// Check remaining books
console.log('\n📚 Checking books to process...');
const completedCodes = progress?.completedBooks || [];
const remainingBooks = bibleBooks.filter(book => !completedCodes.includes(book.code));

console.log(`   - Total books: ${bibleBooks.length}`);
console.log(`   - Completed: ${completedCodes.length}`);
console.log(`   - Remaining: ${remainingBooks.length}`);

// Show next books to process
console.log('\n📖 Next books to process:');
const nextBooks = remainingBooks.slice(0, 5);
nextBooks.forEach(book => {
  console.log(`   - ${book.code}: ${book.name} (${book.chapters} chapters, ${book.verses} verses)`);
});

// Check theme availability
console.log('\n🎨 Books with theme data available:');
const booksWithThemes = ['GEN', 'EXO', 'LEV', 'NUM', 'DEU', 'MAT'];
const availableThemes = booksWithThemes.filter(code => !completedCodes.includes(code));
if (availableThemes.length > 0) {
  console.log(`   - Ready to vectorize with themes: ${availableThemes.join(', ')}`);
} else {
  console.log('   - All books with themes have been vectorized');
}

// Estimate time
console.log('\n⏱️  Time estimates:');
const totalVerses = remainingBooks.reduce((sum, book) => sum + book.verses, 0);
const estimatedHours = Math.ceil(remainingBooks.length * 0.5); // ~30 min per book
console.log(`   - Remaining verses: ${totalVerses.toLocaleString()}`);
console.log(`   - Estimated time: ~${estimatedHours} hours`);
console.log(`   - With 10-minute delays: ~${Math.ceil(estimatedHours * 1.3)} hours total`);

console.log('\n✅ Ready to run vectorization!');
console.log('   Run: npm run vectorize-all');
console.log('   You can safely interrupt with Ctrl+C and resume later.');
