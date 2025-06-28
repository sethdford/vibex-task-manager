/**
 * Update the status of a single task
 * @param {string} tasksPath - Path to the tasks.json file
 * @param {string} taskIdInput - Task ID to update
 * @param {string} newStatus - New status
 * @param {Object} data - Tasks data
 * @param {boolean} showUi - Whether to show UI elements
 */
declare function updateSingleTaskStatus(tasksPath: any, taskIdInput: any, newStatus: any, data: any, showUi?: boolean): Promise<void>;
export default updateSingleTaskStatus;
//# sourceMappingURL=update-single-task-status.d.ts.map