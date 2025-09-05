import { ResponseParser } from '../lib/utils/response-parser';

// Test case from the task
const testResponse = `Of course. This is an excellent and foundational question for understanding sin, responsibility, and relationships.

Here is a breakdown of why Adam was wrong to blame Eve, framed in a way that can be useful for teaching, counseling, or personal reflection.

## 1. Personal Responsibility

Adam had direct communication with God and received the command not to eat from the tree before Eve was created (Genesis 2:16-17). He was fully aware of the consequences and had personal responsibility for his actions.

## 2. Failed Leadership

Rather than protecting or guiding Eve, Adam was passive. He was "with her" during the temptation (Genesis 3:6) but remained silent. His blame-shifting reveals a failure to take leadership responsibility in the relationship.

## 3. Breaking Trust with God

By blaming Eve (and indirectly God who "gave" him Eve), Adam damaged his relationship with both. He chose self-preservation over honesty and accountability, showing a lack of integrity.`;

console.log('Testing response parser with the specific case...\n');

const parsed = ResponseParser.parseResponse(testResponse);

console.log('Conversational part:');
console.log('-------------------');
console.log(parsed.conversational);
console.log('\nContent part:');
console.log('-------------');
console.log(parsed.content);
console.log('\nContent type:', parsed.contentType);
console.log('Metadata:', parsed.metadata);

// Verify the transition sentence is removed
const hasTransitionSentence = parsed.content.includes('Here is a breakdown of why Adam was wrong to blame Eve');
console.log('\nTransition sentence removed:', !hasTransitionSentence);

// Verify the conversational part is correct
const expectedConversational = 'Of course. This is an excellent and foundational question for understanding sin, responsibility, and relationships.';
console.log('Conversational part correct:', parsed.conversational === expectedConversational);
