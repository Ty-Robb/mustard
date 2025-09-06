// Main Bible versions to display in the application
export const MAIN_BIBLE_VERSIONS = [
  {
    id: 'de4e12af7f28f599-01',
    abbreviation: 'KJV',
    name: 'King James Version',
    description: 'Classic English translation from 1611',
    verseIdExample: 'JHN.3.16' // John 3:16 format for KJV
  },
  {
    id: '06125adad2d5898a-01',
    abbreviation: 'ASV',
    name: 'American Standard Version',
    description: 'Literal translation from 1901'
  },
  {
    id: '9879dbb7cfe39e4d-04',
    abbreviation: 'WEB',
    name: 'World English Bible',
    description: 'Modern public domain translation'
  },
  {
    id: '7142879509583d59-02',
    abbreviation: 'BBE',
    name: 'Bible in Basic English',
    description: 'Simple English translation'
  },
  {
    id: '40072c4a5aba4022-01',
    abbreviation: 'RSVCE',
    name: 'Revised Standard Version Catholic Edition',
    description: 'Catholic edition of RSV'
  },
  {
    id: '685d1470fe4d5c3b-01',
    abbreviation: 'FBV',
    name: 'Free Bible Version',
    description: 'Modern free translation',
    verseIdExample: 'JOH.3.16' // John 3:16 format for FBV (based on search results)
  }
];

// Get Bible IDs for filtering
export const MAIN_BIBLE_IDS = MAIN_BIBLE_VERSIONS.map(bible => bible.id);

// Helper to check if a Bible ID is in our main list
export function isMainBibleVersion(bibleId: string): boolean {
  return MAIN_BIBLE_IDS.includes(bibleId);
}
