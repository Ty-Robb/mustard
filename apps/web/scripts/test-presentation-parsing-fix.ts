import { PresentationParser } from '../lib/utils/presentation-parser';
import { ResponseParser } from '../lib/utils/response-parser';

// Test content with formatting tags
const testContent = `[SUMMARY]
This presentation covers the key aspects of effective communication in the workplace, including verbal and non-verbal communication techniques, active listening skills, and strategies for clear messaging.
[/SUMMARY]

[CONTENT]
[presentation]

## Slide 1: Effective Communication in the Workplace
### Building Better Connections

---

## Slide 2: Why Communication Matters
- Improves team collaboration
- Reduces misunderstandings
- Increases productivity
- Builds stronger relationships
- Enhances problem-solving

---

## Slide 3: Types of Communication
### Verbal Communication
- Face-to-face conversations
- Phone calls
- Video meetings
- Presentations

### Non-Verbal Communication
- Body language
- Facial expressions
- Tone of voice
- Eye contact

---

## Slide 4: Active Listening Skills
> "The most important thing in communication is hearing what isn't said."
— Peter Drucker

Key techniques:
- Give full attention
- Avoid interrupting
- Ask clarifying questions
- Provide feedback
- Show empathy

---

## Slide 5: Clear Messaging Strategies
1. Know your audience
2. Be concise and specific
3. Use simple language
4. Structure your message
5. Confirm understanding

---

## Slide 6: Common Communication Barriers
- Language differences
- Cultural misunderstandings
- Emotional barriers
- Physical distractions
- Assumptions and biases

---

## Slide 7: Improving Your Communication
### Action Steps
- Practice active listening daily
- Seek feedback on your communication style
- Observe effective communicators
- Join speaking clubs or workshops
- Read books on communication

---

## Slide 8: Conclusion
Effective communication is a skill that can be learned and improved. By focusing on both verbal and non-verbal aspects, practicing active listening, and being mindful of barriers, you can become a more effective communicator and build stronger professional relationships.
[/CONTENT]`;

console.log('Testing presentation parsing with formatting tags...\n');

// First, parse with ResponseParser to extract clean content
const parsedResponse = ResponseParser.parseResponse(testContent);
console.log('Response Parser Results:');
console.log('- Has conversational:', !!parsedResponse.conversational);
console.log('- Has content:', !!parsedResponse.content);
console.log('- Has summary:', !!parsedResponse.summary);
console.log('- Content type:', parsedResponse.contentType);
console.log('\nExtracted Summary:');
console.log(parsedResponse.summary);
console.log('\n---\n');

// Test 1: Parse raw content (should fail or show tags)
console.log('Test 1: Parsing raw content with tags');
const rawParsed = PresentationParser.parsePresentation(testContent);
if (rawParsed) {
  console.log('✗ Incorrectly parsed presentation from raw content');
  console.log('First slide content:', rawParsed.slides[0]?.content);
} else {
  console.log('✓ Correctly did not parse presentation from raw content with tags');
}

console.log('\n---\n');

// Test 2: Parse cleaned content (should succeed)
console.log('Test 2: Parsing cleaned content without tags');
const cleanContent = parsedResponse.content || testContent;
const cleanParsed = PresentationParser.parsePresentation(cleanContent);

if (cleanParsed) {
  console.log('✓ Successfully parsed presentation from clean content');
  console.log('Title:', cleanParsed.title);
  console.log('Number of slides:', cleanParsed.slides.length);
  console.log('\nSlide details:');
  
  cleanParsed.slides.forEach((slide, index) => {
    console.log(`\nSlide ${index + 1}:`);
    console.log('- Layout:', slide.layout);
    console.log('- Title:', slide.content.title || '(no title)');
    if (slide.content.subtitle) {
      console.log('- Subtitle:', slide.content.subtitle);
    }
    if (slide.content.bulletPoints) {
      console.log('- Bullet points:', slide.content.bulletPoints.length);
    }
    if (slide.content.body) {
      console.log('- Has body text');
    }
  });
} else {
  console.log('✗ Failed to parse presentation from clean content');
}

console.log('\n---\n');

// Test 3: Verify no formatting tags in parsed content
console.log('Test 3: Checking for formatting tags in parsed slides');
if (cleanParsed) {
  let hasFormattingTags = false;
  
  cleanParsed.slides.forEach((slide, index) => {
    const content = JSON.stringify(slide.content);
    if (content.includes('[SUMMARY]') || content.includes('[CONTENT]') || 
        content.includes('[/SUMMARY]') || content.includes('[/CONTENT]')) {
      console.log(`✗ Slide ${index + 1} contains formatting tags`);
      hasFormattingTags = true;
    }
  });
  
  if (!hasFormattingTags) {
    console.log('✓ No formatting tags found in any slides');
  }
}

console.log('\n\nTest completed!');
