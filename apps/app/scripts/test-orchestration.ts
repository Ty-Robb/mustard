/**
 * Test script for the Multi-Agent Orchestration System
 */

import { orchestratorService } from '@/lib/services/orchestrator.service';
import { OrchestrationRequest } from '@/types/orchestration';

async function testOrchestration() {
  console.log('🚀 Testing Multi-Agent Orchestration System...\n');

  // Test 1: Simple Essay Request
  console.log('Test 1: Essay Writing');
  console.log('====================');
  
  const essayRequest: OrchestrationRequest = {
    task: 'Write a short essay about the importance of community in church life',
    deliverableType: 'essay',
    userId: 'test-user-123',
    preferences: {
      qualityLevel: 'standard',
      speedPriority: 'medium',
      costSensitivity: 'medium',
      targetAudience: 'church members',
      tone: 'inspirational',
      length: 'short'
    }
  };

  try {
    console.log('📝 Request:', essayRequest.task);
    console.log('⏳ Orchestrating agents...\n');
    
    const result = await orchestratorService.orchestrate(essayRequest);
    
    console.log('✅ Orchestration completed!');
    console.log(`📊 Agents used: ${result.agentTrace.length}`);
    console.log(`⏱️  Duration: ${result.duration}ms`);
    console.log(`💰 Total cost: $${result.cost.total.toFixed(4)}`);
    console.log('\n📋 Agent Execution Trace:');
    
    result.agentTrace.forEach((execution, index) => {
      console.log(`  ${index + 1}. ${execution.agentName} (${execution.model})`);
      console.log(`     - Success: ${execution.success ? '✅' : '❌'}`);
      console.log(`     - Tokens: ${execution.tokensUsed}`);
      console.log(`     - Time: ${execution.executionTime}ms`);
      console.log(`     - Cost: $${execution.cost.toFixed(4)}`);
    });
    
    console.log('\n📄 Deliverable Summary:');
    console.log(`Type: ${result.deliverableType}`);
    if (result.deliverable.title) {
      console.log(`Title: ${result.deliverable.title}`);
    }
    console.log(`Content preview: ${result.deliverable.content?.substring(0, 200)}...`);
    
  } catch (error) {
    console.error('❌ Orchestration failed:', error);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 2: Presentation Request
  console.log('Test 2: Presentation Creation');
  console.log('=============================');
  
  const presentationRequest: OrchestrationRequest = {
    task: 'Create a presentation about youth ministry trends',
    deliverableType: 'presentation',
    userId: 'test-user-123',
    preferences: {
      qualityLevel: 'premium',
      speedPriority: 'low',
      costSensitivity: 'low',
      includeImages: true,
      targetAudience: 'church leaders',
      length: 'medium'
    }
  };

  try {
    console.log('📝 Request:', presentationRequest.task);
    console.log('⏳ Orchestrating agents...\n');
    
    const result = await orchestratorService.orchestrate(presentationRequest);
    
    console.log('✅ Orchestration completed!');
    console.log(`📊 Agents used: ${result.agentTrace.length}`);
    console.log(`⏱️  Duration: ${result.duration}ms`);
    console.log(`💰 Total cost: $${result.cost.total.toFixed(4)}`);
    
    console.log('\n💰 Cost Breakdown:');
    console.log('By Model:');
    Object.entries(result.cost.byModel).forEach(([model, cost]) => {
      console.log(`  - ${model}: $${cost.toFixed(4)}`);
    });
    
    console.log('\n📊 Deliverable Summary:');
    console.log(`Type: ${result.deliverableType}`);
    console.log(`Slides: ${result.deliverable.slideCount || 0}`);
    
  } catch (error) {
    console.error('❌ Orchestration failed:', error);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 3: Model Selection Test
  console.log('Test 3: Model Selection Intelligence');
  console.log('====================================');
  
  const simpleRequest: OrchestrationRequest = {
    task: 'Generate a title for a sermon about forgiveness',
    userId: 'test-user-123',
    preferences: {
      qualityLevel: 'basic',
      speedPriority: 'high',
      costSensitivity: 'high'
    }
  };

  try {
    console.log('📝 Request:', simpleRequest.task);
    console.log('⏳ Orchestrating agents...\n');
    
    const result = await orchestratorService.orchestrate(simpleRequest);
    
    console.log('✅ Orchestration completed!');
    console.log(`📊 Models used:`);
    
    const modelUsage = new Map<string, number>();
    result.agentTrace.forEach(execution => {
      modelUsage.set(execution.model, (modelUsage.get(execution.model) || 0) + 1);
    });
    
    modelUsage.forEach((count, model) => {
      console.log(`  - ${model}: ${count} times`);
    });
    
    console.log(`\n💰 Cost efficiency: $${result.cost.total.toFixed(4)} (optimized for cost)`);
    
  } catch (error) {
    console.error('❌ Orchestration failed:', error);
  }

  console.log('\n✨ Orchestration testing complete!');
}

// Run the test
testOrchestration().catch(console.error);
