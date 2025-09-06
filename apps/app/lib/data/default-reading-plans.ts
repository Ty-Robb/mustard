import { ReadingPlan } from '@/types';

// Helper function to generate date entries for a plan
function generatePlanEntries(passages: Array<{ day: number; passages: string[] }>, duration: number): ReadingPlan['entries'] {
  const entries: ReadingPlan['entries'] = [];
  
  for (let day = 1; day <= duration; day++) {
    const dayPassages = passages.find(p => p.day === day);
    entries.push({
      day,
      passages: dayPassages?.passages || [],
      completed: false,
    });
  }
  
  return entries;
}

// M'Cheyne Two-Year Plan - A more contemplative pace
export const mcheyneeTwoYearPlan: Partial<ReadingPlan> = {
  name: "M'Cheyne Two-Year Bible Reading Plan",
  description: "Robert Murray M'Cheyne's classic reading plan adapted for a two-year journey. Read through the Old Testament once and the New Testament twice with four daily readings at a more contemplative pace.",
  duration: 730, // 2 years
  isPublic: true,
  tags: ['classic', 'comprehensive', 'two-year', 'mcheyne'],
  entries: generatePlanEntries([
    { day: 1, passages: ['Genesis 1', 'Matthew 1', 'Ezra 1', 'Acts 1'] },
    { day: 2, passages: ['Genesis 2', 'Matthew 2', 'Ezra 2', 'Acts 2'] },
    // This would continue for all 730 days
    // For now, we'll implement a pattern that can be expanded
  ], 730),
};

// Grant Horner's Bible Reading System
export const grantHornerPlan: Partial<ReadingPlan> = {
  name: "Grant Horner's Bible Reading System",
  description: "An intensive reading plan with 10 chapters daily from 10 different sections of the Bible. Read the Gospels and Paul's letters multiple times while covering the entire Bible.",
  duration: 365,
  isPublic: true,
  tags: ['intensive', 'comprehensive', 'one-year', 'grant-horner', '10-chapters'],
  entries: generatePlanEntries([
    { 
      day: 1, 
      passages: [
        'Matthew 1',      // List 1: Gospels
        'Genesis 1',      // List 2: Pentateuch
        'Romans 1',       // List 3: Paul's Letters
        '1 Thessalonians 1', // List 4: Paul's Letters II
        'Job 1',          // List 5: Wisdom Literature
        'Psalm 1',        // List 6: Psalms
        'Proverbs 1',     // List 7: Proverbs
        'Joshua 1',       // List 8: History
        'Isaiah 1',       // List 9: Prophets
        'Acts 1'          // List 10: Acts & Epistles
      ] 
    },
    // Pattern continues with each list cycling at different rates
  ], 365),
};

// Chronological Cross-Reference Plan
export const chronologicalCrossReferencePlan: Partial<ReadingPlan> = {
  name: "Chronological Cross-Reference Bible Reading Plan",
  description: "Read the Bible chronologically with parallel New Testament passages that fulfill or reference Old Testament events. See how the New Testament fulfills the Old in a rich, cohesive narrative.",
  duration: 365,
  isPublic: true,
  tags: ['chronological', 'cross-reference', 'one-year', 'fulfillment'],
  entries: generatePlanEntries([
    { 
      day: 1, 
      passages: [
        'Genesis 1-3',     // Creation and Fall
        'John 1:1-5',      // In the beginning was the Word
        'Colossians 1:15-17', // Christ in creation
        'Hebrews 1:1-3'    // God speaking through the Son
      ] 
    },
    { 
      day: 2, 
      passages: [
        'Genesis 4-7',     // Cain, Abel, and Noah
        'Hebrews 11:4-7',  // By faith Abel and Noah
        '1 John 3:11-12',  // Not like Cain
        '2 Peter 2:5'      // Noah, preacher of righteousness
      ] 
    },
    // Continue with chronological OT and thematic NT connections
  ], 365),
};

// Bible in 90 Days Challenge
export const bible90DaysPlan: Partial<ReadingPlan> = {
  name: "Bible in 90 Days Challenge",
  description: "Read through the entire Bible in just 90 days. This intensive plan requires about 12-15 pages of reading per day, perfect for those wanting to get a quick overview of Scripture.",
  duration: 90,
  isPublic: true,
  tags: ['intensive', 'challenge', '90-days', 'overview'],
  entries: generatePlanEntries([
    { day: 1, passages: ['Genesis 1-16'] },
    { day: 2, passages: ['Genesis 17-28'] },
    { day: 3, passages: ['Genesis 29-40'] },
    { day: 4, passages: ['Genesis 41-50', 'Exodus 1-8'] },
    // Continue through the entire Bible in 90 days
  ], 90),
};

// One Year Bible Plan
export const oneYearBiblePlan: Partial<ReadingPlan> = {
  name: "One Year Bible Reading Plan",
  description: "Read through the entire Bible in one year with daily readings from the Old Testament, New Testament, Psalms, and Proverbs.",
  duration: 365,
  isPublic: true,
  tags: ['classic', 'one-year', 'balanced', 'daily'],
  entries: generatePlanEntries([
    { 
      day: 1, 
      passages: [
        'Genesis 1-3',     // Old Testament
        'Matthew 1',       // New Testament
        'Psalm 1',         // Psalms
        'Proverbs 1:1-6'   // Proverbs
      ] 
    },
    // Continue for all 365 days
  ], 365),
};

// Gospels in 30 Days
export const gospels30DaysPlan: Partial<ReadingPlan> = {
  name: "The Gospels in 30 Days",
  description: "Focus on the life and teachings of Jesus by reading through all four Gospels in one month. Perfect for new believers or anyone wanting to deepen their understanding of Christ.",
  duration: 30,
  isPublic: true,
  tags: ['gospels', 'jesus', '30-days', 'beginner-friendly'],
  entries: generatePlanEntries([
    { day: 1, passages: ['Matthew 1-4'] },
    { day: 2, passages: ['Matthew 5-7'] },
    { day: 3, passages: ['Matthew 8-10'] },
    { day: 4, passages: ['Matthew 11-13'] },
    { day: 5, passages: ['Matthew 14-16'] },
    { day: 6, passages: ['Matthew 17-19'] },
    { day: 7, passages: ['Matthew 20-22'] },
    { day: 8, passages: ['Matthew 23-25'] },
    { day: 9, passages: ['Matthew 26-28'] },
    { day: 10, passages: ['Mark 1-3'] },
    { day: 11, passages: ['Mark 4-6'] },
    { day: 12, passages: ['Mark 7-9'] },
    { day: 13, passages: ['Mark 10-12'] },
    { day: 14, passages: ['Mark 13-16'] },
    { day: 15, passages: ['Luke 1-3'] },
    { day: 16, passages: ['Luke 4-6'] },
    { day: 17, passages: ['Luke 7-9'] },
    { day: 18, passages: ['Luke 10-12'] },
    { day: 19, passages: ['Luke 13-15'] },
    { day: 20, passages: ['Luke 16-18'] },
    { day: 21, passages: ['Luke 19-21'] },
    { day: 22, passages: ['Luke 22-24'] },
    { day: 23, passages: ['John 1-3'] },
    { day: 24, passages: ['John 4-6'] },
    { day: 25, passages: ['John 7-9'] },
    { day: 26, passages: ['John 10-12'] },
    { day: 27, passages: ['John 13-15'] },
    { day: 28, passages: ['John 16-18'] },
    { day: 29, passages: ['John 19-21'] },
    { day: 30, passages: ['Review favorite passages'] },
  ], 30),
};

// Psalms and Proverbs Plan
export const psalmProverbsPlan: Partial<ReadingPlan> = {
  name: "Psalms and Proverbs in 60 Days",
  description: "Read through the wisdom literature of Psalms and Proverbs in two months. Great for daily devotion and practical wisdom.",
  duration: 60,
  isPublic: true,
  tags: ['wisdom', 'psalms', 'proverbs', '60-days', 'devotional'],
  entries: generatePlanEntries([
    { day: 1, passages: ['Psalm 1-5', 'Proverbs 1'] },
    { day: 2, passages: ['Psalm 6-10', 'Proverbs 2'] },
    // Continue through all Psalms and Proverbs
  ], 60),
};

// New Testament in 90 Days
export const newTestament90DaysPlan: Partial<ReadingPlan> = {
  name: "New Testament in 90 Days",
  description: "Read through the entire New Testament in three months. Focus on the life of Jesus, the early church, and the apostles' teachings.",
  duration: 90,
  isPublic: true,
  tags: ['new-testament', '90-days', 'jesus', 'apostles'],
  entries: generatePlanEntries([
    { day: 1, passages: ['Matthew 1-4'] },
    { day: 2, passages: ['Matthew 5-7'] },
    { day: 3, passages: ['Matthew 8-10'] },
    // Continue through the entire New Testament
  ], 90),
};

// Export all default plans
export const defaultReadingPlans: Partial<ReadingPlan>[] = [
  mcheyneeTwoYearPlan,
  grantHornerPlan,
  chronologicalCrossReferencePlan,
  bible90DaysPlan,
  oneYearBiblePlan,
  gospels30DaysPlan,
  psalmProverbsPlan,
  newTestament90DaysPlan,
];

// Function to get a specific default plan by name
export function getDefaultPlan(planName: string): Partial<ReadingPlan> | undefined {
  return defaultReadingPlans.find(plan => plan.name === planName);
}

// Function to get plans by tag
export function getDefaultPlansByTag(tag: string): Partial<ReadingPlan>[] {
  return defaultReadingPlans.filter(plan => plan.tags?.includes(tag));
}

// Function to get plans by duration range
export function getDefaultPlansByDuration(minDays: number, maxDays: number): Partial<ReadingPlan>[] {
  return defaultReadingPlans.filter(plan => 
    plan.duration && plan.duration >= minDays && plan.duration <= maxDays
  );
}
