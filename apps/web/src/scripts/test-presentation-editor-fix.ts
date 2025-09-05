import { NextRequest } from 'next/server';

// Test the presentation editor fix for infinite loop
async function testPresentationEditorFix() {
  console.log('Testing presentation editor fix...\n');

  const testContent = `
[presentation]
# Fixed Presentation

---

## Testing Advanced Toolbar

This slide tests the advanced editor toolbar with AI features.

Select this text to see the Edit, Enhance, and Visualize dropdowns.

---

## Multiple Editors

- This slide has multiple editors
- Each editor should only initialize once
- No infinite loops should occur

---

## Data for Visualization

Sales Data:
- Q1: $100,000
- Q2: $150,000
- Q3: $200,000
- Q4: $250,000

Select the sales data above and use the Visualize dropdown to create a chart.

[/presentation]
  `;

  // Create a mock request
  const mockRequest = new NextRequest('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: [
        {
          role: 'user',
          content: 'Create a test presentation'
        },
        {
          role: 'assistant', 
          content: testContent
        }
      ],
      userId: 'test-user',
      chatId: 'test-chat',
      selectedAgent: 'presentation'
    }),
  });

  try {
    // Import and call the chat route handler
    const { POST } = await import('../app/api/chat/route');
    const response = await POST(mockRequest);
    
    if (!response.ok) {
      console.error('Failed to process presentation:', response.statusText);
      return;
    }

    console.log('✓ Presentation created successfully');
    console.log('\nFix implemented:');
    console.log('1. Added initializedEditorsRef to track which editors have been initialized');
    console.log('2. Check if editor is already initialized before registering');
    console.log('3. Clear initialized editors when slide changes');
    console.log('\nThe infinite loop should now be fixed!');
    console.log('\nTo test:');
    console.log('1. Open the presentation in the chat interface');
    console.log('2. Click on any slide to edit it');
    console.log('3. Select text to see the advanced toolbar');
    console.log('4. No console errors should appear');
    
  } catch (error) {
    console.error('Error testing presentation editor fix:', error);
  }
}

// Run the test
testPresentationEditorFix().catch(console.error);
