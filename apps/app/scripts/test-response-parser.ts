#!/usr/bin/env tsx

import { ResponseParser } from '../lib/utils/response-parser';

// Test cases
const testCases = [
  {
    name: 'Essay with conversational preamble',
    input: `Of course. This is an excellent and foundational question for understanding sin, responsibility, and relationships.

Here is a breakdown of why Adam was wrong to blame Eve, framed in a way that can be useful for teaching, counseling, or personal reflection:

# Why Adam Was Wrong to Blame Eve

## 1. Personal Responsibility

Adam was directly commanded by God before Eve was even created. In Genesis 2:16-17, God told Adam not to eat from the tree of the knowledge of good and evil. This command was given to Adam alone, making him primarily responsible for obeying it.

## 2. Leadership Failure

As the first human and Eve's partner, Adam had a responsibility to guide and protect. Instead of intervening when the serpent tempted Eve, he stood by passively. Genesis 3:6 notes that Adam was "with her" during the temptation, suggesting he failed in his protective role.

## 3. Deflection of Blame

When confronted by God, Adam's response was to blame both Eve and indirectly God himself: "The woman you put here with me—she gave me some fruit from the tree, and I ate it" (Genesis 3:12). This shows a refusal to take ownership of his own choice.`,
    expectedConversational: `Of course. This is an excellent and foundational question for understanding sin, responsibility, and relationships.

Here is a breakdown of why Adam was wrong to blame Eve, framed in a way that can be useful for teaching, counseling, or personal reflection:`,
    expectedContentStart: '# Why Adam Was Wrong to Blame Eve'
  },
  {
    name: 'Direct essay without preamble',
    input: `# The Impact of Technology on Modern Society

Technology has fundamentally transformed how we live, work, and interact with one another. From the industrial revolution to the digital age, each technological leap has brought both opportunities and challenges.

## Communication Revolution

The way we communicate has been completely revolutionized. Email, instant messaging, and video calls have made global communication instantaneous and affordable.`,
    expectedConversational: '',
    expectedContentStart: '# The Impact of Technology on Modern Society'
  },
  {
    name: 'List format with introduction',
    input: `I'll help you create a comprehensive checklist for planning a wedding. Here's a detailed timeline:

# Wedding Planning Checklist

## 12 Months Before
- Set your budget
- Create your guest list
- Choose your wedding date
- Book your venue
- Hire a wedding planner (optional)

## 9 Months Before
- Shop for wedding dress
- Choose your bridal party
- Book photographer and videographer
- Start planning honeymoon`,
    expectedConversational: `I'll help you create a comprehensive checklist for planning a wedding. Here's a detailed timeline:`,
    expectedContentStart: '# Wedding Planning Checklist'
  }
];

console.log('Testing Response Parser\n');
console.log('='.repeat(80));

testCases.forEach((testCase, index) => {
  console.log(`\nTest ${index + 1}: ${testCase.name}`);
  console.log('-'.repeat(40));
  
  const parsed = ResponseParser.parseResponse(testCase.input);
  
  console.log('Parsed Response:');
  console.log('- Content Type:', parsed.contentType);
  console.log('- Has Conversational:', !!parsed.conversational);
  console.log('- Has Content:', !!parsed.content);
  console.log('- Word Count:', parsed.metadata?.wordCount || 0);
  console.log('- Has Headers:', parsed.metadata?.hasHeaders || false);
  console.log('- Title:', parsed.metadata?.title || 'None');
  
  // Check conversational part
  if (testCase.expectedConversational) {
    const conversationalMatch = parsed.conversational.trim() === testCase.expectedConversational.trim();
    console.log(`\nConversational Match: ${conversationalMatch ? '✓' : '✗'}`);
    if (!conversationalMatch) {
      console.log('Expected:', testCase.expectedConversational);
      console.log('Got:', parsed.conversational);
    }
  }
  
  // Check content start
  const contentStartMatch = parsed.content.startsWith(testCase.expectedContentStart);
  console.log(`Content Start Match: ${contentStartMatch ? '✓' : '✗'}`);
  if (!contentStartMatch) {
    console.log('Expected to start with:', testCase.expectedContentStart);
    console.log('Got:', parsed.content.substring(0, 100) + '...');
  }
  
  // Show preview
  const preview = ResponseParser.getContentPreview(parsed.content, 100);
  console.log('\nContent Preview:', preview);
});

// Test edge cases
console.log('\n\n' + '='.repeat(80));
console.log('Edge Case Tests\n');

const edgeCases = [
  {
    name: 'Very short response',
    input: 'This is a short response.',
    shouldBeParsedAs: 'conversational'
  },
  {
    name: 'Response with code blocks',
    input: `Here's how to implement a simple function:

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

This function takes a name parameter and returns a greeting.`,
    shouldBeParsedAs: 'content with code'
  }
];

edgeCases.forEach((edgeCase) => {
  console.log(`\nEdge Case: ${edgeCase.name}`);
  console.log('-'.repeat(40));
  
  const parsed = ResponseParser.parseResponse(edgeCase.input);
  console.log('Content Type:', parsed.contentType);
  console.log('Conversational Length:', parsed.conversational.length);
  console.log('Content Length:', parsed.content.length);
  console.log('Expected:', edgeCase.shouldBeParsedAs);
});

console.log('\n' + '='.repeat(80));
console.log('Test completed!');
