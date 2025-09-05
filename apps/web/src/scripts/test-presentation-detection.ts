import { ResponseAnalyzer } from '../lib/utils/response-analyzer';

console.log('Testing Presentation Detection\n');

// Test cases for presentation detection
const testCases = [
  // Should detect presentations
  {
    prompt: 'Create a presentation about climate change',
    expected: true,
    description: 'Direct presentation request',
  },
  {
    prompt: 'Make slides about renewable energy',
    expected: true,
    description: 'Slides request',
  },
  {
    prompt: 'Build a slide deck for my meeting',
    expected: true,
    description: 'Slide deck request',
  },
  {
    prompt: 'I need a PowerPoint presentation on AI',
    expected: true,
    description: 'PowerPoint request',
  },
  {
    prompt: 'Can you create a pitch deck for our startup?',
    expected: true,
    description: 'Pitch deck request',
  },
  {
    prompt: 'Turn this essay into a presentation',
    expected: true,
    description: 'Essay to presentation conversion',
  },
  
  // Should NOT detect presentations
  {
    prompt: 'Write an essay about climate change',
    expected: false,
    description: 'Essay request',
  },
  {
    prompt: 'Explain how solar panels work',
    expected: false,
    description: 'General explanation',
  },
  {
    prompt: 'Create a chart showing sales data',
    expected: false,
    description: 'Chart request',
  },
];

console.log('Testing User Prompt Analysis:');
console.log('================================\n');

let passedTests = 0;
let failedTests = 0;

testCases.forEach((testCase) => {
  const result = ResponseAnalyzer.analyzeUserPrompt(testCase.prompt);
  const isPresentation = result.isPresentation;
  const passed = isPresentation === testCase.expected;
  
  if (passed) {
    passedTests++;
    console.log(`✅ PASS: ${testCase.description}`);
  } else {
    failedTests++;
    console.log(`❌ FAIL: ${testCase.description}`);
  }
  
  console.log(`   Prompt: "${testCase.prompt}"`);
  console.log(`   Expected: ${testCase.expected}, Got: ${isPresentation}`);
  console.log(`   Analysis: Essay=${result.isEssay}, Presentation=${result.isPresentation}\n`);
});

// Test streaming content detection
console.log('\nTesting Streaming Content Detection:');
console.log('=====================================\n');

const streamingTests = [
  {
    prompt: 'Create a presentation about AI',
    content: '# Artificial Intelligence Presentation\n\nSlide 1: Introduction\n- What is AI?\n- History of AI',
    expectedPresentation: true,
    description: 'Presentation with slide markers',
  },
  {
    prompt: 'Write about machine learning',
    content: '# Machine Learning\n\nMachine learning is a subset of artificial intelligence...',
    expectedPresentation: false,
    description: 'Essay content',
  },
];

streamingTests.forEach((test) => {
  const result = ResponseAnalyzer.analyzeStreamingContent(test.prompt, test.content);
  const passed = result.shouldOpenPresentation === test.expectedPresentation;
  
  if (passed) {
    passedTests++;
    console.log(`✅ PASS: ${test.description}`);
  } else {
    failedTests++;
    console.log(`❌ FAIL: ${test.description}`);
  }
  
  console.log(`   Content Type: ${result.contentType}`);
  console.log(`   Should Open Editor: ${result.shouldOpenEditor}`);
  console.log(`   Should Open Presentation: ${result.shouldOpenPresentation}\n`);
});

// Test full response analysis
console.log('\nTesting Full Response Analysis:');
console.log('================================\n');

const responseTests = [
  {
    prompt: 'Create a presentation on renewable energy',
    response: `# Renewable Energy Presentation

## Slide 1: Introduction
- What is renewable energy?
- Why is it important?
- Types of renewable sources

## Slide 2: Solar Power
- How solar panels work
- Benefits and challenges
- Current adoption rates

## Slide 3: Wind Energy
- Wind turbine technology
- Offshore vs onshore wind
- Environmental impact`,
    expectedPresentation: true,
    description: 'Full presentation response',
  },
];

responseTests.forEach((test) => {
  const result = ResponseAnalyzer.analyzeResponse(test.prompt, test.response);
  const passed = result.isPresentationWorthy === test.expectedPresentation;
  
  if (passed) {
    passedTests++;
    console.log(`✅ PASS: ${test.description}`);
  } else {
    failedTests++;
    console.log(`❌ FAIL: ${test.description}`);
  }
  
  console.log(`   Content Type: ${result.contentType}`);
  console.log(`   Is Presentation Worthy: ${result.isPresentationWorthy}`);
  console.log(`   Confidence: ${result.confidence}%`);
  console.log(`   Reasons: ${result.reasons.join(', ')}\n`);
});

// Summary
console.log('\n=============================');
console.log('Test Summary:');
console.log(`Total Tests: ${passedTests + failedTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${failedTests}`);
console.log(`Success Rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`);
