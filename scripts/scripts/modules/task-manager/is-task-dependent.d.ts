/**
 * Check if a task is dependent on another task (directly or indirectly)
 * Used to prevent circular dependencies
 * @param {Array} allTasks - Array of all tasks
 * @param {Object} task - The task to check
 * @param {number} targetTaskId - The task ID to check dependency against
 * @returns {boolean} Whether the task depends on the target task
 */
declare function isTaskDependentOn(allTasks: any, task: any, targetTaskId: any): boolean;
export default isTaskDependentOn;
//# sourceMappingURL=is-task-dependent.d.ts.map