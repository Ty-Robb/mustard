/**
 * Agent Registry - Central repository of all specialized agents
 */

import { Agent, AgentCategory, AgentRegistry } from '@/types/orchestration';

// Master Orchestrator
const orchestratorAgent: Agent = {
  id: 'orchestrator',
  name: 'Master Orchestrator',
  description: 'Analyzes tasks and coordinates specialist agents',
  category: 'orchestrator',
  modelName: 'gemini-2.5-pro',
  responsibilities: [
    'Task decomposition',
    'Agent selection',
    'Model optimization',
    'Workflow management',
    'Result synthesis'
  ],
  capabilities: [
    'task-analysis',
    'workflow-planning',
    'agent-coordination',
    'result-aggregation'
  ],
  temperature: 0.3
};

// Research & Analysis Agents
const researchAgents: Agent[] = [
  {
    id: 'research-agent',
    name: 'General Research Agent',
    description: 'Conducts web research and critical analysis of findings',
    category: 'research',
    modelName: 'gemini-2.5-flash',
    responsibilities: [
      'Web research with critical evaluation',
      'Information gathering and verification',
      'Trend analysis with context',
      'Background research with balanced perspectives',
      'Identifying biases and limitations in sources'
    ],
    capabilities: ['research', 'analysis', 'summarization', 'critical-appraisal'],
    temperature: 0.5
  },
  {
    id: 'biblical-research',
    name: 'Biblical Research Specialist',
    description: 'Analyzes scripture and theological concepts with scholarly critique',
    category: 'research',
    modelName: 'gemini-2.5-pro',
    responsibilities: [
      'Scripture analysis with hermeneutical awareness',
      'Cross-reference finding and contextual evaluation',
      'Original language insights with translation critiques',
      'Theological context and denominational perspectives',
      'Critical examination of interpretive traditions'
    ],
    capabilities: ['biblical-analysis', 'theology', 'hebrew', 'greek', 'critical-appraisal'],
    temperature: 0.3
  },
  {
    id: 'data-analyst',
    name: 'Data Analysis Agent',
    description: 'Performs statistical analysis with critical evaluation of findings',
    category: 'research',
    modelName: 'gemini-2.5-flash',
    responsibilities: [
      'Statistical analysis with methodology critique',
      'Trend identification and significance testing',
      'Data visualization planning with bias awareness',
      'Insight generation with confidence intervals',
      'Limitations and assumptions assessment'
    ],
    capabilities: ['data-analysis', 'statistics', 'visualization', 'critical-appraisal'],
    temperature: 0.3
  },
  {
    id: 'source-validator',
    name: 'Source Validation Agent',
    description: 'Critically evaluates claims and source reliability',
    category: 'research',
    modelName: 'gemini-2.5-flash-lite',
    responsibilities: [
      'Fact verification with confidence levels',
      'Source credibility and bias assessment',
      'Citation checking and methodology critique',
      'Accuracy validation with error margins',
      'Identifying conflicting evidence and perspectives'
    ],
    capabilities: ['fact-checking', 'validation', 'critical-appraisal'],
    temperature: 0.1
  }
];

// Content Creation Agents
const contentAgents: Agent[] = [
  {
    id: 'outline-agent',
    name: 'Outline Creator',
    description: 'Creates structured outlines and document frameworks',
    category: 'content',
    modelName: 'gemini-2.5-flash',
    responsibilities: [
      'Document structure planning',
      'Logical flow creation',
      'Section organization',
      'Key point identification'
    ],
    capabilities: ['outlining', 'structure', 'organization'],
    temperature: 0.4
  },
  {
    id: 'introduction-writer',
    name: 'Introduction Specialist',
    description: 'Crafts compelling introductions and hooks',
    category: 'content',
    modelName: 'gemini-2.5-flash',
    responsibilities: [
      'Hook creation',
      'Thesis statement writing',
      'Context setting',
      'Audience engagement'
    ],
    capabilities: ['introduction-writing', 'hooks', 'engagement'],
    temperature: 0.7
  },
  {
    id: 'body-writer',
    name: 'Body Content Writer',
    description: 'Develops detailed content with balanced perspectives',
    category: 'content',
    modelName: 'gemini-2.5-flash',
    responsibilities: [
      'Main content development with critical analysis',
      'Supporting evidence integration and evaluation',
      'Paragraph transitions with logical flow',
      'Detail elaboration with counterarguments',
      'Presenting multiple viewpoints fairly'
    ],
    capabilities: ['content-writing', 'elaboration', 'evidence', 'critical-appraisal'],
    temperature: 0.6
  },
  {
    id: 'conclusion-writer',
    name: 'Conclusion Specialist',
    description: 'Creates thoughtful conclusions with nuanced perspectives',
    category: 'content',
    modelName: 'gemini-2.5-flash',
    responsibilities: [
      'Summary creation with balanced assessment',
      'Call to action writing with ethical considerations',
      'Key takeaway emphasis with caveats',
      'Closing impact with future implications',
      'Acknowledging limitations and open questions'
    ],
    capabilities: ['conclusion-writing', 'summarization', 'cta', 'critical-appraisal'],
    temperature: 0.6
  },
  {
    id: 'title-generator',
    name: 'Title Generator',
    description: 'Creates catchy titles and section headers',
    category: 'content',
    modelName: 'gemini-2.5-flash-lite',
    responsibilities: [
      'Title creation',
      'Headline writing',
      'Section naming',
      'SEO optimization'
    ],
    capabilities: ['title-generation', 'headlines', 'seo'],
    temperature: 0.8
  }
];

// Visual & Creative Agents
const visualAgents: Agent[] = [
  {
    id: 'image-generator',
    name: 'Image Generation Specialist',
    description: 'Creates custom images and illustrations using Gemini Flash Image Preview',
    category: 'visual',
    modelName: 'gemini-2.5-flash-image-preview', // Using the dedicated image generation model
    responsibilities: [
      'Custom image creation',
      'Illustration generation',
      'Visual concept development',
      'Style consistency'
    ],
    capabilities: ['image-generation', 'illustration', 'visual-design'],
    temperature: 0.7
  },
  {
    id: 'visual-designer',
    name: 'Visual Design Consultant',
    description: 'Provides design concepts and layout suggestions',
    category: 'visual',
    modelName: 'gemini-2.5-flash',
    responsibilities: [
      'Layout planning',
      'Color scheme selection',
      'Visual hierarchy design',
      'Brand consistency'
    ],
    capabilities: ['design', 'layout', 'color-theory', 'branding'],
    temperature: 0.6
  },
  {
    id: 'infographic-agent',
    name: 'Infographic Designer',
    description: 'Creates data visualizations and infographics',
    category: 'visual',
    modelName: 'gemini-2.5-flash',
    responsibilities: [
      'Data visualization design',
      'Chart selection',
      'Visual data storytelling',
      'Information hierarchy'
    ],
    capabilities: ['data-visualization', 'infographics', 'charts'],
    temperature: 0.5
  },
  {
    id: 'slide-designer',
    name: 'Slide Design Specialist',
    description: 'Optimizes presentation slide layouts and flow',
    category: 'visual',
    modelName: 'gemini-2.5-flash',
    responsibilities: [
      'Slide layout optimization',
      'Visual flow creation',
      'Transition planning',
      'Presentation aesthetics'
    ],
    capabilities: ['presentation-design', 'slide-layout', 'visual-flow'],
    temperature: 0.5
  }
];

// Specialized Domain Agents
const domainAgents: Agent[] = [
  {
    id: 'sermon-specialist',
    name: 'Sermon Development Expert',
    description: 'Specializes in homiletics and sermon structure',
    category: 'domain',
    modelName: 'gemini-2.5-pro',
    responsibilities: [
      'Sermon structure planning',
      'Homiletical analysis',
      'Delivery note creation',
      'Application development'
    ],
    capabilities: ['homiletics', 'preaching', 'sermon-structure'],
    temperature: 0.4
  },
  {
    id: 'theology-analyst',
    name: 'Theological Analysis Expert',
    description: 'Provides theological analysis with scholarly critique',
    category: 'domain',
    modelName: 'gemini-2.5-pro',
    responsibilities: [
      'Doctrinal verification with historical development',
      'Theological interpretation with multiple perspectives',
      'Historical context analysis and cultural critique',
      'Denominational considerations and ecumenical dialogue',
      'Critical examination of theological assumptions'
    ],
    capabilities: ['theology', 'doctrine', 'church-history', 'critical-appraisal'],
    temperature: 0.2
  },
  {
    id: 'youth-specialist',
    name: 'Youth Ministry Specialist',
    description: 'Creates age-appropriate content for youth',
    category: 'domain',
    modelName: 'gemini-2.5-flash',
    responsibilities: [
      'Youth engagement strategies',
      'Age-appropriate content',
      'Interactive element design',
      'Cultural relevance'
    ],
    capabilities: ['youth-ministry', 'engagement', 'education'],
    temperature: 0.7
  },
  {
    id: 'worship-planner',
    name: 'Worship Service Planner',
    description: 'Plans worship services and liturgical elements',
    category: 'domain',
    modelName: 'gemini-2.5-flash',
    responsibilities: [
      'Service flow planning',
      'Song selection',
      'Liturgy coordination',
      'Theme integration'
    ],
    capabilities: ['worship-planning', 'liturgy', 'music-selection'],
    temperature: 0.5
  },
  {
    id: 'curriculum-designer',
    name: 'Curriculum Design Specialist',
    description: 'Designs educational curricula and course structures',
    category: 'domain',
    modelName: 'gemini-2.5-flash',
    responsibilities: [
      'Learning objective design',
      'Course structure planning',
      'Assessment creation',
      'Progressive learning paths'
    ],
    capabilities: ['curriculum-design', 'education', 'assessment'],
    temperature: 0.4
  }
];

// Quality & Enhancement Agents
const qualityAgents: Agent[] = [
  {
    id: 'editor-agent',
    name: 'Content Editor',
    description: 'Edits content for grammar, style, and coherence',
    category: 'quality',
    modelName: 'gemini-2.5-flash',
    responsibilities: [
      'Grammar correction',
      'Style improvement',
      'Coherence checking',
      'Flow optimization'
    ],
    capabilities: ['editing', 'proofreading', 'style-guide'],
    temperature: 0.3
  },
  {
    id: 'formatter-agent',
    name: 'Format Specialist',
    description: 'Applies consistent formatting and style guides',
    category: 'quality',
    modelName: 'gemini-2.5-flash-lite',
    responsibilities: [
      'Format standardization',
      'Style guide application',
      'Consistency checking',
      'Document structure'
    ],
    capabilities: ['formatting', 'style-consistency'],
    temperature: 0.1
  },
  {
    id: 'seo-optimizer',
    name: 'SEO Optimization Agent',
    description: 'Optimizes content for search engines',
    category: 'quality',
    modelName: 'gemini-2.5-flash-lite',
    responsibilities: [
      'Keyword optimization',
      'Meta description writing',
      'Content structure for SEO',
      'Readability optimization'
    ],
    capabilities: ['seo', 'keywords', 'web-optimization'],
    temperature: 0.4
  },
  {
    id: 'accessibility-checker',
    name: 'Accessibility Specialist',
    description: 'Ensures content accessibility standards',
    category: 'quality',
    modelName: 'gemini-2.5-flash-lite',
    responsibilities: [
      'Alt text creation',
      'Readability checking',
      'Structure verification',
      'Accessibility compliance'
    ],
    capabilities: ['accessibility', 'wcag', 'readability'],
    temperature: 0.2
  }
];

// Additional Helper Agents
const helperAgents: Agent[] = [
  {
    id: 'biblical-references',
    name: 'Biblical References Specialist',
    description: 'Enriches content with relevant biblical references and cross-references',
    category: 'research',
    modelName: 'gemini-2.5-flash',
    responsibilities: [
      'Finding relevant scripture references',
      'Adding biblical cross-references',
      'Providing verse context and interpretation',
      'Connecting themes to biblical passages',
      'Integrating user-specific biblical content',
      'Ensuring scriptural accuracy'
    ],
    capabilities: ['biblical-references', 'scripture-search', 'cross-referencing', 'biblical-context'],
    temperature: 0.3
  },
  {
    id: 'critical-appraiser',
    name: 'Critical Appraisal Specialist',
    description: 'Provides balanced critical evaluation of any subject',
    category: 'research',
    modelName: 'gemini-2.5-pro',
    responsibilities: [
      'Comprehensive critical analysis',
      'Identifying strengths and weaknesses',
      'Evaluating evidence quality',
      'Presenting balanced perspectives',
      'Highlighting assumptions and biases',
      'Suggesting areas for improvement'
    ],
    capabilities: ['critical-appraisal', 'analysis', 'evaluation', 'critique'],
    temperature: 0.4
  },
  {
    id: 'illustration-finder',
    name: 'Illustration Finder',
    description: 'Finds relevant stories and examples',
    category: 'content',
    modelName: 'gemini-2.5-flash',
    responsibilities: [
      'Story discovery',
      'Example finding',
      'Analogy creation',
      'Cultural relevance'
    ],
    capabilities: ['storytelling', 'examples', 'analogies'],
    temperature: 0.7
  },
  {
    id: 'discussion-creator',
    name: 'Discussion Question Creator',
    description: 'Creates engaging discussion questions',
    category: 'content',
    modelName: 'gemini-2.5-flash',
    responsibilities: [
      'Question formulation',
      'Discussion guide creation',
      'Engagement strategies',
      'Depth progression'
    ],
    capabilities: ['questions', 'discussion', 'engagement'],
    temperature: 0.6
  },
  {
    id: 'activity-designer',
    name: 'Interactive Activity Designer',
    description: 'Designs interactive learning activities',
    category: 'content',
    modelName: 'gemini-2.5-flash',
    responsibilities: [
      'Activity creation',
      'Engagement design',
      'Learning reinforcement',
      'Group dynamics'
    ],
    capabilities: ['activities', 'interaction', 'learning'],
    temperature: 0.7
  },
  {
    id: 'workbook-designer',
    name: 'Workbook Designer',
    description: 'Creates student workbooks and materials',
    category: 'content',
    modelName: 'gemini-2.5-flash',
    responsibilities: [
      'Workbook layout',
      'Exercise creation',
      'Note-taking guides',
      'Review materials'
    ],
    capabilities: ['workbook', 'exercises', 'study-materials'],
    temperature: 0.5
  },
  {
    id: 'leader-guide-agent',
    name: 'Leader Guide Creator',
    description: 'Creates facilitation guides for leaders',
    category: 'content',
    modelName: 'gemini-2.5-flash',
    responsibilities: [
      'Facilitation notes',
      'Time management guides',
      'Discussion leadership',
      'Group management tips'
    ],
    capabilities: ['facilitation', 'leadership', 'group-management'],
    temperature: 0.4
  }
];

// Presentation Specialist Agents
const presentationAgents: Agent[] = [
  {
    id: 'presentation-orchestrator',
    name: 'Presentation Strategy Orchestrator',
    description: 'Coordinates specialist agents to create transformational presentations',
    category: 'content',
    modelName: 'gemini-2.5-pro',
    responsibilities: [
      'Analyzing chat content to identify the audience\'s current reality',
      'Extracting the core transformation story',
      'Coordinating specialist agents',
      'Ensuring storytelling best practices',
      'Managing the presentation creation workflow'
    ],
    capabilities: ['task-analysis', 'workflow-planning', 'agent-coordination', 'result-aggregation'],
    temperature: 0.3
  },
  {
    id: 'story-arc-specialist',
    name: 'Story Arc & Narrative Specialist',
    description: 'Structures presentations using hero\'s journey principles',
    category: 'content',
    modelName: 'gemini-2.5-flash',
    responsibilities: [
      'Establishing the current reality (What Is)',
      'Crafting the vision of possibility (What Could Be)',
      'Building contrast and tension through the messy middle',
      'Creating compelling calls to action',
      'Painting the transformed future (New Bliss)',
      'Positioning audience as protagonist'
    ],
    capabilities: ['narrative-structure', 'storytelling', 'hero-journey', 'tension-building'],
    temperature: 0.5
  },
  {
    id: 'core-message-specialist',
    name: 'Core Message & Focus Specialist',
    description: 'Distills complex ideas into a single powerful message',
    category: 'content',
    modelName: 'gemini-2.5-flash',
    responsibilities: [
      'Analyzing content for central transformation',
      'Creating a concise, memorable core statement',
      'Ensuring all content supports the central message',
      'Filtering out non-essential information',
      'Clarifying what\'s at stake for the audience'
    ],
    capabilities: ['message-distillation', 'focus', 'clarity', 'filtering'],
    temperature: 0.4
  },
  {
    id: 'engagement-balance',
    name: 'Analytical & Emotional Balance Specialist',
    description: 'Balances logic and emotion throughout the presentation',
    category: 'content',
    modelName: 'gemini-2.5-flash',
    responsibilities: [
      'Identifying emotional connection points',
      'Finding relevant stories and examples',
      'Balancing data with human elements',
      'Creating emotionally resonant transitions',
      'Ensuring evidence supports emotional appeals'
    ],
    capabilities: ['emotional-intelligence', 'data-storytelling', 'balance', 'engagement'],
    temperature: 0.6
  },
  {
    id: 'visual-clarity',
    name: 'Visual Clarity & Design Specialist',
    description: 'Ensures visual design enhances understanding',
    category: 'visual',
    modelName: 'gemini-2.5-flash',
    responsibilities: [
      'Enforcing one concept per slide',
      'Ensuring instant comprehension (3-second rule)',
      'Creating meaningful visual hierarchy',
      'Eliminating cognitive noise',
      'Making visuals serve the message',
      'Suggesting purposeful imagery'
    ],
    capabilities: ['visual-design', 'clarity', 'hierarchy', 'simplification'],
    temperature: 0.5
  },
  {
    id: 'memorable-moments',
    name: 'Memorable Moments Specialist',
    description: 'Creates unforgettable presentation highlights',
    category: 'content',
    modelName: 'gemini-2.5-flash',
    responsibilities: [
      'Identifying opportunities for memorable moments',
      'Creating powerful reveals or demonstrations',
      'Crafting quotable statements',
      'Designing surprising visual moments',
      'Ensuring moments amplify the core message'
    ],
    capabilities: ['impact-creation', 'memorability', 'surprise', 'amplification'],
    temperature: 0.7
  },
  {
    id: 'speaker-notes-specialist',
    name: 'Speaker Notes & Delivery Specialist',
    description: 'Creates comprehensive speaker notes and delivery guidance',
    category: 'content',
    modelName: 'gemini-2.5-flash',
    responsibilities: [
      'Writing conversational speaker notes for each slide',
      'Adding delivery cues and timing suggestions',
      'Including transition phrases between slides',
      'Providing context and background information',
      'Adding reminders for audience engagement',
      'Including pause points and emphasis markers',
      'Suggesting gestures or stage movements',
      'Creating backup content for Q&A'
    ],
    capabilities: ['speaker-notes', 'delivery-guidance', 'presentation-coaching'],
    temperature: 0.6
  }
];

// Combine all agents
const allAgents: Agent[] = [
  orchestratorAgent,
  ...researchAgents,
  ...contentAgents,
  ...visualAgents,
  ...domainAgents,
  ...qualityAgents,
  ...helperAgents,
  ...presentationAgents
];

// Create the agent registry
export function createAgentRegistry(): AgentRegistry {
  const agents = new Map<string, Agent>();
  const agentsByCategory = new Map<AgentCategory, Agent[]>();
  const agentsByCapability = new Map<string, Agent[]>();

  // Initialize category map
  const categories: AgentCategory[] = ['orchestrator', 'research', 'content', 'visual', 'domain', 'quality'];
  categories.forEach(category => {
    agentsByCategory.set(category, []);
  });

  // Populate registry
  allAgents.forEach(agent => {
    // Add to main registry
    agents.set(agent.id, agent);

    // Add to category map
    const categoryAgents = agentsByCategory.get(agent.category) || [];
    categoryAgents.push(agent);
    agentsByCategory.set(agent.category, categoryAgents);

    // Add to capability map
    if (agent.capabilities) {
      agent.capabilities.forEach(capability => {
        const capabilityAgents = agentsByCapability.get(capability) || [];
        capabilityAgents.push(agent);
        agentsByCapability.set(capability, capabilityAgents);
      });
    }
  });

  return {
    agents,
    agentsByCategory,
    agentsByCapability
  };
}

// Helper functions
export function getAgent(registry: AgentRegistry, agentId: string): Agent | undefined {
  return registry.agents.get(agentId);
}

export function getAgentsByCategory(registry: AgentRegistry, category: AgentCategory): Agent[] {
  return registry.agentsByCategory.get(category) || [];
}

export function getAgentsByCapability(registry: AgentRegistry, capability: string): Agent[] {
  return registry.agentsByCapability.get(capability) || [];
}

export function findAgentsForTask(registry: AgentRegistry, requiredCapabilities: string[]): Agent[] {
  const matchingAgents = new Set<Agent>();
  
  requiredCapabilities.forEach(capability => {
    const agents = getAgentsByCapability(registry, capability);
    agents.forEach(agent => matchingAgents.add(agent));
  });

  return Array.from(matchingAgents);
}

// Export the default registry instance
export const defaultAgentRegistry = createAgentRegistry();
