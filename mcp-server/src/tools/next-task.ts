/**
 * tools/next-task.js
 * Tool to find the next task to work on based on dependencies and status
 */
import { MCPTool } from './utils.js';

import { z } from 'zod';
import {
	apiResultToCommandResult,
	createErrorResponse,
	handleApiResult,
	withNormalizedProjectRoot
} from './utils.js';
import { nextTaskDirect } from '../core/vibex-task-manager-core.js';
import {
	findTasksPath,
	resolveComplexityReportPath
} from '../core/utils/path-utils.js';
import { createLogger } from '../core/logger.js';

/**
 * Register the nextTask tool with the MCP server
 * @param {Object} server - FastMCP server instance
 */
export function registerNextTaskTool(server: any): void {
	const tool: MCPTool = {
		name: 'next_task',
		description:
			'Find the next task to work on based on dependencies and status',
		parameters: z.object({
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
					`Finding next task with args: ${JSON.stringify(args)}`
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

				let complexityReportPath: string | null = null;
				try {
					complexityReportPath = resolveComplexityReportPath(args, session);
				} catch (error) {
					wrappedLogger.error(
						`Error finding complexity report: ${(error as Error).message}`
					);
					// This is optional, so we don't fail the operation
					complexityReportPath = null;
				}

				const result = await nextTaskDirect(
					{
						tasksJsonPath,
						reportPath: complexityReportPath || undefined
					},
					log // Pass original logger
				);

				if (result.success && result.data?.nextTask) {
					wrappedLogger.info(`Next task found: ${result.data.nextTask.id}`);
				} else if (result.success) {
					wrappedLogger.info(`No next task found or all tasks are complete.`);
				} else {
					wrappedLogger.error(
						`Error finding next task: ${result.error?.message || 'Unknown error'}`
					);
				}
				return handleApiResult(
					apiResultToCommandResult(result),
					log,
					'Error finding next task'
				);
			} catch (error) {
				wrappedLogger.error(
					`Error in next-task tool: ${(error as Error).message}`
				);
				return createErrorResponse((error as Error).message);
			}
		})
	};

	server.addTool(tool);
}
