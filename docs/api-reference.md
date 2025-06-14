# API Reference

The Vibex Task Manager provides multiple API interfaces for task management, project coordination, and AI-powered task analysis. This reference covers all available APIs and integration methods.

## Overview

Vibex Task Manager exposes its functionality through three primary interfaces:

1. **[MCP Server API](#mcp-server-api)** - Model Context Protocol tools for AI editor integration
2. **[CLI API](#cli-api)** - Command-line interface for direct task management
3. **[TypeScript API](#typescript-api)** - Programmatic interfaces for Node.js applications

## Quick Start

### MCP Server Integration
```json
{
  "mcpServers": {
    "vibex-task-manager": {
      "command": "npx",
      "args": ["vibex-task-manager", "mcp"]
    }
  }
}
```

### CLI Usage
```bash
# Initialize project
npx vibex-task-manager init

# Add a task
npx vibex-task-manager add "Implement user authentication"

# List tasks
npx vibex-task-manager list
```

### Programmatic Usage
```typescript
import { TaskService } from 'vibex-task-manager';

const taskService = new TaskService();
const tasks = await taskService.getTasks();
```

---

## MCP Server API

The MCP (Model Context Protocol) Server provides 32 tools for comprehensive task management integration with AI editors like Claude Code, Cursor AI, and Windsurf.

### Connection

The MCP server runs on demand when tools are called. Configure your AI editor to use:

```bash
npx vibex-task-manager mcp
```

### Tool Categories

#### Initialization & Setup
- [`initialize_project`](#initialize_project) - Initialize a new project
- [`models`](#models) - Configure AI models
- [`parse_prd`](#parse_prd) - Parse Product Requirements Documents

#### Task Management
- [`get_tasks`](#get_tasks) - List all tasks
- [`get_task`](#get_task) - Show specific task details
- [`add_task`](#add_task) - Add new tasks using AI
- [`update_task`](#update_task) - Update specific tasks
- [`remove_task`](#remove_task) - Remove tasks
- [`set_task_status`](#set_task_status) - Update task status
- [`move_task`](#move_task) - Move tasks between positions

#### Subtask Management
- [`add_subtask`](#add_subtask) - Add subtasks to tasks
- [`update_subtask`](#update_subtask) - Update subtask details
- [`remove_subtask`](#remove_subtask) - Remove subtasks
- [`clear_subtasks`](#clear_subtasks) - Clear all subtasks from tasks

#### Task Analysis
- [`analyze_task_complexity`](#analyze_task_complexity) - Analyze task complexity
- [`complexity_report`](#complexity_report) - View complexity reports
- [`next_task`](#next_task) - Find next task to work on
- [`expand_task`](#expand_task) - Expand tasks with AI-generated subtasks
- [`expand_all_tasks`](#expand_all_tasks) - Expand all tasks

#### Dependency Management
- [`add_dependency`](#add_dependency) - Add task dependencies
- [`remove_dependency`](#remove_dependency) - Remove dependencies
- [`validate_dependencies`](#validate_dependencies) - Validate dependency chains
- [`fix_dependencies`](#fix_dependencies) - Fix invalid dependencies

#### Utilities
- [`generate_task_files`](#generate_task_files) - Generate individual task files
- [`get_operation_status`](#get_operation_status) - Check operation status

---

### Tool Reference

#### initialize_project
Initialize a new Vibex Task Manager project in the current directory.

**Parameters:**
```typescript
{
  name?: string;          // Project name (default: current directory name)
  description?: string;   // Project description
}
```

**Response:**
```typescript
{
  success: boolean;
  message: string;
  projectPath: string;
}
```

**Example:**
```typescript
// MCP Tool Call
{
  "tool": "initialize_project",
  "arguments": {
    "name": "my-project",
    "description": "A sample project for task management"
  }
}
```

#### get_tasks
Retrieve all tasks in the current project.

**Parameters:**
```typescript
{
  status?: TaskStatus;     // Filter by status
  priority?: Priority;     // Filter by priority
  includeSubtasks?: boolean; // Include subtask details (default: true)
}
```

**Response:**
```typescript
{
  tasks: Task[];
  totalCount: number;
  summary: {
    pending: number;
    inProgress: number;
    done: number;
    review: number;
    deferred: number;
    cancelled: number;
  };
}
```

#### add_task
Add a new task using AI-powered analysis and structuring.

**Parameters:**
```typescript
{
  title: string;           // Task title
  description?: string;    // Task description
  priority?: Priority;     // Task priority (default: 'medium')
  dependencies?: number[]; // Task dependencies by ID
}
```

**Response:**
```typescript
{
  task: Task;
  analysis: {
    complexity: number;    // 1-10 complexity score
    estimatedHours: number;
    suggestedPriority: Priority;
    recommendations: string[];
  };
}
```

#### update_task
Update an existing task with new information.

**Parameters:**
```typescript
{
  id: number;              // Task ID
  title?: string;          // New title
  description?: string;    // New description
  status?: TaskStatus;     // New status
  priority?: Priority;     // New priority
  dependencies?: number[]; // New dependencies
  details?: string;        // Additional details
  testStrategy?: string;   // Testing strategy
}
```

**Response:**
```typescript
{
  task: Task;
  changes: string[];       // List of changes made
}
```

#### analyze_task_complexity
Analyze the complexity of a specific task using AI.

**Parameters:**
```typescript
{
  id: number;              // Task ID
  includeSubtasks?: boolean; // Include subtask analysis (default: true)
}
```

**Response:**
```typescript
{
  taskId: number;
  complexity: {
    score: number;         // 1-10 complexity score
    factors: string[];     // Contributing complexity factors
    estimatedHours: number;
    riskLevel: 'low' | 'medium' | 'high';
  };
  recommendations: {
    priority: Priority;
    breakdown: string[];   // Suggested task breakdown
    dependencies: number[]; // Suggested dependencies
  };
  subtaskComplexity?: Array<{
    subtaskId: number;
    complexity: number;
    factors: string[];
  }>;
}
```

#### expand_task
Expand a task into detailed subtasks using AI analysis.

**Parameters:**
```typescript
{
  id: number;              // Task ID
  maxSubtasks?: number;    // Maximum subtasks to generate (default: 10)
  detailLevel?: 'basic' | 'detailed' | 'comprehensive'; // Detail level
}
```

**Response:**
```typescript
{
  taskId: number;
  subtasks: Subtask[];
  expansion: {
    methodology: string;   // Expansion approach used
    totalEstimatedHours: number;
    criticalPath: number[]; // Subtask IDs in critical path
    parallelizable: number[][]; // Groups of parallelizable subtasks
  };
}
```

#### next_task
Find the next optimal task to work on based on dependencies and priority.

**Parameters:**
```typescript
{
  includeInProgress?: boolean; // Include in-progress tasks (default: false)
  priorityWeight?: number;     // Priority weighting factor (default: 0.7)
  dependencyWeight?: number;   // Dependency weighting factor (default: 0.3)
}
```

**Response:**
```typescript
{
  nextTask: Task | null;
  recommendations: Array<{
    task: Task;
    score: number;        // Recommendation score
    reasoning: string[];  // Why this task is recommended
  }>;
  blockedTasks: Array<{
    task: Task;
    blockingDependencies: number[]; // IDs of blocking tasks
  }>;
}
```

---

## CLI API

The CLI provides direct command-line access to all task management functionality.

### Global Commands

#### Project Management
```bash
vibex-task-manager init [name]           # Initialize project
vibex-task-manager config [key] [value]  # Configure settings
vibex-task-manager models                # Manage AI models
```

#### Task Operations
```bash
vibex-task-manager add <title>           # Add task
vibex-task-manager list [options]        # List tasks
vibex-task-manager show <id>             # Show task details
vibex-task-manager update <id> [options] # Update task
vibex-task-manager remove <id>           # Remove task
vibex-task-manager status <id> <status>  # Update task status
```

#### Advanced Operations
```bash
vibex-task-manager analyze <id>          # Analyze task complexity
vibex-task-manager expand <id>           # Expand task into subtasks
vibex-task-manager next                  # Find next task to work on
vibex-task-manager deps add <id> <dep>   # Add dependency
vibex-task-manager deps remove <id> <dep> # Remove dependency
```

### Command Options

#### List Command
```bash
vibex-task-manager list [options]

Options:
  --status <status>     Filter by status (pending|in-progress|done|review|deferred|cancelled)
  --priority <priority> Filter by priority (low|medium|high)
  --format <format>     Output format (table|json|markdown)
  --sort <field>        Sort by field (id|title|status|priority|created)
  --include-subtasks    Include subtasks in output
```

#### Add Command
```bash
vibex-task-manager add <title> [options]

Options:
  --description <desc>  Task description
  --priority <priority> Task priority (low|medium|high)
  --depends-on <ids>    Comma-separated dependency IDs
  --details <details>   Additional task details
  --expand              Auto-expand into subtasks
```

---

## TypeScript API

For programmatic integration, Vibex Task Manager provides comprehensive TypeScript interfaces.

### Core Interfaces

#### Task Interface
```typescript
interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  dependencies: number[];
  priority: Priority;
  details?: string;
  testStrategy?: string;
  subtasks?: Subtask[];
  created: string;        // ISO date string
  updated: string;        // ISO date string
  estimatedHours?: number;
  actualHours?: number;
  complexity?: number;    // 1-10 scale
}
```

#### Subtask Interface
```typescript
interface Subtask {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  dependencies: number[];
  priority?: Priority;
  details?: string;
  testStrategy?: string;
  created: string;
  updated: string;
  estimatedHours?: number;
  actualHours?: number;
}
```

#### Type Definitions
```typescript
type TaskStatus = 'pending' | 'in-progress' | 'done' | 'review' | 'deferred' | 'cancelled';
type Priority = 'low' | 'medium' | 'high';

interface TaskFilter {
  status?: TaskStatus;
  priority?: Priority;
  dependsOn?: number;
  hasSubtasks?: boolean;
}

interface TaskAnalysis {
  complexity: number;
  estimatedHours: number;
  riskFactors: string[];
  recommendations: string[];
  breakdown?: string[];
}
```

### Service Classes

#### TaskService
Primary service for task management operations.

```typescript
class TaskService {
  // Task CRUD operations
  async getTasks(filter?: TaskFilter): Promise<Task[]>
  async getTask(id: number): Promise<Task | null>
  async addTask(task: Partial<Task>): Promise<Task>
  async updateTask(id: number, updates: Partial<Task>): Promise<Task>
  async removeTask(id: number): Promise<boolean>
  
  // Status management
  async setTaskStatus(id: number, status: TaskStatus): Promise<Task>
  async moveTask(id: number, position: number): Promise<Task[]>
  
  // Subtask management
  async addSubtask(taskId: number, subtask: Partial<Subtask>): Promise<Subtask>
  async updateSubtask(taskId: number, subtaskId: number, updates: Partial<Subtask>): Promise<Subtask>
  async removeSubtask(taskId: number, subtaskId: number): Promise<boolean>
  
  // Dependencies
  async addDependency(taskId: number, dependsOn: number): Promise<Task>
  async removeDependency(taskId: number, dependsOn: number): Promise<Task>
  async validateDependencies(): Promise<ValidationResult>
  
  // Analysis
  async analyzeComplexity(id: number): Promise<TaskAnalysis>
  async getNextTask(criteria?: NextTaskCriteria): Promise<Task | null>
  async expandTask(id: number, options?: ExpansionOptions): Promise<Subtask[]>
}
```

#### ConfigManager
Configuration management service.

```typescript
class ConfigManager {
  async getConfig(): Promise<Config>
  async setConfig(config: Partial<Config>): Promise<Config>
  async getAIProvider(): Promise<AIProvider>
  async setAIProvider(provider: AIProvider): Promise<void>
}
```

### Usage Examples

#### Basic Task Management
```typescript
import { TaskService } from 'vibex-task-manager';

const taskService = new TaskService();

// Add a new task
const newTask = await taskService.addTask({
  title: "Implement user authentication",
  description: "Add JWT-based authentication system",
  priority: "high",
  dependencies: []
});

// Get all pending tasks
const pendingTasks = await taskService.getTasks({
  status: 'pending'
});

// Update task status
await taskService.setTaskStatus(newTask.id, 'in-progress');
```

#### Advanced Analysis
```typescript
// Analyze task complexity
const analysis = await taskService.analyzeComplexity(taskId);
console.log(`Complexity: ${analysis.complexity}/10`);
console.log(`Estimated hours: ${analysis.estimatedHours}`);

// Find next task to work on
const nextTask = await taskService.getNextTask({
  priorityWeight: 0.8,
  dependencyWeight: 0.2
});

// Expand task into subtasks
const subtasks = await taskService.expandTask(taskId, {
  maxSubtasks: 8,
  detailLevel: 'detailed'
});
```

#### Dependency Management
```typescript
// Add dependencies
await taskService.addDependency(taskId, dependencyId);

// Validate all dependencies
const validation = await taskService.validateDependencies();
if (!validation.isValid) {
  console.log('Dependency issues:', validation.errors);
}
```

---

## Integration Examples

### Claude Code Integration

Add to your `.claude/config.json`:

```json
{
  "mcpServers": {
    "vibex-task-manager": {
      "command": "npx",
      "args": ["vibex-task-manager", "mcp"],
      "env": {
        "VIBEX_PROJECT_PATH": "${workspaceFolder}"
      }
    }
  }
}
```

### Cursor AI Integration

Add to your `cursor-settings.json`:

```json
{
  "mcp.servers": {
    "vibex-task-manager": {
      "command": "npx",
      "args": ["vibex-task-manager", "mcp"]
    }
  }
}
```

### Windsurf Integration

Configure in your workspace settings:

```json
{
  "mcp": {
    "servers": {
      "vibex-task-manager": {
        "command": "npx vibex-task-manager mcp"
      }
    }
  }
}
```

### GitHub Actions Integration

```yaml
name: Task Management
on: [push, pull_request]

jobs:
  sync-tasks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npx vibex-task-manager init
      - run: npx vibex-task-manager parse-prd README.md
      - run: npx vibex-task-manager list --format json > tasks.json
```

---

## Error Handling

### Common Error Responses

#### MCP Tool Errors
```typescript
{
  "error": {
    "code": "TASK_NOT_FOUND",
    "message": "Task with ID 123 not found",
    "details": {
      "taskId": 123,
      "availableIds": [1, 2, 3, 4, 5]
    }
  }
}
```

#### Dependency Validation Errors
```typescript
{
  "error": {
    "code": "CIRCULAR_DEPENDENCY",
    "message": "Circular dependency detected",
    "details": {
      "cycle": [1, 2, 3, 1],
      "affectedTasks": [1, 2, 3]
    }
  }
}
```

### Error Codes

| Code | Description | Resolution |
|------|-------------|------------|
| `PROJECT_NOT_INITIALIZED` | No Vibex project found | Run `vibex-task-manager init` |
| `TASK_NOT_FOUND` | Task ID doesn't exist | Check task ID with `list` command |
| `CIRCULAR_DEPENDENCY` | Dependency cycle detected | Remove conflicting dependencies |
| `INVALID_STATUS` | Invalid task status | Use valid status values |
| `AI_SERVICE_ERROR` | AI provider unavailable | Check AI provider configuration |
| `INSUFFICIENT_PERMISSIONS` | File access denied | Check file permissions |

---

## Rate Limits and Best Practices

### AI Provider Limits
- **AWS Bedrock**: 100 requests/minute per region
- **Task Analysis**: Cached for 1 hour per task
- **Batch Operations**: Max 50 tasks per operation

### Performance Optimization
```typescript
// Efficient task loading
const tasks = await taskService.getTasks({
  includeSubtasks: false  // Faster loading
});

// Batch dependency operations
await Promise.all([
  taskService.addDependency(1, 2),
  taskService.addDependency(1, 3),
  taskService.addDependency(1, 4)
]);

// Use analysis caching
const analysis = await taskService.analyzeComplexity(id, {
  useCache: true,
  cacheTimeout: 3600  // 1 hour
});
```

### Memory Management
- Task data is loaded on-demand
- Analysis results are cached automatically
- File watchers are used for real-time updates
- Cleanup operations run automatically

---

## Changelog

See [CHANGELOG.md](../CHANGELOG.md) for version history and breaking changes.

## Support

- **Documentation**: [docs/](.)
- **Issues**: [GitHub Issues](https://github.com/ruvnet/vibex-task-manager/issues)
- **Discussions**: [GitHub Discussions](https://github.com/ruvnet/vibex-task-manager/discussions)