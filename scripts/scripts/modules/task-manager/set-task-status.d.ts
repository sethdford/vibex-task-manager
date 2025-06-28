interface SetTaskStatusOptions {
    mcpLog?: any;
    session?: any;
}
/**
 * Set the status of a task
 * @param {string} tasksPath - Path to the tasks.json file
 * @param {string} taskIdInput - Task ID(s) to update
 * @param {string} newStatus - New status
 * @param {SetTaskStatusOptions} options - Additional options (mcpLog for MCP mode)
 * @returns {Object|undefined} Result object in MCP mode, undefined in CLI mode
 */
declare function setTaskStatus(tasksPath: string, taskIdInput: string, newStatus: string, options?: SetTaskStatusOptions): Promise<{
    success: boolean;
    updatedTasks: {
        id: string;
        status: import("../../../src/constants/task-status.js").TaskStatus;
    }[];
}>;
export default setTaskStatus;
//# sourceMappingURL=set-task-status.d.ts.map