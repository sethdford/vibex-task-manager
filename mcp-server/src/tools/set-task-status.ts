/**
 * tools/setTaskStatus.js
 * Tool to set the status of a task
 */
import { MCPTool } from './utils.js';

import { z } from 'zod';
import {
	handleApiResult,
	createErrorResponse,
	withNormalizedProjectRoot,
	apiResultToCommandResult
} from './utils.js';
import {
	setTaskStatusDirect,
	nextTaskDirect
} from '../core/vibex-task-manager-core.js';
import {
	findTasksPath,
	findComplexityReportPath
} from '../core/utils/path-utils.js';
import { TASK_STATUS_OPTIONS } from '../../../src/constants/task-status.js';
import { createLogger } from '../core/logger.js';

/**
 * Register the setTaskStatus tool with the MCP server
 * @param {Object} server - FastMCP server instance
 */
export function registerSetTaskStatusTool(server: any): void {
	const tool: MCPTool = {
		name: 'set_task_status',
		description: 'Set the status of one or more tasks or subtasks.',
		parameters: z.object({
			id: z
				.string()
				.describe(
					"Task ID or subtask ID (e.g., '15', '15.2'). Can be comma-separated to update multiple tasks/subtasks at once."
				),
			status: z
				.enum([
					'pending',
					'done',
					'in-progress',
					'review',
					'deferred',
					'cancelled'
				] as const)
				.describe(
					"New status to set (e.g., 'pending', 'done', 'in-progress', 'review', 'deferred', 'cancelled'."
				),
			file: z.string().optional().describe('Absolute path to the tasks file'),
			complexityReport: z
				.string()
				.optional()
				.describe(
					'Path to the complexity report file (relative to project root or absolute)'
				),
			projectRoot: z
				.string()
				.describe('The directory of the project. Must be an absolute path.')
		}),
		execute: withNormalizedProjectRoot(async (args, { log, session }) => {
			const wrappedLogger = createLogger(log);
			try {
				wrappedLogger.info(
					`Setting task status with args: ${JSON.stringify(args)}`
				);

				let tasksJsonPath;
				try {
					tasksJsonPath = findTasksPath(
						{ projectRoot: args.projectRoot, file: args.file },
						wrappedLogger
					);
				} catch (error) {
					wrappedLogger.error(
						`Error finding tasks.json: ${(error as Error).message}`
					);
					return createErrorResponse(
						`Failed to find tasks.json: ${(error as Error).message}`
					);
				}

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
					wrappedLogger.error(
						`Error finding complexity report: ${(error as Error).message}`
					);
				}

				const result = await setTaskStatusDirect(
					{
						...args,
						tasksJsonPath,
						complexityReportPath
					},
					log
				);

				if (result.success) {
					wrappedLogger.info(
						`Successfully updated status for task(s) ${args.id} to "${args.status}": ${result.data?.message}`
					);
				} else {
					wrappedLogger.error(
						`Failed to update task status: ${result.error?.message || 'Unknown error'}`
					);
				}

				return handleApiResult(
					apiResultToCommandResult(result),
					log,
					'Error setting task status'
				);
			} catch (error) {
				wrappedLogger.error(
					`Error in set-task-status tool: ${(error as Error).message}`
				);
				return createErrorResponse((error as Error).message);
			}
		})
	};

	server.addTool(tool);
}
