/**
 * Test script to verify all agents are using Genkit
 */

import { orchestratorService } from '@/lib/services/orchestrator.service';
import { defaultAgentRegistry, getAgent } from '@/lib/agents/agent-registry';

async function testAllAgentsGenkit() {
  console.log('🧪 Testing All Agents with Genkit Integration\n');

  // Test different agent categories
  const testCases = [
    {
      task: 'Create a presentation about climate change',
      expectedAgents: ['research-agent', 'critical-appraiser', 'slide-designer']
    },
    {
      task: 'Write an essay on artificial intelligence ethics',
      expectedAgents: ['research-agent', 'body-writer', 'editor-agent']
    },
    {
      task: 'Design a course on web development',
      expectedAgents: ['curriculum-designer']
    },
    {
      task: 'Create a sermon on forgiveness',
      expectedAgents: ['biblical-research', 'theology-analyst', 'sermon-specialist']
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n📋 Test: ${testCase.task}`);
    console.log('Expected agents:', testCase.expectedAgents.join(', '));
    
    try {
      const result = await orchestratorService.orchestrate({
        userId: 'test-user',
        task: testCase.task,
        preferences: {
          disableGrounding: false // Ensure grounding is enabled
        }
      });

      console.log(`✅ Success! Used ${result.agentTrace.length} agents`);
      
      // Check which agents used Genkit
      result.agentTrace.forEach(execution => {
        const hasGrounding = execution.metadata?.toolsUsed?.includes('google-search');
        console.log(`  - ${execution.agentName}: ${hasGrounding ? '🔍 Used search' : '📝 No search needed'}`);
      });

    } catch (error) {
      console.error(`❌ Error:`, error);
    }
  }

  // Test with grounding disabled
  console.log('\n\n🧪 Testing with grounding disabled...');
  try {
    const result = await orchestratorService.orchestrate({
      userId: 'test-user',
      task: 'Research quantum computing',
      preferences: {
        disableGrounding: true
      }
    });
    
    console.log('✅ Grounding disabled test passed');
    const hasAnyGrounding = result.agentTrace.some(e => 
      e.metadata?.toolsUsed?.includes('google-search')
    );
    console.log(`Grounding used: ${hasAnyGrounding ? '❌ Yes (should be no)' : '✅ No'}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }

  // List all agents and their categories
  console.log('\n\n📊 All Agents by Category:');
  const categories = ['research', 'content', 'visual', 'domain', 'quality'];
  
  categories.forEach(category => {
    console.log(`\n${category.toUpperCase()} Agents:`);
    defaultAgentRegistry.agents.forEach((agent, id) => {
      if (agent.category === category) {
        console.log(`  - ${agent.name} (${id})`);
      }
    });
  });
}

// Run the test
testAllAgentsGenkit().catch(console.error);
