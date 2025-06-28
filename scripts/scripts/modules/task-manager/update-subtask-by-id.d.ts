import { Subtask } from './types.js';
interface UpdateSubtaskContext {
    session?: {
        env?: Record<string, string>;
    };
    mcpLog?: {
        error: (...args: unknown[]) => void;
        info: (...args: unknown[]) => void;
        warn: (...args: unknown[]) => void;
        debug: (...args: unknown[]) => void;
    };
    projectRoot?: string;
}
/**
 * Update a subtask by appending additional timestamped information using the unified AI service.
 * @param {string} tasksPath - Path to the tasks.json file
 * @param {string} subtaskId - ID of the subtask to update in format "parentId.subtaskId"
 * @param {string} prompt - Prompt for generating additional information
 * @param {boolean} [useResearch=false] - Whether to use the research AI role.
 * @param {UpdateSubtaskContext} context - Context object containing session and mcpLog.
 * @param {string} [outputFormat='text'] - Output format ('text' or 'json'). Automatically 'json' if mcpLog is present.
 * @returns {Promise<Subtask | null>} - The updated subtask or null if update failed.
 */
declare function updateSubtaskById(tasksPath: string, subtaskId: string, prompt: string, useResearch?: boolean, context?: UpdateSubtaskContext, outputFormat?: 'text' | 'json'): Promise<Subtask | null>;
export default updateSubtaskById;
//# sourceMappingURL=update-subtask-by-id.d.ts.map