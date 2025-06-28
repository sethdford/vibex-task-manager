import type { TelemetryData as SrcTelemetryData } from '../../../src/types/index.js';
interface ExpandAllTasksContext {
    session?: {
        env?: Record<string, string>;
    };
    mcpLog?: {
        error: (...args: any[]) => void;
        info: (...args: any[]) => void;
        warn: (...args: any[]) => void;
        debug: (...args: any[]) => void;
    };
    projectRoot?: string;
}
interface ExpandAllTasksResult {
    success: boolean;
    expandedCount: number;
    failedCount: number;
    skippedCount: number;
    tasksToExpand: number;
    telemetryData: SrcTelemetryData[];
    message?: string;
}
/**
 * Expand all eligible pending or in-progress tasks using the expandTask function.
 * @param {string} tasksPath - Path to the tasks.json file
 * @param {number} [numSubtasks] - Optional: Target number of subtasks per task.
 * @param {boolean} [useResearch=false] - Whether to use the research AI role.
 * @param {string} [additionalContext=''] - Optional additional context.
 * @param {boolean} [force=false] - Force expansion even if tasks already have subtasks.
 * @param {Object} context - Context object containing session and mcpLog.
 * @param {Object} [context.session] - Session object from MCP.
 * @param {Object} [context.mcpLog] - MCP logger object.
 * @param {string} [outputFormat='text'] - Output format ('text' or 'json'). MCP calls should use 'json'.
 * @returns {Promise<{success: boolean, expandedCount: number, failedCount: number, skippedCount: number, tasksToExpand: number, telemetryData: Array<Object>}>} - Result summary.
 */
declare function expandAllTasks(tasksPath: string, numSubtasks: number, // Keep this signature, expandTask handles defaults
useResearch?: boolean, additionalContext?: string, force?: boolean, // Keep force here for the filter logic
context?: ExpandAllTasksContext, outputFormat?: string): Promise<ExpandAllTasksResult>;
export default expandAllTasks;
//# sourceMappingURL=expand-all-tasks.d.ts.map