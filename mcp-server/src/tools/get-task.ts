/**
 * tools/get-task.js
 * Tool to get task details by ID
 */
import { MCPTool } from './utils.js';
import { z } from 'zod';
import {
	MCPToolResult,
	createErrorResponse,
	withNormalizedProjectRoot,
	handleApiResult,
	apiResultToCommandResult
} from './utils.js';
import { showTaskDirect } from '../core/vibex-task-manager-core.js';
import {
	findTasksPath,
	findComplexityReportPath
} from '../core/utils/path-utils.js';
import { createLogger } from '../core/logger.js';

/**
 * Custom processor function that removes allTasks from the response
 * @param {Object} data - The data returned from showTaskDirect
 * @returns {Object} - The processed data with allTasks removed
 */
function processTaskResponse(data) {
	if (!data) return data;

	// If we have the expected structure with task and allTasks
	if (typeof data === 'object' && data !== null && data.id && data.title) {
		// If the data itself looks like the task object, return it
		return data;
	} else if (data.task) {
		return data.task;
	}

	// If structure is unexpected, return as is
	return data;
}

/**
 * Register the get-task tool with the MCP server
 * @param {Object} server - FastMCP server instance
 */
export function registerShowTaskTool(server: any): void {
		const tool: MCPTool = {
		
		name: 'get_task',
		description: 'Get detailed information about a specific task',
		parameters: z.object({
			id: z.string().describe('Task ID to get'),
			status: z
				.string()
				.optional()
				.describe("Filter subtasks by status (e.g., 'pending', 'done')"),
			file: z
				.string()
				.optional()
				.describe('Path to the tasks file relative to project root'),
			complexityReport: z
				.string()
				.optional()
				.describe(
					'Path to the complexity report file (relative to project root or absolute)'
				),
			projectRoot: z
				.string()
				.optional()
				.describe(
					'Absolute path to the project root directory (Optional, usually from session)'
				)
		}),
		execute: withNormalizedProjectRoot(async (args, { log, session }) => {
			const wrappedLogger = createLogger(log);
			try {
				wrappedLogger.info(`Getting task with args: ${JSON.stringify(args)}`);

				let tasksJsonPath;
				try {
					tasksJsonPath = findTasksPath(
						{ projectRoot: args.projectRoot, file: args.file },
						wrappedLogger
					);
				} catch (error) {
					wrappedLogger.error(`Error finding tasks.json: ${(error as Error).message}`);
					return createErrorResponse(
						`Failed to find tasks.json: ${(error as Error).message}`
					);
				}

				// Call the direct function, passing the normalized projectRoot
				// Resolve the path to complexity report
				let complexityReportPath;
				try {
					complexityReportPath = findComplexityReportPath(
						{
							projectRoot: args.projectRoot,
							complexityReport: args.complexityReport
						},
						wrappedLogger
					);
				} catch (error) {
					wrappedLogger.error(`Error finding complexity report: ${(error as Error).message}`);
				}
				const result = await showTaskDirect(
					{
						...args,
						tasksJsonPath,
						reportPath: complexityReportPath
					},
					log // Pass original logger
				);

				if (result.success) {
					wrappedLogger.info(
						`Successfully retrieved task details for ID: ${args.id}`
					);
				} else {
					wrappedLogger.error(`Failed to get task: ${result.error}`);
				}

				return handleApiResult(
					apiResultToCommandResult(result),
					log,
					'Error getting task'
				);
			} catch (error) {
				wrappedLogger.error(`Error in get-task tool: ${(error as Error).message}`);
				return createErrorResponse((error as Error).message);
			}
		})
	};

	server.addTool(tool);
}
