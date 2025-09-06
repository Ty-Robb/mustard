import { ResponseParser } from '../lib/utils/response-parser';

// Test the specific response format mentioned by the user
const testResponse = `Of course. This is an excellent and foundational question for understanding sin, responsibility, and relationships.

Here is a breakdown of why Adam was wrong to blame Eve, framed in a way that can be useful for teaching, counseling, or personal reflection.

# Why Adam Was Wrong to Blame Eve

## 1. Personal Responsibility
Adam was given the command directly from God (Genesis 2:16-17), before Eve was even created. He had firsthand knowledge of God's instruction and was responsible for his own obedience.

## 2. Adam Was Present
Genesis 3:6 indicates that Adam was "with her" when Eve ate the fruit. He wasn't deceived or tricked - he was a passive participant who failed to intervene or remind Eve of God's command.

## 3. Shifting Blame is Sin
By blaming Eve (and indirectly God - "the woman YOU gave me"), Adam demonstrated pride and an unwillingness to take responsibility. This blame-shifting itself was sinful.`;

console.log('Testing specific response format...\n');

const parsed = ResponseParser.parseResponse(testResponse);

console.log('Parsed Response:');
console.log('================');
console.log('\nConversational Part:');
console.log('-------------------');
console.log(parsed.conversational);
console.log('\nContent Part:');
console.log('-------------');
console.log(parsed.content);
console.log('\nContent Type:', parsed.contentType);
console.log('Metadata:', parsed.metadata);

// Verify the expected behavior
console.log('\n\nVerification:');
console.log('=============');
console.log('✓ Conversational part should be: "Of course."');
console.log('  Actual:', JSON.stringify(parsed.conversational));
console.log('\n✓ Content should start with: "This is an excellent..."');
console.log('  Actual starts with:', parsed.content.substring(0, 50) + '...');
console.log('\n✓ The "Here is a breakdown..." sentence should NOT be included');
console.log('  Content includes "Here is a breakdown"?:', parsed.content.includes('Here is a breakdown'));
