interface ParsePRDOptions {
    force?: boolean;
    append?: boolean;
    research?: boolean;
    reportProgress?: Function;
    mcpLog?: any;
    session?: any;
    projectRoot?: string;
}
/**
 * Parse a PRD file and generate tasks
 * @param {string} prdPath - Path to the PRD file
 * @param {string} tasksPath - Path to the tasks.json file
 * @param {number} numTasks - Number of tasks to generate
 * @param {ParsePRDOptions} options - Additional options
 * @param {string} [outputFormat='text'] - Output format ('text' or 'json').
 */
declare function parsePRD(prdPath: string, tasksPath: string, numTasks: number, options?: ParsePRDOptions): Promise<{
    success: boolean;
    message: string;
    tasksPath: string;
    telemetryData: any;
}>;
export default parsePRD;
//# sourceMappingURL=parse-prd.d.ts.map