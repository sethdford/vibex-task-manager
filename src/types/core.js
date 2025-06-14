/**
 * Core TypeScript type definitions for Vibex Task Manager
 * Comprehensive type system with AWS Bedrock integration
 */
import { z } from 'zod';
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
export const PrioritySchema = z.enum(['low', 'medium', 'high']);
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
    models: z.object({
        main: BedrockModelConfigSchema,
        research: BedrockModelConfigSchema,
        fallback: BedrockModelConfigSchema.optional(),
    }),
    global: GlobalConfigSchema,
    version: z.string().default('1.0.0'),
    lastUpdated: z.string().datetime().optional(),
});
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
// ============================================================================
// Error Types
// ============================================================================
export class VibexError extends Error {
    code;
    details;
    constructor(message, code, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'VibexError';
    }
}
export class TaskNotFoundError extends VibexError {
    constructor(taskId, availableIds = []) {
        super(`Task with ID ${taskId} not found`, 'TASK_NOT_FOUND', { taskId, availableIds });
        this.name = 'TaskNotFoundError';
    }
}
export class CircularDependencyError extends VibexError {
    constructor(cycle) {
        super(`Circular dependency detected: ${cycle.join(' → ')}`, 'CIRCULAR_DEPENDENCY', { cycle });
        this.name = 'CircularDependencyError';
    }
}
export class ConfigurationError extends VibexError {
    constructor(message, field) {
        super(message, 'CONFIGURATION_ERROR', { field });
        this.name = 'ConfigurationError';
    }
}
export class AIServiceError extends VibexError {
    constructor(message, modelId, originalError) {
        super(message, 'AI_SERVICE_ERROR', { modelId, originalError: originalError?.message });
        this.name = 'AIServiceError';
    }
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
};
