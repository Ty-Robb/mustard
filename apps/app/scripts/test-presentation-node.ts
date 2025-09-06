import { PresentationParser } from '../lib/utils/presentation-parser';
import { ResponseAnalyzer } from '../lib/utils/response-analyzer';

// Test presentation content examples
const presentationExamples = [
  {
    name: 'Simple presentation with slide markers',
    userPrompt: 'Create a presentation about renewable energy',
    content: `[presentation]

## Slide 1: Title Slide
# Renewable Energy
The Future of Sustainable Power

--- slide ---

## Slide 2: Introduction
### What is Renewable Energy?

Renewable energy comes from natural sources that are constantly replenished:
- Solar power
- Wind energy
- Hydroelectric power
- Geothermal energy
- Biomass

--- slide ---

## Slide 3: Benefits
### Why Choose Renewable Energy?

* Environmentally friendly
* Sustainable for future generations
* Reduces carbon footprint
* Creates jobs
* Energy independence

--- slide ---

## Slide 4: Quote
> "The future is green energy, sustainability, renewable energy."
— Arnold Schwarzenegger

--- slide ---

## Slide 5: Conclusion
### The Path Forward

Together, we can build a sustainable future through renewable energy adoption.

Thank you!`
  },
  {
    name: 'Presentation with different layouts',
    userPrompt: 'Make slides about project management',
    content: `# Project Management Excellence
[title slide]

Slide 1:
# Project Management Excellence
Your Guide to Successful Projects

Slide 2:
## The Project Lifecycle
[two column]
Planning | Execution
- Define scope | - Implement plan
- Set timeline | - Monitor progress
- Allocate resources | - Manage risks

Slide 3:
## Key Success Factors
- Clear objectives
- Strong communication
- Risk management
- Stakeholder engagement
- Regular monitoring

Slide 4:
[quote]
"A project without a plan is just a wish."
— Project Management Proverb

Slide 5:
## Conclusion
Effective project management leads to successful outcomes!`
  },
  {
    name: 'Presentation without explicit markers',
    userPrompt: 'Create a slideshow about healthy eating',
    content: `# Healthy Eating Habits

## Introduction to Nutrition

Good nutrition is the foundation of a healthy lifestyle. Let's explore the key principles of healthy eating.

## The Food Groups

Understanding the five main food groups:
- Fruits and vegetables
- Whole grains
- Lean proteins
- Dairy products
- Healthy fats

## Benefits of Healthy Eating

* Increased energy levels
* Better immune system
* Improved mental clarity
* Weight management
* Disease prevention

## Making Smart Choices

Choose whole foods over processed options. Read nutrition labels and practice portion control.

## Your Health Journey

Start small, make gradual changes, and celebrate your progress!`
  }
];

// Test the presentation parser
console.log('🧪 Testing Presentation Parser\n');

presentationExamples.forEach((example, index) => {
  console.log(`\n📊 Test ${index + 1}: ${example.name}`);
  console.log('User Prompt:', example.userPrompt);
  console.log('---');
  
  // Test response analyzer
  const analysis = ResponseAnalyzer.analyzeResponse(example.userPrompt, example.content);
  console.log('Response Analysis:');
  console.log('- Is Presentation:', analysis.isPresentationWorthy);
  console.log('- Content Type:', analysis.contentType);
  console.log('- Confidence:', analysis.confidence);
  console.log('- Reasons:', analysis.reasons);
  
  // Test presentation parser
  const parsed = PresentationParser.parsePresentation(example.content);
  
  if (parsed) {
    console.log('\n✅ Presentation Parsed Successfully!');
    console.log('- Title:', parsed.title);
    console.log('- Total Slides:', parsed.slides.length);
    console.log('- Estimated Duration:', parsed.metadata?.estimatedDuration, 'minutes');
    
    console.log('\nSlides:');
    parsed.slides.forEach((slide, slideIndex) => {
      console.log(`\n  Slide ${slideIndex + 1} (${slide.layout}):`);
      console.log('  - Title:', slide.content.title || '(no title)');
      if (slide.content.subtitle) {
        console.log('  - Subtitle:', slide.content.subtitle);
      }
      if (slide.content.body) {
        console.log('  - Body:', slide.content.body.substring(0, 50) + '...');
      }
      if (slide.content.bulletPoints) {
        console.log('  - Bullet Points:', slide.content.bulletPoints.length, 'items');
      }
      if (slide.content.columns) {
        console.log('  - Columns:', slide.content.columns.length);
      }
    });
  } else {
    console.log('\n❌ Failed to parse presentation');
  }
  
  console.log('\n' + '='.repeat(80));
});

// Test edge cases
console.log('\n\n🔍 Testing Edge Cases\n');

const edgeCases = [
  {
    name: 'Non-presentation content',
    content: 'This is just a regular response without any presentation markers.',
    shouldParse: false
  },
  {
    name: 'Single slide',
    content: '[presentation]\n# Welcome\nThis is a single slide presentation',
    shouldParse: true
  },
  {
    name: 'Empty slides',
    content: '[presentation]\n--- slide ---\n--- slide ---',
    shouldParse: true
  }
];

edgeCases.forEach((testCase) => {
  console.log(`\nTesting: ${testCase.name}`);
  const parsed = PresentationParser.parsePresentation(testCase.content);
  const didParse = parsed !== null;
  const expected = testCase.shouldParse;
  
  if (didParse === expected) {
    console.log(`✅ Passed: ${didParse ? 'Parsed' : 'Did not parse'} as expected`);
    if (parsed) {
      console.log(`   - Slides: ${parsed.slides.length}`);
    }
  } else {
    console.log(`❌ Failed: Expected ${expected ? 'to parse' : 'not to parse'}, but got ${didParse}`);
  }
});

console.log('\n\n✨ Testing complete!');
