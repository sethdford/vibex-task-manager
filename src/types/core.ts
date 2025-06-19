/**
 * Core TypeScript type definitions for Vibex Task Manager
 * Comprehensive type system with AWS Bedrock integration
 */

import { z } from 'zod';
import { ClaudeModelId } from '../core/bedrock-client.js';

// ============================================================================
// Task Management Types
// ============================================================================

export const TaskStatusSchema = z.enum([
  'pending',
  'in-progress', 
  'done',
  'review',
  'deferred',
  'cancelled'
]);

// SPARC Methodology Statuses
export const SparcStatusSchema = z.enum([
  'specification',  // Define requirements for build/test fix swarm
  'pseudocode',     // Design agent coordination and task flow
  'architecture',   // Create swarm structure and agent roles
  'refinement',     // Deploy agents with TDD approach
  'completion'      // Validate build and all tests pass
]);

export const PrioritySchema = z.enum(['low', 'medium', 'high']);

export type TaskStatus = z.infer<typeof TaskStatusSchema>;
export type SparcStatus = z.infer<typeof SparcStatusSchema>;
export type Priority = z.infer<typeof PrioritySchema>;

// SPARC Methodology Types
export const SparcMethodologySchema = z.object({
  enabled: z.boolean().default(false),
  currentPhase: SparcStatusSchema.optional(),
  phases: z.object({
    specification: z.object({
      status: z.enum(['pending', 'in-progress', 'done', 'blocked']).default('pending'),
      requirements: z.array(z.string()).default([]),
      swarmDefinition: z.string().optional(),
      testCriteria: z.array(z.string()).default([]),
      completedAt: z.string().datetime().optional(),
    }),
    pseudocode: z.object({
      status: z.enum(['pending', 'in-progress', 'done', 'blocked']).default('pending'),
      agentCoordination: z.string().optional(),
      taskFlow: z.string().optional(),
      coordinationPattern: z.string().optional(),
      completedAt: z.string().datetime().optional(),
    }),
    architecture: z.object({
      status: z.enum(['pending', 'in-progress', 'done', 'blocked']).default('pending'),
      swarmStructure: z.string().optional(),
      agentRoles: z.array(z.object({
        role: z.string(),
        responsibilities: z.array(z.string()),
        dependencies: z.array(z.string()),
      })).default([]),
      completedAt: z.string().datetime().optional(),
    }),
    refinement: z.object({
      status: z.enum(['pending', 'in-progress', 'done', 'blocked']).default('pending'),
      tddApproach: z.string().optional(),
      testCases: z.array(z.string()).default([]),
      deploymentPlan: z.string().optional(),
      completedAt: z.string().datetime().optional(),
    }),
    completion: z.object({
      status: z.enum(['pending', 'in-progress', 'done', 'blocked']).default('pending'),
      buildValidation: z.boolean().default(false),
      testResults: z.array(z.object({
        testName: z.string(),
        status: z.enum(['pass', 'fail', 'skipped']),
        details: z.string().optional(),
      })).default([]),
      validationReport: z.string().optional(),
      completedAt: z.string().datetime().optional(),
    }),
  }),
  metadata: z.object({
    startedAt: z.string().datetime().optional(),
    completedAt: z.string().datetime().optional(),
    totalPhases: z.number().default(5),
    completedPhases: z.number().default(0),
    methodology: z.literal('sparc').default('sparc'),
  }),
});

export type SparcMethodology = z.infer<typeof SparcMethodologySchema>;

// Core Task Schema
export const TaskSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1).max(500),
  description: z.string().max(5000),
  status: TaskStatusSchema,
  priority: PrioritySchema,
  dependencies: z.array(z.number().int().positive()).default([]),
  details: z.string().optional(),
  testStrategy: z.string().optional(),
  subtasks: z.array(z.lazy(() => SubtaskSchema)).optional(),
  created: z.string().datetime().optional(),
  updated: z.string().datetime().optional(),
  estimatedHours: z.number().positive().optional(),
  actualHours: z.number().positive().optional(),
  complexity: z.number().min(1).max(10).optional(),
  tags: z.array(z.string()).default([]),
  assignee: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  sparc: SparcMethodologySchema.optional(),
});

// Subtask Schema
export const SubtaskSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000),
  status: TaskStatusSchema,
  priority: PrioritySchema.optional(),
  dependencies: z.array(z.number().int().positive()).default([]),
  details: z.string().optional(),
  testStrategy: z.string().optional(),
  created: z.string().datetime().optional(),
  updated: z.string().datetime().optional(),
  estimatedHours: z.number().positive().optional(),
  actualHours: z.number().positive().optional(),
});

export type Task = z.infer<typeof TaskSchema>;
export type Subtask = z.infer<typeof SubtaskSchema>;

// Task creation and update types
export type TaskCreateInput = Omit<Task, 'id' | 'created' | 'updated'>;
export type TaskUpdateInput = Partial<Omit<Task, 'id' | 'created'>>;
export type SubtaskCreateInput = Omit<Subtask, 'id' | 'created' | 'updated'>;
export type SubtaskUpdateInput = Partial<Omit<Subtask, 'id' | 'created'>>;

// ============================================================================
// Configuration Types
// ============================================================================

export const BedrockModelConfigSchema = z.object({
  modelId: z.string(),
  maxTokens: z.number().min(1).max(200000).default(4096),
  temperature: z.number().min(0).max(1).default(0.3),
  topP: z.number().min(0).max(1).optional(),
  topK: z.number().min(1).max(500).optional(),
  region: z.string().default('us-east-1'),
  profile: z.string().optional(),
  accessKeyId: z.string().optional(),
  secretAccessKey: z.string().optional(),
  sessionToken: z.string().optional(),
});

export const GlobalConfigSchema = z.object({
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  debug: z.boolean().default(false),
  defaultSubtasks: z.number().min(1).max(20).default(5),
  defaultNumTasks: z.number().min(1).max(100).optional(),
  defaultPriority: PrioritySchema.default('medium'),
  projectName: z.string().optional(),
  dataDirectory: z.string().default('.vibex'),
  autoSave: z.boolean().default(true),
  autoBackup: z.boolean().default(true),
  maxBackups: z.number().min(1).max(100).default(10),
});

export const ConfigSchema = z.object({
  projectName: z.string().optional(),
  version: z.string().optional(),
  created: z.string().optional(),
  aiProvider: z.enum(['bedrock', 'openai']).optional(),
  models: z.object({
    main: BedrockModelConfigSchema,
    research: BedrockModelConfigSchema,
    fallback: BedrockModelConfigSchema,
  }),
  aws: z.object({
    region: z.string().optional(),
    profile: z.string().optional(),
  }).optional(),
  features: z.object({
    aiTaskGeneration: z.boolean().optional(),
    complexityAnalysis: z.boolean().optional(),
  }).optional(),
  global: GlobalConfigSchema,
  lastUpdated: z.string().datetime().optional(),
  dataDirectory: z.string().default('.vibex'),
  autoSave: z.boolean().default(true),
  autoBackup: z.boolean().default(true),
  maxBackups: z.number().min(1).max(100).default(10),
});

export type BedrockModelConfig = z.infer<typeof BedrockModelConfigSchema>;
export type GlobalConfig = z.infer<typeof GlobalConfigSchema>;
export type Config = z.infer<typeof ConfigSchema>;

// ============================================================================
// Task Data Storage Types
// ============================================================================

export const TasksDataSchema = z.object({
  tasks: z.array(TaskSchema),
  metadata: z.object({
    version: z.string().default('1.0.0'),
    created: z.string().datetime(),
    updated: z.string().datetime(),
    totalTasks: z.number().int().nonnegative(),
    projectName: z.string().optional(),
  }),
});

export type TasksData = z.infer<typeof TasksDataSchema>;

// ============================================================================
// Analysis and Reporting Types
// ============================================================================

export const ComplexityAnalysisSchema = z.object({
  taskId: z.number().int().positive(),
  taskTitle: z.string(),
  complexityScore: z.number().min(1).max(10),
  factors: z.array(z.string()),
  reasoning: z.string(),
  estimatedHours: z.number().positive(),
  riskLevel: z.enum(['low', 'medium', 'high']),
  recommendations: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  timestamp: z.string().datetime(),
});

export const ComplexityReportSchema = z.object({
  metadata: z.object({
    generatedAt: z.string().datetime(),
    tasksAnalyzed: z.number().int().nonnegative(),
    model: z.string(),
    projectName: z.string().optional(),
    totalEstimatedHours: z.number().positive(),
    averageComplexity: z.number().min(1).max(10),
  }),
  analyses: z.array(ComplexityAnalysisSchema),
  summary: z.object({
    highComplexityTasks: z.number().int().nonnegative(),
    mediumComplexityTasks: z.number().int().nonnegative(),
    lowComplexityTasks: z.number().int().nonnegative(),
    totalRisk: z.enum(['low', 'medium', 'high']),
    criticalPath: z.array(z.number().int().positive()),
    bottlenecks: z.array(z.object({
      taskId: z.number().int().positive(),
      reason: z.string(),
      impact: z.enum(['low', 'medium', 'high']),
    })),
  }),
});

export type ComplexityAnalysis = z.infer<typeof ComplexityAnalysisSchema>;
export type ComplexityReport = z.infer<typeof ComplexityReportSchema>;

// ============================================================================
// AI Generation Types
// ============================================================================

export const AIGeneratedTaskSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(5000),
  details: z.string().optional(),
  testStrategy: z.string().optional(),
  priority: PrioritySchema,
  estimatedHours: z.number().positive().optional(),
  complexity: z.number().min(1).max(10).optional(),
  dependencies: z.array(z.number().int().positive()).default([]),
  tags: z.array(z.string()).default([]),
  subtasks: z.array(z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(2000),
    details: z.string().optional(),
    estimatedHours: z.number().positive().optional(),
    priority: PrioritySchema.optional(),
  })).optional(),
});

export const PRDAnalysisSchema = z.object({
  projectName: z.string(),
  overview: z.string(),
  features: z.array(z.string()),
  requirements: z.array(z.string()),
  constraints: z.array(z.string()),
  acceptanceCriteria: z.array(z.string()),
  estimatedComplexity: z.number().min(1).max(10),
  estimatedDuration: z.string(),
  tasks: z.array(AIGeneratedTaskSchema),
});

export type AIGeneratedTask = z.infer<typeof AIGeneratedTaskSchema>;
export type PRDAnalysis = z.infer<typeof PRDAnalysisSchema>;

// ============================================================================
// Task Operations Types
// ============================================================================

export interface TaskFilter {
  status?: TaskStatus | TaskStatus[];
  priority?: Priority | Priority[];
  assignee?: string;
  tags?: string[];
  hasSubtasks?: boolean;
  hasDependencies?: boolean;
  dependsOn?: number;
  dueBefore?: Date;
  dueAfter?: Date;
  createdBefore?: Date;
  createdAfter?: Date;
  search?: string;
}

export interface TaskSortOptions {
  field: 'id' | 'title' | 'status' | 'priority' | 'created' | 'updated' | 'dueDate' | 'complexity';
  order: 'asc' | 'desc';
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface TaskQueryOptions {
  filter?: TaskFilter;
  sort?: TaskSortOptions;
  pagination?: PaginationOptions;
  includeSubtasks?: boolean;
}

export interface TaskQueryResult {
  tasks: Task[];
  totalCount: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ============================================================================
// Next Task Recommendation Types
// ============================================================================

export const NextTaskCriteriaSchema = z.object({
  includeInProgress: z.boolean().default(false),
  priorityWeight: z.number().min(0).max(1).default(0.7),
  dependencyWeight: z.number().min(0).max(1).default(0.3),
  complexityWeight: z.number().min(0).max(1).default(0.0),
  dueDateWeight: z.number().min(0).max(1).default(0.0),
  excludeTaskIds: z.array(z.number().int().positive()).default([]),
  maxComplexity: z.number().min(1).max(10).optional(),
  preferredTags: z.array(z.string()).default([]),
  assignee: z.string().optional(),
});

export const TaskRecommendationSchema = z.object({
  task: TaskSchema,
  score: z.number().min(0).max(1),
  reasoning: z.array(z.string()),
  factors: z.object({
    priority: z.number(),
    dependencies: z.number(),
    complexity: z.number().optional(),
    dueDate: z.number().optional(),
    tags: z.number().optional(),
  }),
});

export const NextTaskResultSchema = z.object({
  recommendation: TaskRecommendationSchema.optional(),
  alternatives: z.array(TaskRecommendationSchema).max(5),
  blockedTasks: z.array(z.object({
    task: TaskSchema,
    blockingDependencies: z.array(z.number().int().positive()),
    reason: z.string(),
  })),
  analysis: z.object({
    totalTasks: z.number().int().nonnegative(),
    availableTasks: z.number().int().nonnegative(),
    blockedTasks: z.number().int().nonnegative(),
    recommendations: z.array(z.string()),
  }),
});

export type NextTaskCriteria = z.infer<typeof NextTaskCriteriaSchema>;
export type TaskRecommendation = z.infer<typeof TaskRecommendationSchema>;
export type NextTaskResult = z.infer<typeof NextTaskResultSchema>;

// ============================================================================
// Dependency Management Types
// ============================================================================

export interface DependencyValidationResult {
  isValid: boolean;
  errors: DependencyError[];
  warnings: DependencyWarning[];
  cycles: DependencyCycle[];
  orphanedDependencies: OrphanedDependency[];
}

export interface DependencyError {
  type: 'circular' | 'missing' | 'self-reference';
  taskId: number;
  dependencyId?: number;
  message: string;
  severity: 'error' | 'warning';
}

export interface DependencyWarning {
  type: 'deep-chain' | 'cross-priority' | 'temporal-conflict';
  taskId: number;
  message: string;
  suggestion?: string;
}

export interface DependencyCycle {
  cycle: number[];
  length: number;
  severity: 'blocking' | 'warning';
}

export interface OrphanedDependency {
  taskId: number;
  missingDependencies: number[];
}

// ============================================================================
// Error Types
// ============================================================================

export class VibexError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'VibexError';
  }
}

export class TaskNotFoundError extends VibexError {
  constructor(taskId: number, availableIds: number[] = []) {
    super(
      `Task with ID ${taskId} not found`,
      'TASK_NOT_FOUND',
      { taskId, availableIds }
    );
    this.name = 'TaskNotFoundError';
  }
}

export class CircularDependencyError extends VibexError {
  constructor(cycle: number[]) {
    super(
      `Circular dependency detected: ${cycle.join(' → ')}`,
      'CIRCULAR_DEPENDENCY',
      { cycle }
    );
    this.name = 'CircularDependencyError';
  }
}

export class ConfigurationError extends VibexError {
  constructor(message: string, field?: string) {
    super(message, 'CONFIGURATION_ERROR', { field });
    this.name = 'ConfigurationError';
  }
}

export class AIServiceError extends VibexError {
  constructor(message: string, modelId?: string, originalError?: Error) {
    super(message, 'AI_SERVICE_ERROR', { modelId, originalError: originalError?.message });
    this.name = 'AIServiceError';
  }
}

// ============================================================================
// Utility Types
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// ============================================================================
// Event Types
// ============================================================================

export interface TaskEvent {
  type: 'task:created' | 'task:updated' | 'task:deleted' | 'task:status_changed';
  taskId: number;
  task?: Task;
  changes?: Partial<Task>;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface SubtaskEvent {
  type: 'subtask:created' | 'subtask:updated' | 'subtask:deleted';
  taskId: number;
  subtaskId: number;
  subtask?: Subtask;
  changes?: Partial<Subtask>;
  timestamp: Date;
}

export interface ConfigEvent {
  type: 'config:updated' | 'config:reset';
  changes?: Partial<Config>;
  timestamp: Date;
}

export type VibexEvent = TaskEvent | SubtaskEvent | ConfigEvent;

// ============================================================================
// Service Interface Types
// ============================================================================

export interface ITaskService {
  // CRUD operations
  getTasks(options?: TaskQueryOptions): Promise<TaskQueryResult>;
  getTask(id: number): Promise<Task>;
  createTask(input: TaskCreateInput): Promise<Task>;
  updateTask(id: number, updates: TaskUpdateInput): Promise<Task>;
  deleteTask(id: number): Promise<boolean>;

  // Status management
  setTaskStatus(id: number, status: TaskStatus): Promise<Task>;
  bulkUpdateStatus(ids: number[], status: TaskStatus): Promise<Task[]>;

  // Subtask management
  addSubtask(taskId: number, subtask: SubtaskCreateInput): Promise<Subtask>;
  updateSubtask(taskId: number, subtaskId: number, updates: SubtaskUpdateInput): Promise<Subtask>;
  removeSubtask(taskId: number, subtaskId: number): Promise<boolean>;
  clearSubtasks(taskId: number): Promise<boolean>;

  // Dependencies
  addDependency(taskId: number, dependsOn: number): Promise<Task>;
  removeDependency(taskId: number, dependsOn: number): Promise<Task>;
  validateDependencies(): Promise<DependencyValidationResult>;
  fixDependencies(): Promise<DependencyValidationResult>;

  // AI-powered operations
  analyzeComplexity(taskId: number): Promise<ComplexityAnalysis>;
  expandTask(taskId: number, options?: { maxSubtasks?: number; detailLevel?: string }): Promise<Subtask[]>;
  getNextTask(criteria?: NextTaskCriteria): Promise<NextTaskResult>;
  generateTasksFromPRD(prdContent: string): Promise<PRDAnalysis>;

  // SPARC Methodology operations
  enableSparcMethodology(taskId: number): Promise<Task>;
  disableSparcMethodology(taskId: number): Promise<Task>;
  advanceSparcPhase(taskId: number, phase: SparcStatus): Promise<Task>;
  updateSparcPhase(taskId: number, phase: SparcStatus, updates: Record<string, unknown>): Promise<Task>;
  getSparcProgress(taskId: number): Promise<{ currentPhase: SparcStatus; progress: number; phases: Record<string, unknown> }>;
  generateSparcRequirements(taskId: number): Promise<string[]>;
  generateSparcPseudocode(taskId: number): Promise<{ coordination: string; taskFlow: string }>;
  generateSparcArchitecture(taskId: number): Promise<{ structure: string; roles: Array<{ role: string; responsibilities: string[] }> }>;
  generateSparcTests(taskId: number): Promise<string[]>;
  validateSparcCompletion(taskId: number): Promise<{ isValid: boolean; issues: string[]; testResults: Array<{ testName: string; status: 'pass' | 'fail' | 'skipped' }> }>;

  // Bulk operations
  moveTask(taskId: number, newPosition: number): Promise<Task[]>;
  duplicateTask(taskId: number): Promise<Task>;
  archiveTasks(filter: TaskFilter): Promise<number>;
}

export interface IConfigService {
  getConfig(): Promise<Config>;
  updateConfig(updates: DeepPartial<Config>): Promise<Config>;
  resetConfig(): Promise<Config>;
  validateConfig(config: unknown): Promise<Config>;
  getDefaultConfig(): Config;
}

// ============================================================================
// MCP Tool Types
// ============================================================================

export interface MCPToolResult {
  type: 'text' | 'error';
  text: string;
  metadata?: Record<string, unknown>;
}

export interface MCPToolInput {
  projectRoot: string;
  [key: string]: unknown;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: z.ZodSchema;
  handler: (input: MCPToolInput) => Promise<MCPToolResult>;
}

// ============================================================================
// Export validation schemas for runtime use
// ============================================================================

export const ValidationSchemas = {
  Task: TaskSchema,
  Subtask: SubtaskSchema,
  Config: ConfigSchema,
  TasksData: TasksDataSchema,
  ComplexityAnalysis: ComplexityAnalysisSchema,
  ComplexityReport: ComplexityReportSchema,
  AIGeneratedTask: AIGeneratedTaskSchema,
  PRDAnalysis: PRDAnalysisSchema,
  NextTaskCriteria: NextTaskCriteriaSchema,
  TaskRecommendation: TaskRecommendationSchema,
  NextTaskResult: NextTaskResultSchema,
} as const;

export const ProjectSettingsSchema = z.object({
  projectName: z.string().optional(),
  defaultSubtasks: z.number().optional(),
  defaultPriority: PrioritySchema.optional(),
  dataDirectory: z.string().default('.taskmanager'),
  autoSave: z.boolean().optional(),
  autoBackup: z.boolean().optional(),
});