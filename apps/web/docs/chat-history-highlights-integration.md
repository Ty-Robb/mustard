# Chat History and Highlights Integration

## Overview
This document describes the implementation of chat history tabs and AI-generated highlights in the Bible study application.

## Features Implemented

### 1. Tabbed AI Insights Panel
The AI Insights panel now includes three tabs:
- **Chat**: Current conversation with AI
- **History**: Browse past conversations
- **Highlights**: View all highlights for the current passage

### 2. Chat History Tab
- Lists all past chat sessions grouped by date (Today, Yesterday, This Week, etc.)
- Search functionality to find specific conversations
- Click on any session to load it (TODO: implement session loading)
- Shows reference, selected text preview, and tags for each session

### 3. Highlights Tab
- Displays all highlights for the current Bible reference
- Separates AI-generated highlights from manual highlights
- Shows highlight type, text, notes, and creation date
- AI highlights include a "View conversation" indicator
- Click on AI highlights to load the associated chat session (TODO: implement)

### 4. Auto-Highlight Creation
When AI generates insights:
1. The conversation is saved to the database
2. An AI highlight is automatically created with:
   - The selected text
   - The Bible reference
   - The type of insight (biography, timeline, etc.)
   - Link to the chat session and specific message
   - Appropriate tags

### 5. Data Persistence
All data is stored in user-specific MongoDB databases:
- Chat sessions with full context
- Individual messages
- AI-generated highlights with session links

## User Experience Flow

1. **Study a passage**: User selects text in the Bible reader
2. **Get AI insights**: Click "Insights" button to open AI panel
3. **Choose insight type**: Select from suggested actions (biography, timeline, etc.)
4. **Auto-save**: Conversation and highlight are automatically saved
5. **Browse history**: Switch to History tab to see past conversations
6. **View highlights**: Switch to Highlights tab to see all insights for the passage
7. **Resume conversations**: Click on any past session or highlight to continue

## Technical Implementation

### Components
- `AIInsightsPanel.tsx`: Main panel with tabs
- `ChatHistoryTab.tsx`: Lists past conversations
- `HighlightsTab.tsx`: Shows highlights for current reference

### API Endpoints Used
- `/api/chat/sessions`: Create and list chat sessions
- `/api/chat/messages`: Add messages to sessions
- `/api/highlights`: Create and retrieve highlights

### Data Models
- `ChatSession`: Stores conversation context and metadata
- `ChatMessage`: Individual messages in a conversation
- `Highlight`: Bible highlights with AI context when applicable

## Future Enhancements

### Session Loading
Currently, clicking on a past session or AI highlight logs to console. Next steps:
1. Implement `loadSession` function in AIInsightsPanel
2. Fetch session messages from API
3. Replace current chat with loaded session
4. Update UI to show loaded session indicator

### Bible Reader Integration
Add visual indicators in the Bible reader for AI highlights:
1. Special styling for text with AI insights
2. Sparkle icon or gradient background
3. Hover tooltip showing insight preview
4. Click to open associated conversation

### Additional Features
- Export chat history
- Share specific conversations
- Bulk operations on highlights
- Advanced search with filters
- Session templates for common study patterns

## Benefits

1. **Never lose insights**: All AI conversations are permanently saved
2. **Build knowledge**: See all insights for a passage in one place
3. **Resume anytime**: Pick up past conversations where you left off
4. **Visual indicators**: Easily spot passages you've studied with AI
5. **Organized study**: Automatic categorization and tagging

## Testing

To test the integration:
1. Select text in the Bible reader
2. Click "Insights" to generate AI insights
3. Check the History tab to see the saved session
4. Check the Highlights tab to see the AI highlight
5. Verify the highlight links back to the session
