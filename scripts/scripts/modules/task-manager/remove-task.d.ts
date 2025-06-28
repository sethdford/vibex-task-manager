interface Subtask {
    id: number;
    title: string;
    description?: string;
    status: string;
    dependencies?: (number | string)[];
    parentTaskId?: number;
}
interface Task {
    id: number;
    title: string;
    description?: string;
    status: string;
    dependencies?: (number | string)[];
    subtasks?: Subtask[];
}
interface RemoveResult {
    success: boolean;
    messages: string[];
    errors: string[];
    removedTasks: (Task | Subtask)[];
}
/**
 * Removes one or more tasks or subtasks from the tasks file
 * @param {string} tasksPath - Path to the tasks file
 * @param {string} taskIds - Comma-separated string of task/subtask IDs to remove (e.g., '5,6.1,7')
 * @returns {Object} Result object with success status, messages, and removed task info
 */
declare function removeTask(tasksPath: string, taskIds: string): Promise<RemoveResult | {
    success: boolean;
    message: string;
    error: string;
    removedTasks: (Subtask | Task)[];
}>;
export default removeTask;
//# sourceMappingURL=remove-task.d.ts.map