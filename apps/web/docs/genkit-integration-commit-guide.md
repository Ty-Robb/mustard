# Genkit Integration - Git Commit Guide

## Current Status
We have successfully integrated Google's Genkit framework with the Mustard multi-agent orchestration system. This guide outlines how to commit these changes in logical chunks.

## Files Changed
- **Modified Files:**
  - `.env.example` - Added Google Search API configuration
  - `package.json` - Added Genkit dependencies
  - `src/lib/services/orchestrator.service.ts` - Integrated Genkit grounding
  - `src/types/orchestration.ts` - Added metadata support
  - Various other files (agent-registry, chat.service, etc.)

- **New Files:**
  - `package-lock.json` - NPM lock file (replaced pnpm-lock.yaml)
  - `src/lib/services/genkit.service.ts` - Core Genkit service
  - `src/scripts/test-genkit-integration.ts` - Integration tests
  - `docs/genkit-integration-guide.md` - Documentation

- **Deleted Files:**
  - `pnpm-lock.yaml` - Replaced by package-lock.json

## Recommended Commit Sequence

### Commit 1: Switch from pnpm to npm
```bash
git add pnpm-lock.yaml package-lock.json
git commit -m "chore: switch from pnpm to npm package manager

- Remove pnpm-lock.yaml
- Add package-lock.json
- Maintain all existing dependencies"
```

### Commit 2: Add Genkit dependencies
```bash
git add package.json
git commit -m "feat: add Genkit and Google AI dependencies

- Add genkit@1.18.0 for AI flow orchestration
- Add @genkit-ai/googleai@1.18.0 for Google AI integration
- Prepare for grounding capabilities with Google Search"
```

### Commit 3: Create Genkit service
```bash
git add src/lib/services/genkit.service.ts
git commit -m "feat: create Genkit service with flow orchestration

- Implement GenkitService with research, critical appraisal, and data analysis flows
- Add mock Google Search functionality for development
- Include proper TypeScript interfaces and error handling
- Implement fallback to VertexAI when Genkit encounters issues
- Support for lazy initialization to handle client/server environments"
```

### Commit 4: Update orchestration types
```bash
git add src/types/orchestration.ts
git commit -m "feat: add metadata support to orchestration types

- Add optional metadata field to AgentExecution interface
- Support tracking sources, confidence scores, and tools used
- Add disableGrounding option to UserPreferences
- Maintain backward compatibility"
```

### Commit 5: Integrate Genkit with orchestrator
```bash
git add src/lib/services/orchestrator.service.ts
git commit -m "feat: integrate Genkit grounding into orchestrator

- Add grounding support for research and analysis agents
- Route grounding-enabled agents through Genkit flows
- Implement shouldUseGrounding logic
- Maintain backward compatibility for non-grounded agents
- Add metadata propagation from Genkit responses"
```

### Commit 6: Add environment configuration
```bash
git add .env.example
git commit -m "docs: add Google Search API configuration to env example

- Add GOOGLE_SEARCH_API_KEY placeholder
- Add GOOGLE_SEARCH_ENGINE_ID placeholder
- Document configuration requirements for grounding"
```

### Commit 7: Add test scripts
```bash
git add src/scripts/test-genkit-integration.ts
git commit -m "test: add comprehensive Genkit integration tests

- Test grounding functionality with mock search
- Test fallback to VertexAI service
- Test direct flow execution
- Test grounding disable functionality
- Include detailed console output for debugging"
```

### Commit 8: Add documentation
```bash
git add docs/genkit-integration-guide.md
git commit -m "docs: add Genkit integration guide

- Document installation and setup process
- Explain architecture and flow design
- Provide usage examples
- Include troubleshooting section
- Document future enhancements roadmap"
```

### Commit 9: Update other orchestration files
```bash
git add src/lib/agents/agent-registry.ts src/lib/services/chat.service.ts
git add src/scripts/test-chat-orchestration.ts src/scripts/test-critical-appraisal.ts
git add docs/critical-appraisal-implementation.md docs/multi-agent-orchestration-integration.md
git add docs/multi-agent-orchestration-progress.md
git commit -m "feat: update orchestration system for Genkit support

- Update agent registry with grounding capabilities
- Enhance chat service integration
- Add comprehensive test coverage
- Update documentation for new features"
```

## Post-Commit Tasks

After committing, we should address the identified issues:

1. **Fix JSON parsing in orchestrator** - Handle markdown code blocks
2. **Improve deliverable type detection** - Better task analysis
3. **Fix agent selection logic** - Ensure proper agent routing

## Verification

After each commit, verify:
```bash
# Check commit history
git log --oneline -10

# Verify no uncommitted changes remain
git status

# Run tests to ensure nothing broke
npm run test:genkit  # (if script is added)
