import { bibleService } from '@/lib/services/bible.service';

async function checkAvailableBibles() {
  try {
    console.log('🔍 Fetching available English Bibles...\n');
    const bibles = await bibleService.getBibles({ language: 'eng' });
    
    // Group by abbreviation
    const grouped = new Map<string, any[]>();
    
    bibles.forEach(bible => {
      const abbr = bible.abbreviation || 'UNKNOWN';
      if (!grouped.has(abbr)) {
        grouped.set(abbr, []);
      }
      grouped.get(abbr)!.push(bible);
    });
    
    // Show popular translations
    const popularTranslations = ['KJV', 'NIV', 'ESV', 'NKJV', 'NLT', 'NASB', 'RSV', 'NRSV', 'CSB', 'BSB'];
    
    console.log('📚 Popular Translations Available:');
    console.log('==================================\n');
    
    popularTranslations.forEach(abbr => {
      if (grouped.has(abbr)) {
        const versions = grouped.get(abbr)!;
        console.log(`${abbr}:`);
        versions.forEach(v => {
          console.log(`  - ${v.name} (ID: ${v.id})`);
        });
        console.log();
      }
    });
    
    // Show all available
    console.log('\n📖 All Available Translations:');
    console.log('==============================\n');
    
    Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([abbr, versions]) => {
        console.log(`${abbr}: ${versions.length} version(s)`);
        versions.forEach(v => {
          console.log(`  - ${v.name}`);
        });
      });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAvailableBibles();
