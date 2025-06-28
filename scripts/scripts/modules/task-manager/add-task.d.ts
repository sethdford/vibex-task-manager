export default addTask;
/**
 * Add a new task using AI
 * @param tasksPath - Path to the tasks.json file
 * @param prompt - Description of the task to add (required for AI-driven creation)
 * @param dependencies - Task dependencies
 * @param priority - Task priority
 * @param context - Context object containing session and potentially projectRoot
 * @param outputFormat - Output format (text or json)
 * @param manualTaskData - Manual task data (optional, for direct task creation without AI)
 * @param useResearch - Whether to use the research model (passed to unified service)
 * @returns An object containing newTaskId and telemetryData
 */
declare function addTask(tasksPath: any, prompt: any, dependencies?: any[], priority?: any, context?: {}, outputFormat?: string, manualTaskData?: any, useResearch?: boolean): Promise<{
    newTaskId: number;
    telemetryData: Record<string, any>;
}>;
//# sourceMappingURL=add-task.d.ts.map