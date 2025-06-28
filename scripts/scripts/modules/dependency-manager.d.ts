/**
 * dependency-manager.js
 * Manages task dependencies and relationships
 */
type Task = {
    id: number;
    title: string;
    description: string;
    status: string;
    dependencies: (string | number)[];
    subtasks?: Subtask[];
};
type Subtask = {
    id: number;
    title: string;
    description: string;
    status: string;
    dependencies: (string | number)[];
};
type DependencyIssue = {
    type: 'self' | 'missing' | 'circular';
    taskId: string | number;
    dependencyId?: string | number;
    message: string;
};
/**
 * Add a dependency to a task
 * @param {string} tasksPath - Path to the tasks.json file
 * @param {number|string} taskId - ID of the task to add dependency to
 * @param {number|string} dependencyId - ID of the task to add as dependency
 */
declare function addDependency(tasksPath: string, taskId: number | string, dependencyId: number | string): Promise<void>;
/**
 * Remove a dependency from a task
 * @param {string} tasksPath - Path to the tasks.json file
 * @param {number|string} taskId - ID of the task to remove dependency from
 * @param {number|string} dependencyId - ID of the task to remove as dependency
 */
declare function removeDependency(tasksPath: string, taskId: number | string, dependencyId: number | string): Promise<void>;
/**
 * Check for circular dependencies
 * @param {Array} tasks - All tasks
 * @param {number|string} taskId - The ID of the task to check
 * @param {Array} chain - The dependency chain being checked
 * @returns {boolean} - True if circular, false otherwise
 */
declare function isCircularDependency(tasks: Task[], taskId: string | number, chain?: (string | number)[]): boolean;
/**
 * Validate all task dependencies.
 * @param {Array} tasks - The list of all tasks
 * @returns {Array} - A list of dependency issues found.
 */
declare function validateTaskDependencies(tasks: Task[]): {
    issues: DependencyIssue[];
    valid: boolean;
};
/**
 * Removes duplicate dependencies from all tasks and subtasks.
 * @param {object} tasksData - The object containing all tasks
 * @returns {object} - The modified tasks data
 */
declare function removeDuplicateDependencies(tasksData: any): any;
/**
 * Removes dependencies on subtasks from parent tasks if both exist.
 * This helps avoid redundant dependencies.
 * @param {object} tasksData - The object containing all tasks
 * @returns {object} - The modified tasks data
 */
declare function cleanupSubtaskDependencies(tasksData: any): any;
/**
 * Validate and report dependency issues for all tasks.
 * @param {string} tasksPath - Path to the tasks.json file
 */
declare function validateDependenciesCommand(tasksPath: string, options?: {}): Promise<void>;
/**
 * Counts all dependencies across all tasks and subtasks.
 * @param {Array} tasks - A list of tasks.
 * @returns {number} The total count of dependencies.
 */
declare function countAllDependencies(tasks: Task[]): number;
/**
 * Automatically fix dependency issues.
 * @param {string} tasksPath - Path to the tasks.json file
 */
declare function fixDependenciesCommand(tasksPath: string, options?: {}): Promise<void>;
/**
 * Validates dependencies and relationships for subtasks within a parent task.
 * @param {object} parentTask - The parent task object.
 * @returns {Array} - A list of issues found.
 */
declare function validateSubtaskDependencies(parentTask: Task): DependencyIssue[];
/**
 * A comprehensive function to validate and fix all dependency types.
 * @param {object} tasksData - The tasks data object.
 * @param {string|null} tasksPath - Path to tasks.json, if it needs to be written.
 * @returns {object} - The processed tasks data.
 */
declare function validateAndFixDependencies(tasksData: any, tasksPath?: any): any;
export { addDependency, removeDependency, isCircularDependency, validateTaskDependencies, removeDuplicateDependencies, cleanupSubtaskDependencies, validateDependenciesCommand, countAllDependencies, fixDependenciesCommand, validateSubtaskDependencies, validateAndFixDependencies };
//# sourceMappingURL=dependency-manager.d.ts.map