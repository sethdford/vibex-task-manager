interface UpdateTasksContext {
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
 * Update tasks based on new context using the unified AI service.
 * @param {string} tasksPath - Path to the tasks.json file
 * @param {number} fromId - Task ID to start updating from
 * @param {string} prompt - Prompt with new context
 * @param {boolean} [useResearch=false] - Whether to use the research AI role.
 * @param {Object} context - Context object containing session and mcpLog.
 * @param {Object} [context.session] - Session object from MCP server.
 * @param {Object} [context.mcpLog] - MCP logger object.
 * @param {string} [outputFormat='text'] - Output format ('text' or 'json').
 */
declare function updateTasks(tasksPath: any, fromId: any, prompt: any, useResearch?: boolean, context?: UpdateTasksContext, outputFormat?: string): Promise<{
    success: boolean;
    updatedTasks: {
        status?: string;
        id?: number;
        dependencies?: (string | number)[];
        details?: string;
        title?: string;
        description?: string;
        priority?: string;
        testStrategy?: string;
        subtasks?: any[];
    }[];
    telemetryData: any;
}>;
export default updateTasks;
//# sourceMappingURL=update-tasks.d.ts.map