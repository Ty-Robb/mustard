# AI Insights Implementation

## Overview
The AI Insights feature allows users to select Bible text and generate comprehensive insights using Google's Gemini AI. Users can trigger this feature by selecting text and pressing Cmd+U (Mac) or Ctrl+U (Windows).

## Components

### 1. API Endpoint (`/api/insights`)
- **Location**: `src/app/api/insights/route.ts`
- **Authentication**: Firebase ID token required
- **AI Model**: Google Gemini Pro
- **Features**:
  - Generates historical/cultural context
  - Provides cross-references
  - Identifies key themes
  - Offers original language insights (Hebrew/Greek)
  - Suggests practical applications
  - Provides theological analysis

### 2. AIInsightsExtension
- **Location**: `src/components/bible/extensions/AIInsightsExtension.ts`
- **Purpose**: TipTap extension that handles keyboard shortcuts
- **Keyboard Shortcut**: Cmd+U / Ctrl+U
- **Functionality**:
  - Captures selected text
  - Extracts verse context
  - Triggers the insights modal

### 3. AIInsightsModal
- **Location**: `src/components/bible/AIInsightsModal.tsx`
- **Features**:
  - Beautiful UI with icons for each insight section
  - Loading states while generating insights
  - Copy functionality for each section
  - ESC key to close
  - Responsive design

### 4. BibleReader Integration
- **Location**: `src/components/bible/BibleReader.tsx`
- **Integration Points**:
  - Initializes AIInsightsExtension
  - Manages modal state
  - Handles API calls with authentication
  - Provides verse reference context

## Usage

1. **Select Text**: Users highlight any Bible text in the reader
2. **Trigger Insights**: Press Cmd+U (Mac) or Ctrl+U (Windows)
3. **View Insights**: Modal opens with AI-generated insights
4. **Copy Content**: Each section can be copied individually
5. **Close Modal**: Click close button or press ESC

## Environment Variables Required

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

## API Request/Response

### Request
```typescript
{
  selectedText: string;
  verseContext?: string;
  reference?: string;
}
```

### Response
```typescript
{
  historicalContext: string;
  crossReferences: string[];
  keyThemes: string[];
  originalLanguage: {
    hebrew?: string;
    greek?: string;
    insights: string;
  };
  practicalApplication: string;
  theologicalInsights: string;
}
```

## Error Handling

- Authentication errors return 401
- Missing text returns 400
- AI generation failures return 500
- Fallback parsing for malformed AI responses
- User-friendly error messages in modal

## SSR Considerations

The BibleReader component includes `immediatelyRender: false` in the TipTap editor configuration to prevent SSR hydration mismatches in Next.js.

## Future Enhancements

1. **Caching**: Cache insights for frequently accessed verses
2. **Customization**: Allow users to select which insight types to generate
3. **Export**: Add ability to export insights as PDF or markdown
4. **Sharing**: Enable sharing insights with other users
5. **Language Support**: Add support for multiple languages
6. **Offline Mode**: Store generated insights for offline access
