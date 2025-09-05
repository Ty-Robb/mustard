import { MatthewChapterTheme } from '@/types/bible-vectors';

// Using the same interface structure as Matthew for consistency
export const leviticusChapterThemes: MatthewChapterTheme[] = [
  {
    chapter: 1,
    theme: "Burnt Offerings:  A holistic dedication to God.",
    keyTopics: ["Burnt Offering","Whole Burnt Offering","Acceptable Offerings","Fire Offering","God's Pleasure"]
  },
  {
    chapter: 2,
    theme: "Grain Offerings:  Expressing gratitude and consecration through food.",
    keyTopics: ["Grain Offering","Fine Flour","Oil","Frankincense","Acceptable Offerings"]
  },
  {
    chapter: 3,
    theme: "Peace Offerings:  Fellowship and communion with God.",
    keyTopics: ["Peace Offering","Fellowship Offering","Fat","Breast","Right Shoulder","Priest's Portion"]
  },
  {
    chapter: 4,
    theme: "Sin Offerings: Atonement for unintentional sins.",
    keyTopics: ["Sin Offering","Unintentional Sin","Priest's Role","Blood Sacrifice","Atonement"]
  },
  {
    chapter: 5,
    theme: "Guilt Offerings:  Restoring relationship after transgression.",
    keyTopics: ["Guilt Offering","Trespass Offering","Restoration","Restitution","Compensation"]
  },
  {
    chapter: 6,
    theme: "Continuing Instructions on Offerings: Emphasis on priestly duties and procedures.",
    keyTopics: ["Burnt Offering","Grain Offering","Peace Offering","Sin Offering","Priest's Duties"]
  },
  {
    chapter: 7,
    theme: "Regulations Concerning Offerings:  Further instructions and explanations.",
    keyTopics: ["Offerings","Blessings","Priestly Portions","Holiness","Consecration"]
  },
  {
    chapter: 8,
    theme: "Aaron and his Sons Consecrated: Inauguration of the Levitical priesthood.",
    keyTopics: ["Consecration","Aaron","Sons of Aaron","Priestly Garments","Sacrifices"]
  },
  {
    chapter: 9,
    theme: "First Sacrifices:  Inaugural sacrifices by Aaron and his sons.",
    keyTopics: ["First Sacrifice","Aaron","Sons of Aaron","Burnt Offering","Sin Offering"]
  },
  {
    chapter: 10,
    theme: "Nadab and Abihu's Death:  A warning about holiness and obedience to God's commands.",
    keyTopics: ["Nadab","Abihu","Death","Strange Fire","Obedience","Holiness"]
  },
  {
    chapter: 11,
    theme: "Clean and Unclean Animals:  Dietary laws and distinctions of holiness.",
    keyTopics: ["Clean Animals","Unclean Animals","Dietary Laws","Holiness","Purity"]
  },
  {
    chapter: 12,
    theme: "Purification After Childbirth:  Ritual purity and cleansing.",
    keyTopics: ["Childbirth","Purification","Blood","Offerings","Cleanliness","Purity"]
  },
  {
    chapter: 13,
    theme: "Diseases of the Skin:  Identifying and dealing with skin diseases.",
    keyTopics: ["Skin Diseases","Leprosy","Purification","Priest's Diagnosis","Isolation"]
  },
  {
    chapter: 14,
    theme: "Purification from Leprosy:  Ritual cleansing from skin diseases.",
    keyTopics: ["Leprosy","Purification","Birds","Cedar Wood","Scarlet Yarn","Hyssop"]
  },
  {
    chapter: 15,
    theme: "Discharges and Purification:  Laws concerning bodily discharges.",
    keyTopics: ["Discharges","Sexual Discharges","Purification","Cleanliness","Purity"]
  },
  {
    chapter: 16,
    theme: "The Day of Atonement:  Annual atonement for the sins of the people.",
    keyTopics: ["Atonement","Day of Atonement","Scapegoat","High Priest","Blood Sacrifice"]
  },
  {
    chapter: 17,
    theme: "Blood Sacrifice:  The importance and exclusive nature of blood sacrifices.",
    keyTopics: ["Blood","Sacrifice","Holiness","Forbidden Practices","Centralized Worship"]
  },
  {
    chapter: 18,
    theme: "Sexual Morality:  Laws concerning sexual conduct.",
    keyTopics: ["Sexual Morality","Incest","Forbidden Relationships","Holiness","Purity"]
  },
  {
    chapter: 19,
    theme: "Holiness in Daily Life:  Diverse laws promoting righteousness and justice.",
    keyTopics: ["Holiness","Justice","Love","Neighbor","Integrity"]
  },
  {
    chapter: 20,
    theme: "Consequences of Disobedience:  Penalties for various sins and transgressions.",
    keyTopics: ["Disobedience","Consequences","Punishments","Sanctions","Holiness"]
  },
  {
    chapter: 21,
    theme: "Priests:  Requirements and restrictions for priests.",
    keyTopics: ["Priests","Requirements","Restrictions","Holiness","Purity"]
  },
  {
    chapter: 22,
    theme: "Holiness of Priests:  Further instructions on priestly holiness and conduct.",
    keyTopics: ["Priests","Holiness","Purity","Offerings","Restrictions"]
  },
  {
    chapter: 23,
    theme: "Sacred Festivals:  Instruction on the various feasts and festivals.",
    keyTopics: ["Festivals","Sabbaths","Feast of Unleavened Bread","Pentecost","Day of Atonement","Feast of Tabernacles"]
  },
  {
    chapter: 24,
    theme: "Incense and the Sabbath:  Regulations concerning incense and the Sabbath.",
    keyTopics: ["Incense","Sabbath","Blasphemy","Punishment","Holiness"]
  },
  {
    chapter: 25,
    theme: "The Sabbatical Year and Jubilee:  Laws concerning land ownership and social justice.",
    keyTopics: ["Sabbatical Year","Jubilee","Land Ownership","Debt Cancellation","Social Justice"]
  },
  {
    chapter: 26,
    theme: "Blessings of Obedience and Curses of Disobedience:  Consequences of following or rejecting God's laws.",
    keyTopics: ["Blessings","Curses","Obedience","Disobedience","Consequences"]
  },
  {
    chapter: 27,
    theme: "Vows and Consecration:  Laws concerning vows and consecrated things.",
    keyTopics: ["Vows","Consecration","Redemption","Valuation","Property"]
  }
];

export function getLeviticusChapterTheme(chapter: number): string {
  const theme = leviticusChapterThemes.find(t => t.chapter === chapter);
  return theme ? theme.theme : `Chapter ${chapter}`;
}

export function getLeviticusChapterKeyTopics(chapter: number): string[] {
  const theme = leviticusChapterThemes.find(t => t.chapter === chapter);
  return theme ? theme.keyTopics : [];
}

export function getLeviticusVerseThemes(chapter: number, verse: number): string[] {
  // This is a simplified version - in a full implementation, 
  // you might have verse-specific themes
  const chapterTopics = getLeviticusChapterKeyTopics(chapter);
  
  // Special cases for well-known verses
  const verseRef = `${chapter}:${verse}`;
  const specificThemes: { [key: string]: string[] } = {
    "1:1": [
        "Burnt Offering",
        "Whole Burnt Offering",
        "Dedication to God"
    ],
    "2:1": [
        "Grain Offering",
        "Food Offering",
        "Gratitude"
    ],
    "3:1": [
        "Peace Offering",
        "Fellowship",
        "Communion"
    ],
    "4:1": [
        "Sin Offering",
        "Unintentional Sin",
        "Atonement"
    ],
    "5:1": [
        "Guilt Offering",
        "Trespass",
        "Restoration"
    ],
    "6:1": [
        "Instructions on Offerings",
        "Priestly Duties",
        "Procedures"
    ],
    "7:1": [
        "Regulations on Offerings",
        "Blessings",
        "Holiness"
    ],
    "8:1": [
        "Priestly Consecration",
        "Aaron",
        "Sons of Aaron"
    ],
    "9:1": [
        "First Sacrifices",
        "Inauguration",
        "Aaron's Ministry"
    ],
    "10:1": [
        "Nadab and Abihu",
        "Strange Fire",
        "Obedience to God"
    ],
    "11:1": [
        "Clean and Unclean Animals",
        "Dietary Laws",
        "Holiness"
    ],
    "16:1": [
        "Day of Atonement",
        "Atonement for Sins",
        "Scapegoat"
    ],
    "17:1": [
        "Centralized Worship",
        "Blood Sacrifice",
        "Holiness"
    ],
    "18:1": [
        "Sexual Morality",
        "Forbidden Relationships",
        "Purity"
    ],
    "19:1": [
        "Holiness in Daily Life",
        "Justice",
        "Love for Neighbor"
    ],
    "20:1": [
        "Consequences of Disobedience",
        "Sanctions",
        "Divine Judgment"
    ],
    "23:1": [
        "Sacred Festivals",
        "Sabbaths",
        "Divine Appointments"
    ],
    "25:1": [
        "Sabbatical Year",
        "Jubilee",
        "Social Justice"
    ]
};
  
  if (specificThemes[verseRef]) {
    return [...new Set([...specificThemes[verseRef], ...chapterTopics.slice(0, 3)])];
  }
  
  return chapterTopics.slice(0, 3);
}

// Book metadata for Leviticus
export const leviticusBookInfo = {
  "name": "Leviticus",
  "description": "Leviticus outlines the laws and regulations governing Israelite worship, purity, and community life, emphasizing God's holiness and the people's need for atonement and reconciliation.",
  "testament": "old",
  "genre": "law",
  "author": "Moses",
  "chapters": 27,
  "verses": 859,
  "themes": [
    "Holiness",
    "Sacrifice",
    "Priesthood",
    "Purity",
    "Atonement",
    "Worship",
    "Law",
    "Community"
  ]
};
