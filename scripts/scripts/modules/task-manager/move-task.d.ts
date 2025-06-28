/**
 * Move a task or subtask to a new position
 * @param {string} tasksPath - Path to tasks.json file
 * @param {string} sourceId - ID of the task/subtask to move (e.g., '5' or '5.2')
 * @param {string} destinationId - ID of the destination (e.g., '7' or '7.3')
 * @param {boolean} generateFiles - Whether to regenerate task files after moving
 * @returns {Object} Result object with moved task details
 */
declare function moveTask(tasksPath: any, sourceId: any, destinationId: any, generateFiles?: boolean): Promise<any>;
export default moveTask;
//# sourceMappingURL=move-task.d.ts.map