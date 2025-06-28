/**
 * Syncs the current task list to README.md at the project root
 * @param {string} projectRoot - Path to the project root directory
 * @param {Object} options - Options for syncing
 * @param {boolean} options.withSubtasks - Include subtasks in the output (default: false)
 * @param {string} options.status - Filter by status (e.g., 'pending', 'done')
 * @param {string} options.tasksPath - Custom path to tasks.json
 * @returns {boolean} - True if sync was successful, false otherwise
 */
export declare function syncTasksToReadme(projectRoot?: any, options?: {
    withSubtasks?: boolean;
    status?: string;
    tasksPath?: string;
}): Promise<boolean>;
export default syncTasksToReadme;
//# sourceMappingURL=sync-readme.d.ts.map