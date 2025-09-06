/**
 * Presentation Workflow - Specialized workflow for creating presentations
 * Uses presentation specialist agents with strict formatting rules
 */

import { Agent } from '@/types/orchestration';

export interface PresentationWorkflowPhase {
  phaseName: string;
  parallel: boolean;
  agents: Array<{
    agentId: string;
    taskTemplate: string;
  }>;
  dependencies?: string[];
  priority?: number;
}

export interface PresentationWorkflow {
  phases: PresentationWorkflowPhase[];
}

/**
 * Get the presentation workflow with specialized agents
 */
export function getPresentationWorkflow(): PresentationWorkflow {
  return {
    phases: [
      {
        phaseName: 'orchestration',
        parallel: false,
        agents: [
          {
            agentId: 'presentation-orchestrator',
            taskTemplate: `Analyze the request: {task}
            
CRITICAL: You must coordinate the creation of a presentation that follows these rules:
- Title slide: NO bullets, just title and optional subtitle
- Content slides: 3-5 bullet points per slide (3 preferred)
- Each bullet: 6-10 words ideally (complete thoughts allowed)
- Use clear, concise language
- One core idea per slide
- Break complex topics into multiple slides
- Consider two-column layouts for comparisons or text+image
- Suggest relevant images where they add value

Extract the core transformation story and coordinate specialist agents to create a visually engaging presentation.`
          }
        ]
      },
      {
        phaseName: 'story-structure',
        parallel: false,
        agents: [
          {
            agentId: 'story-arc-specialist',
            taskTemplate: `Create the narrative structure for: {task}

FORMATTING RULES:
- Title slide: Title only (no bullets)
- Content slides: 3-5 bullets per slide
- Each bullet: 6-10 words (complete thoughts)
- Use clear, concise language
- One idea per slide
- Consider two-column layouts where appropriate:
  * Text + Image for key concepts
  * Side-by-side comparisons
  * Visual storytelling

Structure the presentation using hero's journey:
1. Current Reality (What Is)
2. Vision of Possibility (What Could Be)
3. The Journey (Messy Middle)
4. Call to Action
5. Transformed Future (New Bliss)

For each section, suggest if a two-column layout with images would enhance understanding.`
          }
        ]
      },
      {
        phaseName: 'core-message',
        parallel: false,
        agents: [
          {
            agentId: 'core-message-specialist',
            taskTemplate: `Distill the core message for: {task}

Create a single powerful statement that captures the transformation.
Then outline key points following these rules:
- 3-5 bullet points per slide (3 preferred)
- 6-10 words per bullet (complete thoughts)
- Clear, concise language
- Remove unnecessary words while maintaining clarity

Consider where two-column layouts would help:
- Key concept + supporting image
- Before/after comparisons
- Problem/solution side-by-side

Focus on clarity and impact. Every word must earn its place.`
          }
        ]
      },
      {
        phaseName: 'content-creation',
        parallel: true,
        agents: [
          {
            agentId: 'visual-clarity',
            taskTemplate: `Design slide layouts for: {task}

DESIGN PRINCIPLES:
- One concept per slide
- 3-second readability test
- Title: 6-8 words max
- Bullets: 3-5 per slide (3 preferred)
- Each bullet: 6-10 words (complete thoughts)
- Suggest visuals that enhance understanding
- Eliminate cognitive noise

LAYOUT OPTIONS:
- Standard: Title + 3-5 bullets
- Two-column: Text left, image right
- Visual focus: Large image with minimal text
- Comparison: Side-by-side columns

For each slide, specify:
[layout: standard/two-column/visual-focus/comparison]
[image: description of suggested visual if applicable]`
          },
          {
            agentId: 'memorable-moments',
            taskTemplate: `Identify memorable moments for: {task}

Create impactful moments while maintaining:
- 3-5 bullets per slide (3 preferred)
- 6-10 words per bullet (complete thoughts)
- Powerful reveals and transitions
- Quotable statements
- Surprising visuals

Consider special layouts for impact:
- Quote slides for powerful statements
- Image-focused slides for emotional moments
- Two-column for before/after reveals

Each moment must amplify the core message.`
          }
        ]
      },
      {
        phaseName: 'speaker-notes',
        parallel: false,
        agents: [
          {
            agentId: 'speaker-notes-specialist',
            taskTemplate: `Create speaker notes for the presentation about: {task}

The slides follow strict formatting (3 bullets, 6 words each).
Create conversational speaker notes that:
- Expand on each bullet point
- Add context and examples
- Include delivery cues
- Suggest pauses and emphasis
- Provide transition phrases

The slides are minimal by design - the speaker notes contain the full story.`
          }
        ]
      },
      {
        phaseName: 'final-formatting',
        parallel: false,
        agents: [
          {
            agentId: 'formatter-agent',
            taskTemplate: `Format the final presentation for: {task}

FORMATTING GUIDELINES:
- Title slide has NO bullets
- Content slides: 3-5 bullets (3 preferred)
- Each bullet: 6-10 words (complete thoughts)
- Clear, concise language
- One idea per slide
- Support two-column layouts

LAYOUT FORMATS:
1. Standard slide:
## Slide Title
- Clear bullet point with complete thought
- Another concise point about the topic
- Final supporting point or conclusion

2. Two-column slide:
## Slide Title
[layout: two-column]
Left:
- Key point about topic
- Supporting detail here
- Conclusion or insight
Right:
[image: Description of visual]

3. Visual focus slide:
## Slide Title
[layout: visual-focus]
[image: Large central image description]
- Single powerful statement

Output using markdown formatting for **bold**, *italic*, etc.`
          }
        ]
      }
    ]
  };
}

/**
 * Get prompt additions for presentation agents
 */
export function getPresentationAgentPrompt(agentId: string): string {
  const basePrompt = `
PRESENTATION FORMATTING GUIDELINES:
1. Title slide: NO bullets, just title and optional subtitle
2. Content slides: 3-5 bullet points (3 preferred for clarity)
3. Each bullet: 6-10 words (complete thoughts, not fragments)
4. Use clear, concise language
5. One core idea per slide
6. Support markdown formatting (**bold**, *italic*)
7. Consider visual layouts (two-column, image-focused)

FORMATTING EXAMPLES:
Standard slide:
## Clear Slide Title Here
- Complete thought about the main topic
- Supporting point with relevant details included
- Conclusion or call to action statement

Two-column slide:
## Comparison or Visual Title
[layout: two-column]
Left:
- Text content on the left side
- Another point about this topic
Right:
[image: Description of supporting visual]`;

  const agentSpecificPrompts: Record<string, string> = {
    'presentation-orchestrator': `
${basePrompt}

As the Presentation Orchestrator, guide agents to create visually engaging presentations.
Encourage two-column layouts and image suggestions where they enhance understanding.`,

    'story-arc-specialist': `
${basePrompt}

Structure the narrative with flexibility:
- Each story beat gets its own slide
- 3-5 bullets per slide (complete thoughts)
- Consider visual layouts for key moments`,

    'core-message-specialist': `
${basePrompt}

Distill complex ideas into clear, concise points.
If a concept needs more than 10 words, consider:
- Breaking into multiple bullets
- Using a two-column layout
- Creating an additional slide`,

    'visual-clarity': `
${basePrompt}

Design for instant comprehension:
- 3-second readability test
- Suggest relevant visuals
- Use layout variations for impact
- Support markdown formatting`,

    'memorable-moments': `
${basePrompt}

Create impact through clarity and visuals:
- Use **bold** for emphasis
- Suggest powerful images
- Consider quote slides for key statements
- Two-column for comparisons`,

    'speaker-notes-specialist': `
The slides are intentionally concise (3-5 bullets, 6-10 words each).
Your speaker notes should contain:
- Full narrative and context
- Detailed examples
- Delivery cues and timing
- Transition phrases
The slides are visual aids, not documents.`,

    'formatter-agent': `
${basePrompt}

Format presentations for clarity and impact:
1. Ensure bullets are complete thoughts (6-10 words)
2. Support two-column and visual layouts
3. Apply markdown formatting
4. Verify one idea per slide
5. Suggest images where helpful

CRITICAL: Start your output with [PRESENTATION START] and end with [PRESENTATION END]
This ensures the presentation is properly detected and displayed.

Example:
[PRESENTATION START]
## Slide 1: Title
- First bullet point here
- Second bullet point here
- Third bullet point here

## Slide 2: Next Topic
...
[PRESENTATION END]

Focus on readability and visual appeal.`
  };

  return agentSpecificPrompts[agentId] || basePrompt;
}
