/**
 * Master Orchestrator Service
 * Coordinates multi-agent workflows and manages task execution
 */

// Use crypto.randomUUID() instead of uuid package
import { 
  OrchestrationRequest,
  OrchestrationResult,
  TaskAnalysis,
  ExecutionPlan,
  ExecutionPhase,
  AgentTask,
  AgentExecution,
  CostBreakdown,
  DeliverableType,
  ModelSelectionCriteria,
  OrchestrationError,
  AgentResponse,
  OrchestrationSession,
  Agent
} from '@/types/orchestration';
import { 
  defaultAgentRegistry, 
  getAgent,
  findAgentsForTask 
} from '@/lib/agents/agent-registry';
import { 
  selectModel, 
  analyzeTaskComplexity,
  determineQualityRequirement,
  calculateEstimatedCost,
  getModelParameters
} from '@/lib/utils/model-selector';
import { VertexAIService } from '@/lib/services/vertex-ai.service';
import { getDatabase } from '@/lib/mongodb';
import { genkitService } from '@/lib/services/genkit.service';
import { getPresentationWorkflow, getPresentationAgentPrompt } from '@/lib/workflows/presentation-workflow';
// Activity logging removed - orchestrator is a system service without user tokens

export class OrchestratorService {
  private vertexAI: VertexAIService;
  private registry = defaultAgentRegistry;

  constructor() {
    this.vertexAI = new VertexAIService();
  }

  /**
   * Main orchestration entry point
   */
  async orchestrate(request: OrchestrationRequest): Promise<OrchestrationResult> {
    const sessionId = crypto.randomUUID();
    const startTime = Date.now();

    try {
      // 1. Analyze the task
      console.log(`[Orchestrator] Analyzing task: ${request.task}`);
      const analysis = await this.analyzeTask(request);

      // 2. Create execution plan
      console.log(`[Orchestrator] Creating execution plan for ${analysis.deliverableType}`);
      const plan = await this.createExecutionPlan(analysis, request);

      // 3. Initialize session in database
      const session = await this.initializeSession(sessionId, request, analysis, plan);

      // 4. Execute the plan
      console.log(`[Orchestrator] Executing plan with ${plan.totalAgents} agents`);
      const agentExecutions = await this.executeAgents(plan, request);

      // 5. Synthesize results
      console.log(`[Orchestrator] Synthesizing results from ${agentExecutions.length} executions`);
      const deliverable = await this.synthesizeResults(agentExecutions, analysis);

      // 6. Calculate costs
      const cost = this.calculateCosts(agentExecutions);

      // 7. Update session and return result
      const result: OrchestrationResult = {
        success: true,
        sessionId,
        deliverable,
        deliverableType: analysis.deliverableType,
        agentTrace: agentExecutions,
        cost,
        duration: Date.now() - startTime,
        metadata: {
          analysis,
          plan
        }
      };

      await this.updateSession(sessionId, 'completed', result);

      // Note: Activity logging would require user authentication token
      // Consider implementing system-level logging or passing token through request
      console.log(`[Orchestrator] Completed orchestration for user ${request.userId}:`, {
        sessionId,
        deliverableType: analysis.deliverableType,
        agentCount: plan.totalAgents,
        duration: result.duration,
        cost: cost.total
      });

      return result;

    } catch (error) {
      console.error('[Orchestrator] Error:', error);
      await this.updateSession(sessionId, 'failed');
      throw new OrchestrationError(
        `Orchestration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'ORCHESTRATION_ERROR'
      );
    }
  }

  /**
   * Analyze the task using the orchestrator agent
   */
  private async analyzeTask(request: OrchestrationRequest): Promise<TaskAnalysis> {
    const orchestratorAgent = getAgent(this.registry, 'orchestrator');
    if (!orchestratorAgent) {
      throw new OrchestrationError('Orchestrator agent not found', 'AGENT_NOT_FOUND');
    }

    const prompt = `
You are the Master Orchestrator analyzing a user request to determine the best approach.

User Request: "${request.task}"

${request.context ? `Additional Context: ${JSON.stringify(request.context)}` : ''}

Analyze this request and provide a structured response with:
1. The type of deliverable - IMPORTANT: Only set as "presentation" if the user explicitly asks for a presentation, slides, or slide deck using clear language like "create a presentation", "make slides", etc. Otherwise, default to essay, article, or general.
2. Required capabilities needed from specialist agents
3. Estimated complexity (simple, moderate, or complex)
4. Suggested workflow approach
5. Whether image generation is needed
6. Whether critical appraisal is needed (for topics requiring balanced evaluation)
7. Any special considerations

CRITICAL: Do NOT set deliverableType as "presentation" unless the user explicitly requests one with phrases like:
- "create a presentation about..."
- "make me a presentation on..."
- "build a slide deck for..."
- "I need slides about..."
- "generate a presentation on..."

Simply mentioning a topic or asking questions should NOT trigger presentation mode.

Respond in JSON format:
{
  "deliverableType": "type",
  "requiredCapabilities": ["capability1", "capability2"],
  "estimatedComplexity": "complexity",
  "suggestedWorkflow": "workflow-name",
  "estimatedAgents": number,
  "requiresImageGeneration": boolean,
  "requiresCriticalAppraisal": boolean,
  "metadata": {
    "specialConsiderations": ["consideration1"],
    "estimatedSlides": number (if presentation),
    "estimatedWords": number (if essay/article),
    "estimatedWeeks": number (if course)
  }
}`;

    const response = await this.vertexAI.generateContent(
      prompt,
      orchestratorAgent.modelName,
      getModelParameters(orchestratorAgent.modelName, orchestratorAgent)
    );

    try {
      // Strip markdown code blocks if present
      let cleanResponse = response.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.substring(7); // Remove ```json
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.substring(3); // Remove ```
      }
      if (cleanResponse.endsWith('```')) {
        cleanResponse = cleanResponse.substring(0, cleanResponse.length - 3); // Remove trailing ```
      }
      cleanResponse = cleanResponse.trim();
      
      const analysis = JSON.parse(cleanResponse);
      // Add critical-appraisal capability if needed
      const capabilities = analysis.requiredCapabilities || [];
      if (analysis.requiresCriticalAppraisal && !capabilities.includes('critical-appraisal')) {
        capabilities.push('critical-appraisal');
      }
      
      return {
        deliverableType: analysis.deliverableType || 'general',
        requiredCapabilities: capabilities,
        estimatedComplexity: analysis.estimatedComplexity || 'moderate',
        suggestedWorkflow: analysis.suggestedWorkflow || 'standard',
        estimatedAgents: analysis.estimatedAgents || 3,
        requiresImageGeneration: analysis.requiresImageGeneration || false,
        metadata: analysis.metadata || {}
      };
    } catch (error) {
      console.error('[Orchestrator] Failed to parse analysis:', error);
      console.error('[Orchestrator] Raw response:', response);
      // Fallback analysis
      return {
        deliverableType: request.deliverableType || 'general',
        requiredCapabilities: ['research', 'content-writing'],
        estimatedComplexity: 'moderate',
        suggestedWorkflow: 'standard',
        estimatedAgents: 3,
        requiresImageGeneration: false,
        metadata: {}
      };
    }
  }

  /**
   * Create an execution plan based on the analysis
   */
  private async createExecutionPlan(
    analysis: TaskAnalysis, 
    request: OrchestrationRequest
  ): Promise<ExecutionPlan> {
    const planId = crypto.randomUUID();
    const phases: ExecutionPhase[] = [];

    // Check if a specific agent is forced
    if (request.context?.forceAgent) {
      const forcedAgent = getAgent(this.registry, request.context.forceAgent);
      if (forcedAgent) {
        console.log(`[Orchestrator] Using forced agent: ${forcedAgent.name}`);
        
        // Create a single-phase plan with the forced agent
        const criteria: ModelSelectionCriteria = {
          taskComplexity: analyzeTaskComplexity(request.task, forcedAgent),
          qualityRequirement: determineQualityRequirement(
            request.task, 
            request.preferences?.qualityLevel
          ),
          speedPriority: request.preferences?.speedPriority || 'medium',
          needsImageGeneration: forcedAgent.id === 'image-generator',
          costSensitivity: request.preferences?.costSensitivity || 'medium'
        };

        const model = selectModel(criteria);

        phases.push({
          phaseId: 'phase-0',
          phaseName: 'execution',
          parallel: false,
          tasks: [{
            taskId: crypto.randomUUID(),
            agentId: forcedAgent.id,
            task: request.task,
            model,
            priority: 1
          }]
        });

        const estimatedCost = calculateEstimatedCost(model);

        return {
          planId,
          phases,
          estimatedDuration: 5000,
          estimatedCost,
          totalAgents: 1
        };
      }
    }

    // Get workflow template based on deliverable type
    const workflow = this.getWorkflowTemplate(analysis.deliverableType);

    // Build phases based on workflow
    let phaseIndex = 0;
    for (const workflowPhase of workflow.phases) {
      const tasks: AgentTask[] = [];

      for (const agentConfig of workflowPhase.agents) {
        const agent = getAgent(this.registry, agentConfig.agentId);
        if (!agent) continue;

        // Determine model based on criteria
        const criteria: ModelSelectionCriteria = {
          taskComplexity: analyzeTaskComplexity(agentConfig.taskTemplate, agent),
          qualityRequirement: determineQualityRequirement(
            agentConfig.taskTemplate, 
            request.preferences?.qualityLevel
          ),
          speedPriority: request.preferences?.speedPriority || 'medium',
          needsImageGeneration: agentConfig.agentId === 'image-generator',
          costSensitivity: request.preferences?.costSensitivity || 'medium'
        };

        const model = selectModel(criteria);

        tasks.push({
          taskId: crypto.randomUUID(),
          agentId: agent.id,
          task: this.interpolateTask(agentConfig.taskTemplate, request, analysis),
          model,
          dependencies: workflowPhase.dependencies,
          priority: workflowPhase.priority || 1
        });
      }

      if (tasks.length > 0) {
        phases.push({
          phaseId: `phase-${phaseIndex++}`,
          phaseName: workflowPhase.phaseName,
          parallel: workflowPhase.parallel,
          tasks,
          dependencies: workflowPhase.dependencies
        });
      }
    }

    // Calculate estimates
    const totalAgents = phases.reduce((sum, phase) => sum + phase.tasks.length, 0);
    const estimatedDuration = totalAgents * 5000; // 5 seconds per agent average
    const estimatedCost = phases.reduce((sum, phase) => {
      return sum + phase.tasks.reduce((phaseSum, task) => {
        return phaseSum + calculateEstimatedCost(task.model);
      }, 0);
    }, 0);

    return {
      planId,
      phases,
      estimatedDuration,
      estimatedCost,
      totalAgents
    };
  }

  /**
   * Execute agents according to the plan
   */
  private async executeAgents(
    plan: ExecutionPlan,
    request: OrchestrationRequest
  ): Promise<AgentExecution[]> {
    const executions: AgentExecution[] = [];
    const phaseResults = new Map<string, any>();

    for (const phase of plan.phases) {
      console.log(`[Orchestrator] Executing phase: ${phase.phaseName}`);

      if (phase.parallel) {
        // Execute tasks in parallel
        const phaseExecutions = await Promise.all(
          phase.tasks.map(task => this.executeAgentTask(task, request, phaseResults))
        );
        executions.push(...phaseExecutions);
      } else {
        // Execute tasks sequentially
        for (const task of phase.tasks) {
          const execution = await this.executeAgentTask(task, request, phaseResults);
          executions.push(execution);
          
          // Store result for dependent tasks
          phaseResults.set(task.taskId, execution.output);
        }
      }

      // Store phase results
      phaseResults.set(phase.phaseId, {
        tasks: phase.tasks.map(t => t.taskId),
        results: executions.filter(e => 
          phase.tasks.some(t => t.taskId === e.executionId)
        )
      });
    }

    return executions;
  }

  /**
   * Execute a single agent task
   */
  private async executeAgentTask(
    task: AgentTask,
    request: OrchestrationRequest,
    previousResults: Map<string, any>
  ): Promise<AgentExecution> {
    const startTime = Date.now();
    const agent = getAgent(this.registry, task.agentId);
    
    if (!agent) {
      throw new OrchestrationError(
        `Agent not found: ${task.agentId}`,
        'AGENT_NOT_FOUND',
        task.agentId,
        task.taskId
      );
    }

    try {
      console.log(`[Orchestrator] Executing agent: ${agent.name} with model: ${task.model}`);

      // Build context from previous results
      const context = this.buildAgentContext(task, previousResults, request);

      let response: string;
      let metadata: any = {};

      // Check if agent should use Genkit for grounding
      if (this.shouldUseGrounding(agent, request)) {
        console.log(`[Orchestrator] Using Genkit grounding for agent: ${agent.id}`);
        
        const flowResult = await genkitService.executeFlow(agent.id, {
          task: task.task,
          context,
          agent
        });
        
        response = flowResult.result;
        metadata = flowResult.metadata || {};
      } else {
        // Standard execution without grounding
        const prompt = this.createAgentPrompt(agent, task, context);
        response = await this.vertexAI.generateContent(
          prompt,
          task.model,
          getModelParameters(task.model, agent)
        );
      }

      // Calculate metrics
      const executionTime = Date.now() - startTime;
      const tokensUsed = response.length / 4; // Rough estimate
      const cost = calculateEstimatedCost(task.model, tokensUsed);

      return {
        executionId: task.taskId,
        agentId: agent.id,
        agentName: agent.name,
        model: task.model,
        phase: 'execution',
        input: { task: task.task, context },
        output: response,
        success: true,
        tokensUsed,
        executionTime,
        cost,
        timestamp: new Date(),
        metadata
      };

    } catch (error) {
      console.error(`[Orchestrator] Agent execution failed:`, error);
      
      return {
        executionId: task.taskId,
        agentId: agent.id,
        agentName: agent.name,
        model: task.model,
        phase: 'execution',
        input: { task: task.task },
        output: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        tokensUsed: 0,
        executionTime: Date.now() - startTime,
        cost: 0,
        timestamp: new Date()
      };
    }
  }

  /**
   * Determine if an agent should use grounding
   */
  private shouldUseGrounding(agent: Agent, request: OrchestrationRequest): boolean {
    // Check if grounding is explicitly disabled in preferences
    if (request.preferences?.disableGrounding === true) {
      return false;
    }

    // All agents now use Genkit by default
    // The Genkit service will handle grounding appropriately based on agent type
    return true;
  }

  /**
   * Synthesize results from all agent executions
   */
  private async synthesizeResults(
    executions: AgentExecution[],
    analysis: TaskAnalysis
  ): Promise<any> {
    // Group executions by phase
    const phaseGroups = new Map<string, AgentExecution[]>();
    
    executions.forEach(execution => {
      const phase = execution.phase || 'unknown';
      if (!phaseGroups.has(phase)) {
        phaseGroups.set(phase, []);
      }
      phaseGroups.get(phase)!.push(execution);
    });

    // Build deliverable based on type
    switch (analysis.deliverableType) {
      case 'presentation':
        return this.synthesizePresentationResults(executions, analysis);
      
      case 'essay':
      case 'article':
        return this.synthesizeDocumentResults(executions, analysis);
      
      case 'sermon':
        return this.synthesizeSermonResults(executions, analysis);
      
      case 'course':
        return this.synthesizeCourseResults(executions, analysis);
      
      default:
        return this.synthesizeGeneralResults(executions, analysis);
    }
  }

  /**
   * Helper methods for specific deliverable synthesis
   */
  private synthesizePresentationResults(
    executions: AgentExecution[],
    analysis: TaskAnalysis
  ): any {
    // Look for the formatter agent's output first - it has the final formatted presentation
    const formatterExecution = executions.find(e => e.agentId === 'formatter-agent');
    
    if (formatterExecution && formatterExecution.success && formatterExecution.output) {
      // The formatter agent outputs the complete formatted presentation
      return {
        type: 'presentation',
        content: formatterExecution.output,
        metadata: {
          agentCount: executions.length,
          workflow: 'multi-agent-presentation'
        }
      };
    }

    // Fallback: try to find any agent with presentation content
    const presentationAgents = [
      'presentation-orchestrator',
      'story-arc-specialist', 
      'core-message-specialist',
      'visual-clarity',
      'memorable-moments',
      'speaker-notes-specialist'
    ];

    for (const execution of executions) {
      if (!execution.success || !execution.output) continue;
      
      if (presentationAgents.includes(execution.agentId)) {
        // Check if output looks like a presentation (has slide markers)
        if (execution.output.includes('## Slide') || 
            execution.output.includes('### Slide') ||
            execution.output.includes('[Slide')) {
          return {
            type: 'presentation',
            content: execution.output,
            metadata: {
              agentCount: executions.length,
              workflow: 'multi-agent-presentation',
              source: execution.agentId
            }
          };
        }
      }
    }

    // Last resort: combine all outputs
    const allOutputs = executions
      .filter(e => e.success && e.output)
      .map(e => `### ${e.agentName}\n\n${e.output}`)
      .join('\n\n---\n\n');

    return {
      type: 'presentation',
      content: allOutputs,
      metadata: {
        agentCount: executions.length,
        workflow: 'multi-agent-presentation',
        warning: 'No formatted presentation found, showing raw outputs'
      }
    };
  }

  private synthesizeDocumentResults(
    executions: AgentExecution[],
    analysis: TaskAnalysis
  ): any {
    let title = '';
    let introduction = '';
    let body = '';
    let conclusion = '';
    const metadata: any = {};

    executions.forEach(execution => {
      if (!execution.success || !execution.output) return;

      switch (execution.agentId) {
        case 'title-generator':
          title = execution.output;
          break;
        case 'introduction-writer':
          introduction = execution.output;
          break;
        case 'body-writer':
          body = execution.output;
          break;
        case 'conclusion-writer':
          conclusion = execution.output;
          break;
        case 'seo-optimizer':
          metadata.seo = execution.output;
          break;
      }
    });

    return {
      type: analysis.deliverableType,
      title,
      content: `${introduction}\n\n${body}\n\n${conclusion}`,
      sections: { introduction, body, conclusion },
      metadata
    };
  }

  private synthesizeSermonResults(
    executions: AgentExecution[],
    analysis: TaskAnalysis
  ): any {
    // Similar to document but with sermon-specific structure
    return this.synthesizeDocumentResults(executions, analysis);
  }

  private synthesizeCourseResults(
    executions: AgentExecution[],
    analysis: TaskAnalysis
  ): any {
    const modules: any[] = [];
    const metadata: any = {};

    // Group by module/week
    // Implementation depends on course structure

    return {
      type: 'course',
      modules,
      metadata
    };
  }

  private synthesizeGeneralResults(
    executions: AgentExecution[],
    analysis: TaskAnalysis
  ): any {
    // Combine all successful outputs
    const results = executions
      .filter(e => e.success && e.output)
      .map(e => ({
        agent: e.agentName,
        output: e.output
      }));

    return {
      type: 'general',
      results,
      metadata: { analysis }
    };
  }

  /**
   * Calculate total costs from executions
   */
  private calculateCosts(executions: AgentExecution[]): CostBreakdown {
    const byAgent: Record<string, number> = {};
    const byModel: Record<string, number> = {
      'gemini-2.5-pro': 0,
      'gemini-2.5-flash': 0,
      'gemini-2.5-flash-lite': 0,
      'gemini-2.5-flash-image-preview': 0
    };
    const byPhase: Record<string, number> = {};
    let total = 0;

    executions.forEach(execution => {
      // By agent
      byAgent[execution.agentId] = (byAgent[execution.agentId] || 0) + execution.cost;
      
      // By model
      byModel[execution.model] = (byModel[execution.model] || 0) + execution.cost;
      
      // By phase
      const phase = execution.phase || 'unknown';
      byPhase[phase] = (byPhase[phase] || 0) + execution.cost;
      
      // Total
      total += execution.cost;
    });

    return { total, byAgent, byModel, byPhase };
  }

  /**
   * Database operations
   */
  private async initializeSession(
    sessionId: string,
    request: OrchestrationRequest,
    analysis: TaskAnalysis,
    plan: ExecutionPlan
  ): Promise<OrchestrationSession> {
    const db = await getDatabase();
    const session: OrchestrationSession = {
      sessionId,
      userId: request.userId,
      request,
      analysis,
      plan,
      status: 'executing',
      agentExecutions: [],
      cost: { 
        total: 0, 
        byAgent: {}, 
        byModel: {
          'gemini-2.5-pro': 0,
          'gemini-2.5-flash': 0,
          'gemini-2.5-flash-lite': 0,
          'gemini-2.5-flash-image-preview': 0
        }, 
        byPhase: {} 
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection('orchestration_sessions').insertOne(session);
    return session;
  }

  private async updateSession(
    sessionId: string,
    status: 'planning' | 'executing' | 'completed' | 'failed',
    result?: OrchestrationResult
  ): Promise<void> {
    const db = await getDatabase();
    const update: any = {
      status,
      updatedAt: new Date()
    };

    if (result) {
      update.result = result;
      update.agentExecutions = result.agentTrace;
      update.cost = result.cost;
    }

    await db.collection('orchestration_sessions').updateOne(
      { sessionId },
      { $set: update }
    );
  }

  /**
   * Helper methods
   */
  private getWorkflowTemplate(deliverableType: DeliverableType): any {
    // Use specialized presentation workflow
    if (deliverableType === 'presentation') {
      return getPresentationWorkflow();
    }
    
    // Other workflows remain the same
    const workflows: Record<DeliverableType, any> = {
      presentation: getPresentationWorkflow(), // This won't be reached but kept for type safety
      essay: {
        phases: [
          {
            phaseName: 'research',
            parallel: true,
            agents: [
              { agentId: 'research-agent', taskTemplate: 'Research {task}' },
              { agentId: 'critical-appraiser', taskTemplate: 'Provide critical analysis for: {task}' }
            ]
          },
          {
            phaseName: 'planning',
            parallel: false,
            agents: [
              { agentId: 'outline-agent', taskTemplate: 'Create essay outline' }
            ]
          },
          {
            phaseName: 'writing',
            parallel: false,
            agents: [
              { agentId: 'introduction-writer', taskTemplate: 'Write introduction' },
              { agentId: 'body-writer', taskTemplate: 'Write main content' },
              { agentId: 'conclusion-writer', taskTemplate: 'Write conclusion' }
            ]
          },
          {
            phaseName: 'enhancement',
            parallel: true,
            agents: [
              { agentId: 'editor-agent', taskTemplate: 'Edit and polish' },
              { agentId: 'seo-optimizer', taskTemplate: 'Optimize for web' }
            ]
          }
        ]
      },
      article: {
        // Similar to essay
        phases: []
      },
      sermon: {
        phases: [
          {
            phaseName: 'scripture',
            parallel: true,
            agents: [
              { agentId: 'biblical-research', taskTemplate: 'Research scripture for {task}' },
              { agentId: 'theology-analyst', taskTemplate: 'Analyze theological context' }
            ]
          },
          {
            phaseName: 'structure',
            parallel: false,
            agents: [
              { agentId: 'sermon-specialist', taskTemplate: 'Create sermon outline' }
            ]
          },
          {
            phaseName: 'content',
            parallel: false,
            agents: [
              { agentId: 'introduction-writer', taskTemplate: 'Write sermon introduction' },
              { agentId: 'body-writer', taskTemplate: 'Develop main points' },
              { agentId: 'illustration-finder', taskTemplate: 'Find illustrations' },
              { agentId: 'conclusion-writer', taskTemplate: 'Write application and invitation' }
            ]
          }
        ]
      },
      course: {
        phases: [
          {
            phaseName: 'design',
            parallel: false,
            agents: [
              { agentId: 'curriculum-designer', taskTemplate: 'Design course structure' }
            ]
          }
        ]
      },
      general: {
        phases: [
          {
            phaseName: 'execution',
            parallel: false,
            agents: [
              { agentId: 'research-agent', taskTemplate: 'Process {task}' }
            ]
          }
        ]
      }
    };

    return workflows[deliverableType] || workflows.general;
  }

  private interpolateTask(
    template: string, 
    request: OrchestrationRequest,
    analysis: TaskAnalysis
  ): string {
    return template
      .replace('{task}', request.task)
      .replace('{deliverableType}', analysis.deliverableType)
      .replace('{audience}', request.preferences?.targetAudience || 'general audience');
  }

  private buildAgentContext(
    task: AgentTask,
    previousResults: Map<string, any>,
    request: OrchestrationRequest
  ): any {
    const context: any = {
      originalRequest: request.task,
      preferences: request.preferences,
      taskContext: request.context
    };

    // Add dependent results
    if (task.dependencies) {
      context.dependencies = {};
      task.dependencies.forEach(depId => {
        if (previousResults.has(depId)) {
          context.dependencies[depId] = previousResults.get(depId);
        }
      });
    }

    return context;
  }

  private createAgentPrompt(
    agent: any,
    task: AgentTask,
    context: any
  ): string {
    // Special prompt for presentation agents
    const presentationAgentIds = [
      'presentation-orchestrator',
      'story-arc-specialist',
      'core-message-specialist',
      'visual-clarity',
      'memorable-moments',
      'speaker-notes-specialist',
      'formatter-agent'
    ];
    
    if (presentationAgentIds.includes(agent.id)) {
      const presentationPrompt = getPresentationAgentPrompt(agent.id);
      return `
You are ${agent.name}, a specialist in ${agent.description}.

Your responsibilities include:
${agent.responsibilities.map((r: string) => `- ${r}`).join('\n')}

${presentationPrompt}

Task: ${task.task}

${context.originalRequest ? `Original Request: ${context.originalRequest}` : ''}

${context.dependencies ? `Previous Work:
${JSON.stringify(context.dependencies, null, 2)}` : ''}

${context.preferences ? `User Preferences:
${JSON.stringify(context.preferences, null, 2)}` : ''}

Remember: Follow the STRICT presentation formatting rules above. Every slide must be readable at a glance.
`;
    }
    
    // Special prompt for critical appraisal agent
    if (agent.id === 'critical-appraiser') {
      return `
You are ${agent.name}, a specialist in ${agent.description}.

Your responsibilities include:
${agent.responsibilities.map((r: string) => `- ${r}`).join('\n')}

Task: ${task.task}

${context.originalRequest ? `Original Request: ${context.originalRequest}` : ''}

${context.dependencies ? `Previous Research:
${JSON.stringify(context.dependencies, null, 2)}` : ''}

Please provide a comprehensive critical appraisal that:
1. Identifies key strengths and weaknesses
2. Evaluates evidence quality and reliability
3. Presents multiple perspectives fairly
4. Highlights assumptions and potential biases
5. Suggests areas for improvement or further investigation
6. Provides a balanced conclusion

Be thorough but fair, analytical but constructive. Your goal is to help the user understand the topic deeply, not just superficially.
`;
    }

    // Standard prompt for other agents
    return `
You are ${agent.name}, a specialist in ${agent.description}.

Your responsibilities include:
${agent.responsibilities.map((r: string) => `- ${r}`).join('\n')}

Task: ${task.task}

${context.originalRequest ? `Original Request: ${context.originalRequest}` : ''}

${context.dependencies ? `Previous Work:
${JSON.stringify(context.dependencies, null, 2)}` : ''}

${context.preferences ? `User Preferences:
${JSON.stringify(context.preferences, null, 2)}` : ''}

Please complete this task according to your specialization. ${agent.capabilities?.includes('critical-appraisal') ? 'Include critical evaluation and balanced perspectives in your response.' : ''} Provide clear, actionable output that can be used by other agents or presented to the user.
`;
  }
}

// Export singleton instance
export const orchestratorService = new OrchestratorService();
