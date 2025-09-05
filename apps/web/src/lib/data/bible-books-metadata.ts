export interface BibleBookMetadata {
  code: string;           // 3-letter code (e.g., "GEN", "MAT")
  name: string;           // Full name (e.g., "Genesis", "Matthew")
  testament: 'old' | 'new';
  genre: 'law' | 'history' | 'wisdom' | 'prophecy' | 'gospel' | 'epistle' | 'apocalyptic';
  author: string;
  chapters: number;
  verses: number;
  order: number;          // Book order in the Bible
  section: string;        // Major section (e.g., "Pentateuch", "Gospels")
  themes: string[];       // Major themes of the book
  vectorized: boolean;    // Track vectorization status
  vectorizedDate?: Date;  // When it was vectorized
  vectorizedVerses?: number; // How many verses were successfully vectorized
}

export const bibleBooks: BibleBookMetadata[] = [
  // Old Testament - Pentateuch/Torah
  {
    code: "GEN",
    name: "Genesis",
    testament: "old",
    genre: "law",
    author: "Moses",
    chapters: 50,
    verses: 1533,
    order: 1,
    section: "Pentateuch",
    themes: ["creation", "fall", "flood", "covenant", "patriarchs", "providence"],
    vectorized: true,
    vectorizedDate: new Date("2024-01-01"), // Update with actual date
    vectorizedVerses: 1533
  },
  {
    code: "EXO",
    name: "Exodus",
    testament: "old",
    genre: "law",
    author: "Moses",
    chapters: 40,
    verses: 1213,
    order: 2,
    section: "Pentateuch",
    themes: ["deliverance", "covenant", "law", "tabernacle", "worship", "redemption"],
    vectorized: true,
    vectorizedDate: new Date("2025-08-28"),
    vectorizedVerses: 1213
  },
  {
    code: "LEV",
    name: "Leviticus",
    testament: "old",
    genre: "law",
    author: "Moses",
    chapters: 27,
    verses: 859,
    order: 3,
    section: "Pentateuch",
    themes: ["holiness", "sacrifice", "priesthood", "purity", "atonement", "worship"],
    vectorized: false
  },
  {
    code: "NUM",
    name: "Numbers",
    testament: "old",
    genre: "law",
    author: "Moses",
    chapters: 36,
    verses: 1288,
    order: 4,
    section: "Pentateuch",
    themes: ["wilderness", "rebellion", "faith", "journey", "census", "inheritance"],
    vectorized: false
  },
  {
    code: "DEU",
    name: "Deuteronomy",
    testament: "old",
    genre: "law",
    author: "Moses",
    chapters: 34,
    verses: 959,
    order: 5,
    section: "Pentateuch",
    themes: ["covenant renewal", "law", "love", "obedience", "blessings", "curses"],
    vectorized: false
  },

  // Old Testament - Historical Books
  {
    code: "JOS",
    name: "Joshua",
    testament: "old",
    genre: "history",
    author: "Joshua",
    chapters: 24,
    verses: 658,
    order: 6,
    section: "Historical",
    themes: ["conquest", "promise fulfilled", "inheritance", "faithfulness", "leadership"],
    vectorized: false
  },
  {
    code: "JDG",
    name: "Judges",
    testament: "old",
    genre: "history",
    author: "Samuel",
    chapters: 21,
    verses: 618,
    order: 7,
    section: "Historical",
    themes: ["cycles", "deliverance", "apostasy", "repentance", "leadership", "chaos"],
    vectorized: false
  },
  {
    code: "RUT",
    name: "Ruth",
    testament: "old",
    genre: "history",
    author: "Unknown",
    chapters: 4,
    verses: 85,
    order: 8,
    section: "Historical",
    themes: ["loyalty", "redemption", "providence", "love", "kinsman-redeemer"],
    vectorized: false
  },
  {
    code: "1SA",
    name: "1 Samuel",
    testament: "old",
    genre: "history",
    author: "Samuel/Nathan/Gad",
    chapters: 31,
    verses: 810,
    order: 9,
    section: "Historical",
    themes: ["kingship", "anointing", "obedience", "leadership transition", "covenant"],
    vectorized: false
  },
  {
    code: "2SA",
    name: "2 Samuel",
    testament: "old",
    genre: "history",
    author: "Nathan/Gad",
    chapters: 24,
    verses: 695,
    order: 10,
    section: "Historical",
    themes: ["David's reign", "covenant", "sin and consequences", "kingdom", "messiah"],
    vectorized: false
  },
  {
    code: "1KI",
    name: "1 Kings",
    testament: "old",
    genre: "history",
    author: "Jeremiah",
    chapters: 22,
    verses: 816,
    order: 11,
    section: "Historical",
    themes: ["Solomon", "temple", "divided kingdom", "prophets", "idolatry", "judgment"],
    vectorized: false
  },
  {
    code: "2KI",
    name: "2 Kings",
    testament: "old",
    genre: "history",
    author: "Jeremiah",
    chapters: 25,
    verses: 719,
    order: 12,
    section: "Historical",
    themes: ["decline", "exile", "prophets", "judgment", "remnant", "reform"],
    vectorized: false
  },
  {
    code: "1CH",
    name: "1 Chronicles",
    testament: "old",
    genre: "history",
    author: "Ezra",
    chapters: 29,
    verses: 942,
    order: 13,
    section: "Historical",
    themes: ["genealogy", "David", "worship", "temple preparation", "covenant"],
    vectorized: false
  },
  {
    code: "2CH",
    name: "2 Chronicles",
    testament: "old",
    genre: "history",
    author: "Ezra",
    chapters: 36,
    verses: 822,
    order: 14,
    section: "Historical",
    themes: ["temple", "worship", "revival", "judgment", "restoration", "prayer"],
    vectorized: false
  },
  {
    code: "EZR",
    name: "Ezra",
    testament: "old",
    genre: "history",
    author: "Ezra",
    chapters: 10,
    verses: 280,
    order: 15,
    section: "Historical",
    themes: ["return", "restoration", "temple rebuilding", "reform", "law", "separation"],
    vectorized: false
  },
  {
    code: "NEH",
    name: "Nehemiah",
    testament: "old",
    genre: "history",
    author: "Nehemiah",
    chapters: 13,
    verses: 406,
    order: 16,
    section: "Historical",
    themes: ["rebuilding", "leadership", "prayer", "opposition", "covenant renewal"],
    vectorized: false
  },
  {
    code: "EST",
    name: "Esther",
    testament: "old",
    genre: "history",
    author: "Unknown",
    chapters: 10,
    verses: 167,
    order: 17,
    section: "Historical",
    themes: ["providence", "courage", "deliverance", "reversal", "Jewish identity"],
    vectorized: false
  },

  // Old Testament - Wisdom/Poetry
  {
    code: "JOB",
    name: "Job",
    testament: "old",
    genre: "wisdom",
    author: "Unknown",
    chapters: 42,
    verses: 1070,
    order: 18,
    section: "Wisdom",
    themes: ["suffering", "sovereignty", "faith", "wisdom", "restoration", "theodicy"],
    vectorized: false
  },
  {
    code: "PSA",
    name: "Psalms",
    testament: "old",
    genre: "wisdom",
    author: "David and others",
    chapters: 150,
    verses: 2461,
    order: 19,
    section: "Wisdom",
    themes: ["worship", "prayer", "lament", "praise", "trust", "messiah"],
    vectorized: false
  },
  {
    code: "PRO",
    name: "Proverbs",
    testament: "old",
    genre: "wisdom",
    author: "Solomon and others",
    chapters: 31,
    verses: 915,
    order: 20,
    section: "Wisdom",
    themes: ["wisdom", "fear of Lord", "discipline", "righteousness", "folly", "instruction"],
    vectorized: false
  },
  {
    code: "ECC",
    name: "Ecclesiastes",
    testament: "old",
    genre: "wisdom",
    author: "Solomon",
    chapters: 12,
    verses: 222,
    order: 21,
    section: "Wisdom",
    themes: ["vanity", "meaning", "time", "wisdom", "enjoyment", "God's sovereignty"],
    vectorized: false
  },
  {
    code: "SNG",
    name: "Song of Songs",
    testament: "old",
    genre: "wisdom",
    author: "Solomon",
    chapters: 8,
    verses: 117,
    order: 22,
    section: "Wisdom",
    themes: ["love", "marriage", "beauty", "desire", "commitment", "intimacy"],
    vectorized: false
  },

  // Old Testament - Major Prophets
  {
    code: "ISA",
    name: "Isaiah",
    testament: "old",
    genre: "prophecy",
    author: "Isaiah",
    chapters: 66,
    verses: 1292,
    order: 23,
    section: "Major Prophets",
    themes: ["holiness", "judgment", "comfort", "servant", "messiah", "new creation"],
    vectorized: false
  },
  {
    code: "JER",
    name: "Jeremiah",
    testament: "old",
    genre: "prophecy",
    author: "Jeremiah",
    chapters: 52,
    verses: 1364,
    order: 24,
    section: "Major Prophets",
    themes: ["judgment", "new covenant", "weeping", "restoration", "false prophets"],
    vectorized: false
  },
  {
    code: "LAM",
    name: "Lamentations",
    testament: "old",
    genre: "prophecy",
    author: "Jeremiah",
    chapters: 5,
    verses: 154,
    order: 25,
    section: "Major Prophets",
    themes: ["lament", "destruction", "hope", "God's faithfulness", "repentance"],
    vectorized: false
  },
  {
    code: "EZK",
    name: "Ezekiel",
    testament: "old",
    genre: "prophecy",
    author: "Ezekiel",
    chapters: 48,
    verses: 1273,
    order: 26,
    section: "Major Prophets",
    themes: ["God's glory", "judgment", "restoration", "new temple", "watchman", "visions"],
    vectorized: false
  },
  {
    code: "DAN",
    name: "Daniel",
    testament: "old",
    genre: "prophecy",
    author: "Daniel",
    chapters: 12,
    verses: 357,
    order: 27,
    section: "Major Prophets",
    themes: ["sovereignty", "prophecy", "faithfulness", "kingdoms", "end times", "prayer"],
    vectorized: false
  },

  // Old Testament - Minor Prophets
  {
    code: "HOS",
    name: "Hosea",
    testament: "old",
    genre: "prophecy",
    author: "Hosea",
    chapters: 14,
    verses: 197,
    order: 28,
    section: "Minor Prophets",
    themes: ["unfaithful love", "spiritual adultery", "restoration", "covenant", "judgment"],
    vectorized: false
  },
  {
    code: "JOL",
    name: "Joel",
    testament: "old",
    genre: "prophecy",
    author: "Joel",
    chapters: 3,
    verses: 73,
    order: 29,
    section: "Minor Prophets",
    themes: ["day of the Lord", "locusts", "repentance", "Spirit outpouring", "restoration"],
    vectorized: false
  },
  {
    code: "AMO",
    name: "Amos",
    testament: "old",
    genre: "prophecy",
    author: "Amos",
    chapters: 9,
    verses: 146,
    order: 30,
    section: "Minor Prophets",
    themes: ["justice", "judgment", "social righteousness", "day of the Lord", "restoration"],
    vectorized: false
  },
  {
    code: "OBA",
    name: "Obadiah",
    testament: "old",
    genre: "prophecy",
    author: "Obadiah",
    chapters: 1,
    verses: 21,
    order: 31,
    section: "Minor Prophets",
    themes: ["Edom's judgment", "pride", "day of the Lord", "restoration", "justice"],
    vectorized: false
  },
  {
    code: "JON",
    name: "Jonah",
    testament: "old",
    genre: "prophecy",
    author: "Jonah",
    chapters: 4,
    verses: 48,
    order: 32,
    section: "Minor Prophets",
    themes: ["mission", "repentance", "God's mercy", "reluctant prophet", "Nineveh"],
    vectorized: false
  },
  {
    code: "MIC",
    name: "Micah",
    testament: "old",
    genre: "prophecy",
    author: "Micah",
    chapters: 7,
    verses: 105,
    order: 33,
    section: "Minor Prophets",
    themes: ["justice", "humble walk", "messianic prophecy", "restoration", "covenant"],
    vectorized: false
  },
  {
    code: "NAM",
    name: "Nahum",
    testament: "old",
    genre: "prophecy",
    author: "Nahum",
    chapters: 3,
    verses: 47,
    order: 34,
    section: "Minor Prophets",
    themes: ["Nineveh's judgment", "God's wrath", "justice", "comfort", "sovereignty"],
    vectorized: false
  },
  {
    code: "HAB",
    name: "Habakkuk",
    testament: "old",
    genre: "prophecy",
    author: "Habakkuk",
    chapters: 3,
    verses: 56,
    order: 35,
    section: "Minor Prophets",
    themes: ["faith", "theodicy", "justice", "prayer", "trust", "God's sovereignty"],
    vectorized: false
  },
  {
    code: "ZEP",
    name: "Zephaniah",
    testament: "old",
    genre: "prophecy",
    author: "Zephaniah",
    chapters: 3,
    verses: 53,
    order: 36,
    section: "Minor Prophets",
    themes: ["day of the Lord", "judgment", "remnant", "restoration", "rejoicing"],
    vectorized: false
  },
  {
    code: "HAG",
    name: "Haggai",
    testament: "old",
    genre: "prophecy",
    author: "Haggai",
    chapters: 2,
    verses: 38,
    order: 37,
    section: "Minor Prophets",
    themes: ["temple rebuilding", "priorities", "God's presence", "future glory", "blessing"],
    vectorized: false
  },
  {
    code: "ZEC",
    name: "Zechariah",
    testament: "old",
    genre: "prophecy",
    author: "Zechariah",
    chapters: 14,
    verses: 211,
    order: 38,
    section: "Minor Prophets",
    themes: ["visions", "messiah", "restoration", "temple", "future kingdom", "repentance"],
    vectorized: false
  },
  {
    code: "MAL",
    name: "Malachi",
    testament: "old",
    genre: "prophecy",
    author: "Malachi",
    chapters: 4,
    verses: 55,
    order: 39,
    section: "Minor Prophets",
    themes: ["covenant faithfulness", "worship", "messenger", "refining", "Elijah's return"],
    vectorized: false
  },

  // New Testament - Gospels
  {
    code: "MAT",
    name: "Matthew",
    testament: "new",
    genre: "gospel",
    author: "Matthew",
    chapters: 28,
    verses: 1071,
    order: 40,
    section: "Gospels",
    themes: ["Messiah", "Kingdom of Heaven", "fulfillment", "teaching", "discipleship"],
    vectorized: true,
    vectorizedDate: new Date("2024-01-01"), // Update with actual date
    vectorizedVerses: 1071
  },
  {
    code: "MRK",
    name: "Mark",
    testament: "new",
    genre: "gospel",
    author: "Mark",
    chapters: 16,
    verses: 678,
    order: 41,
    section: "Gospels",
    themes: ["servant", "action", "suffering", "discipleship", "kingdom of God"],
    vectorized: false
  },
  {
    code: "LUK",
    name: "Luke",
    testament: "new",
    genre: "gospel",
    author: "Luke",
    chapters: 24,
    verses: 1151,
    order: 42,
    section: "Gospels",
    themes: ["salvation", "compassion", "prayer", "Holy Spirit", "universal gospel"],
    vectorized: false
  },
  {
    code: "JHN",
    name: "John",
    testament: "new",
    genre: "gospel",
    author: "John",
    chapters: 21,
    verses: 879,
    order: 43,
    section: "Gospels",
    themes: ["deity of Christ", "belief", "eternal life", "signs", "love", "truth"],
    vectorized: false
  },

  // New Testament - History
  {
    code: "ACT",
    name: "Acts",
    testament: "new",
    genre: "history",
    author: "Luke",
    chapters: 28,
    verses: 1007,
    order: 44,
    section: "History",
    themes: ["Holy Spirit", "church growth", "mission", "persecution", "gospel spread"],
    vectorized: false
  },

  // New Testament - Pauline Epistles
  {
    code: "ROM",
    name: "Romans",
    testament: "new",
    genre: "epistle",
    author: "Paul",
    chapters: 16,
    verses: 433,
    order: 45,
    section: "Pauline Epistles",
    themes: ["justification", "faith", "grace", "law", "righteousness", "sanctification"],
    vectorized: false
  },
  {
    code: "1CO",
    name: "1 Corinthians",
    testament: "new",
    genre: "epistle",
    author: "Paul",
    chapters: 16,
    verses: 437,
    order: 46,
    section: "Pauline Epistles",
    themes: ["unity", "wisdom", "spiritual gifts", "love", "resurrection", "holiness"],
    vectorized: false
  },
  {
    code: "2CO",
    name: "2 Corinthians",
    testament: "new",
    genre: "epistle",
    author: "Paul",
    chapters: 13,
    verses: 257,
    order: 47,
    section: "Pauline Epistles",
    themes: ["comfort", "ministry", "reconciliation", "giving", "weakness", "apostleship"],
    vectorized: false
  },
  {
    code: "GAL",
    name: "Galatians",
    testament: "new",
    genre: "epistle",
    author: "Paul",
    chapters: 6,
    verses: 149,
    order: 48,
    section: "Pauline Epistles",
    themes: ["freedom", "grace", "faith", "law", "Spirit", "fruit of the Spirit"],
    vectorized: false
  },
  {
    code: "EPH",
    name: "Ephesians",
    testament: "new",
    genre: "epistle",
    author: "Paul",
    chapters: 6,
    verses: 155,
    order: 49,
    section: "Pauline Epistles",
    themes: ["unity", "grace", "church", "spiritual warfare", "mystery", "new life"],
    vectorized: false
  },
  {
    code: "PHP",
    name: "Philippians",
    testament: "new",
    genre: "epistle",
    author: "Paul",
    chapters: 4,
    verses: 104,
    order: 50,
    section: "Pauline Epistles",
    themes: ["joy", "humility", "unity", "contentment", "pressing on", "Christ's mind"],
    vectorized: false
  },
  {
    code: "COL",
    name: "Colossians",
    testament: "new",
    genre: "epistle",
    author: "Paul",
    chapters: 4,
    verses: 95,
    order: 51,
    section: "Pauline Epistles",
    themes: ["supremacy of Christ", "fullness", "new life", "wisdom", "thanksgiving"],
    vectorized: false
  },
  {
    code: "1TH",
    name: "1 Thessalonians",
    testament: "new",
    genre: "epistle",
    author: "Paul",
    chapters: 5,
    verses: 89,
    order: 52,
    section: "Pauline Epistles",
    themes: ["second coming", "holiness", "encouragement", "work", "hope", "love"],
    vectorized: false
  },
  {
    code: "2TH",
    name: "2 Thessalonians",
    testament: "new",
    genre: "epistle",
    author: "Paul",
    chapters: 3,
    verses: 47,
    order: 53,
    section: "Pauline Epistles",
    themes: ["perseverance", "day of the Lord", "lawlessness", "work", "tradition"],
    vectorized: false
  },
  {
    code: "1TI",
    name: "1 Timothy",
    testament: "new",
    genre: "epistle",
    author: "Paul",
    chapters: 6,
    verses: 113,
    order: 54,
    section: "Pauline Epistles",
    themes: ["church order", "leadership", "doctrine", "godliness", "false teaching"],
    vectorized: false
  },
  {
    code: "2TI",
    name: "2 Timothy",
    testament: "new",
    genre: "epistle",
    author: "Paul",
    chapters: 4,
    verses: 83,
    order: 55,
    section: "Pauline Epistles",
    themes: ["perseverance", "scripture", "preaching", "faithfulness", "crown of life"],
    vectorized: false
  },
  {
    code: "TIT",
    name: "Titus",
    testament: "new",
    genre: "epistle",
    author: "Paul",
    chapters: 3,
    verses: 46,
    order: 56,
    section: "Pauline Epistles",
    themes: ["good works", "sound doctrine", "leadership", "grace", "godly living"],
    vectorized: false
  },
  {
    code: "PHM",
    name: "Philemon",
    testament: "new",
    genre: "epistle",
    author: "Paul",
    chapters: 1,
    verses: 25,
    order: 57,
    section: "Pauline Epistles",
    themes: ["forgiveness", "reconciliation", "brotherhood", "love", "appeal"],
    vectorized: false
  },

  // New Testament - General Epistles
  {
    code: "HEB",
    name: "Hebrews",
    testament: "new",
    genre: "epistle",
    author: "Unknown",
    chapters: 13,
    verses: 303,
    order: 58,
    section: "General Epistles",
    themes: ["superiority of Christ", "priesthood", "faith", "new covenant", "perseverance"],
    vectorized: false
  },
  {
    code: "JAS",
    name: "James",
    testament: "new",
    genre: "epistle",
    author: "James",
    chapters: 5,
    verses: 108,
    order: 59,
    section: "General Epistles",
    themes: ["faith and works", "wisdom", "tongue", "patience", "prayer", "trials"],
    vectorized: false
  },
  {
    code: "1PE",
    name: "1 Peter",
    testament: "new",
    genre: "epistle",
    author: "Peter",
    chapters: 5,
    verses: 105,
    order: 60,
    section: "General Epistles",
    themes: ["suffering", "holiness", "hope", "submission", "shepherding", "humility"],
    vectorized: false
  },
  {
    code: "2PE",
    name: "2 Peter",
    testament: "new",
    genre: "epistle",
    author: "Peter",
    chapters: 3,
    verses: 61,
    order: 61,
    section: "General Epistles",
    themes: ["knowledge", "false teachers", "day of the Lord", "growth", "scripture"],
    vectorized: false
  },
  {
    code: "1JN",
    name: "1 John",
    testament: "new",
    genre: "epistle",
    author: "John",
    chapters: 5,
    verses: 105,
    order: 62,
    section: "General Epistles",
    themes: ["love", "fellowship", "light", "truth", "assurance", "antichrist"],
    vectorized: false
  },
  {
    code: "2JN",
    name: "2 John",
    testament: "new",
    genre: "epistle",
    author: "John",
    chapters: 1,
    verses: 13,
    order: 63,
    section: "General Epistles",
    themes: ["truth", "love", "false teachers", "hospitality", "walking in truth"],
    vectorized: false
  },
  {
    code: "3JN",
    name: "3 John",
    testament: "new",
    genre: "epistle",
    author: "John",
    chapters: 1,
    verses: 14,
    order: 64,
    section: "General Epistles",
    themes: ["hospitality", "truth", "good and evil", "church leadership", "faithfulness"],
    vectorized: false
  },
  {
    code: "JUD",
    name: "Jude",
    testament: "new",
    genre: "epistle",
    author: "Jude",
    chapters: 1,
    verses: 25,
    order: 65,
    section: "General Epistles",
    themes: ["contend for faith", "false teachers", "judgment", "perseverance", "doxology"],
    vectorized: false
  },

  // New Testament - Apocalyptic
  {
    code: "REV",
    name: "Revelation",
    testament: "new",
    genre: "apocalyptic",
    author: "John",
    chapters: 22,
    verses: 404,
    order: 66,
    section: "Apocalyptic",
    themes: ["end times", "judgment", "victory", "new creation", "worship", "Christ's return"],
    vectorized: false
  }
];

// Helper functions
export function getBookByCode(code: string): BibleBookMetadata | undefined {
  return bibleBooks.find(book => book.code === code);
}

export function getBookByName(name: string): BibleBookMetadata | undefined {
  return bibleBooks.find(book => 
    book.name.toLowerCase() === name.toLowerCase()
  );
}

export function getBooksByTestament(testament: 'old' | 'new'): BibleBookMetadata[] {
  return bibleBooks.filter(book => book.testament === testament);
}

export function getBooksBySection(section: string): BibleBookMetadata[] {
  return bibleBooks.filter(book => book.section === section);
}

export function getVectorizedBooks(): BibleBookMetadata[] {
  return bibleBooks.filter(book => book.vectorized);
}

export function getUnvectorizedBooks(): BibleBookMetadata[] {
  return bibleBooks.filter(book => !book.vectorized);
}

export function getTotalVerses(): number {
  return bibleBooks.reduce((total, book) => total + book.verses, 0);
}

export function getVectorizedVerses(): number {
  return bibleBooks
    .filter(book => book.vectorized)
    .reduce((total, book) => total + (book.vectorizedVerses || 0), 0);
}

export function getVectorizationProgress(): {
  totalBooks: number;
  vectorizedBooks: number;
  totalVerses: number;
  vectorizedVerses: number;
  percentageBooks: number;
  percentageVerses: number;
} {
  const totalBooks = bibleBooks.length;
  const vectorizedBooks = getVectorizedBooks().length;
  const totalVerses = getTotalVerses();
  const vectorizedVerses = getVectorizedVerses();
  
  return {
    totalBooks,
    vectorizedBooks,
    totalVerses,
    vectorizedVerses,
    percentageBooks: (vectorizedBooks / totalBooks) * 100,
    percentageVerses: (vectorizedVerses / totalVerses) * 100
  };
}

// Export sections for easy iteration
export const bibleSections = [
  "Pentateuch",
  "Historical",
  "Wisdom",
  "Major Prophets",
  "Minor Prophets",
  "Gospels",
  "History",
  "Pauline Epistles",
  "General Epistles",
  "Apocalyptic"
];
