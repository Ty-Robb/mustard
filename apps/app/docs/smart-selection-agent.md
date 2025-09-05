# Smart Selection Agent Documentation

## Overview

The Smart Selection Agent is a two-stage interface for Bible text interaction. When users select text, they first see highlight options and an "Insights" button. Clicking "Insights" opens the AI panel with context-aware action suggestions based on the selected text type, avoiding unnecessary API calls while providing targeted AI assistance.

## Architecture

### Components

1. **SelectionToolbar** (`/src/components/bible/SelectionToolbar.tsx`)
   - Floating toolbar that appears when text is selected
   - Shows highlight colors and "Insights" button
   - No API calls until user clicks "Insights"
   - Handles positioning to stay within viewport

2. **Analyze Text API** (`/src/app/api/analyze-text/route.ts`)
   - Analyzes selected text to determine content type
   - Returns up to 5 most relevant actions
   - Uses pattern matching and heuristics to identify:
     - Person names (biography, timeline, related verses)
     - Place names (map view)
     - Numbers (biblical numerology)
     - Commands (practical application)
     - Theological terms (word study, theology)

3. **Enhanced AI Insights Panel** (`/src/components/bible/AIInsightsPanel.tsx`)
   - Shows selected text at the top
   - Calls analyze-text API when opened
   - Displays 4 context-aware action buttons in a grid
   - Allows custom questions via text input
   - Generates targeted insights based on selected action

4. **Enhanced Insights API** (`/src/app/api/insights/route.ts`)
   - Accepts `actionType` parameter
   - Uses specialized prompts for each action type:
     - Biography: Life events, character traits, relationships
     - Word Study: Original language, etymology, usage
     - Timeline: Historical dating, chronological context
     - Location: Geography, archaeological findings
     - Practical Application: Modern context, action steps

## User Flow

1. User selects text in the Bible reader
2. SelectionToolbar appears with:
   - 6 highlight color options
   - "Insights" button
   - Close button
3. If user clicks a highlight color:
   - Text is highlighted
   - Toolbar closes
4. If user clicks "Insights":
   - AI Insights Panel opens
   - Analyze-text API is called
   - Panel shows 4 context-aware action buttons
   - User can click an action or type custom question
5. After selecting an action:
   - Specialized prompt is sent to AI
   - Targeted insights are generated

## Action Types

### Person-Related Actions
- **Biography**: Comprehensive life story and significance
- **Timeline**: Chronological events in their life
- **Related Verses**: Other mentions throughout Scripture

### Place-Related Actions
- **View on Map**: Geographic and historical context
- **Biblical Events**: Significant events at this location

### Concept-Related Actions
- **Word Study**: Original language analysis
- **Theological Deep Dive**: Doctrinal significance
- **Practical Application**: Modern-day relevance

### General Actions (Always Available)
- **Cross References**: Related passages
- **Commentary**: Expert insights
- **Summarize**: Key points (for longer selections)

## Implementation Details

### Text Analysis Heuristics

```typescript
// Person detection
const namePattern = /^[A-Z][a-z]+(\s[A-Z][a-z]+)?$/;

// Place detection
const placeIndicators = ['jerusalem', 'egypt', 'israel', ...];

// Number detection
const numberPattern = /\b(one|two|three|...|\\d+)\\b/i;

// Command detection
const commandIndicators = ['shall', 'must', 'command', ...];

// Theological term detection
const theologicalTerms = ['love', 'faith', 'hope', ...];
```

### Action Prompts

Each action type has a specialized prompt template that guides the AI to provide relevant insights:

```typescript
const actionPrompts = {
  'biography': `Tell me about ${text} - their life, character, and significance in the Bible.`,
  'word-study': `Perform a detailed word study on "${text}".`,
  'timeline': `Create a timeline of events related to ${text}.`,
  // ... etc
}
```

## Benefits

1. **Efficiency**: No API calls until user explicitly requests insights
2. **User Control**: Clear separation between highlighting and AI features
3. **Targeted Responses**: Context-aware actions provide relevant options
4. **Flexibility**: Users can choose preset actions or type custom questions
5. **Better UX**: Familiar chat-like interface with action buttons
6. **Performance**: Faster initial interaction (highlighting doesn't require API)

## Future Enhancements

1. **Enhanced Detection**: Improve pattern matching for better accuracy
2. **More Action Types**: Add actions for prophecies, parables, miracles
3. **User Preferences**: Remember preferred actions for similar content
4. **Keyboard Shortcuts**: Quick access to common actions
5. **Action History**: Track and revisit previous analyses
6. **Custom Actions**: Allow users to define their own action types

## Testing

To test the Smart Selection Agent:

1. Navigate to the Bible reader
2. Select different types of text:
   - A person's name (e.g., "Moses", "David")
   - A place name (e.g., "Jerusalem", "Egypt")
   - A number (e.g., "seven", "forty")
   - A command (e.g., text with "shall" or "must")
   - A theological concept (e.g., "faith", "love")
3. Verify appropriate actions appear
4. Click each action and verify targeted insights
5. Test edge cases:
   - Very short selections
   - Very long selections
   - Mixed content types
   - Non-biblical text

## Troubleshooting

### Toolbar Not Appearing
- Check browser console for errors
- Verify user is authenticated
- Ensure text is properly selected

### Wrong Actions Displayed
- Review analyze-text API logic
- Check pattern matching rules
- Consider text context

### Insights Not Generating
- Verify API authentication
- Check network requests
- Review error logs
