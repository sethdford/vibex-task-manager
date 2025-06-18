/**
 * TypeScript Task Service with AWS Bedrock Integration
 * Core service for task management operations using Claude models
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import BedrockClient, { ClaudeModelId } from '../core/bedrock-client.js';
import {
  Task,
  Subtask,
  TaskCreateInput,
  TaskUpdateInput,
  SubtaskCreateInput,
  SubtaskUpdateInput,
  TaskQueryOptions,
  TaskQueryResult,
  TaskStatus,
  Priority,
  NextTaskCriteria,
  NextTaskResult,
  ComplexityAnalysis,
  DependencyValidationResult,
  PRDAnalysis,
  TasksData,
  Config,
  TaskFilter,
  ITaskService,
  TaskNotFoundError,
  CircularDependencyError,
  AIServiceError,
  ValidationSchemas,
} from '../types/core.js';
import { ConfigService } from './config-service.js';

export class TaskService implements ITaskService {
  	private bedrockClient!: BedrockClient;
  private configService: ConfigService;
  private projectRoot: string;
  private tasksFilePath: string;
  private cache: Map<string, { data: unknown; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(projectRoot: string, configService?: ConfigService) {
    this.projectRoot = projectRoot;
    this.configService = configService || new ConfigService(projectRoot);
    this.tasksFilePath = path.join(projectRoot, '.taskmanager', 'tasks', 'tasks.json');
    
    // Initialize Bedrock client with current config
    this.initializeBedrockClient();
  }

  private async initializeBedrockClient(): Promise<void> {
    try {
      const config = await this.configService.getConfig();
      this.bedrockClient = new BedrockClient({
        region: config.models.main.region,
        profile: config.models.main.profile,
        accessKeyId: config.models.main.accessKeyId,
        secretAccessKey: config.models.main.secretAccessKey,
        sessionToken: config.models.main.sessionToken,
      });
    } catch (error) {
      throw new AIServiceError('Failed to initialize Bedrock client', undefined, error as Error);
    }
  }

  // ============================================================================
  // Core CRUD Operations
  // ============================================================================

  async getTasks(options: TaskQueryOptions = {}): Promise<TaskQueryResult> {
    const tasksData = await this.loadTasksData();
    let tasks = [...tasksData.tasks];

    // Apply filters
    if (options.filter) {
      tasks = this.applyFilters(tasks, options.filter);
    }

    // Apply sorting
    if (options.sort) {
      tasks = this.applySorting(tasks, options.sort);
    }

    // Count total before pagination
    const totalCount = tasks.length;

    // Apply pagination
    if (options.pagination) {
      const { page, limit } = options.pagination;
      const startIndex = (page - 1) * limit;
      tasks = tasks.slice(startIndex, startIndex + limit);
    }

    // Include/exclude subtasks
    if (options.includeSubtasks === false) {
      tasks = tasks.map(task => ({ ...task, subtasks: undefined }));
    }

    return {
      tasks,
      totalCount,
      page: options.pagination?.page || 1,
      limit: options.pagination?.limit || totalCount,
      hasMore: options.pagination ? (options.pagination.page * options.pagination.limit) < totalCount : false,
    };
  }

  async getTask(id: number): Promise<Task> {
    const tasksData = await this.loadTasksData();
    const task = tasksData.tasks.find(t => t.id === id);
    
    if (!task) {
      const availableIds = tasksData.tasks.map(t => t.id);
      throw new TaskNotFoundError(id, availableIds);
    }

    return task;
  }

  async createTask(input: TaskCreateInput): Promise<Task> {
    const tasksData = await this.loadTasksData();
    const maxId = Math.max(0, ...tasksData.tasks.map(t => t.id));
    const now = new Date().toISOString();

    const newTask: Task = {
      id: maxId + 1,
      subtasks: [],
      dependencies: [],
      status: 'pending',
      ...input,
      created: now,
      updated: now,
    };

    // Validate the task
    const validatedTask = ValidationSchemas.Task.parse(newTask);

    // Check for dependency cycles
    if (validatedTask.dependencies.length > 0) {
      const wouldCreateCycle = this.wouldCreateCycle(
        validatedTask.id,
        validatedTask.dependencies,
        tasksData.tasks
      );
      if (wouldCreateCycle.length > 0) {
        throw new CircularDependencyError(wouldCreateCycle);
      }
    }

    tasksData.tasks.push(validatedTask);
    tasksData.metadata.totalTasks = tasksData.tasks.length;
    tasksData.metadata.updated = now;

    await this.saveTasksData(tasksData);
    this.clearCache();

    return validatedTask;
  }

  async updateTask(id: number, updates: TaskUpdateInput): Promise<Task> {
    const tasksData = await this.loadTasksData();
    const taskIndex = tasksData.tasks.findIndex(t => t.id === id);
    
    if (taskIndex === -1) {
      throw new TaskNotFoundError(id);
    }

    const existingTask = tasksData.tasks[taskIndex];
    const now = new Date().toISOString();

    const updatedTask: Task = {
      ...existingTask,
      ...updates,
      id, // Ensure ID cannot be changed
      updated: now,
    };

    // Validate the updated task
    const validatedTask = ValidationSchemas.Task.parse(updatedTask);

    // Check for dependency cycles if dependencies were updated
    if (updates.dependencies && updates.dependencies.length > 0) {
      const wouldCreateCycle = this.wouldCreateCycle(
        id,
        updates.dependencies,
        tasksData.tasks.filter(t => t.id !== id)
      );
      if (wouldCreateCycle.length > 0) {
        throw new CircularDependencyError(wouldCreateCycle);
      }
    }

    tasksData.tasks[taskIndex] = validatedTask;
    tasksData.metadata.updated = now;

    await this.saveTasksData(tasksData);
    this.clearCache();

    return validatedTask;
  }

  async deleteTask(id: number): Promise<boolean> {
    const tasksData = await this.loadTasksData();
    const taskIndex = tasksData.tasks.findIndex(t => t.id === id);
    
    if (taskIndex === -1) {
      throw new TaskNotFoundError(id);
    }

    // Remove the task
    tasksData.tasks.splice(taskIndex, 1);

    // Remove any dependencies referencing this task
    tasksData.tasks.forEach(task => {
      task.dependencies = task.dependencies.filter(depId => depId !== id);
    });

    tasksData.metadata.totalTasks = tasksData.tasks.length;
    tasksData.metadata.updated = new Date().toISOString();

    await this.saveTasksData(tasksData);
    this.clearCache();

    return true;
  }

  async createTaskFromPrompt(prompt: string, options: Partial<TaskCreateInput>): Promise<Task> {
    const systemPrompt = this.buildTaskCreationPrompt();
    const modelConfig = await this.configService.getModelConfig('main');
    
    const response = await this.bedrockClient.generateText({
      model: modelConfig.modelId as ClaudeModelId,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 4096,
    });

    let taskData: any;
    try {
      taskData = JSON.parse(response.text);
    } catch (e) {
      throw new AIServiceError('Failed to parse AI response for task creation.', JSON.stringify({ prompt, response: response.text }));
    }

    const taskInput: TaskCreateInput = {
      title: taskData.title,
      description: taskData.description,
      priority: options.priority || taskData.priority || 'medium',
      status: 'pending',
      dependencies: options.dependencies || [],
      subtasks: [],
      tags: taskData.tags || [],
      estimatedHours: taskData.estimatedHours,
      complexity: taskData.complexity,
    };

    return this.createTask(taskInput);
  }

  // ============================================================================
  // Status Management
  // ============================================================================

  async setTaskStatus(id: number, status: TaskStatus): Promise<Task> {
    return this.updateTask(id, { status });
  }

  async bulkUpdateStatus(ids: number[], status: TaskStatus): Promise<Task[]> {
    const updatedTasks: Task[] = [];
    
    for (const id of ids) {
      try {
        const task = await this.updateTask(id, { status });
        updatedTasks.push(task);
      } catch (error) {
        if (!(error instanceof TaskNotFoundError)) {
          throw error;
        }
        // Skip non-existent tasks
      }
    }

    return updatedTasks;
  }

  // ============================================================================
  // Subtask Management
  // ============================================================================

  async addSubtask(taskId: number, subtaskInput: SubtaskCreateInput): Promise<Subtask> {
    const task = await this.getTask(taskId);
    const maxSubtaskId = Math.max(0, ...(task.subtasks?.map(s => s.id) || []));
    const now = new Date().toISOString();

    const newSubtask: Subtask = {
      ...subtaskInput,
      id: maxSubtaskId + 1,
      created: now,
      updated: now,
    };

    // Validate the subtask
    const validatedSubtask = ValidationSchemas.Subtask.parse(newSubtask);

    const updatedSubtasks = [...(task.subtasks || []), validatedSubtask];
    await this.updateTask(taskId, { subtasks: updatedSubtasks });

    return validatedSubtask;
  }

  async updateSubtask(taskId: number, subtaskId: number, updates: SubtaskUpdateInput): Promise<Subtask> {
    const task = await this.getTask(taskId);
    
    if (!task.subtasks) {
      throw new TaskNotFoundError(subtaskId);
    }

    const subtaskIndex = task.subtasks.findIndex(s => s.id === subtaskId);
    if (subtaskIndex === -1) {
      throw new TaskNotFoundError(subtaskId);
    }

    const existingSubtask = task.subtasks[subtaskIndex];
    const now = new Date().toISOString();

    const updatedSubtask: Subtask = {
      ...existingSubtask,
      ...updates,
      id: subtaskId,
      updated: now,
    };

    // Validate the updated subtask
    const validatedSubtask = ValidationSchemas.Subtask.parse(updatedSubtask);

    const updatedSubtasks = [...task.subtasks];
    updatedSubtasks[subtaskIndex] = validatedSubtask;

    await this.updateTask(taskId, { subtasks: updatedSubtasks });

    return validatedSubtask;
  }

  async removeSubtask(taskId: number, subtaskId: number): Promise<boolean> {
    const task = await this.getTask(taskId);
    
    if (!task.subtasks) {
      return false;
    }

    const subtaskIndex = task.subtasks.findIndex(s => s.id === subtaskId);
    if (subtaskIndex === -1) {
      return false;
    }

    const updatedSubtasks = task.subtasks.filter(s => s.id !== subtaskId);
    await this.updateTask(taskId, { subtasks: updatedSubtasks });

    return true;
  }

  async clearSubtasks(taskId: number): Promise<boolean> {
    await this.updateTask(taskId, { subtasks: [] });
    return true;
  }

  // ============================================================================
  // Dependency Management
  // ============================================================================

  async addDependency(taskId: number, dependsOn: number): Promise<Task> {
    const task = await this.getTask(taskId);
    
    // Check if dependency already exists
    if (task.dependencies.includes(dependsOn)) {
      return task;
    }

    // Check if the dependency task exists
    await this.getTask(dependsOn); // Will throw if not found

    const newDependencies = [...task.dependencies, dependsOn];

    // Check for cycles
    const wouldCreateCycle = this.wouldCreateCycle(taskId, newDependencies, []);
    if (wouldCreateCycle.length > 0) {
      throw new CircularDependencyError(wouldCreateCycle);
    }

    return this.updateTask(taskId, { dependencies: newDependencies });
  }

  async removeDependency(taskId: number, dependsOn: number): Promise<Task> {
    const task = await this.getTask(taskId);
    const newDependencies = task.dependencies.filter(id => id !== dependsOn);
    return this.updateTask(taskId, { dependencies: newDependencies });
  }

  async validateDependencies(): Promise<DependencyValidationResult> {
    const tasksData = await this.loadTasksData();
    const tasks = tasksData.tasks;
    const errors: DependencyValidationResult['errors'] = [];
    const warnings: DependencyValidationResult['warnings'] = [];
    const cycles: DependencyValidationResult['cycles'] = [];
    const orphanedDependencies: DependencyValidationResult['orphanedDependencies'] = [];

    const taskIds = new Set(tasks.map(t => t.id));

    for (const task of tasks) {
      // Check for missing dependencies
      for (const depId of task.dependencies) {
        if (!taskIds.has(depId)) {
          orphanedDependencies.push({
            taskId: task.id,
            missingDependencies: [depId],
          });
          errors.push({
            type: 'missing',
            taskId: task.id,
            dependencyId: depId,
            message: `Task ${task.id} depends on non-existent task ${depId}`,
            severity: 'error',
          });
        }
      }

      // Check for self-references
      if (task.dependencies.includes(task.id)) {
        errors.push({
          type: 'self-reference',
          taskId: task.id,
          dependencyId: task.id,
          message: `Task ${task.id} cannot depend on itself`,
          severity: 'error',
        });
      }

      // Check for deep dependency chains
      const chainDepth = this.calculateDependencyDepth(task.id, tasks);
      if (chainDepth > 5) {
        warnings.push({
          type: 'deep-chain',
          taskId: task.id,
          message: `Task ${task.id} has a deep dependency chain (depth: ${chainDepth})`,
          suggestion: 'Consider breaking down dependencies or restructuring tasks',
        });
      }
    }

    // Check for circular dependencies
    const visitedCycles = new Set<string>();
    for (const task of tasks) {
      const cycle = this.detectCycle(task.id, tasks, new Set(), []);
      if (cycle.length > 0) {
        const cycleKey = cycle.sort().join(',');
        if (!visitedCycles.has(cycleKey)) {
          visitedCycles.add(cycleKey);
          cycles.push({
            cycle,
            length: cycle.length,
            severity: 'blocking',
          });
          
          for (const taskId of cycle) {
            errors.push({
              type: 'circular',
              taskId,
              message: `Task ${taskId} is part of circular dependency: ${cycle.join(' → ')}`,
              severity: 'error',
            });
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      cycles,
      orphanedDependencies,
    };
  }

  async fixDependencies(): Promise<DependencyValidationResult> {
    const validation = await this.validateDependencies();
    
    if (validation.isValid) {
      return validation;
    }

    const tasksData = await this.loadTasksData();
    let hasChanges = false;

    // Fix orphaned dependencies
    for (const orphaned of validation.orphanedDependencies) {
      const task = tasksData.tasks.find(t => t.id === orphaned.taskId);
      if (task) {
        const cleanedDependencies = task.dependencies.filter(
          depId => !orphaned.missingDependencies.includes(depId)
        );
        if (cleanedDependencies.length !== task.dependencies.length) {
          task.dependencies = cleanedDependencies;
          task.updated = new Date().toISOString();
          hasChanges = true;
        }
      }
    }

    // Fix circular dependencies by removing the last dependency in each cycle
    for (const cycle of validation.cycles) {
      if (cycle.cycle.length > 1) {
        const lastTaskId = cycle.cycle[cycle.cycle.length - 1];
        const firstTaskId = cycle.cycle[0];
        const lastTask = tasksData.tasks.find(t => t.id === lastTaskId);
        
        if (lastTask && lastTask.dependencies.includes(firstTaskId)) {
          lastTask.dependencies = lastTask.dependencies.filter(id => id !== firstTaskId);
          lastTask.updated = new Date().toISOString();
          hasChanges = true;
        }
      }
    }

    if (hasChanges) {
      tasksData.metadata.updated = new Date().toISOString();
      await this.saveTasksData(tasksData);
      this.clearCache();
    }

    // Re-validate after fixes
    return this.validateDependencies();
  }

  // ============================================================================
  // AI-Powered Operations
  // ============================================================================

  async analyzeComplexity(taskId: number): Promise<ComplexityAnalysis> {
    const task = await this.getTask(taskId);
    const config = await this.configService.getConfig();
    
    const cacheKey = `complexity:${taskId}:${task.updated}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached as ComplexityAnalysis;
    }

    try {
      const analysisPrompt = this.buildComplexityAnalysisPrompt(task);
      
      const result = await this.bedrockClient.generateObject({
        model: config.models.main.modelId as ClaudeModelId,
        messages: [{ role: 'user', content: analysisPrompt }],
        system: 'You are an expert software engineering analyst. Analyze task complexity objectively and provide actionable insights.',
        schema: ValidationSchemas.ComplexityAnalysis,
        maxTokens: config.models.main.maxTokens,
        temperature: config.models.main.temperature,
      });

      const analysis: ComplexityAnalysis = {
        ...result.object,
        timestamp: new Date().toISOString(),
      };

      this.setCache(cacheKey, analysis);
      return analysis;

    } catch (error) {
      throw new AIServiceError(
        `Failed to analyze complexity for task ${taskId}`,
        config.models.main.modelId,
        error as Error
      );
    }
  }

  async expandTask(taskId: number, options: { maxSubtasks?: number; detailLevel?: string } = {}): Promise<Subtask[]> {
    const task = await this.getTask(taskId);
    const config = await this.configService.getConfig();
    const { maxSubtasks = 5, detailLevel = 'detailed' } = options;

    try {
      const expansionPrompt = this.buildTaskExpansionPrompt(task, maxSubtasks, detailLevel);
      
      const result = await this.bedrockClient.generateObject({
        model: config.models.main.modelId as ClaudeModelId,
        messages: [{ role: 'user', content: expansionPrompt }],
        system: 'You are an expert project manager. Break down tasks into clear, actionable subtasks.',
        schema: ValidationSchemas.AIGeneratedTask.pick({ subtasks: true }),
        maxTokens: config.models.main.maxTokens,
        temperature: config.models.main.temperature,
      });

      const generatedSubtasks = result.object.subtasks || [];
      const subtasks: Subtask[] = [];

      // Convert generated subtasks to proper Subtask objects
      for (let i = 0; i < generatedSubtasks.length; i++) {
        const genSubtask = generatedSubtasks[i];
        const subtask: Subtask = {
          id: i + 1,
          title: genSubtask.title,
          description: genSubtask.description,
          status: 'pending',
          priority: genSubtask.priority || 'medium',
          dependencies: [],
          details: genSubtask.details,
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
          estimatedHours: genSubtask.estimatedHours,
        };
        subtasks.push(subtask);
      }

      // Update the task with new subtasks
      await this.updateTask(taskId, { subtasks });

      return subtasks;

    } catch (error) {
      throw new AIServiceError(
        `Failed to expand task ${taskId}`,
        config.models.main.modelId,
        error as Error
      );
    }
  }

  async getNextTask(criteria: NextTaskCriteria = {}): Promise<NextTaskResult> {
    const validatedCriteria = ValidationSchemas.NextTaskCriteria.parse(criteria);
    const tasksData = await this.loadTasksData();
    
    // Filter available tasks
    const availableTasks = tasksData.tasks.filter(task => {
      // Exclude specific task IDs
      if (validatedCriteria.excludeTaskIds.includes(task.id)) return false;
      
      // Check status
      if (!validatedCriteria.includeInProgress && task.status === 'in-progress') return false;
      if (task.status === 'done' || task.status === 'cancelled') return false;
      
      // Check assignee
      if (validatedCriteria.assignee && task.assignee !== validatedCriteria.assignee) return false;
      
      // Check max complexity
      if (validatedCriteria.maxComplexity && task.complexity && task.complexity > validatedCriteria.maxComplexity) {
        return false;
      }
      
      // Check if all dependencies are completed
      const hasBlockingDependencies = task.dependencies.some(depId => {
        const depTask = tasksData.tasks.find(t => t.id === depId);
        return !depTask || depTask.status !== 'done';
      });
      
      return !hasBlockingDependencies;
    });

    // Score and rank tasks
    const recommendations = availableTasks.map(task => {
      const score = this.calculateTaskScore(task, validatedCriteria);
      const reasoning = this.generateTaskReasoning(task, validatedCriteria);
      const factors = this.calculateTaskFactors(task, validatedCriteria);

      return {
        task,
        score,
        reasoning,
        factors,
      };
    }).sort((a, b) => b.score - a.score);

    // Find blocked tasks
    const blockedTasks = tasksData.tasks
      .filter(task => {
        if (task.status === 'done' || task.status === 'cancelled') return false;
        return task.dependencies.some(depId => {
          const depTask = tasksData.tasks.find(t => t.id === depId);
          return !depTask || depTask.status !== 'done';
        });
      })
      .map(task => {
        const blockingDependencies = task.dependencies.filter(depId => {
          const depTask = tasksData.tasks.find(t => t.id === depId);
          return !depTask || depTask.status !== 'done';
        });
        
        return {
          task,
          blockingDependencies,
          reason: `Waiting for completion of tasks: ${blockingDependencies.join(', ')}`,
        };
      });

    const result: NextTaskResult = {
      recommendation: recommendations[0],
      alternatives: recommendations.slice(1, 6),
      blockedTasks,
      analysis: {
        totalTasks: tasksData.tasks.length,
        availableTasks: availableTasks.length,
        blockedTasks: blockedTasks.length,
        recommendations: this.generateProjectRecommendations(tasksData.tasks, availableTasks, blockedTasks),
      },
    };

    return ValidationSchemas.NextTaskResult.parse(result);
  }

  async generateTasksFromPRD(prdContent: string): Promise<PRDAnalysis> {
    const config = await this.configService.getConfig();

    try {
      const prdPrompt = this.buildPRDAnalysisPrompt(prdContent);
      
      const result = await this.bedrockClient.generateObject({
        model: config.models.research?.modelId as ClaudeModelId || config.models.main.modelId as ClaudeModelId,
        messages: [{ role: 'user', content: prdPrompt }],
        system: 'You are an expert product manager and technical analyst. Extract clear, actionable tasks from product requirements.',
        schema: ValidationSchemas.PRDAnalysis,
        maxTokens: 8000,
        temperature: 0.1,
      });

      return result.object;

    } catch (error) {
      throw new AIServiceError(
        'Failed to generate tasks from PRD',
        config.models.research?.modelId || config.models.main.modelId,
        error as Error
      );
    }
  }

  // ============================================================================
  // Bulk Operations
  // ============================================================================

  async moveTask(taskId: number, newPosition: number): Promise<Task[]> {
    const tasksData = await this.loadTasksData();
    const taskIndex = tasksData.tasks.findIndex(t => t.id === taskId);
    
    if (taskIndex === -1) {
      throw new TaskNotFoundError(taskId);
    }

    // Remove task from current position
    const [task] = tasksData.tasks.splice(taskIndex, 1);
    
    // Insert at new position
    const insertIndex = Math.max(0, Math.min(newPosition, tasksData.tasks.length));
    tasksData.tasks.splice(insertIndex, 0, task);

    // Update metadata
    tasksData.metadata.updated = new Date().toISOString();

    await this.saveTasksData(tasksData);
    this.clearCache();

    return tasksData.tasks;
  }

  async duplicateTask(taskId: number): Promise<Task> {
    const originalTask = await this.getTask(taskId);
    
    const duplicateInput: TaskCreateInput = {
      title: `${originalTask.title} (Copy)`,
      description: originalTask.description,
      status: 'pending',
      priority: originalTask.priority,
      dependencies: [], // Don't copy dependencies
      details: originalTask.details,
      testStrategy: originalTask.testStrategy,
      estimatedHours: originalTask.estimatedHours,
      complexity: originalTask.complexity,
      tags: [...(originalTask.tags || [])],
      assignee: originalTask.assignee,
      dueDate: originalTask.dueDate,
      subtasks: originalTask.subtasks?.map((subtask, index) => ({
        ...subtask,
        id: index + 1,
        status: 'pending',
        dependencies: [],
        created: undefined,
        updated: undefined,
      })),
    };

    return this.createTask(duplicateInput);
  }

  async archiveTasks(filter: TaskFilter): Promise<number> {
    const { tasks } = await this.getTasks({ filter });
    let archivedCount = 0;

    for (const task of tasks) {
      if (task.status === 'done' || task.status === 'cancelled') {
        await this.deleteTask(task.id);
        archivedCount++;
      }
    }

    return archivedCount;
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private async loadTasksData(): Promise<TasksData> {
    const cacheKey = 'tasks-data';
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached as TasksData;
    }

    try {
      await fs.access(this.tasksFilePath);
      const content = await fs.readFile(this.tasksFilePath, 'utf8');
      const data = JSON.parse(content);
      const validatedData = ValidationSchemas.TasksData.parse(data);
      
      this.setCache(cacheKey, validatedData);
      return validatedData;
    } catch (error) {
      // File doesn't exist or is invalid, return default structure
      const defaultData: TasksData = {
        tasks: [],
        metadata: {
          version: '1.0.0',
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
          totalTasks: 0,
        },
      };
      
      await this.saveTasksData(defaultData);
      return defaultData;
    }
  }

  private async saveTasksData(data: TasksData): Promise<void> {
    // Validate before saving
    const validatedData = ValidationSchemas.TasksData.parse(data);
    
    // Ensure directory exists
    const dir = path.dirname(this.tasksFilePath);
    await fs.mkdir(dir, { recursive: true });
    
    // Save to file
    await fs.writeFile(this.tasksFilePath, JSON.stringify(validatedData, null, 2), 'utf8');
    
    // Update cache
    this.setCache('tasks-data', validatedData);
  }

  private applyFilters(tasks: Task[], filter: TaskFilter): Task[] {
    return tasks.filter(task => {
      // Status filter
      if (filter.status) {
        const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
        if (!statuses.includes(task.status)) return false;
      }

      // Priority filter
      if (filter.priority) {
        const priorities = Array.isArray(filter.priority) ? filter.priority : [filter.priority];
        if (!priorities.includes(task.priority)) return false;
      }

      // Assignee filter
      if (filter.assignee && task.assignee !== filter.assignee) return false;

      // Tags filter
      if (filter.tags && filter.tags.length > 0) {
        const taskTags = task.tags || [];
        const hasMatchingTag = filter.tags.some(tag => taskTags.includes(tag));
        if (!hasMatchingTag) return false;
      }

      // Subtasks filter
      if (filter.hasSubtasks !== undefined) {
        const hasSubtasks = Boolean(task.subtasks && task.subtasks.length > 0);
        if (filter.hasSubtasks !== hasSubtasks) return false;
      }

      // Dependencies filter
      if (filter.hasDependencies !== undefined) {
        const hasDependencies = task.dependencies.length > 0;
        if (filter.hasDependencies !== hasDependencies) return false;
      }

      // Depends on filter
      if (filter.dependsOn && !task.dependencies.includes(filter.dependsOn)) return false;

      // Date filters
      if (filter.dueBefore && task.dueDate) {
        const dueDate = new Date(task.dueDate);
        if (dueDate >= filter.dueBefore) return false;
      }

      if (filter.dueAfter && task.dueDate) {
        const dueDate = new Date(task.dueDate);
        if (dueDate <= filter.dueAfter) return false;
      }

      if (filter.createdBefore && task.created) {
        const createdDate = new Date(task.created);
        if (createdDate >= filter.createdBefore) return false;
      }

      if (filter.createdAfter && task.created) {
        const createdDate = new Date(task.created);
        if (createdDate <= filter.createdAfter) return false;
      }

      // Search filter
      if (filter.search) {
        const searchTerm = filter.search.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(searchTerm);
        const matchesDescription = task.description.toLowerCase().includes(searchTerm);
        const matchesDetails = task.details?.toLowerCase().includes(searchTerm) || false;
        if (!matchesTitle && !matchesDescription && !matchesDetails) return false;
      }

      return true;
    });
  }

  private applySorting(tasks: Task[], sort: { field: string; order: 'asc' | 'desc' }): Task[] {
    return [...tasks].sort((a, b) => {
      let aValue: unknown;
      let bValue: unknown;

      switch (sort.field) {
        case 'id':
          aValue = a.id;
          bValue = b.id;
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'priority':
          const priorityOrder = { low: 0, medium: 1, high: 2 };
          aValue = priorityOrder[a.priority];
          bValue = priorityOrder[b.priority];
          break;
        case 'created':
          aValue = a.created ? new Date(a.created).getTime() : 0;
          bValue = b.created ? new Date(b.created).getTime() : 0;
          break;
        case 'updated':
          aValue = a.updated ? new Date(a.updated).getTime() : 0;
          bValue = b.updated ? new Date(b.updated).getTime() : 0;
          break;
        case 'dueDate':
          aValue = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
          bValue = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
          break;
        case 'complexity':
          aValue = a.complexity || 0;
          bValue = b.complexity || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sort.order === 'asc' ? -1 : 1;
      if (aValue > bValue) return sort.order === 'asc' ? 1 : -1;
      return 0;
    });
  }

  private wouldCreateCycle(taskId: number, dependencies: number[], existingTasks: Task[]): number[] {
    return this.detectCycle(taskId, existingTasks, new Set(), [], dependencies);
  }

  private detectCycle(
    currentId: number,
    tasks: Task[],
    visited: Set<number>,
    path: number[],
    overrideDependencies?: number[]
  ): number[] {
    if (visited.has(currentId)) {
      const cycleStart = path.indexOf(currentId);
      return cycleStart >= 0 ? path.slice(cycleStart).concat(currentId) : [];
    }

    visited.add(currentId);
    path.push(currentId);

    const currentTask = tasks.find(t => t.id === currentId);
    const dependencies = overrideDependencies || currentTask?.dependencies || [];

    for (const depId of dependencies) {
      const cycle = this.detectCycle(depId, tasks, new Set(visited), [...path]);
      if (cycle.length > 0) {
        return cycle;
      }
    }

    return [];
  }

  private calculateDependencyDepth(taskId: number, tasks: Task[], visited = new Set<number>()): number {
    if (visited.has(taskId)) return 0; // Circular reference, stop

    visited.add(taskId);
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.dependencies.length === 0) return 1;

    const maxDepth = Math.max(
      ...task.dependencies.map(depId => this.calculateDependencyDepth(depId, tasks, new Set(visited)))
    );

    return maxDepth + 1;
  }

  private calculateTaskScore(task: Task, criteria: NextTaskCriteria): number {
    let score = 0;

    // Priority scoring
    const priorityScores = { low: 0.3, medium: 0.6, high: 1.0 };
    score += priorityScores[task.priority] * criteria.priorityWeight;

    // Dependency scoring (fewer dependencies = higher score)
    const dependencyScore = Math.max(0, 1 - (task.dependencies.length * 0.1));
    score += dependencyScore * criteria.dependencyWeight;

    // Complexity scoring (if enabled)
    if (criteria.complexityWeight > 0 && task.complexity) {
      const complexityScore = Math.max(0, 1 - (task.complexity - 1) / 9); // Normalize 1-10 to 1-0
      score += complexityScore * criteria.complexityWeight;
    }

    // Due date scoring (if enabled)
    if (criteria.dueDateWeight > 0 && task.dueDate) {
      const daysUntilDue = (new Date(task.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      const dueDateScore = daysUntilDue <= 0 ? 1 : Math.max(0, 1 - daysUntilDue / 30); // Urgent tasks score higher
      score += dueDateScore * criteria.dueDateWeight;
    }

    // Preferred tags bonus
    if (criteria.preferredTags.length > 0 && task.tags) {
      const hasPreferredTag = criteria.preferredTags.some(tag => task.tags!.includes(tag));
      if (hasPreferredTag) score += 0.1;
    }

    return Math.min(1, score); // Cap at 1.0
  }

  private generateTaskReasoning(task: Task, criteria: NextTaskCriteria): string[] {
    const reasoning: string[] = [];

    if (task.priority === 'high') reasoning.push('High priority task');
    if (task.dependencies.length === 0) reasoning.push('No blocking dependencies');
    if (task.complexity && task.complexity <= 3) reasoning.push('Low complexity, quick to complete');
    if (task.dueDate) {
      const daysUntilDue = (new Date(task.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      if (daysUntilDue <= 7) reasoning.push('Due within a week');
    }

    return reasoning;
  }

  private calculateTaskFactors(task: Task, criteria: NextTaskCriteria) {
    const priorityScores = { low: 0.3, medium: 0.6, high: 1.0 };
    
    return {
      priority: priorityScores[task.priority] * criteria.priorityWeight,
      dependencies: Math.max(0, 1 - (task.dependencies.length * 0.1)) * criteria.dependencyWeight,
      complexity: task.complexity ? Math.max(0, 1 - (task.complexity - 1) / 9) * criteria.complexityWeight : 0,
      dueDate: task.dueDate 
        ? Math.max(0, 1 - (new Date(task.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)) * criteria.dueDateWeight
        : 0,
    };
  }

  private generateProjectRecommendations(allTasks: Task[], availableTasks: Task[], blockedTasks: any[]): string[] {
    const recommendations: string[] = [];

    if (availableTasks.length === 0) {
      recommendations.push('No tasks are currently available to work on');
    }

    if (blockedTasks.length > allTasks.length * 0.3) {
      recommendations.push('Consider reviewing and completing blocking tasks to unblock the project');
    }

    const highPriorityBlocked = blockedTasks.filter(bt => bt.task.priority === 'high').length;
    if (highPriorityBlocked > 0) {
      recommendations.push(`${highPriorityBlocked} high-priority tasks are blocked - prioritize their dependencies`);
    }

    return recommendations;
  }

  private buildComplexityAnalysisPrompt(task: Task): string {
    return `Analyze the complexity of this software development task:

Title: ${task.title}
Description: ${task.description}
${task.details ? `Details: ${task.details}` : ''}
${task.subtasks?.length ? `Subtasks: ${task.subtasks.length} defined` : 'No subtasks defined'}

Provide a comprehensive complexity analysis including:
- Complexity score (1-10, where 1 is trivial and 10 is extremely complex)
- Key factors contributing to complexity
- Detailed reasoning for the score
- Estimated hours for completion
- Risk level assessment
- Specific recommendations for implementation
- Confidence level in the analysis

Consider factors like:
- Technical difficulty and skill requirements
- Integration complexity with existing systems
- Testing requirements and edge cases
- Documentation and maintenance needs
- Potential for unexpected issues or scope creep
- Dependencies on external systems or teams`;
  }

  private buildTaskExpansionPrompt(task: Task, maxSubtasks: number, detailLevel: string): string {
    return `Based on the following task, expand it into approximately ${maxSubtasks} subtasks. The detail level should be ${detailLevel}.
Task: ${JSON.stringify(task, null, 2)}
Respond with a JSON array of subtask objects, each with a 'title' and 'description'.`;
  }

  private buildTaskCreationPrompt(): string {
    return `You are an expert task creation assistant. Based on the user's prompt, generate a JSON object representing a single task.
The JSON object should have the following properties:
- title: string (required)
- description: string (required)
- priority: 'low' | 'medium' | 'high' (optional, defaults to 'medium')
- tags: string[] (optional)
- estimatedHours: number (optional)
- complexity: number (1-10, optional)

Example prompt: "Create a login page"
Example response:
{
  "title": "Create User Login Page",
  "description": "Develop a front-end login page with fields for username and password, and a submit button. It should also include a link for password reset.",
  "priority": "high",
  "tags": ["frontend", "auth"],
  "estimatedHours": 8,
  "complexity": 5
}`;
  }

  private buildPRDAnalysisPrompt(prdContent: string): string {
    return `Analyze the following Product Requirements Document (PRD) and generate a project summary and a list of tasks.
PRD Content:
---
${prdContent}
---
Respond with a JSON object with 'projectName', 'overview', 'estimatedComplexity', 'estimatedDuration', and a 'tasks' array. Each task object should have 'title', 'description', 'priority', 'complexity', and 'estimatedHours'.`;
  }

  private getFromCache(key: string): unknown | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setCache(key: string, data: unknown): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  private clearCache(): void {
    this.cache.clear();
  }
}

export default TaskService;