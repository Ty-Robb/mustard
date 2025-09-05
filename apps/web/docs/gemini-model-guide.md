# Gemini Model Selection Guide

## Overview

This guide provides comprehensive information about available Gemini models in Google Vertex AI, their capabilities, and recommendations for different use cases in the Mustard application.

## Available Models (as of January 2025)

### Production-Ready Models

#### Gemini 2.5 Pro
- **Model ID**: `gemini-2.5-pro`
- **Input**: Audio, images, videos, text, and PDF
- **Output**: Text
- **Optimized for**: Enhanced thinking and reasoning, multimodal understanding, advanced coding
- **Best for**: Complex analysis, biblical scholarship, theological essays, detailed content generation
- **Cost**: Higher tier
- **Recommended agents**: Biblical Scholar, Theology Assistant, Essay Writer

#### Gemini 2.5 Flash
- **Model ID**: `gemini-2.5-flash`
- **Input**: Audio, images, videos, and text
- **Output**: Text
- **Optimized for**: Adaptive thinking, cost efficiency
- **Best for**: General assistance, balanced performance, standard chat responses
- **Cost**: Medium tier
- **Recommended agents**: General Assistant, Bible Study Leader, Data Visualization

#### Gemini 2.5 Flash-Lite
- **Model ID**: `gemini-2.5-flash-lite`
- **Input**: Text, image, video, audio
- **Output**: Text
- **Optimized for**: Most cost-efficient model supporting high throughput
- **Best for**: Quick summaries, simple responses, high-volume tasks
- **Cost**: Lowest tier
- **Recommended agents**: Summary Generator, Devotional Guide

#### Gemini 2.0 Flash
- **Model ID**: `gemini-2.0-flash`
- **Input**: Audio, images, videos, and text
- **Output**: Text
- **Optimized for**: Next generation features, speed, and realtime streaming
- **Best for**: Real-time interactions, streaming responses
- **Cost**: Medium tier
- **Alternative for**: General chat when 2.5 Flash is unavailable

#### Gemini 2.0 Flash-Lite
- **Model ID**: `gemini-2.0-flash-lite`
- **Input**: Audio, images, videos, and text
- **Output**: Text
- **Optimized for**: Cost efficiency and low latency
- **Best for**: Quick responses, simple tasks
- **Cost**: Low tier
- **Alternative for**: Summary generation when 2.5 Flash-Lite is unavailable

### Preview/Experimental Models

#### Gemini 2.5 Flash Live
- **Model ID**: `gemini-live-2.5-flash-preview`
- **Input**: Audio, video, and text
- **Output**: Text, audio
- **Optimized for**: Low-latency bidirectional voice and video interactions
- **Best for**: Future voice/video chat features
- **Status**: Preview - not recommended for production

#### Gemini 2.5 Flash Native Audio
- **Model ID**: `gemini-2.5-flash-preview-native-audio-dialog` & `gemini-2.5-flash-exp-native-audio-thinking-dialog`
- **Input**: Audio, videos, and text
- **Output**: Text and audio, interleaved
- **Optimized for**: High quality, natural conversational audio outputs
- **Best for**: Future audio response features
- **Status**: Preview/Experimental

#### Gemini 2.5 Flash Image Preview
- **Model ID**: `gemini-2.5-flash-image-preview`
- **Input**: Images and text
- **Output**: Images and text
- **Optimized for**: Precise, conversational image generation and editing
- **Best for**: Visual content creation
- **Status**: Preview

#### Text-to-Speech Models
- **Flash Preview TTS**: `gemini-2.5-flash-preview-tts`
- **Pro Preview TTS**: `gemini-2.5-pro-preview-tts`
- **Optimized for**: Low latency, controllable, single- and multi-speaker text-to-speech
- **Best for**: Future audio narration features
- **Status**: Preview

### Deprecated Models (DO NOT USE)

- `gemini-1.5-pro` - **DEPRECATED**
- `gemini-1.5-flash` - **DEPRECATED**
- `gemini-1.5-flash-8b` - **DEPRECATED**

## Model Selection Strategy

### By Use Case

#### 1. Executive Summaries / TLDR
- **Primary**: `gemini-2.5-flash-lite`
- **Fallback**: `gemini-2.0-flash-lite`
- **Rationale**: Most cost-efficient, fast response, perfect for short outputs

#### 2. General Chat / Q&A
- **Primary**: `gemini-2.5-flash`
- **Fallback**: `gemini-2.0-flash`
- **Rationale**: Good balance of cost and capability

#### 3. Complex Analysis / Essays
- **Primary**: `gemini-2.5-pro`
- **Fallback**: `gemini-2.5-flash`
- **Rationale**: Enhanced reasoning for quality content

#### 4. Biblical/Theological Analysis
- **Primary**: `gemini-2.5-pro`
- **Fallback**: `gemini-2.5-flash`
- **Rationale**: Complex reasoning and multimodal understanding

#### 5. Data Visualization
- **Primary**: `gemini-2.5-flash`
- **Fallback**: `gemini-2.0-flash`
- **Rationale**: Structured output generation at reasonable cost

### By Performance Requirements

#### Low Latency Required
- Use: `gemini-2.5-flash-lite` or `gemini-2.0-flash-lite`

#### High Quality Required
- Use: `gemini-2.5-pro`

#### Cost Optimization
- Use: `gemini-2.5-flash-lite` > `gemini-2.0-flash-lite` > `gemini-2.5-flash`

#### Multimodal Input
- Use: Any Gemini 2.5 or 2.0 model (all support multimodal)

## Configuration Recommendations

### Default Model
```typescript
modelName: 'gemini-2.5-pro' // Replace deprecated gemini-1.5-pro
```

### Agent-Specific Models
```typescript
// Summary Generator - Optimize for cost and speed
{
  id: 'summary-generator',
  modelName: 'gemini-2.5-flash-lite',
  temperature: 0.3,
  maxOutputTokens: 150
}

// General Assistant - Balance cost and capability
{
  id: 'general-assistant',
  modelName: 'gemini-2.5-flash',
  temperature: 0.5,
  maxOutputTokens: 3072
}

// Biblical Scholar - Maximize quality
{
  id: 'biblical-scholar',
  modelName: 'gemini-2.5-pro',
  temperature: 0.3,
  maxOutputTokens: 3072
}

// Essay Writer - High quality output
{
  id: 'essay-writer',
  modelName: 'gemini-2.5-pro',
  temperature: 0.5,
  maxOutputTokens: 4096
}

// Data Visualization - Structured output
{
  id: 'data-visualization',
  modelName: 'gemini-2.5-flash',
  temperature: 0.3,
  maxOutputTokens: 4096
}
```

## Cost Optimization Tips

1. **Use tiered approach**: Flash-Lite for simple tasks, Flash for standard, Pro for complex
2. **Set appropriate token limits**: Don't use high limits for simple tasks
3. **Cache responses**: For repeated questions, cache summaries
4. **Monitor usage**: Track which agents consume most tokens

## Migration from Deprecated Models

### From gemini-1.5-pro
- **Direct replacement**: `gemini-2.5-pro`
- **Cost-optimized alternative**: `gemini-2.5-flash`

### From gemini-1.5-flash
- **Direct replacement**: `gemini-2.5-flash`
- **Cost-optimized alternative**: `gemini-2.5-flash-lite`

### From gemini-1.5-flash-8b
- **Direct replacement**: `gemini-2.5-flash-lite`
- **Performance alternative**: `gemini-2.0-flash-lite`

## Testing Model Availability

Before deploying, test model availability in your project:

```bash
# Run the model availability test
npx tsx src/scripts/test-model-availability.ts
```

## Future Considerations

1. **Voice Features**: When implementing voice chat, consider `gemini-live-2.5-flash-preview`
2. **Image Generation**: For visual content creation, use `gemini-2.5-flash-image-preview`
3. **Audio Narration**: For TTS features, use the preview TTS models
4. **Real-time Chat**: Consider `gemini-2.0-flash` for streaming capabilities

## Troubleshooting

### Model Not Found (404)
- Verify the model ID is correct
- Check if your project has access to the model
- Try the fallback model
- Ensure you're using the correct region

### Performance Issues
- Check token limits
- Consider using a lighter model
- Implement response caching
- Monitor API quotas

### Cost Concerns
- Switch to Flash-Lite models for high-volume tasks
- Implement usage monitoring
- Set strict token limits
- Use summaries instead of full responses where appropriate
