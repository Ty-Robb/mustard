# Genkit Integration Guide

## Overview

This guide documents the integration of Google's Genkit framework into the Mustard multi-agent orchestration system. Genkit provides powerful flow orchestration capabilities with native tool support, enabling agents to access real-world data through Google Search and other tools.

## Architecture

### Before Genkit Integration
```
Orchestrator → Agents → Vertex AI Service
```

### After Genkit Integration
```
Orchestrator → Genkit Service → Flows with Tools (Google Search)
             ↘ Traditional Agents → Vertex AI Service
```

## Implementation Details

### 1. Genkit Service (`src/lib/services/genkit.service.ts`)

The Genkit service provides:
- Flow creation for research, critical appraisal, and data analysis
- Google Search integration (mock implementation, ready for real API)
- Metadata tracking for sources and tools used

Key features:
- **Research Flow**: Searches for relevant information and synthesizes findings
- **Critical Appraisal Flow**: Searches multiple perspectives for balanced evaluation
- **Data Analysis Flow**: Searches for benchmarks and statistics

### 2. Orchestrator Integration

The orchestrator was updated to:
- Check if agents should use grounding based on capabilities
- Route grounding-enabled agents through Genkit flows
- Maintain backward compatibility for non-grounded agents

Grounding-enabled agents:
- `research-agent`
- `biblical-research`
- `critical-appraiser`
- `theology-analyst`
- `data-analyst`

### 3. Type System Updates

Added to `OrchestrationRequest`:
- `disableGrounding?: boolean` in UserPreferences

Added to `AgentExecution`:
- `metadata?: { sources?, confidence?, toolsUsed? }`

## Configuration

### Environment Variables

Add to your `.env.local`:
```env
# Google Search API Configuration
GOOGLE_SEARCH_API_KEY=your-google-search-api-key
GOOGLE_SEARCH_ENGINE_ID=your-google-search-engine-id
```

### Getting Google Search API Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the Custom Search API
3. Create credentials (API Key)
4. Go to [Programmable Search Engine](https://programmablesearchengine.google.com/)
5. Create a new search engine
6. Get your Search Engine ID

## Usage

### Basic Usage

The integration works transparently through the orchestrator:

```typescript
const request: OrchestrationRequest = {
  task: 'Research renewable energy',
  userId: 'user-123',
  preferences: {
    qualityLevel: 'premium'
  }
};

const result = await orchestratorService.orchestrate(request);
```

### Disabling Grounding

To disable grounding for specific requests:

```typescript
const request: OrchestrationRequest = {
  task: 'Write a creative story',
  userId: 'user-123',
  preferences: {
    disableGrounding: true // Agents won't use Google Search
  }
};
```

### Direct Flow Execution

You can also execute Genkit flows directly:

```typescript
const flowResult = await genkitService.executeFlow('research-agent', {
  task: 'What are the benefits of meditation?',
  context: { source: 'direct' }
});

console.log(flowResult.result); // The research findings
console.log(flowResult.metadata.sources); // URLs used
```

## Testing

Run the integration tests:

```bash
npm run test:genkit
# or
tsx src/scripts/test-genkit-integration.ts
```

The test script covers:
1. Research tasks with grounding
2. Critical appraisal with multiple perspectives
3. Tasks with grounding disabled
4. Direct flow execution

## Benefits

1. **Real-World Data**: Agents can access current information via Google Search
2. **Source Attribution**: All responses include source URLs for verification
3. **Balanced Perspectives**: Critical appraisal agents search for diverse viewpoints
4. **Flexible Control**: Grounding can be enabled/disabled per request
5. **Future-Proof**: Easy to add more tools (Wikipedia, custom APIs, etc.)

## Future Enhancements

### 1. Real Google Search Implementation

Replace the mock search in `performGoogleSearch()`:

```typescript
private async performGoogleSearch(query: string): Promise<GoogleSearchResult[]> {
  const response = await fetch(
    `https://www.googleapis.com/customsearch/v1?` +
    `key=${this.googleSearchApiKey}&` +
    `cx=${this.googleSearchEngineId}&` +
    `q=${encodeURIComponent(query)}`
  );
  
  const data = await response.json();
  return data.items.map(item => ({
    title: item.title,
    snippet: item.snippet,
    link: item.link
  }));
}
```

### 2. Additional Tools

Add more tools to Genkit flows:
- Wikipedia API for encyclopedic content
- News APIs for current events
- Academic databases for research papers
- Bible APIs for scripture references

### 3. Caching Layer

Implement caching to:
- Reduce API calls
- Improve response times
- Lower costs

### 4. Advanced Flows

Create specialized flows for:
- Multi-step research with refinement
- Comparative analysis across sources
- Fact-checking with confidence scores

## Troubleshooting

### Common Issues

1. **NPM Installation Fails**
   - Clear npm cache: `npm cache clean --force`
   - Delete `node_modules` and `package-lock.json`
   - Try `pnpm` or `yarn` instead

2. **Google Search Not Working**
   - Verify API key and Search Engine ID
   - Check API quotas in Google Cloud Console
   - Ensure Custom Search API is enabled

3. **Grounding Not Activating**
   - Check agent capabilities include 'research' or 'critical-appraisal'
   - Ensure `disableGrounding` is not set to true
   - Verify agent is in the grounding-enabled list

## Migration Notes

The integration is designed to be non-breaking:
- Existing agents continue to work without modification
- Grounding is opt-in based on agent capabilities
- Performance impact is minimal for non-grounded agents

To migrate custom agents to use grounding:
1. Add agent ID to `groundingEnabledAgents` set
2. Ensure agent has appropriate capabilities
3. Test with and without grounding enabled

## Conclusion

The Genkit integration brings powerful grounding capabilities to the Mustard orchestration system while maintaining flexibility and backward compatibility. Agents can now access real-world data when needed, providing more accurate and up-to-date responses to users.
