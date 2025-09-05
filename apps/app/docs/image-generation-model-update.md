# Image Generation Model Update

## Overview
Updated the image generation system to use the dedicated `gemini-2.5-flash-image-preview` model instead of the standard `gemini-2.5-flash` model.

## Changes Made

### 1. Type System Update
- Added `'gemini-2.5-flash-image-preview'` to the `ModelName` type in `src/types/orchestration.ts`

### 2. Agent Registry Update
- Updated the `image-generator` agent in `src/lib/agents/agent-registry.ts` to use the new model
- Changed description to reflect the use of "Gemini Flash Image Preview"

### 3. Orchestrator Service Update
- Added the new model to cost tracking in `calculateCosts` method
- Added the new model to session initialization in `initializeSession` method

### 4. Model Selector Update
- Added cost factor (0.5 - slightly higher than flash due to image capabilities)
- Added speed factor (1.2 - slightly slower than flash due to image processing)
- Added capabilities: `['image-generation', 'visual-creation', 'creative-tasks']`
- Updated `selectModel` function to return `gemini-2.5-flash-image-preview` for image generation tasks
- Added model parameters with higher temperature (0.7) for creative image generation

## Benefits

1. **Dedicated Image Model**: Using a model specifically designed for image generation
2. **Better Performance**: Optimized for visual content creation
3. **Proper Cost Tracking**: Accurate cost allocation for image generation tasks
4. **Flexible Parameters**: Higher temperature settings for more creative outputs

## Usage

The system will automatically select the `gemini-2.5-flash-image-preview` model when:
- The `image-generator` agent is used
- Any task requires image generation (detected by `needsImageGeneration` criteria)
- Tasks contain keywords like "image" or "visual"

## Testing

To test the implementation:
1. Request a presentation or content that requires images
2. The orchestrator should automatically select the image-generator agent
3. The agent will use the `gemini-2.5-flash-image-preview` model
4. Check logs for confirmation: "Executing agent: Image Generation Specialist with model: gemini-2.5-flash-image-preview"

## Future Considerations

- Monitor the performance and quality of generated images
- Adjust temperature and other parameters based on results
- Consider adding more specialized image generation agents for different types of visuals
