import { MatthewChapterTheme } from '@repo/types';

export const matthewChapterThemes: MatthewChapterTheme[] = [
  {
    chapter: 1,
    theme: "The Genealogy and Birth of Jesus Christ",
    keyTopics: ["genealogy", "Abraham", "David", "virgin birth", "Emmanuel", "Joseph's dream"]
  },
  {
    chapter: 2,
    theme: "The Visit of the Magi and Flight to Egypt",
    keyTopics: ["wise men", "star", "Herod", "gifts", "flight to Egypt", "massacre of innocents", "return to Nazareth"]
  },
  {
    chapter: 3,
    theme: "John the Baptist and the Baptism of Jesus",
    keyTopics: ["John the Baptist", "repentance", "baptism", "Holy Spirit", "dove", "voice from heaven"]
  },
  {
    chapter: 4,
    theme: "The Temptation of Jesus and Beginning of Ministry",
    keyTopics: ["temptation", "Satan", "fasting", "scripture", "calling disciples", "Peter", "Andrew", "James", "John"]
  },
  {
    chapter: 5,
    theme: "Sermon on the Mount - The Beatitudes and Kingdom Ethics",
    keyTopics: ["beatitudes", "salt and light", "law fulfillment", "anger", "adultery", "divorce", "oaths", "retaliation", "love enemies"]
  },
  {
    chapter: 6,
    theme: "Sermon on the Mount - Prayer and Trust in God",
    keyTopics: ["giving", "Lord's Prayer", "forgiveness", "fasting", "treasures", "worry", "seek first kingdom"]
  },
  {
    chapter: 7,
    theme: "Sermon on the Mount - Judging and the Golden Rule",
    keyTopics: ["judging", "speck and plank", "pearls before swine", "ask seek knock", "golden rule", "narrow gate", "false prophets", "wise builder"]
  },
  {
    chapter: 8,
    theme: "Jesus' Authority in Healing and Nature",
    keyTopics: ["leper healed", "centurion's faith", "Peter's mother-in-law", "calming storm", "demons into pigs"]
  },
  {
    chapter: 9,
    theme: "Jesus' Authority to Forgive and Call Disciples",
    keyTopics: ["paralytic healed", "forgiveness of sins", "Matthew called", "new wineskins", "ruler's daughter", "woman with bleeding", "blind men", "mute man"]
  },
  {
    chapter: 10,
    theme: "The Twelve Apostles Sent Out",
    keyTopics: ["twelve apostles", "mission instructions", "persecution", "fear God not man", "division", "take up cross", "rewards"]
  },
  {
    chapter: 11,
    theme: "Jesus and John the Baptist",
    keyTopics: ["John's question", "Jesus' testimony about John", "woes to cities", "rest for the weary", "easy yoke"]
  },
  {
    chapter: 12,
    theme: "Lord of the Sabbath and Spiritual Warfare",
    keyTopics: ["Sabbath", "healing on Sabbath", "chosen servant", "Beelzebul", "blasphemy against Spirit", "sign of Jonah", "Jesus' true family"]
  },
  {
    chapter: 13,
    theme: "Parables of the Kingdom",
    keyTopics: ["parable of sower", "purpose of parables", "wheat and tares", "mustard seed", "leaven", "hidden treasure", "pearl", "net", "prophet without honor"]
  },
  {
    chapter: 14,
    theme: "Miracles of Provision and Power",
    keyTopics: ["John Baptist beheaded", "feeding 5000", "walking on water", "Peter's faith", "healing at Gennesaret"]
  },
  {
    chapter: 15,
    theme: "True Defilement and Gentile Faith",
    keyTopics: ["traditions of elders", "what defiles", "Canaanite woman's faith", "healing many", "feeding 4000"]
  },
  {
    chapter: 16,
    theme: "Peter's Confession and the Cost of Discipleship",
    keyTopics: ["sign seeking", "leaven of Pharisees", "Peter's confession", "keys of kingdom", "Jesus predicts death", "take up cross", "lose life to save it"]
  },
  {
    chapter: 17,
    theme: "The Transfiguration and Faith",
    keyTopics: ["transfiguration", "Moses and Elijah", "voice from cloud", "epileptic boy healed", "faith as mustard seed", "temple tax"]
  },
  {
    chapter: 18,
    theme: "Kingdom Greatness and Forgiveness",
    keyTopics: ["greatest in kingdom", "causing to stumble", "lost sheep", "church discipline", "binding and loosing", "unmerciful servant", "seventy times seven"]
  },
  {
    chapter: 19,
    theme: "Marriage, Children, and Riches",
    keyTopics: ["divorce", "marriage", "blessing children", "rich young ruler", "camel through needle", "first will be last"]
  },
  {
    chapter: 20,
    theme: "Kingdom Values and Service",
    keyTopics: ["workers in vineyard", "equal payment", "death prediction", "mother's request", "servant leadership", "blind men healed"]
  },
  {
    chapter: 21,
    theme: "The Triumphal Entry and Temple Cleansing",
    keyTopics: ["triumphal entry", "hosanna", "temple cleansing", "fig tree cursed", "authority questioned", "two sons", "wicked tenants"]
  },
  {
    chapter: 22,
    theme: "Parables of Judgment and Questions",
    keyTopics: ["wedding banquet", "render to Caesar", "resurrection question", "greatest commandment", "David's son"]
  },
  {
    chapter: 23,
    theme: "Woes to the Scribes and Pharisees",
    keyTopics: ["seven woes", "hypocrisy", "blind guides", "whitewashed tombs", "Jerusalem lament", "prophets killed"]
  },
  {
    chapter: 24,
    theme: "The Olivet Discourse - End Times",
    keyTopics: ["temple destruction", "signs of end", "false messiahs", "tribulation", "Son of Man coming", "fig tree lesson", "no one knows hour", "be ready"]
  },
  {
    chapter: 25,
    theme: "Parables of Readiness and Final Judgment",
    keyTopics: ["ten virgins", "talents", "faithful servant", "sheep and goats", "final judgment", "eternal life", "eternal punishment"]
  },
  {
    chapter: 26,
    theme: "The Passion Begins",
    keyTopics: ["plot to kill Jesus", "anointing at Bethany", "Judas betrays", "Last Supper", "Gethsemane", "arrest", "Peter's denial", "trial before Caiaphas"]
  },
  {
    chapter: 27,
    theme: "The Crucifixion and Death of Jesus",
    keyTopics: ["Judas' remorse", "trial before Pilate", "Barabbas", "crown of thorns", "crucifixion", "mocking", "death", "temple veil torn", "burial"]
  },
  {
    chapter: 28,
    theme: "The Resurrection and Great Commission",
    keyTopics: ["empty tomb", "angel's message", "risen Lord", "guards' report", "Great Commission", "make disciples", "all authority", "always with you"]
  }
];

export function getChapterTheme(chapter: number): string {
  const theme = matthewChapterThemes.find(t => t.chapter === chapter);
  return theme ? theme.theme : `Chapter ${chapter}`;
}

export function getChapterKeyTopics(chapter: number): string[] {
  const theme = matthewChapterThemes.find(t => t.chapter === chapter);
  return theme ? theme.keyTopics : [];
}

export function getVerseThemes(chapter: number, verse: number): string[] {
  // This is a simplified version - in a full implementation, 
  // you might have verse-specific themes
  const chapterTopics = getChapterKeyTopics(chapter);
  
  // Special cases for well-known verses
  const verseRef = `${chapter}:${verse}`;
  const specificThemes: { [key: string]: string[] } = {
    "1:23": ["virgin birth", "Emmanuel", "prophecy fulfilled"],
    "3:17": ["Trinity", "baptism", "God's voice", "beloved Son"],
    "5:3-12": ["beatitudes", "kingdom of heaven", "blessed"],
    "6:9-13": ["Lord's Prayer", "prayer", "forgiveness"],
    "7:12": ["golden rule", "love", "ethics"],
    "11:28-30": ["rest", "burden", "yoke", "gentleness"],
    "16:16": ["confession", "Christ", "Son of God"],
    "16:18": ["church", "Peter", "keys of kingdom"],
    "22:37-39": ["greatest commandment", "love God", "love neighbor"],
    "28:19-20": ["Great Commission", "baptism", "Trinity", "discipleship"]
  };
  
  if (specificThemes[verseRef]) {
    return [...new Set([...specificThemes[verseRef], ...chapterTopics.slice(0, 3)])];
  }
  
  return chapterTopics.slice(0, 3);
}
