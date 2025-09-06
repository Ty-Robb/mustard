/**
 * Test script for critical appraisal capability
 */

import { orchestratorService } from '@/lib/services/orchestrator.service';
import { OrchestrationRequest } from '@/types/orchestration';
import { getAgentsByCapability } from '@/lib/agents/agent-registry';
import { defaultAgentRegistry } from '@/lib/agents/agent-registry';

async function testCriticalAppraisal() {
  console.log('🔍 Testing Critical Appraisal Capability\n');

  // 1. Test agent registry
  console.log('1️⃣ Testing Agent Registry');
  console.log('==========================');
  
  const criticalAgents = getAgentsByCapability(defaultAgentRegistry, 'critical-appraisal');
  console.log(`Found ${criticalAgents.length} agents with critical appraisal capability:`);
  
  criticalAgents.forEach(agent => {
    console.log(`\n- ${agent.name} (${agent.id})`);
    console.log(`  Description: ${agent.description}`);
    console.log(`  Model: ${agent.modelName}`);
    console.log(`  Responsibilities:`);
    agent.responsibilities.forEach(r => console.log(`    • ${r}`));
  });

  // 2. Test orchestration with critical appraisal
  console.log('\n\n2️⃣ Testing Orchestration with Critical Appraisal');
  console.log('================================================');

  const testRequests: OrchestrationRequest[] = [
    {
      userId: 'test-user',
      task: 'Tell me about artificial intelligence and its impact on society',
      deliverableType: 'essay',
      preferences: {
        qualityLevel: 'premium',
        targetAudience: 'general public',
        tone: 'analytical'
      }
    },
    {
      userId: 'test-user',
      task: 'Create a presentation about renewable energy solutions',
      deliverableType: 'presentation',
      preferences: {
        qualityLevel: 'premium',
        targetAudience: 'business executives'
      }
    },
    {
      userId: 'test-user',
      task: 'Analyze the doctrine of justification by faith',
      deliverableType: 'article',
      context: {
        denomination: 'Protestant',
        depth: 'theological'
      }
    }
  ];

  for (const request of testRequests) {
    console.log(`\n📋 Request: "${request.task}"`);
    console.log(`   Type: ${request.deliverableType}`);
    
    try {
      // Simulate task analysis
      const mockAnalysis = {
        deliverableType: request.deliverableType || 'general',
        requiredCapabilities: ['research', 'critical-appraisal', 'content-writing'],
        estimatedComplexity: 'moderate' as const,
        suggestedWorkflow: 'standard',
        estimatedAgents: 5,
        requiresImageGeneration: false,
        requiresCriticalAppraisal: true,
        metadata: {}
      };

      console.log('\n   Analysis Results:');
      console.log(`   - Requires Critical Appraisal: ${mockAnalysis.requiresCriticalAppraisal}`);
      console.log(`   - Required Capabilities: ${mockAnalysis.requiredCapabilities.join(', ')}`);
      console.log(`   - Estimated Agents: ${mockAnalysis.estimatedAgents}`);

      // Find agents that would be used
      const selectedAgents = mockAnalysis.requiredCapabilities.flatMap(cap => 
        getAgentsByCapability(defaultAgentRegistry, cap)
      );
      
      const uniqueAgents = Array.from(new Set(selectedAgents.map(a => a.id)))
        .map(id => selectedAgents.find(a => a.id === id)!);

      console.log(`\n   Selected Agents (${uniqueAgents.length}):`);
      uniqueAgents.forEach(agent => {
        console.log(`   - ${agent.name} (${agent.modelName})`);
      });

    } catch (error) {
      console.error('   ❌ Error:', error);
    }
  }

  // 3. Test specific critical appraisal prompts
  console.log('\n\n3️⃣ Testing Critical Appraisal Prompts');
  console.log('=====================================');

  const criticalAppraiser = criticalAgents.find(a => a.id === 'critical-appraiser');
  if (criticalAppraiser) {
    console.log('\nCritical Appraiser Agent Details:');
    console.log(`Name: ${criticalAppraiser.name}`);
    console.log(`Temperature: ${criticalAppraiser.temperature}`);
    console.log('\nSample prompt structure for critical appraisal:');
    console.log(`
Task: Critically evaluate artificial intelligence

The agent will provide:
1. Identifies key strengths and weaknesses
2. Evaluates evidence quality and reliability
3. Presents multiple perspectives fairly
4. Highlights assumptions and potential biases
5. Suggests areas for improvement or further investigation
6. Provides a balanced conclusion
    `);
  }

  console.log('\n✅ Critical Appraisal Testing Complete!');
}

// Run the test
testCriticalAppraisal().catch(console.error);
