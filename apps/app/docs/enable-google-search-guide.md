# Enable Real Google Search for AI Agents

## Current Issue

The AI agents are using mock search data instead of real web search because Google Search API credentials are not configured. This is why the AI has no knowledge of specific topics like "kpop demon hunters".

## How to Enable Real Web Search

### Step 1: Get Google Search API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the **Custom Search JSON API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Custom Search API"
   - Click on it and press "Enable"
4. Create credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the API key

### Step 2: Create Custom Search Engine

1. Go to [Google Programmable Search Engine](https://programmablesearchengine.google.com/)
2. Click "Add" to create a new search engine
3. Configure:
   - **Sites to search**: Choose "Search the entire web"
   - **Name**: Give it a name like "Mustard AI Search"
4. After creation, go to "Edit search engine" > "Setup"
5. Copy the **Search engine ID** (cx parameter)

### Step 3: Add Credentials to Your Project

Add these to your `.env.local` file:

```env
# Google Search API
GOOGLE_SEARCH_API_KEY=your-api-key-here
GOOGLE_SEARCH_ENGINE_ID=your-search-engine-id-here
```

### Step 4: Restart Your Development Server

```bash
npm run dev
```

## Verify It's Working

When the agents perform searches, you should see in the console:
- No more "Google Search API not configured. Using mock data" messages
- Real search results being used

## Test Examples

Try these queries to test real search:
- "What are kpop demon hunters?"
- "Latest news about [current event]"
- "Technical details about [specific technology]"

## Troubleshooting

### If still using mock data:
1. Check environment variables are loaded correctly
2. Verify API key is valid and has quota
3. Check Search Engine ID is correct
4. Look for error messages in console

### API Quota
- Free tier: 100 searches/day
- Monitor usage in Google Cloud Console
- Consider implementing caching to reduce API calls

## Security Note

Never commit your API keys to git. Always use environment variables and keep `.env.local` in `.gitignore`.
