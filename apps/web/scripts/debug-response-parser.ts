import { ResponseParser } from '../lib/utils/response-parser';

// Test the specific response format mentioned by the user
const testResponse = `Of course. This is an excellent and foundational question for understanding sin, responsibility, and relationships.

Here is a breakdown of why Adam was wrong to blame Eve, framed in a way that can be useful for teaching, counseling, or personal reflection.

# Why Adam Was Wrong to Blame Eve

## 1. Personal Responsibility
Adam was given the command directly from God (Genesis 2:16-17), before Eve was even created. He had firsthand knowledge of God's instruction and was responsible for his own obedience.`;

console.log('Debugging response parser...\n');

// First, let's see what findContentStart returns
const lines = testResponse.split('\n');
console.log('Response lines:');
lines.forEach((line, i) => {
  console.log(`Line ${i}: "${line}"`);
});

console.log('\n\nChecking for sentence with transition:');
const sentenceWithTransition = /^(.+?\.) +(Here is|Here's|Below is|Following is|I've created|I've prepared|This is)/i;
const match = testResponse.match(sentenceWithTransition);
console.log('Match found:', match ? 'Yes' : 'No');
if (match) {
  console.log('Full match:', match[0]);
  console.log('First sentence:', match[1]);
  console.log('Content start index:', match[1].length + 1);
}

console.log('\n\nParsing response:');
const parsed = ResponseParser.parseResponse(testResponse);
console.log('Conversational:', JSON.stringify(parsed.conversational));
console.log('Content (first 100 chars):', parsed.content.substring(0, 100) + '...');

console.log('\n\nChecking transition sentence removal:');
const transitionSentencePattern = /^(Here is|Here's|Below is|Following is|I've created|I've prepared|This is)\s+[^.!?]+[.!?]\s*\n+/i;
const transitionMatch = parsed.content.match(transitionSentencePattern);
console.log('Transition match found in content:', transitionMatch ? 'Yes' : 'No');
if (transitionMatch) {
  console.log('Matched text:', JSON.stringify(transitionMatch[0]));
}
