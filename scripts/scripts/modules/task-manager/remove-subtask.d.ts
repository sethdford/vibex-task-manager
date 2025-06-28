/**
 * Remove a subtask from its parent task
 * @param {string} tasksPath - Path to the tasks.json file
 * @param {string} subtaskId - ID of the subtask to remove in format "parentId.subtaskId"
 * @param {boolean} convertToTask - Whether to convert the subtask to a standalone task
 * @param {boolean} generateFiles - Whether to regenerate task files after removing the subtask
 * @returns {Object|null} The removed subtask if convertToTask is true, otherwise null
 */
declare function removeSubtask(tasksPath: any, subtaskId: any, convertToTask?: boolean, generateFiles?: boolean): Promise<any>;
export default removeSubtask;
//# sourceMappingURL=remove-subtask.d.ts.map