# GitHub Copilot Instructions - Vibex Task Manager

This document provides project-specific guidelines for GitHub Copilot to understand the codebase structure, development workflow, and coding standards for the Vibex Task Manager project.

## Project Overview

Vibex Task Manager is a TypeScript-based task management system designed for AI-driven development using AWS Bedrock. The project focuses exclusively on AWS Bedrock as the AI provider and follows a structured task-driven development approach.

## Core Architecture

### Technology Stack
- **Language**: TypeScript (ES2022, NodeNext modules)
- **AI Provider**: AWS Bedrock (Claude models only)
- **Package Manager**: npm
- **Testing**: Jest with ESM support
- **Build System**: TypeScript compiler

### Key Directories
- `src/` - Core TypeScript source code
- `scripts/` - Development scripts and CLI commands
- `mcp-server/` - Model Context Protocol server implementation
- `tests/` - Unit and integration tests
- `dist/` - Compiled JavaScript output
- `.taskmanager/` - Project task management files

## Development Workflow

### CLI Commands
The project provides a global CLI through the `vibex-task-manager` command:
- `vibex-task-manager list` - List all tasks with status
- `vibex-task-manager next` - Show next task to work on
- `vibex-task-manager expand --id=<id>` - Break down complex tasks
- `vibex-task-manager set-status --id=<id> --status=done` - Update task status
- `vibex-task-manager analyze-complexity` - Analyze task complexity

### Task-Driven Development Process
1. Start with `vibex-task-manager list` to see current tasks
2. Use `vibex-task-manager next` to identify next task
3. Implement following task details and dependencies
4. Mark completed with `vibex-task-manager set-status`
5. Generate task files with `vibex-task-manager generate`

## Coding Standards

### TypeScript Guidelines
```typescript
// ✅ DO: Use explicit types for function parameters
function processTask(taskId: string, options: TaskOptions): Promise<TaskResult> {
  // Implementation
}

// ✅ DO: Import types with 'type' keyword
import type { Task, Subtask, TelemetryData } from '../types/index.js';

// ✅ DO: Use proper error handling with typed errors
try {
  await processTask(taskId, options);
} catch (error) {
  log('error', `Task processing failed: ${(error as Error).message}`);
}

// ❌ DON'T: Use implicit 'any' types
function processTask(taskId, options) { // Bad
  // Implementation
}
```

### File Structure Standards
```typescript
// ✅ DO: Follow this import order
import fs from 'fs';                           // Node.js built-ins
import path from 'path';
import chalk from 'chalk';                     // External dependencies
import { log } from '../utils/utils.js';      // Internal utilities
import type { Task } from '../types/index.js'; // Type imports

// ✅ DO: Use .js extensions in imports for ESM compatibility
import { getConfig } from './config-manager.js';

// ❌ DON'T: Omit extensions or use .ts extensions
import { getConfig } from './config-manager'; // Bad
```

### AWS Bedrock Integration
```typescript
// ✅ DO: Use BedrockAIProvider for all AI operations
import { BedrockAIProvider } from '../ai-providers/index.js';

const provider = new BedrockAIProvider();
const result = await provider.generateText({
  modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
  messages: [...],
  maxTokens: 64000,
  temperature: 0.2
});

// ✅ DO: Handle AWS credentials through environment variables
// AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_DEFAULT_REGION

// ❌ DON'T: Reference removed providers
// OpenAI, Azure, Ollama, Google, Perplexity, Mistral, XAI are not supported
```

### Configuration Management
```typescript
// ✅ DO: Use the centralized config system
import { getConfig, getMainProvider, getMainModelId } from '../config-manager.js';

const config = getConfig();
const provider = getMainProvider();
const modelId = getMainModelId();

// ✅ DO: Use .taskmanager directory structure
const TASKMANAGER_DIR = '.taskmanager';
const TASKMANAGER_CONFIG_FILE = '.taskmanager/config.json';
const TASKMANAGER_TASKS_FILE = '.taskmanager/tasks/tasks.json';

// ❌ DON'T: Use old .taskmaster references
// These have been migrated to .taskmanager
```

### Error Handling Patterns
```typescript
// ✅ DO: Use consistent error handling
try {
  const result = await someOperation();
  return result;
} catch (error) {
  log('error', `Operation failed: ${(error as Error).message}`);
  throw error;
}

// ✅ DO: Use type guards for unknown errors
function isErrorWithMessage(error: unknown): error is { message: string } {
  return typeof error === 'object' && error !== null && 'message' in error;
}

// ✅ DO: Handle API errors gracefully
if (!result.success) {
  log('error', `API call failed: ${result.error || 'Unknown error'}`);
  return null;
}
```

### Testing Standards
```typescript
// ✅ DO: Use Jest with ESM configuration
import { jest } from '@jest/globals';

// ✅ DO: Mock external dependencies
jest.mock('../config-manager.js', () => ({
  getMainProvider: jest.fn(() => 'bedrock'),
  getMainModelId: jest.fn(() => 'anthropic.claude-3-5-sonnet-20241022-v2:0')
}));

// ✅ DO: Test both success and failure cases
describe('Task Processing', () => {
  test('should process valid task successfully', async () => {
    // Test implementation
  });

  test('should handle invalid task gracefully', async () => {
    // Error case testing
  });
});
```

## File Organization

### Source Structure
- `src/types/index.ts` - Central type definitions
- `src/constants/` - Application constants (paths, task status)
- `src/ai-providers/` - AI provider implementations (Bedrock only)
- `src/modules/` - Core application modules
- `src/utils/` - Utility functions

### Script Structure
- `scripts/modules/` - CLI command implementations
- `scripts/modules/task-manager/` - Task management operations
- `scripts/modules/ai-services-unified.ts` - Unified AI service layer
- `scripts/modules/config-manager.ts` - Configuration management

### Common Patterns

#### Task Status Management
```typescript
// ✅ DO: Use the defined task status types
import { TASK_STATUS_OPTIONS, isValidTaskStatus } from '../constants/task-status.js';

if (!isValidTaskStatus(status)) {
  throw new Error(`Invalid status: ${status}. Valid options: ${TASK_STATUS_OPTIONS.join(', ')}`);
}
```

#### Path Utilities
```typescript
// ✅ DO: Use centralized path utilities
import { findTasksPath, findConfigPath } from '../utils/path-utils.js';

const tasksPath = findTasksPath(null, { projectRoot });
const configPath = findConfigPath(null, { projectRoot });
```

#### Logging
```typescript
// ✅ DO: Use the centralized logging system
import { log } from '../utils/utils.js';

log('info', 'Task processing started');
log('debug', 'Detailed debug information');
log('error', 'Error occurred during processing');
```

## Migration Notes

### Recent Changes
1. **Provider Cleanup**: Removed support for all AI providers except AWS Bedrock
2. **Naming Migration**: Changed all `TASKMASTER_*` constants to `TASKMANAGER_*`
3. **TypeScript Migration**: Converted JavaScript files to TypeScript with proper typing
4. **Directory Structure**: Migrated from `.taskmaster` to `.taskmanager` directory

### Deprecated Patterns
```typescript
// ❌ DON'T: Use removed providers
// getOllamaBaseURL, getAzureBaseURL - REMOVED
// OpenRouterAIProvider, OllamaAIProvider - REMOVED

// ❌ DON'T: Use old constant names
// TASKMASTER_DIR, TASKMASTER_CONFIG_FILE - Use TASKMANAGER_* instead

// ❌ DON'T: Use old directory structure
// .taskmaster/ - Use .taskmanager/ instead
```

### Current Focus Areas
1. Complete TypeScript migration with proper type safety
2. Maintain AWS Bedrock integration
3. Ensure all tests pass with new architecture
4. Keep task management workflow functional

## Build and Test Commands

### Essential Commands
```bash
# Build the project
npm run build

# Run tests
npm test

# Type checking
npm run typecheck

# Linting
npm run lint
```

### Development Workflow
```bash
# Clean and rebuild
npm run clean && npm run build

# Watch mode for development
npm run build:watch

# Run specific test suites
npm test -- --testPathPattern=config-manager
```

## Environment Variables

### Required for AWS Bedrock
- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `AWS_DEFAULT_REGION` - AWS region (default: us-east-1)

### Optional Configuration
- `TASKMANAGER_LOG_LEVEL` - Logging level (debug, info, warn, error)
- `DEBUG` - Enable debug mode (true/false)

## Best Practices

### Code Quality
1. Always add proper TypeScript types
2. Use consistent error handling patterns
3. Follow the established import order
4. Include comprehensive tests for new features
5. Use the centralized configuration system

### Performance
1. Use efficient file I/O patterns
2. Implement proper caching where appropriate
3. Minimize AWS API calls
4. Use streaming for large operations

### Security
1. Never commit API keys or secrets
2. Use environment variables for sensitive data
3. Validate all user inputs
4. Handle errors without exposing internal details

## Task Management Integration

When working with the task system:
1. Use `vibex-task-manager list` to understand current state
2. Follow dependency chains when implementing
3. Update task status as work progresses
4. Use complexity analysis for large tasks
5. Generate task files after updates

This ensures the AI-driven development workflow remains effective and organized.