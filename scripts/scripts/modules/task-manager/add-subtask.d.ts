import { Subtask } from './types.js';
/**
 * Add a subtask to a parent task
 * @param {string} tasksPath - Path to the tasks.json file
 * @param {number|string} parentId - ID of the parent task
 * @param {number|string|null} existingTaskId - ID of an existing task to convert to subtask (optional)
 * @param {Object} newSubtaskData - Data for creating a new subtask (used if existingTaskId is null)
 * @param {boolean} generateFiles - Whether to regenerate task files after adding the subtask
 * @returns {Object} The newly created or converted subtask
 */
declare function addSubtask(tasksPath: any, parentId: any, existingTaskId?: any, newSubtaskData?: Partial<Subtask>, generateFiles?: boolean): Promise<any>;
export default addSubtask;
//# sourceMappingURL=add-subtask.d.ts.map