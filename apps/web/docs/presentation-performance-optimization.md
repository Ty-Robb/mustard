# Presentation Performance Optimization Plan

## Current Performance Analysis

### Bottleneck Identified
The orchestrator executes workflow phases sequentially, even when phases could potentially run in parallel. Current execution time: ~150 seconds for 7 agents.

### Current Workflow Structure
```
1. orchestration (1 agent) - Sequential
2. story-structure (1 agent) - Sequential  
3. core-message (1 agent) - Sequential
4. content-creation (2 agents) - Parallel within phase
5. speaker-notes (1 agent) - Sequential
6. final-formatting (1 agent) - Sequential
```

### Time Breakdown (estimated)
- Each agent takes ~20-25 seconds on average
- Total: 7 agents × 21 seconds = ~147 seconds
- Only content-creation runs 2 agents in parallel, saving ~20 seconds

## Optimization Strategies

### 1. Immediate Optimization: Parallel Phase Execution
Some phases could run in parallel without dependencies:
- `story-structure` and `core-message` could run simultaneously after orchestration
- This would save ~20-25 seconds

### 2. Agent Consolidation
Reduce the number of sequential steps by combining related agents:
- Merge `visual-clarity` and `memorable-moments` into a single enhanced content agent
- Combine `speaker-notes` generation with `final-formatting`
- Reduces from 7 to 5 agents, saving ~40-50 seconds

### 3. Model Optimization
Currently using `gemini-2.5-flash-lite` for all presentation agents. Consider:
- Use `gemini-2.5-flash` for critical agents (orchestrator, formatter)
- Keep `flash-lite` for supporting agents
- Potential 10-15% speed improvement

### 4. Prompt Optimization
Reduce token usage in prompts:
- Remove redundant instructions
- Use more concise formatting examples
- Streamline agent communication

### 5. Streaming Response Assembly
Instead of waiting for all agents to complete:
- Start assembling the presentation as agents finish
- Stream partial results to the UI
- Improves perceived performance

## Implementation Plan

### Phase 1: Quick Wins (Target: 100-120 seconds)
1. **Parallel Phase Execution**
   ```typescript
   // Modify presentation workflow to mark compatible phases for parallel execution
   phases: [
     { phaseName: 'orchestration', parallel: false, ... },
     { phaseName: 'analysis', parallel: true, agents: [
       'story-structure', 'core-message'
     ]},
     { phaseName: 'content', parallel: true, agents: [
       'visual-clarity', 'memorable-moments'
     ]},
     { phaseName: 'finalization', parallel: false, agents: [
       'speaker-notes', 'formatter'
     ]}
   ]
   ```

2. **Update Orchestrator Service**
   - Add support for parallel phase execution
   - Implement dependency resolution between phases

### Phase 2: Agent Optimization (Target: 60-80 seconds)
1. **Consolidate Agents**
   - Create `content-specialist` combining visual + memorable
   - Create `finalizer-agent` combining notes + formatting

2. **Optimize Prompts**
   - Reduce prompt sizes by 30-40%
   - Use more efficient instruction formats

### Phase 3: Advanced Features
1. **Progressive Rendering**
   - Stream slides as they're generated
   - Show presentation structure early

2. **Caching Layer**
   - Cache common presentation patterns
   - Reuse formatting templates

## Expected Results

### Performance Targets
- **Current**: ~150 seconds
- **Phase 1**: 100-120 seconds (20-33% improvement)
- **Phase 2**: 60-80 seconds (47-60% improvement)
- **Phase 3**: 40-60 seconds (60-73% improvement)

### Quality Maintenance
- Keep all quality checks in place
- Maintain formatting standards
- Preserve the multi-perspective approach

## Next Steps
1. Implement parallel phase execution in orchestrator
2. Update presentation workflow structure
3. Test with various presentation topics
4. Monitor quality vs speed trade-offs
5. Iterate based on results

## Code Changes Required

### 1. Orchestrator Service
- Modify `executeAgents` to support parallel phase execution
- Add phase dependency resolution
- Update cost calculation for parallel execution

### 2. Presentation Workflow
- Restructure phases for parallelism
- Update agent dependencies
- Optimize task templates

### 3. Agent Registry
- Add new consolidated agents if needed
- Update model assignments
- Optimize agent prompts

## Monitoring
- Log execution time per agent
- Track token usage per phase
- Monitor quality scores
- Measure user satisfaction
