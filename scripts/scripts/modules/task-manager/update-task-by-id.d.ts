interface UpdateTaskContext {
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
 * Update a single task by ID using the unified AI service.
 * @param {string} tasksPath - Path to the tasks.json file
 * @param {number} taskId - Task ID to update
 * @param {string} prompt - Prompt with new context
 * @param {boolean} [useResearch=false] - Whether to use the research AI role.
 * @param {Object} context - Context object containing session and mcpLog.
 * @param {Object} [context.session] - Session object from MCP server.
 * @param {Object} [context.mcpLog] - MCP logger object.
 * @param {string} [outputFormat='text'] - Output format ('text' or 'json').
 * @returns {Promise<Object|null>} - Updated task data or null if task wasn't updated/found.
 */
declare function updateTaskById(tasksPath: any, taskId: any, prompt: any, useResearch?: boolean, context?: UpdateTaskContext, outputFormat?: string): Promise<{
    updatedTask: {
        status?: string;
        id?: number;
        dependencies?: (string | number)[];
        details?: string;
        title?: string;
        description?: string;
        priority?: string;
        testStrategy?: string;
        subtasks?: any[];
    };
    telemetryData: any;
}>;
export default updateTaskById;
//# sourceMappingURL=update-task-by-id.d.ts.map