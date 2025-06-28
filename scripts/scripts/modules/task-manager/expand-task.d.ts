interface Subtask {
    id: number;
    title: string;
    description: string;
    dependencies: number[];
    details: string;
    status: string;
    testStrategy?: string;
}
interface ExpandTaskContext {
    session?: {
        env?: Record<string, string>;
    };
    mcpLog?: {
        error: (...args: any[]) => void;
        info: (...args: any[]) => void;
        warn: (...args: any[]) => void;
        debug: (...args: any[]) => void;
    };
    projectRoot?: string;
}
/**
 * Expand a task into subtasks using the unified AI service (generateTextService).
 * Appends new subtasks by default. Replaces existing subtasks if force=true.
 * Integrates complexity report to determine subtask count and prompt if available,
 * unless numSubtasks is explicitly provided.
 * @param {string} tasksPath - Path to the tasks.json file
 * @param {number} taskId - Task ID to expand
 * @param {number | null | undefined} [numSubtasks] - Optional: Explicit target number of subtasks. If null/undefined, check complexity report or config default.
 * @param {boolean} [useResearch=false] - Whether to use the research AI role.
 * @param {string} [additionalContext=''] - Optional additional context.
 * @param {Object} context - Context object containing session and mcpLog.
 * @param {Object} [context.session] - Session object from MCP.
 * @param {Object} [context.mcpLog] - MCP logger object.
 * @param {boolean} [force=false] - If true, replace existing subtasks; otherwise, append.
 * @returns {Promise<Object>} The updated parent task object with new subtasks.
 * @throws {Error} If task not found, AI service fails, or parsing fails.
 */
declare function expandTask(tasksPath: string, taskId: string, numSubtasks?: number, useResearch?: boolean, additionalContext?: string, context?: ExpandTaskContext, force?: boolean): Promise<{
    success: boolean;
    message: string;
    telemetryData: any;
    subtasks?: undefined;
} | {
    success: boolean;
    message: string;
    subtasks: Subtask[];
    telemetryData: any;
}>;
export default expandTask;
//# sourceMappingURL=expand-task.d.ts.map