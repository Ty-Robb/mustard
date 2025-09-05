'use client';

import { BibleReader } from '@/components/bible/BibleReader';
import { Card } from '@/components/ui/card';
import { PanelProvider } from '@/contexts/PanelContext';

// Mock chapter data with sample verses
const mockChapter = {
  id: 'GEN.1',
  bibleId: 'de4e12af7f28f599-02',
  number: '1',
  bookId: 'GEN',
  content: `
    <span class="v" data-number="1">1</span> In the beginning God created the heaven and the earth.
    <span class="v" data-number="2">2</span> And the earth was without form, and void; and darkness was upon the face of the deep. And the Spirit of God moved upon the face of the waters.
    <span class="v" data-number="3">3</span> And God said, Let there be light: and there was light.
    <span class="v" data-number="4">4</span> And God saw the light, that it was good: and God divided the light from the darkness.
    <span class="v" data-number="5">5</span> And God called the light Day, and the darkness he called Night. And the evening and the morning were the first day.
    <span class="v" data-number="6">6</span> And God said, Let there be a firmament in the midst of the waters, and let it divide the waters from the waters.
    <span class="v" data-number="7">7</span> And God made the firmament, and divided the waters which were under the firmament from the waters which were above the firmament: and it was so.
    <span class="v" data-number="8">8</span> And God called the firmament Heaven. And the evening and the morning were the second day.
  `,
  reference: 'Genesis 1',
  verseCount: 31,
  next: { id: 'GEN.2', bookId: 'GEN', number: '2' },
  previous: undefined,
  copyright: ''
};

export default function TestVerseFormattingPage() {
  return (
    <PanelProvider>
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Test Verse Formatting</h1>
        <p className="text-muted-foreground mb-8">
          This page demonstrates the new verse formatting with each verse on its own line,
          1.5 line spacing within verses, and approximately 1.75rem spacing between verses.
        </p>
        
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Genesis Chapter 1 (Sample)</h2>
          <BibleReader
            chapter={mockChapter}
            bookName="Genesis"
            highlights={[]}
            onHighlight={(verseId, color) => {
              console.log('Highlight:', verseId, color);
            }}
          />
        </Card>
        
        <div className="mt-8 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">Formatting Details:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Each verse is displayed on its own line using <code>&lt;div&gt;</code> elements</li>
            <li>Verses have <code>leading-[1.75]</code> (1.75 line height) for comfortable reading</li>
            <li>Between verses there is <code>mb-8</code> (2rem) spacing for clear visual separation</li>
            <li>Verse numbers are displayed as superscript with <code>mr-3</code> (0.75rem) gap after the number</li>
          </ul>
        </div>
      </div>
    </PanelProvider>
  );
}
