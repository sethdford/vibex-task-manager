# MCP Tools Reference

Complete reference for all 27 Model Context Protocol (MCP) tools provided by Vibex Task Manager.

## Overview

The Vibex Task Manager MCP server provides 27 specialized tools for comprehensive task management integration with AI editors. All tools require a `projectRoot` parameter to specify the workspace context.

## Common Parameters

All tools accept these common parameters:

- `projectRoot` (string, required): Absolute path to the project directory
- Additional tool-specific parameters as documented below

## Response Format

All tools return responses in standardized MCP format:

```typescript
// Success Response
{
  type: "text",
  text: string  // Formatted response content
}

// Error Response  
{
  type: "text", 
  text: string  // Error message with details
}
```

---

## Initialization & Setup Tools

### initialize_project

Initialize a new Vibex Task Manager project in the specified directory.

**Parameters:**
```typescript
{
  projectRoot: string;     // Project directory path
  name?: string;           // Project name (default: directory name)
  description?: string;    // Project description
}
```

**Response:**
```json
{
  "success": true,
  "message": "Project initialized successfully",
  "projectPath": "/path/to/project",
  "configPath": "/path/to/project/.vibex/config.json",
  "tasksPath": "/path/to/project/.vibex/tasks.json"
}
```

**Example Usage:**
```typescript
// Initialize project in current directory
{
  "tool": "initialize_project",
  "arguments": {
    "projectRoot": "/Users/dev/my-project",
    "name": "My Project",
    "description": "A sample project for demonstration"
  }
}
```

### models

List and manage available AI models for task analysis and expansion.

**Parameters:**
```typescript
{
  projectRoot: string;     // Project directory path
}
```

**Response:**
```json
{
  "currentModel": "claude-3-5-sonnet-20241022",
  "availableModels": [
    {
      "id": "claude-3-5-sonnet-20241022",
      "name": "Claude 3.5 Sonnet",
      "provider": "anthropic",
      "capabilities": ["reasoning", "analysis", "generation"]
    },
    {
      "id": "claude-3-opus-20240229", 
      "name": "Claude 3 Opus",
      "provider": "anthropic",
      "capabilities": ["reasoning", "analysis", "generation"]
    }
  ]
}
```

### parse_prd

Parse a Product Requirements Document (PRD) and generate initial tasks.

**Parameters:**
```typescript
{
  projectRoot: string;     // Project directory path
  prdPath: string;         // Path to PRD file (markdown, text, or docx)
  generateTasks?: boolean; // Auto-generate tasks (default: true)
}
```

**Response:**
```json
{
  "prdAnalysis": {
    "title": "Project Title",
    "overview": "Project overview from PRD",
    "requirements": ["Requirement 1", "Requirement 2"],
    "features": ["Feature 1", "Feature 2"],
    "acceptance_criteria": ["Criteria 1", "Criteria 2"]
  },
  "generatedTasks": [
    {
      "title": "Task title",
      "description": "Task description", 
      "priority": "medium",
      "estimatedHours": 8
    }
  ]
}
```

---

## Task Listing & Viewing Tools

### get_tasks

Retrieve all tasks in the project with optional filtering.

**Parameters:**
```typescript
{
  projectRoot: string;     // Project directory path
  status?: TaskStatus;     // Filter by status
  priority?: Priority;     // Filter by priority
  includeSubtasks?: boolean; // Include subtask details (default: true)
  format?: 'json' | 'table' | 'markdown'; // Output format (default: 'json')
}
```

**Response:**
```json
{
  "tasks": [
    {
      "id": 1,
      "title": "Implement authentication",
      "description": "Add JWT-based user authentication",
      "status": "pending",
      "priority": "high",
      "dependencies": [],
      "subtasks": [],
      "created": "2024-01-15T10:00:00Z",
      "updated": "2024-01-15T10:00:00Z",
      "estimatedHours": 16,
      "complexity": 7
    }
  ],
  "summary": {
    "total": 10,
    "pending": 3,
    "inProgress": 2,
    "done": 4,
    "review": 1,
    "deferred": 0,
    "cancelled": 0
  }
}
```

### get_task

Get detailed information about a specific task.

**Parameters:**
```typescript
{
  projectRoot: string;     // Project directory path
  id: number;              // Task ID
  includeSubtasks?: boolean; // Include subtask details (default: true)
}
```

**Response:**
```json
{
  "task": {
    "id": 1,
    "title": "Implement authentication",
    "description": "Add JWT-based user authentication",
    "status": "pending",
    "priority": "high", 
    "dependencies": [2, 3],
    "details": "Detailed implementation notes...",
    "testStrategy": "Unit tests for auth service...",
    "subtasks": [
      {
        "id": 1,
        "title": "Create user model",
        "description": "Define user schema and validation",
        "status": "done"
      }
    ],
    "created": "2024-01-15T10:00:00Z",
    "updated": "2024-01-15T10:00:00Z",
    "estimatedHours": 16,
    "actualHours": 8,
    "complexity": 7
  }
}
```

### next_task

Find the next optimal task to work on based on dependencies and priority.

**Parameters:**
```typescript
{
  projectRoot: string;     // Project directory path
  includeInProgress?: boolean; // Include in-progress tasks (default: false)
  priorityWeight?: number; // Priority importance (0-1, default: 0.7)
  dependencyWeight?: number; // Dependency importance (0-1, default: 0.3)
}
```

**Response:**
```json
{
  "nextTask": {
    "id": 5,
    "title": "Setup database schema",
    "score": 0.85,
    "reasoning": [
      "No blocking dependencies",
      "High priority (weight: 0.7)",
      "Enables 3 other tasks"
    ]
  },
  "alternatives": [
    {
      "id": 7,
      "title": "Write API documentation", 
      "score": 0.72,
      "reasoning": ["Medium priority", "Can be done in parallel"]
    }
  ],
  "blockedTasks": [
    {
      "id": 3,
      "title": "Implement user registration",
      "blockingDependencies": [1, 2]
    }
  ]
}
```

---

## Task Management Tools

### add_task

Add a new task using AI-powered analysis and structuring.

**Parameters:**
```typescript
{
  projectRoot: string;     // Project directory path
  title: string;           // Task title
  description?: string;    // Task description
  priority?: Priority;     // Task priority (default: 'medium')
  dependencies?: number[]; // Task dependencies by ID
  autoExpand?: boolean;    // Auto-expand into subtasks (default: false)
}
```

**Response:**
```json
{
  "task": {
    "id": 8,
    "title": "Implement user authentication",
    "description": "Add JWT-based authentication system",
    "status": "pending",
    "priority": "high",
    "dependencies": [],
    "created": "2024-01-15T12:30:00Z",
    "estimatedHours": 16,
    "complexity": 7
  },
  "analysis": {
    "complexity": 7,
    "estimatedHours": 16,
    "riskFactors": ["Security considerations", "Integration complexity"],
    "recommendations": [
      "Break into smaller subtasks",
      "Consider using established auth library",
      "Plan comprehensive testing strategy"
    ]
  }
}
```

### update_task

Update an existing task with new information.

**Parameters:**
```typescript
{
  projectRoot: string;     // Project directory path
  id: number;              // Task ID
  title?: string;          // New title
  description?: string;    // New description
  status?: TaskStatus;     // New status
  priority?: Priority;     // New priority
  dependencies?: number[]; // New dependencies
  details?: string;        // Additional details
  testStrategy?: string;   // Testing strategy
  estimatedHours?: number; // Time estimate
}
```

**Response:**
```json
{
  "task": {
    "id": 1,
    "title": "Updated task title",
    "description": "Updated description",
    "status": "in-progress",
    "priority": "high",
    "updated": "2024-01-15T14:20:00Z"
  },
  "changes": [
    "Title updated from 'Old title' to 'Updated task title'",
    "Status changed from 'pending' to 'in-progress'",
    "Priority changed from 'medium' to 'high'"
  ]
}
```

### remove_task

Remove a task from the project.

**Parameters:**
```typescript
{
  projectRoot: string;     // Project directory path
  id: number;              // Task ID
  force?: boolean;         // Force removal even if dependencies exist (default: false)
}
```

**Response:**
```json
{
  "success": true,
  "removedTask": {
    "id": 5,
    "title": "Removed task title"
  },
  "affectedTasks": [
    {
      "id": 7,
      "title": "Task that depended on removed task",
      "removedDependency": 5
    }
  ]
}
```

### set_task_status

Update the status of a specific task.

**Parameters:**
```typescript
{
  projectRoot: string;     // Project directory path
  id: number;              // Task ID
  status: TaskStatus;      // New status ('pending'|'in-progress'|'done'|'review'|'deferred'|'cancelled')
}
```

**Response:**
```json
{
  "task": {
    "id": 1,
    "title": "Task title",
    "status": "done",
    "updated": "2024-01-15T16:45:00Z"
  },
  "statusChange": {
    "from": "in-progress",
    "to": "done",
    "timestamp": "2024-01-15T16:45:00Z"
  }
}
```

### move_task

Move a task to a different position in the task list.

**Parameters:**
```typescript
{
  projectRoot: string;     // Project directory path
  id: number;              // Task ID to move
  position: number;        // New position (0-based index)
}
```

**Response:**
```json
{
  "success": true,
  "taskMoved": {
    "id": 3,
    "title": "Moved task",
    "newPosition": 0,
    "oldPosition": 5
  },
  "reorderedTasks": [
    {"id": 3, "position": 0},
    {"id": 1, "position": 1}, 
    {"id": 2, "position": 2}
  ]
}
```

---

## Subtask Management Tools

### add_subtask

Add a subtask to an existing task.

**Parameters:**
```typescript
{
  projectRoot: string;     // Project directory path
  taskId: number;          // Parent task ID
  title: string;           // Subtask title
  description?: string;    // Subtask description
  priority?: Priority;     // Subtask priority
  dependencies?: number[]; // Subtask dependencies (other subtask IDs)
}
```

**Response:**
```json
{
  "subtask": {
    "id": 1,
    "title": "Create user model",
    "description": "Define user schema and validation",
    "status": "pending",
    "priority": "medium",
    "dependencies": [],
    "created": "2024-01-15T11:15:00Z"
  },
  "parentTask": {
    "id": 5,
    "title": "Implement user management",
    "subtaskCount": 3
  }
}
```

### update_subtask

Update an existing subtask.

**Parameters:**
```typescript
{
  projectRoot: string;     // Project directory path
  taskId: number;          // Parent task ID
  subtaskId: number;       // Subtask ID
  title?: string;          // New title
  description?: string;    // New description
  status?: TaskStatus;     // New status
  priority?: Priority;     // New priority
  dependencies?: number[]; // New dependencies
}
```

**Response:**
```json
{
  "subtask": {
    "id": 1,
    "title": "Updated subtask title",
    "status": "in-progress",
    "updated": "2024-01-15T13:20:00Z"
  },
  "changes": [
    "Title updated",
    "Status changed from 'pending' to 'in-progress'"
  ]
}
```

### remove_subtask

Remove a subtask from its parent task.

**Parameters:**
```typescript
{
  projectRoot: string;     // Project directory path
  taskId: number;          // Parent task ID
  subtaskId: number;       // Subtask ID to remove
}
```

**Response:**
```json
{
  "success": true,
  "removedSubtask": {
    "id": 2,
    "title": "Removed subtask"
  },
  "parentTask": {
    "id": 5,
    "remainingSubtasks": 2
  }
}
```

### clear_subtasks

Remove all subtasks from a task.

**Parameters:**
```typescript
{
  projectRoot: string;     // Project directory path
  taskId: number;          // Parent task ID
}
```

**Response:**
```json
{
  "success": true,
  "clearedCount": 5,
  "task": {
    "id": 3,
    "title": "Task with cleared subtasks",
    "subtasks": []
  }
}
```

---

## Task Analysis Tools

### analyze

Analyze project or task complexity using AI.

**Parameters:**
```typescript
{
  projectRoot: string;     // Project directory path
  taskId?: number;         // Specific task ID (if not provided, analyzes entire project)
  includeSubtasks?: boolean; // Include subtask analysis (default: true)
  detailLevel?: 'basic' | 'detailed' | 'comprehensive'; // Analysis depth
}
```

**Response:**
```json
{
  "analysis": {
    "overallComplexity": 6.8,
    "totalEstimatedHours": 120,
    "riskLevel": "medium",
    "criticalPath": [1, 3, 7, 9],
    "bottlenecks": [
      {
        "taskId": 3,
        "title": "Database setup",
        "dependentTasks": 5,
        "reason": "Many tasks depend on this"
      }
    ],
    "recommendations": [
      "Consider breaking down task #3 into smaller components",
      "Task #7 can be parallelized with tasks #8 and #9",
      "High-risk tasks should be prioritized for early testing"
    ]
  },
  "taskBreakdown": [
    {
      "taskId": 1,
      "complexity": 7,
      "estimatedHours": 16,
      "riskFactors": ["Security", "Integration"],
      "confidence": 0.85
    }
  ]
}
```

### complexity_report

Generate a comprehensive complexity report for the project.

**Parameters:**
```typescript
{
  projectRoot: string;     // Project directory path
  format?: 'json' | 'markdown' | 'html'; // Report format (default: 'json')
}
```

**Response:**
```json
{
  "projectSummary": {
    "totalTasks": 15,
    "averageComplexity": 5.2,
    "totalEstimatedHours": 180,
    "highRiskTasks": 3,
    "completionPercentage": 40
  },
  "complexityDistribution": {
    "low": 5,      // Tasks with complexity 1-3
    "medium": 7,   // Tasks with complexity 4-6
    "high": 3      // Tasks with complexity 7-10
  },
  "riskAssessment": {
    "level": "medium",
    "factors": [
      "Multiple high-complexity tasks",
      "Complex dependency chains",
      "Limited testing coverage"
    ],
    "mitigation": [
      "Break down high-complexity tasks",
      "Increase testing for critical paths",
      "Consider additional resources for high-risk areas"
    ]
  }
}
```

### expand_task

Expand a task into detailed subtasks using AI analysis.

**Parameters:**
```typescript
{
  projectRoot: string;     // Project directory path
  id: number;              // Task ID to expand
  maxSubtasks?: number;    // Maximum subtasks to generate (default: 10)
  detailLevel?: 'basic' | 'detailed' | 'comprehensive'; // Detail level
  preserveExisting?: boolean; // Keep existing subtasks (default: true)
}
```

**Response:**
```json
{
  "expandedTask": {
    "id": 5,
    "title": "Implement user authentication",
    "originalSubtasks": 2,
    "newSubtasks": 6
  },
  "generatedSubtasks": [
    {
      "id": 3,
      "title": "Design authentication flow",
      "description": "Create user login/logout flow diagrams",
      "estimatedHours": 4,
      "priority": "high",
      "dependencies": []
    },
    {
      "id": 4,
      "title": "Implement JWT token service",
      "description": "Create service for generating and validating JWT tokens",
      "estimatedHours": 8,
      "priority": "high",
      "dependencies": [3]
    }
  ],
  "expansion": {
    "methodology": "functional_decomposition",
    "totalEstimatedHours": 32,
    "criticalPath": [3, 4, 5, 6],
    "parallelizable": [[7, 8], [9, 10]]
  }
}
```

### expand_all

Expand all tasks in the project into subtasks.

**Parameters:**
```typescript
{
  projectRoot: string;     // Project directory path
  maxSubtasksPerTask?: number; // Max subtasks per task (default: 8)
  skipCompleted?: boolean; // Skip completed tasks (default: true)
  detailLevel?: 'basic' | 'detailed' | 'comprehensive'; // Detail level
}
```

**Response:**
```json
{
  "expansionResults": {
    "tasksExpanded": 8,
    "tasksSkipped": 3,
    "totalSubtasksGenerated": 45,
    "averageSubtasksPerTask": 5.6
  },
  "expandedTasks": [
    {
      "taskId": 1,
      "title": "Database setup",
      "subtasksGenerated": 6,
      "estimatedHours": 24
    }
  ],
  "skippedTasks": [
    {
      "taskId": 4,
      "title": "Completed task",
      "reason": "Already completed"
    }
  ]
}
```

---

## Dependency Management Tools

### add_dependency

Add a dependency relationship between tasks.

**Parameters:**
```typescript
{
  projectRoot: string;     // Project directory path
  taskId: number;          // Task that depends on another
  dependsOn: number;       // Task that must be completed first
}
```

**Response:**
```json
{
  "success": true,
  "dependency": {
    "taskId": 5,
    "dependsOn": 3,
    "created": "2024-01-15T14:30:00Z"
  },
  "task": {
    "id": 5,
    "title": "User registration",
    "dependencies": [2, 3],
    "status": "pending"
  },
  "validation": {
    "isValid": true,
    "noCycles": true
  }
}
```

### remove_dependency

Remove a dependency relationship between tasks.

**Parameters:**
```typescript
{
  projectRoot: string;     // Project directory path
  taskId: number;          // Task to remove dependency from
  dependsOn: number;       // Dependency to remove
}
```

**Response:**
```json
{
  "success": true,
  "removedDependency": {
    "taskId": 5,
    "dependsOn": 3
  },
  "task": {
    "id": 5,
    "title": "User registration",
    "dependencies": [2],
    "status": "pending"
  }
}
```

### validate_dependencies

Validate the entire dependency graph for cycles and consistency.

**Parameters:**
```typescript
{
  projectRoot: string;     // Project directory path
  fix?: boolean;           // Automatically fix issues (default: false)
}
```

**Response:**
```json
{
  "validation": {
    "isValid": false,
    "totalDependencies": 15,
    "issuesFound": 2
  },
  "cycles": [
    {
      "cycle": [1, 3, 5, 1],
      "description": "Task 1 → Task 3 → Task 5 → Task 1"
    }
  ],
  "orphanedTasks": [
    {
      "taskId": 8,
      "title": "Orphaned task",
      "issue": "References non-existent dependency #99"
    }
  ],
  "recommendations": [
    "Remove dependency from Task 5 to Task 1 to break cycle",
    "Update Task 8 to remove invalid dependency #99"
  ]
}
```

### fix_dependencies

Automatically fix dependency issues in the project.

**Parameters:**
```typescript
{
  projectRoot: string;     // Project directory path
  dryRun?: boolean;        // Preview changes without applying (default: false)
}
```

**Response:**
```json
{
  "fixes": {
    "cyclesFixed": 1,
    "orphanedDependenciesRemoved": 2,
    "invalidReferencesFixed": 1
  },
  "changes": [
    {
      "type": "removed_dependency",
      "taskId": 5,
      "dependsOn": 1,
      "reason": "Broke circular dependency"
    },
    {
      "type": "removed_dependency", 
      "taskId": 8,
      "dependsOn": 99,
      "reason": "Invalid task reference"
    }
  ],
  "validation": {
    "isValid": true,
    "remainingIssues": 0
  }
}
```

---

## Utility Tools

### generate

Generate individual task files for external processing.

**Parameters:**
```typescript
{
  projectRoot: string;     // Project directory path
  outputDir?: string;      // Output directory (default: './task-files')
  format?: 'markdown' | 'json' | 'yaml'; // File format (default: 'markdown')
  includeSubtasks?: boolean; // Include subtasks in files (default: true)
}
```

**Response:**
```json
{
  "generation": {
    "tasksGenerated": 12,
    "outputDirectory": "/project/task-files",
    "format": "markdown",
    "totalFiles": 12
  },
  "files": [
    {
      "taskId": 1,
      "title": "Implement authentication",
      "filename": "task-001-implement-authentication.md",
      "path": "/project/task-files/task-001-implement-authentication.md",
      "size": "2.1KB"
    }
  ]
}
```

### update

Bulk update multiple tasks with a single operation.

**Parameters:**
```typescript
{
  projectRoot: string;     // Project directory path
  updates: Array<{         // Array of task updates
    id: number;            // Task ID
    changes: Partial<Task>; // Changes to apply
  }>;
}
```

**Response:**
```json
{
  "bulkUpdate": {
    "tasksUpdated": 5,
    "tasksNotFound": 0,
    "errors": []
  },
  "updatedTasks": [
    {
      "id": 1,
      "changes": ["status", "priority"],
      "newStatus": "in-progress",
      "newPriority": "high"
    }
  ]
}
```

---

## Error Handling

### Common Error Responses

#### Project Not Found
```json
{
  "error": "PROJECT_NOT_INITIALIZED",
  "message": "No Vibex project found in the specified directory",
  "details": {
    "projectRoot": "/path/to/project",
    "suggestion": "Run initialize_project tool first"
  }
}
```

#### Task Not Found
```json
{
  "error": "TASK_NOT_FOUND", 
  "message": "Task with ID 123 not found",
  "details": {
    "taskId": 123,
    "availableTaskIds": [1, 2, 3, 4, 5]
  }
}
```

#### Circular Dependency
```json
{
  "error": "CIRCULAR_DEPENDENCY",
  "message": "Adding this dependency would create a cycle",
  "details": {
    "cycle": [1, 3, 5, 1],
    "suggestion": "Remove dependency from task 5 to task 1"
  }
}
```

#### Invalid Parameters
```json
{
  "error": "INVALID_PARAMETERS",
  "message": "Invalid task status provided",
  "details": {
    "parameter": "status",
    "provided": "invalid-status",
    "validValues": ["pending", "in-progress", "done", "review", "deferred", "cancelled"]
  }
}
```

### Error Codes Reference

| Code | Description | Resolution |
|------|-------------|------------|
| `PROJECT_NOT_INITIALIZED` | No Vibex project found | Use `initialize_project` tool |
| `TASK_NOT_FOUND` | Task ID doesn't exist | Check available task IDs |
| `SUBTASK_NOT_FOUND` | Subtask ID doesn't exist | Check subtask IDs for the task |
| `CIRCULAR_DEPENDENCY` | Dependency cycle detected | Remove conflicting dependencies |
| `INVALID_STATUS` | Invalid task status | Use valid status values |
| `INVALID_PRIORITY` | Invalid priority level | Use 'low', 'medium', or 'high' |
| `AI_SERVICE_ERROR` | AI provider unavailable | Check AI configuration |
| `FILE_SYSTEM_ERROR` | File access denied | Check file permissions |
| `INVALID_PARAMETERS` | Parameter validation failed | Check parameter types and values |

---

## Tool Usage Patterns

### Basic Task Management Flow
```typescript
// 1. Initialize project
initialize_project({ projectRoot: "/path/to/project" })

// 2. Add tasks
add_task({ 
  projectRoot: "/path/to/project",
  title: "Setup database",
  priority: "high"
})

// 3. Expand into subtasks
expand_task({
  projectRoot: "/path/to/project", 
  id: 1,
  detailLevel: "detailed"
})

// 4. Add dependencies
add_dependency({
  projectRoot: "/path/to/project",
  taskId: 2,
  dependsOn: 1
})

// 5. Work on next task
next_task({ projectRoot: "/path/to/project" })
```

### Project Analysis Workflow
```typescript
// 1. Parse requirements
parse_prd({
  projectRoot: "/path/to/project",
  prdPath: "requirements.md"
})

// 2. Analyze complexity
analyze({
  projectRoot: "/path/to/project",
  detailLevel: "comprehensive"
})

// 3. Generate complexity report
complexity_report({
  projectRoot: "/path/to/project",
  format: "markdown"
})

// 4. Validate dependencies
validate_dependencies({
  projectRoot: "/path/to/project"
})
```

### Maintenance Operations
```typescript
// 1. Fix dependency issues
fix_dependencies({
  projectRoot: "/path/to/project"
})

// 2. Generate task files
generate({
  projectRoot: "/path/to/project",
  format: "markdown",
  outputDir: "./docs/tasks"
})

// 3. Bulk status updates
update({
  projectRoot: "/path/to/project",
  updates: [
    { id: 1, changes: { status: "done" } },
    { id: 2, changes: { status: "in-progress" } }
  ]
})
```

---

## Integration Examples

### Claude Code Usage
```typescript
// In Claude Code, tools are called automatically:
"I need to add a new authentication task"
// → Calls add_task tool

"Show me the next task to work on"  
// → Calls next_task tool

"Expand task 5 into subtasks"
// → Calls expand_task tool
```

### Programmatic Usage
```typescript
// If using the tools programmatically:
const mcpClient = new MCPClient();

const result = await mcpClient.callTool('add_task', {
  projectRoot: process.cwd(),
  title: 'Implement user authentication',
  description: 'Add JWT-based authentication',
  priority: 'high'
});

console.log(result.task);
```

---

This comprehensive reference covers all 27 MCP tools available in Vibex Task Manager, providing complete parameter documentation, response formats, and usage examples for effective task management integration with AI editors.