# Gemini Model Selection Strategy

This document outlines the smart model selection system implemented for the AI insights feature in the Mustard Bible app.

## Overview

The system automatically selects the most appropriate Gemini model based on the task complexity, optimizing for both performance and cost efficiency.

## Model Tiers

### 1. Simple Tasks (gemini-2.5-flash-lite)
**Cost:** Most efficient  
**Use cases:**
- Cross-references lookup
- Related verses
- Basic summarization

**Characteristics:**
- Fast response times
- Lower token limits (1024 max)
- Best for straightforward queries

### 2. Standard Tasks (gemini-2.5-flash)
**Cost:** Balanced  
**Use cases:**
- Word studies
- Location analysis
- Practical application
- Commentary
- Number significance

**Characteristics:**
- Adaptive thinking
- Medium token limits (2048 max)
- Good balance of quality and speed

### 3. Complex Tasks (gemini-2.5-pro)
**Cost:** Premium  
**Use cases:**
- Biography analysis
- Theological deep dives
- Timeline creation

**Characteristics:**
- Enhanced reasoning
- Higher token limits (4096 max)
- Best for complex analysis requiring deep understanding

### 4. Fallback (gemini-1.5-flash)
**Cost:** Standard  
**Use case:** When newer models fail or are unavailable

**Characteristics:**
- Stable and reliable
- Good general performance
- Proven compatibility

## Implementation

### Model Selection Logic

```typescript
// Task complexity mapping
export const TASK_COMPLEXITY: Record<string, 'simple' | 'standard' | 'advanced'> = {
  // Simple tasks - use flash-lite
  'related-verses': 'simple',
  'cross-references': 'simple',
  'summarize': 'simple',
  
  // Standard tasks - use flash
  'word-study': 'standard',
  'location': 'standard',
  'practical-application': 'standard',
  'commentary': 'standard',
  'number-significance': 'standard',
  
  // Complex tasks - use pro
  'biography': 'advanced',
  'theology': 'advanced',
  'timeline': 'advanced',
};
```

### Usage in API Routes

```typescript
// In /api/insights/route.ts
const model = getModelForTask(genAI, actionType, 'insights');
```

## Configuration

All models are configured with:
- `responseMimeType: "application/json"` for consistent JSON responses
- Appropriate temperature settings for each complexity level
- Token limits optimized for each use case

## Benefits

1. **Cost Optimization**: Simple queries use cheaper models
2. **Performance**: Faster responses for basic tasks
3. **Quality**: Complex analysis gets the best model
4. **Reliability**: Automatic fallback to stable models
5. **Scalability**: Easy to add new models or adjust mappings

## Future Enhancements

1. **Audio Features**: Integration with TTS models for narration
2. **Real-time Chat**: Using live preview models for low-latency interactions
3. **Usage Analytics**: Track model performance and costs
4. **Dynamic Selection**: Adjust model selection based on user tier or preferences

## Monitoring

The system logs which model is used for each request:
```
Using gemini-2.5-flash-lite for cross-references task (Cost-efficient model for simple categorization and analysis)
```

This helps track usage patterns and optimize the selection strategy over time.
