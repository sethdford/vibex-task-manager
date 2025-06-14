// Common types for Vibex Task Manager

// Logger type for MCP server compatibility
export interface Logger {
  info: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  error: (message: string, ...args: any[]) => void;
  debug: (message: string, ...args: any[]) => void;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  dependencies: number[];
  priority: Priority;
  details?: string;
  testStrategy?: string;
  subtasks?: Subtask[];
}

export interface Subtask {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  dependencies: number[];
  priority?: Priority;
  details?: string;
  testStrategy?: string;
}

export type TaskStatus = 'pending' | 'in-progress' | 'done' | 'review' | 'deferred' | 'cancelled';
export type Priority = 'low' | 'medium' | 'high';

export interface TasksData {
  tasks: Task[];
}

export interface Config {
  models: {
    main: ModelConfig;
    research: ModelConfig;
    fallback: ModelConfig;
  };
  global: GlobalConfig;
}

export interface ModelConfig {
  provider: string;
  modelId: string;
  maxTokens: number;
  temperature: number;
}

export interface GlobalConfig {
  logLevel: string;
  debug: boolean;
  defaultSubtasks: number;
  defaultNumTasks?: number;
  defaultPriority: Priority;
  projectName?: string;
  bedrockBaseURL?: string;
  userId?: string;
}

export interface ComplexityReport {
  meta: {
    generatedAt: string;
    tasksAnalyzed: number;
    thresholdScore: number;
    projectName: string;
    usedResearch: boolean;
  };
  complexityAnalysis: TaskComplexityAnalysis[];
}

export interface TaskComplexityAnalysis {
  taskId: number;
  taskTitle: string;
  complexityScore: number;
  recommendedSubtasks: number;
  expansionPrompt?: string;
  reasoning: string;
}

export interface TaskComplexity {
  id: number;
  title: string;
  complexity: 'high' | 'medium' | 'low';
  score: number;
  factors: string[];
  recommendedSubtasks: number;
  expansionCommand: string;
}

export interface ApiKeyStatusReport {
  provider: string;
  cli: boolean;
  mcp: boolean;
}

export interface ActiveModel {
  provider: string;
  modelId: string;
  sweScore?: number | null;
  cost?: {
    input: number | null;
    output: number | null;
  } | null;
}

export interface ConfigData {
  activeModels: {
    main: ActiveModel;
    research: ActiveModel;
    fallback?: ActiveModel;
  };
}

export interface AvailableModel {
  provider: string;
  modelId: string;
  sweScore?: number | null;
  cost?: {
    input: number | null;
    output: number | null;
  } | null;
}

export interface TelemetryData {
  modelUsed: string;
  providerName: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  totalCost: number;
  commandName: string;
}

export interface FindNextTaskResult {
  id: number | string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  dependencies: Array<number | string>;
  parentId?: number;
  description?: string;
  details?: string;
  subtasks?: Array<any>;
  complexityScore?: number;
}

// AI Provider Types
export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GenerateTextParams {
  modelId: string;
  messages: Message[];
  maxTokens?: number;
  temperature?: number;
  apiKey?: string;
  baseURL?: string;
  region?: string;
  profile?: string;
}

export interface StreamTextParams extends GenerateTextParams {
  // Stream text has same params as generate text
}

export interface GenerateObjectParams extends GenerateTextParams {
  schema: any; // Zod schema
  objectName?: string;
}

export interface AIResult {
  text: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
}

export interface StreamResult {
  // Stream result type - will be defined by AI SDK
  [key: string]: any;
}

export interface ObjectResult {
  object: any;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
}

// Re-export everything from core types for compatibility
export * from './core.js';