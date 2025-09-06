# Complete Your Google Search Setup

## ✅ What's Done
- Google Search API Key has been added to `.env.local`

## ⚠️ What You Still Need
- Google Search Engine ID (currently set as placeholder)

## Quick Steps to Get Your Search Engine ID

1. **Go to Google Programmable Search Engine**
   - Visit: https://programmablesearchengine.google.com/

2. **Create a New Search Engine**
   - Click the "Add" button
   - For "Sites to search", select **"Search the entire web"**
   - Give it a name (e.g., "Mustard AI Search")
   - Click "Create"

3. **Get Your Search Engine ID**
   - After creation, click on your search engine name
   - Go to "Setup" or "Basic" tab
   - Find the **Search engine ID** (looks like: `017643444788157903538:8mkqjtgqbwq`)
   - Copy this ID

4. **Update Your Configuration**
   Replace `your-search-engine-id-here` in `.env.local` with your actual Search Engine ID:
   ```bash
   # Edit the file
   nano .env.local
   # or
   code .env.local
   ```

5. **Restart Your Development Server**
   ```bash
   npm run dev
   ```

## Test It's Working

Once configured, try asking the AI about:
- "What are kpop demon hunters?"
- "Latest news about [any current event]"
- "Tell me about [any specific topic]"

The AI should now have real web knowledge instead of generic responses!

## Troubleshooting

If still not working:
1. Check the browser console for errors
2. Look for "Google Search API not configured" messages
3. Verify both API key and Search Engine ID are correct
4. Check your Google Cloud Console for API quota

## Important Note

Your API key is now in `.env.local` which is gitignored, so it won't be committed to your repository. This keeps it secure.
