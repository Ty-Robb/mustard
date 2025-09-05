/**
 * Test script for Genkit integration with orchestrator
 */

import { orchestratorService } from '@/lib/services/orchestrator.service';
import { genkitService } from '@/lib/services/genkit.service';
import { OrchestrationRequest } from '@/types/orchestration';

async function testGenkitIntegration() {
  console.log('🧪 Testing Genkit Integration with Orchestrator\n');

  // Test 1: Research task with grounding
  console.log('Test 1: Research task that should use Genkit grounding');
  console.log('=' .repeat(50));
  
  const researchRequest: OrchestrationRequest = {
    task: 'Research the latest developments in renewable energy technology',
    userId: 'test-user-123',
    preferences: {
      qualityLevel: 'premium',
      speedPriority: 'medium',
      costSensitivity: 'low'
    }
  };

  try {
    console.log('📋 Request:', researchRequest.task);
    console.log('🔄 Orchestrating...\n');
    
    const result = await orchestratorService.orchestrate(researchRequest);
    
    console.log('✅ Orchestration completed!');
    console.log(`📊 Deliverable Type: ${result.deliverableType}`);
    console.log(`⏱️  Duration: ${result.duration}ms`);
    console.log(`💰 Total Cost: $${result.cost.total.toFixed(4)}`);
    console.log(`🤖 Agents Used: ${result.agentTrace.length}`);
    
    // Check if grounding was used
    const groundedAgents = result.agentTrace.filter(
      execution => execution.metadata?.toolsUsed?.includes('google-search')
    );
    
    console.log(`🔍 Agents with grounding: ${groundedAgents.length}`);
    
    if (groundedAgents.length > 0) {
      console.log('\n📌 Grounded Agent Details:');
      groundedAgents.forEach(agent => {
        console.log(`  - ${agent.agentName}: ${agent.metadata?.sources?.length || 0} sources`);
      });
    }
    
    console.log('\n📄 Sample Output (first 500 chars):');
    console.log(JSON.stringify(result.deliverable).substring(0, 500) + '...');
    
  } catch (error) {
    console.error('❌ Test 1 failed:', error);
  }

  console.log('\n' + '=' .repeat(50) + '\n');

  // Test 2: Critical appraisal task
  console.log('Test 2: Critical appraisal task with grounding');
  console.log('=' .repeat(50));
  
  const criticalRequest: OrchestrationRequest = {
    task: 'Provide a critical analysis of artificial intelligence in healthcare',
    userId: 'test-user-123',
    preferences: {
      qualityLevel: 'premium',
      speedPriority: 'low',
      costSensitivity: 'low'
    }
  };

  try {
    console.log('📋 Request:', criticalRequest.task);
    console.log('🔄 Orchestrating...\n');
    
    const result = await orchestratorService.orchestrate(criticalRequest);
    
    console.log('✅ Orchestration completed!');
    console.log(`📊 Analysis included critical appraisal: ${
      result.metadata?.analysis?.requiredCapabilities?.includes('critical-appraisal') || false
    }`);
    
    const criticalAgents = result.agentTrace.filter(
      execution => execution.agentId === 'critical-appraiser' || 
                   execution.agentId === 'theology-analyst'
    );
    
    console.log(`🎯 Critical appraisal agents used: ${criticalAgents.length}`);
    
    if (criticalAgents.length > 0) {
      console.log('\n🔍 Critical Appraisal Sources:');
      criticalAgents.forEach(agent => {
        const sources = agent.metadata?.sources || [];
        console.log(`  - ${agent.agentName}: ${sources.length} sources`);
        if (sources.length > 0) {
          console.log(`    Sources: ${sources.slice(0, 3).join(', ')}...`);
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Test 2 failed:', error);
  }

  console.log('\n' + '=' .repeat(50) + '\n');

  // Test 3: Task with grounding disabled
  console.log('Test 3: Task with grounding explicitly disabled');
  console.log('=' .repeat(50));
  
  const noGroundingRequest: OrchestrationRequest = {
    task: 'Write a creative story about a time traveler',
    userId: 'test-user-123',
    preferences: {
      qualityLevel: 'standard',
      speedPriority: 'high',
      costSensitivity: 'high',
      disableGrounding: true
    }
  };

  try {
    console.log('📋 Request:', noGroundingRequest.task);
    console.log('🚫 Grounding disabled: true');
    console.log('🔄 Orchestrating...\n');
    
    const result = await orchestratorService.orchestrate(noGroundingRequest);
    
    console.log('✅ Orchestration completed!');
    
    const groundedAgents = result.agentTrace.filter(
      execution => execution.metadata?.toolsUsed?.includes('google-search')
    );
    
    console.log(`🔍 Agents with grounding: ${groundedAgents.length} (should be 0)`);
    console.log(`⚡ Execution was faster due to no grounding: ${result.duration}ms`);
    
  } catch (error) {
    console.error('❌ Test 3 failed:', error);
  }

  console.log('\n' + '=' .repeat(50) + '\n');

  // Test 4: Direct Genkit flow execution
  console.log('Test 4: Direct Genkit flow execution');
  console.log('=' .repeat(50));
  
  try {
    console.log('🔄 Executing research flow directly...\n');
    
    const flowResult = await genkitService.executeFlow('research-agent', {
      task: 'What are the benefits of meditation?',
      context: { source: 'direct test' }
    });
    
    console.log('✅ Flow execution completed!');
    console.log(`📊 Result length: ${flowResult.result.length} chars`);
    console.log(`🔍 Sources used: ${flowResult.metadata?.sources?.length || 0}`);
    console.log(`🛠️  Tools used: ${flowResult.metadata?.toolsUsed?.join(', ') || 'none'}`);
    
    console.log('\n📄 Sample Output (first 300 chars):');
    console.log(flowResult.result.substring(0, 300) + '...');
    
  } catch (error) {
    console.error('❌ Test 4 failed:', error);
  }

  console.log('\n✅ All tests completed!');
}

// Run the tests
testGenkitIntegration().catch(console.error);
