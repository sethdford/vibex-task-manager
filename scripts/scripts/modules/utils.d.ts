/**
 * utils.ts
 * Utility functions for the Task Manager CLI
 */
interface TaskAnalysis {
    taskId: number;
    complexityScore: number;
    [key: string]: any;
}
interface ComplexityReport {
    complexityAnalysis: TaskAnalysis[];
    [key: string]: any;
}
interface Task {
    id: number;
    title: string;
    status: string;
    subtasks?: Subtask[];
    parentId?: number;
    complexityScore?: number;
    isSubtask?: boolean;
    parentTask?: {
        id: number;
        title: string;
        status: string;
    };
    [key: string]: any;
}
interface Subtask {
    id: number;
    title: string;
    status: string;
    parentTask?: {
        id: number;
        title: string;
        status: string;
    };
    isSubtask?: boolean;
    complexityScore?: number;
    [key: string]: any;
}
interface TelemetryData {
    timestamp: string;
    userId: string;
    commandName: string;
    modelUsed: string;
    providerName: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens?: number;
    totalCost: number;
    currency: string;
}
interface SessionEnv {
    env?: Record<string, string>;
}
type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'success';
/**
 * Resolves an environment variable's value.
 * Precedence:
 * 1. session.env (if session provided)
 * 2. process.env
 * 3. .env file at projectRoot (if projectRoot provided)
 * @param key - The environment variable key.
 * @param session - The MCP session object.
 * @param projectRoot - The project root directory (for .env fallback).
 * @returns The value of the environment variable or undefined if not found.
 */
declare function resolveEnvVariable(key: string, session?: SessionEnv | null, projectRoot?: string | null): string | undefined;
/**
 * Recursively searches upwards for project root starting from a given directory.
 * @param startDir - The directory to start searching from.
 * @param markers - Marker files/dirs to look for.
 * @returns The path to the project root, or null if not found.
 */
declare function findProjectRoot(startDir?: string, markers?: string[]): string | null;
declare const LOG_LEVELS: {
    debug: number;
    info: number;
    warn: number;
    error: number;
    success: number;
};
/**
 * Returns the task manager module
 * @returns The task manager module object
 */
declare function getTaskManager(): Promise<any>;
/**
 * Enable silent logging mode
 */
declare function enableSilentMode(): void;
/**
 * Disable silent logging mode
 */
declare function disableSilentMode(): void;
/**
 * Check if silent mode is enabled
 * @returns {boolean} True if silent mode is enabled
 */
declare function isSilentMode(): boolean;
/**
 * Logs a message at the specified level
 * @param level - The log level (debug, info, warn, error)
 * @param args - Arguments to log
 */
declare function log(level: LogLevel, ...args: any[]): void;
/**
 * Reads and parses a JSON file
 * @param filepath - Path to the JSON file
 * @returns Parsed JSON data or null if error occurs
 */
declare function readJSON(filepath: string): any | null;
/**
 * Writes data to a JSON file
 * @param filepath - Path to the JSON file
 * @param data - Data to write
 */
declare function writeJSON(filepath: string, data: any): void;
/**
 * Sanitizes a prompt string for use in a shell command
 * @param prompt The prompt to sanitize
 * @returns Sanitized prompt
 */
declare function sanitizePrompt(prompt: string): string;
/**
 * Reads the complexity report from file
 * @param customPath - Optional custom path to the report
 * @returns The parsed complexity report or null if not found
 */
declare function readComplexityReport(customPath?: string | null): ComplexityReport | null;
/**
 * Finds a task analysis in the complexity report
 * @param report - The complexity report
 * @param taskId - The task ID to find
 * @returns The task analysis or null if not found
 */
declare function findTaskInComplexityReport(report: ComplexityReport, taskId: number): TaskAnalysis | null;
declare function addComplexityToTask(task: Task | Subtask, complexityReport: ComplexityReport): void;
/**
 * Formats a task ID as a string
 * @param id - The task ID to format
 * @returns The formatted task ID
 */
declare function formatTaskId(id: string | number): string;
/**
 * Finds a task by ID in the tasks array. Optionally filters subtasks by status.
 * @param tasks - The tasks array
 * @param taskId - The task ID to find
 * @param complexityReport - Optional pre-loaded complexity report
 * @param statusFilter - Optional status to filter subtasks by
 * @returns The task object (potentially with filtered subtasks) and the original subtask count if filtered, or nulls if not found.
 */
declare function findTaskById(tasks: Task[], taskId: string | number, complexityReport?: ComplexityReport | null, statusFilter?: string | null): {
    task: Task | Subtask | null;
    originalSubtaskCount: number | null;
};
/**
 * Truncates text to a specified length
 * @param text - The text to truncate
 * @param maxLength - The maximum length
 * @returns The truncated text
 */
declare function truncate(text: string, maxLength: number): string;
/**
 * Find cycles in a dependency graph using DFS
 * @param subtaskId - Current subtask ID
 * @param dependencyMap - Map of subtask IDs to their dependencies
 * @param visited - Set of visited nodes
 * @param recursionStack - Set of nodes in current recursion stack
 * @param path - Current path in the DFS
 * @returns List of dependency edges that need to be removed to break cycles
 */
declare function findCycles(subtaskId: string, dependencyMap: Map<string, string[]>, visited?: Set<string>, recursionStack?: Set<string>, path?: string[]): string[];
/**
 * Convert a string from camelCase to kebab-case
 * @param str - The string to convert
 * @returns The kebab-case version of the string
 */
declare const toKebabCase: (str: string) => string;
/**
 * Detect camelCase flags in command arguments
 * @param args - Command line arguments to check
 * @returns List of flags that should be converted
 */
declare function detectCamelCaseFlags(args: string[]): Array<{
    original: string;
    kebabCase: string;
}>;
/**
 * Aggregates an array of telemetry objects into a single summary object.
 * @param telemetryArray - Array of telemetryData objects.
 * @param overallCommandName - The name for the aggregated command.
 * @returns Aggregated telemetry object or null if input is empty.
 */
declare function aggregateTelemetry(telemetryArray: TelemetryData[], overallCommandName: string): TelemetryData | null;
export { LOG_LEVELS, log, readJSON, writeJSON, sanitizePrompt, readComplexityReport, findTaskInComplexityReport, formatTaskId, findTaskById, truncate, findCycles, toKebabCase, detectCamelCaseFlags, disableSilentMode, enableSilentMode, getTaskManager, isSilentMode, addComplexityToTask, resolveEnvVariable, findProjectRoot, aggregateTelemetry };
//# sourceMappingURL=utils.d.ts.map