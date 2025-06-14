# TypeScript API Reference

Complete TypeScript interface and type definitions for Vibex Task Manager.

## Overview

Vibex Task Manager provides comprehensive TypeScript definitions for type-safe development. All interfaces support strict typing for tasks, configurations, AI integrations, and system operations.

## Core Interfaces

### Task Interface

The primary interface for task management operations.

```typescript
interface Task {
  id: number;                    // Unique task identifier
  title: string;                 // Task title
  description: string;           // Task description
  status: TaskStatus;            // Current task status
  dependencies: number[];        // Array of dependent task IDs
  priority: Priority;            // Task priority level
  details?: string;              // Optional implementation details
  testStrategy?: string;         // Optional testing strategy
  subtasks?: Subtask[];          // Optional array of subtasks
}
```

#### Usage Example
```typescript
const newTask: Task = {
  id: 1,
  title: "Implement user authentication",
  description: "Add JWT-based authentication system",
  status: "pending",
  dependencies: [2, 3],
  priority: "high",
  details: "Use bcrypt for password hashing, implement JWT with 24h expiry",
  testStrategy: "Unit tests for auth service, integration tests for login flow"
};
```

### Subtask Interface

Interface for subtask entities within tasks.

```typescript
interface Subtask {
  id: number;                    // Unique subtask identifier
  title: string;                 // Subtask title
  description: string;           // Subtask description
  status: TaskStatus;            // Current subtask status
  dependencies: number[];        // Array of dependent subtask IDs
  priority?: Priority;           // Optional subtask priority
  details?: string;              // Optional implementation details
  testStrategy?: string;         // Optional testing strategy
}
```

#### Usage Example
```typescript
const subtask: Subtask = {
  id: 1,
  title: "Create user model",
  description: "Define user schema with validation",
  status: "pending",
  dependencies: [],
  priority: "medium",
  details: "Include email validation and password strength requirements"
};
```

---

## Type Definitions

### TaskStatus Type

Enumeration of all possible task and subtask states.

```typescript
type TaskStatus = 
  | 'pending'       // Task not yet started
  | 'in-progress'   // Task currently being worked on
  | 'done'          // Task completed successfully
  | 'review'        // Task completed, awaiting review
  | 'deferred'      // Task postponed to later
  | 'cancelled';    // Task cancelled/no longer needed
```

#### Status Validation
```typescript
// Available status options constant
const TASK_STATUS_OPTIONS: TaskStatus[] = [
  'pending', 'done', 'in-progress', 'review', 'deferred', 'cancelled'
];

// Type guard function
function isValidTaskStatus(status: string): status is TaskStatus {
  return TASK_STATUS_OPTIONS.includes(status as TaskStatus);
}

// Usage
if (isValidTaskStatus(userInput)) {
  task.status = userInput; // Type-safe assignment
}
```

### Priority Type

Task priority levels for importance ranking.

```typescript
type Priority = 
  | 'low'           // Low priority task
  | 'medium'        // Medium priority task  
  | 'high';         // High priority task
```

#### Priority Usage
```typescript
const priorities: Priority[] = ['low', 'medium', 'high'];

function setPriority(task: Task, priority: Priority): Task {
  return { ...task, priority };
}
```

---

## Configuration Interfaces

### Config Interface

Main configuration structure for the application.

```typescript
interface Config {
  models: {
    main: ModelConfig;          // Primary AI model configuration
    research: ModelConfig;      // Research AI model configuration
    fallback: ModelConfig;      // Fallback AI model configuration
  };
  global: GlobalConfig;         // Global application settings
}
```

### ModelConfig Interface

Configuration for AI model providers.

```typescript
interface ModelConfig {
  provider: string;             // AI provider name (e.g., 'anthropic', 'aws-bedrock')
  modelId: string;              // Model identifier (e.g., 'claude-3-5-sonnet-20241022')
  maxTokens: number;            // Maximum tokens per request
  temperature: number;          // Response randomness (0.0 - 1.0)
}
```

#### Example Configuration
```typescript
const config: Config = {
  models: {
    main: {
      provider: 'anthropic',
      modelId: 'claude-3-5-sonnet-20241022',
      maxTokens: 4096,
      temperature: 0.3
    },
    research: {
      provider: 'aws-bedrock',
      modelId: 'anthropic.claude-3-opus-20240229-v1:0',
      maxTokens: 8192,
      temperature: 0.5
    },
    fallback: {
      provider: 'aws-bedrock',
      modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
      maxTokens: 2048,
      temperature: 0.1
    }
  },
  global: {
    logLevel: 'info',
    debug: false,
    defaultSubtasks: 5,
    defaultPriority: 'medium',
    projectName: 'My Project'
  }
};
```

### GlobalConfig Interface

Global application settings.

```typescript
interface GlobalConfig {
  logLevel: string;             // Logging level ('debug', 'info', 'warn', 'error')
  debug: boolean;               // Enable debug mode
  defaultSubtasks: number;      // Default number of subtasks to generate
  defaultNumTasks?: number;     // Default number of tasks to generate
  defaultPriority: Priority;    // Default priority for new tasks
  projectName?: string;         // Project name
  bedrockBaseURL?: string;      // Custom Bedrock endpoint URL
  userId?: string;              // User identifier for telemetry
}
```

---

## Data Container Interfaces

### TasksData Interface

Container for task arrays in persistence layer.

```typescript
interface TasksData {
  tasks: Task[];                // Array of all project tasks
}
```

### FindNextTaskResult Interface

Result structure for next task recommendations.

```typescript
interface FindNextTaskResult {
  id: number | string;          // Task identifier
  title: string;                // Task title
  status: TaskStatus;           // Current status
  priority: Priority;           // Task priority
  dependencies: Array<number | string>; // Task dependencies
  parentId?: number;            // Parent task ID (for subtasks)
  description?: string;         // Task description
  details?: string;             // Implementation details
  subtasks?: Array<any>;        // Subtasks array
  complexityScore?: number;     // AI-calculated complexity score
}
```

#### Usage Example
```typescript
async function getNextTask(): Promise<FindNextTaskResult | null> {
  const result = await taskService.findNextTask({
    includeInProgress: false,
    priorityWeight: 0.7
  });
  
  if (result) {
    console.log(`Next task: ${result.title} (Priority: ${result.priority})`);
    return result;
  }
  
  return null;
}
```

---

## Complexity Analysis Interfaces

### ComplexityReport Interface

Structure for comprehensive task complexity analysis.

```typescript
interface ComplexityReport {
  meta: {
    generatedAt: string;        // ISO timestamp of report generation
    tasksAnalyzed: number;      // Number of tasks analyzed
    thresholdScore: number;     // Complexity threshold used
    projectName: string;        // Project name
    usedResearch: boolean;      // Whether research model was used
  };
  complexityAnalysis: TaskComplexityAnalysis[]; // Array of task analyses
}
```

### TaskComplexityAnalysis Interface

Individual task complexity analysis results.

```typescript
interface TaskComplexityAnalysis {
  taskId: number;               // Task identifier
  taskTitle: string;            // Task title
  complexityScore: number;      // Complexity score (1-10)
  recommendedSubtasks: number;  // Recommended number of subtasks
  expansionPrompt?: string;     // AI prompt for task expansion
  reasoning: string;            // Analysis reasoning
}
```

### TaskComplexity Interface

Simplified task complexity representation.

```typescript
interface TaskComplexity {
  id: number;                   // Task identifier
  title: string;                // Task title
  complexity: 'high' | 'medium' | 'low'; // Complexity category
  score: number;                // Numerical complexity score
  factors: string[];            // Contributing complexity factors
  recommendedSubtasks: number;  // Suggested subtask count
  expansionCommand: string;     // CLI command for expansion
}
```

#### Usage Example
```typescript
async function analyzeTaskComplexity(taskId: number): Promise<TaskComplexity> {
  const analysis = await aiService.analyzeComplexity(taskId);
  
  const complexity: TaskComplexity = {
    id: taskId,
    title: analysis.title,
    complexity: analysis.score > 7 ? 'high' : analysis.score > 4 ? 'medium' : 'low',
    score: analysis.score,
    factors: analysis.factors,
    recommendedSubtasks: Math.ceil(analysis.score / 2),
    expansionCommand: `vibex expand ${taskId}`
  };
  
  return complexity;
}
```

---

## AI Provider Interfaces

### Message Interface

Structure for AI conversation messages.

```typescript
interface Message {
  role: 'system' | 'user' | 'assistant'; // Message role in conversation
  content: string;                       // Message content
}
```

### GenerateTextParams Interface

Parameters for AI text generation requests.

```typescript
interface GenerateTextParams {
  modelId: string;              // Model identifier
  messages: Message[];          // Conversation messages
  maxTokens?: number;           // Maximum tokens to generate
  temperature?: number;         // Response randomness
  apiKey?: string;              // API key for authentication
  baseURL?: string;             // Custom API base URL
  region?: string;              // AWS region (for Bedrock)
  profile?: string;             // AWS profile (for Bedrock)
}
```

### StreamTextParams Interface

Parameters for streaming AI text generation.

```typescript
interface StreamTextParams extends GenerateTextParams {
  // Inherits all GenerateTextParams properties
}
```

### GenerateObjectParams Interface

Parameters for AI object generation with schema validation.

```typescript
interface GenerateObjectParams extends GenerateTextParams {
  schema: any;                  // Zod schema for validation
  objectName?: string;          // Name for the generated object
}
```

### AI Result Interfaces

Response structures for AI operations.

```typescript
// Text generation result
interface AIResult {
  text: string;                 // Generated text
  usage?: {                     // Optional usage statistics
    inputTokens?: number;       // Input tokens consumed
    outputTokens?: number;      // Output tokens generated
    totalTokens?: number;       // Total tokens used
  };
}

// Object generation result
interface ObjectResult {
  object: any;                  // Generated object (validated against schema)
  usage?: {                     // Optional usage statistics
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
}

// Streaming result
interface StreamResult {
  [key: string]: any;           // Flexible structure for streaming data
}
```

#### Usage Example
```typescript
async function generateTaskDescription(title: string): Promise<string> {
  const params: GenerateTextParams = {
    modelId: 'claude-3-5-sonnet-20241022',
    messages: [
      {
        role: 'system',
        content: 'You are a technical task description generator.'
      },
      {
        role: 'user',
        content: `Generate a detailed description for this task: ${title}`
      }
    ],
    maxTokens: 500,
    temperature: 0.3
  };
  
  const result: AIResult = await aiProvider.generateText(params);
  return result.text;
}
```

---

## Model and Configuration Data

### ActiveModel Interface

Configuration for currently active AI models.

```typescript
interface ActiveModel {
  provider: string;             // Provider name
  modelId: string;              // Model identifier
  sweScore?: number | null;     // SWE-bench score (if available)
  cost?: {                      // Cost information
    input: number | null;       // Cost per input token
    output: number | null;      // Cost per output token
  } | null;
}
```

### AvailableModel Interface

Registry entry for available AI models.

```typescript
interface AvailableModel {
  provider: string;             // Provider name
  modelId: string;              // Model identifier
  sweScore?: number | null;     // Performance score
  cost?: {                      // Pricing information
    input: number | null;       // Input token cost
    output: number | null;      // Output token cost
  } | null;
}
```

### ConfigData Interface

Complete configuration data structure.

```typescript
interface ConfigData {
  activeModels: {
    main: ActiveModel;          // Primary model configuration
    research: ActiveModel;      // Research model configuration
    fallback?: ActiveModel;     // Optional fallback model
  };
}
```

---

## Telemetry and Monitoring

### TelemetryData Interface

Usage tracking and analytics data.

```typescript
interface TelemetryData {
  modelUsed: string;            // Model identifier used
  providerName: string;         // AI provider name
  inputTokens: number;          // Input tokens consumed
  outputTokens: number;         // Output tokens generated
  totalTokens: number;          // Total tokens used
  totalCost: number;            // Total cost in USD
  commandName: string;          // Command that triggered the request
}
```

### ApiKeyStatusReport Interface

API key availability status across different contexts.

```typescript
interface ApiKeyStatusReport {
  provider: string;             // Provider name
  cli: boolean;                 // CLI context availability
  mcp: boolean;                 // MCP context availability
}
```

#### Usage Example
```typescript
function trackUsage(operation: string, result: AIResult): void {
  const telemetry: TelemetryData = {
    modelUsed: 'claude-3-5-sonnet-20241022',
    providerName: 'anthropic',
    inputTokens: result.usage?.inputTokens || 0,
    outputTokens: result.usage?.outputTokens || 0,
    totalTokens: result.usage?.totalTokens || 0,
    totalCost: calculateCost(result.usage),
    commandName: operation
  };
  
  telemetryService.track(telemetry);
}
```

---

## Schema Validation

### Zod Schema Definitions

Runtime type validation using Zod schemas.

```typescript
import { z } from 'zod';

// AI-generated task data schema
const AiTaskDataSchema = z.object({
  title: z.string().describe('Clear, concise title for the task'),
  description: z.string().describe('A one or two sentence description of the task'),
  details: z.string().describe('In-depth implementation details, considerations, and guidance'),
  testStrategy: z.string().describe('Detailed approach for verifying task completion'),
  dependencies: z.array(z.number()).optional().describe('Array of task IDs that this task depends on')
});

// PRD single task schema
const prdSingleTaskSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1),
  description: z.string().min(1),
  details: z.string().optional().default(''),
  testStrategy: z.string().optional().default(''),
  priority: z.enum(['high', 'medium', 'low']).default('medium'),
  dependencies: z.array(z.number().int().positive()).optional().default([]),
  status: z.string().optional().default('pending')
});

// Complete PRD response schema
const prdResponseSchema = z.object({
  tasks: z.array(prdSingleTaskSchema),
  metadata: z.object({
    projectName: z.string(),
    totalTasks: z.number(),
    sourceFile: z.string(),
    generatedAt: z.string()
  })
});

// Type inference from schemas
type AiTaskData = z.infer<typeof AiTaskDataSchema>;
type PrdTask = z.infer<typeof prdSingleTaskSchema>;
type PrdResponse = z.infer<typeof prdResponseSchema>;
```

#### Usage Example
```typescript
async function validateAiResponse(response: unknown): Promise<AiTaskData> {
  try {
    return AiTaskDataSchema.parse(response);
  } catch (error) {
    throw new Error(`Invalid AI response: ${error.message}`);
  }
}

// Type-safe usage
const taskData = await validateAiResponse(aiResponse);
console.log(taskData.title); // TypeScript knows this is a string
```

---

## Type Guards and Utilities

### Type Guard Functions

Runtime type checking utilities.

```typescript
// Task status validation
function isValidTaskStatus(status: string): status is TaskStatus {
  return TASK_STATUS_OPTIONS.includes(status as TaskStatus);
}

// Priority validation
function isValidPriority(priority: string): priority is Priority {
  return ['low', 'medium', 'high'].includes(priority);
}

// Task validation
function isTask(obj: any): obj is Task {
  return (
    typeof obj === 'object' &&
    typeof obj.id === 'number' &&
    typeof obj.title === 'string' &&
    typeof obj.description === 'string' &&
    isValidTaskStatus(obj.status) &&
    Array.isArray(obj.dependencies) &&
    isValidPriority(obj.priority)
  );
}

// Subtask validation
function isSubtask(obj: any): obj is Subtask {
  return (
    typeof obj === 'object' &&
    typeof obj.id === 'number' &&
    typeof obj.title === 'string' &&
    typeof obj.description === 'string' &&
    isValidTaskStatus(obj.status) &&
    Array.isArray(obj.dependencies)
  );
}
```

### Utility Type Helpers

```typescript
// Partial task for updates
type TaskUpdate = Partial<Omit<Task, 'id'>>;

// Task creation data (without id)
type TaskCreateData = Omit<Task, 'id'>;

// Task filter options
type TaskFilter = {
  status?: TaskStatus;
  priority?: Priority;
  hasSubtasks?: boolean;
  dependsOn?: number;
};

// Task sort options
type TaskSortField = 'id' | 'title' | 'status' | 'priority' | 'created';
type TaskSortOrder = 'asc' | 'desc';

interface TaskSortOptions {
  field: TaskSortField;
  order: TaskSortOrder;
}
```

#### Usage Example
```typescript
// Type-safe task updates
function updateTask(id: number, updates: TaskUpdate): Promise<Task> {
  // TypeScript ensures only valid Task properties can be updated
  return taskService.update(id, updates);
}

// Type-safe task filtering
function filterTasks(tasks: Task[], filter: TaskFilter): Task[] {
  return tasks.filter(task => {
    if (filter.status && task.status !== filter.status) return false;
    if (filter.priority && task.priority !== filter.priority) return false;
    if (filter.hasSubtasks !== undefined) {
      const hasSubtasks = task.subtasks && task.subtasks.length > 0;
      if (filter.hasSubtasks !== hasSubtasks) return false;
    }
    return true;
  });
}
```

---

## Error Types

### Error Interfaces

Structured error handling with typed error objects.

```typescript
// Base error interface
interface VibexError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// Specific error types
interface TaskNotFoundError extends VibexError {
  code: 'TASK_NOT_FOUND';
  details: {
    taskId: number;
    availableIds: number[];
  };
}

interface CircularDependencyError extends VibexError {
  code: 'CIRCULAR_DEPENDENCY';
  details: {
    cycle: number[];
    affectedTasks: number[];
  };
}

interface InvalidParametersError extends VibexError {
  code: 'INVALID_PARAMETERS';
  details: {
    parameter: string;
    provided: any;
    expected: string;
  };
}

// Union type for all possible errors
type VibexErrorType = 
  | TaskNotFoundError 
  | CircularDependencyError 
  | InvalidParametersError;
```

#### Error Handling Example
```typescript
function handleVibexError(error: VibexErrorType): string {
  switch (error.code) {
    case 'TASK_NOT_FOUND':
      return `Task ${error.details.taskId} not found. Available IDs: ${error.details.availableIds.join(', ')}`;
    
    case 'CIRCULAR_DEPENDENCY':
      return `Circular dependency detected: ${error.details.cycle.join(' → ')}`;
    
    case 'INVALID_PARAMETERS':
      return `Invalid ${error.details.parameter}: expected ${error.details.expected}, got ${typeof error.details.provided}`;
    
    default:
      return error.message;
  }
}
```

---

## Integration Examples

### Service Implementation

```typescript
import { Task, TaskStatus, Priority, TaskFilter, Config } from 'vibex-task-manager/types';

class TaskService {
  private tasks: Task[] = [];
  private config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  async createTask(data: Omit<Task, 'id'>): Promise<Task> {
    const task: Task = {
      id: this.generateId(),
      ...data
    };
    
    this.tasks.push(task);
    return task;
  }

  async updateTask(id: number, updates: Partial<Task>): Promise<Task> {
    const taskIndex = this.tasks.findIndex(t => t.id === id);
    if (taskIndex === -1) {
      throw new Error(`Task ${id} not found`);
    }

    this.tasks[taskIndex] = { ...this.tasks[taskIndex], ...updates };
    return this.tasks[taskIndex];
  }

  async getTasks(filter?: TaskFilter): Promise<Task[]> {
    if (!filter) return [...this.tasks];

    return this.tasks.filter(task => {
      if (filter.status && task.status !== filter.status) return false;
      if (filter.priority && task.priority !== filter.priority) return false;
      return true;
    });
  }

  private generateId(): number {
    return Math.max(0, ...this.tasks.map(t => t.id)) + 1;
  }
}
```

### React Component Integration

```typescript
import React, { useState, useEffect } from 'react';
import { Task, TaskStatus, Priority } from 'vibex-task-manager/types';

interface TaskListProps {
  filter?: {
    status?: TaskStatus;
    priority?: Priority;
  };
}

const TaskList: React.FC<TaskListProps> = ({ filter }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, [filter]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const result = await taskService.getTasks(filter);
      setTasks(result);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (id: number, status: TaskStatus) => {
    try {
      await taskService.updateTask(id, { status });
      await loadTasks(); // Refresh list
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  if (loading) return <div>Loading tasks...</div>;

  return (
    <div>
      {tasks.map(task => (
        <div key={task.id} className="task-item">
          <h3>{task.title}</h3>
          <p>{task.description}</p>
          <div>
            <span>Status: {task.status}</span>
            <span>Priority: {task.priority}</span>
          </div>
          <select
            value={task.status}
            onChange={(e) => updateTaskStatus(task.id, e.target.value as TaskStatus)}
          >
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
            <option value="review">Review</option>
          </select>
        </div>
      ))}
    </div>
  );
};
```

---

## Best Practices

### Type Safety Guidelines

1. **Always use type guards** for runtime validation
2. **Prefer interfaces over types** for object structures
3. **Use union types** for constrained string values
4. **Implement Zod schemas** for external data validation
5. **Create utility types** for common operations

### Example Best Practices Implementation

```typescript
// Good: Type-safe task creation
async function createTaskSafely(data: unknown): Promise<Task> {
  // Validate input data
  const validatedData = AiTaskDataSchema.parse(data);
  
  // Type-safe task creation
  const taskData: Omit<Task, 'id'> = {
    title: validatedData.title,
    description: validatedData.description,
    status: 'pending',
    dependencies: validatedData.dependencies || [],
    priority: 'medium',
    details: validatedData.details,
    testStrategy: validatedData.testStrategy
  };
  
  return await taskService.createTask(taskData);
}

// Good: Type-safe error handling
function handleTaskOperation<T>(
  operation: () => Promise<T>
): Promise<T> {
  return operation().catch((error: unknown) => {
    if (error instanceof Error) {
      console.error(`Task operation failed: ${error.message}`);
    }
    throw error;
  });
}

// Good: Type-safe configuration
function validateConfig(config: unknown): Config {
  const configSchema = z.object({
    models: z.object({
      main: z.object({
        provider: z.string(),
        modelId: z.string(),
        maxTokens: z.number(),
        temperature: z.number()
      }),
      research: z.object({
        provider: z.string(),
        modelId: z.string(),
        maxTokens: z.number(),
        temperature: z.number()
      }),
      fallback: z.object({
        provider: z.string(),
        modelId: z.string(),
        maxTokens: z.number(),
        temperature: z.number()
      })
    }),
    global: z.object({
      logLevel: z.string(),
      debug: z.boolean(),
      defaultSubtasks: z.number(),
      defaultPriority: z.enum(['low', 'medium', 'high']),
      projectName: z.string().optional()
    })
  });
  
  return configSchema.parse(config);
}
```

---

This TypeScript API reference provides comprehensive type definitions and usage examples for building type-safe applications with Vibex Task Manager. All interfaces support IntelliSense and compile-time type checking for robust development experiences.