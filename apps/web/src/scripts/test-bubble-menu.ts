import { NextRequest } from 'next/server';

// Test the bubble menu functionality in presentations
async function testBubbleMenu() {
  console.log('Testing bubble menu in presentations...\n');

  const testContent = `
[presentation]
# Test Presentation

---

## Slide with Text

This is some text that you can select to see the bubble menu.

Try selecting this text and the formatting toolbar should appear above it.

---

## Features

- Bold text formatting
- Italic text formatting  
- Heading styles
- Bullet lists
- Highlight text

Select any text on this slide to format it!

---

## Quote Slide

> "The bubble menu provides a clean, distraction-free editing experience."

Select the quote text to format it.

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
          content: 'Create a presentation about text formatting'
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
    console.log('\nTo test the bubble menu:');
    console.log('1. Open the presentation in the chat interface');
    console.log('2. Click on any slide to edit it');
    console.log('3. Select some text with your mouse');
    console.log('4. The bubble menu should appear above the selection');
    console.log('5. Click formatting buttons to apply styles');
    console.log('\nNote: The bubble menu only appears when showToolbar=false');
    
  } catch (error) {
    console.error('Error testing bubble menu:', error);
  }
}

// Run the test
testBubbleMenu().catch(console.error);
