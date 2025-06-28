interface GenerateTaskFilesOptions {
    mcpLog?: any;
}
/**
 * Generate individual task files from tasks.json
 * @param {string} tasksPath - Path to the tasks.json file
 * @param {string} outputDir - Output directory for task files
 * @param {GenerateTaskFilesOptions} options - Additional options (mcpLog for MCP mode)
 * @returns {Object|undefined} Result object in MCP mode, undefined in CLI mode
 */
declare function generateTaskFiles(tasksPath: string, outputDir: string, options?: GenerateTaskFilesOptions): {
    success: boolean;
    count: any;
    directory: string;
};
export default generateTaskFiles;
//# sourceMappingURL=generate-task-files.d.ts.map