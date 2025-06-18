/**
 * tools/remove-task.js
 * Tool to remove a task by ID
 */
import { MCPTool } from './utils.js';

import { z } from 'zod';
import {
	handleApiResult,
	createErrorResponse,
	withNormalizedProjectRoot,
	apiResultToCommandResult
} from './utils.js';
import { removeTaskDirect } from '../core/vibex-task-manager-core.js';
import { findTasksPath } from '../core/utils/path-utils.js';
import { createLogger } from '../core/logger.js';
import { Ora } from 'ora';

/**
 * Register the remove-task tool with the MCP server
 * @param {Object} server - FastMCP server instance
 */
export function registerRemoveTaskTool(server: any): void {
		const tool: MCPTool = {
		
		name: 'remove_task',
		description: 'Remove a task or subtask permanently from the tasks list',
		parameters: z.object({
			id: z
				.string()
				.describe(
					"ID of the task or subtask to remove (e.g., '5' or '5.2'). Can be comma-separated to update multiple tasks/subtasks at once."
				),
			file: z.string().optional().describe('Absolute path to the tasks file'),
			projectRoot: z
				.string()
				.describe('The directory of the project. Must be an absolute path.'),
			confirm: z
				.boolean()
				.optional()
				.describe('Whether to skip confirmation prompt (default: false)')
		}),
		execute: withNormalizedProjectRoot(async (args, { log, session }) => {
			const wrappedLogger = createLogger(log);
			try {
				wrappedLogger.info(`Removing task with args: ${JSON.stringify(args)}`);

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

				const result = await removeTaskDirect(
					{
						...args,
						tasksJsonPath
					},
					log // Pass original logger
				);

				if (result.success) {
					const successMessages: string[] = [];
					const errorMessages: string[] = [];

					const idList = args.id.split(',').map((id) => id.trim());

					for (const id of idList) {
						const taskResult = result.data?.results.find((r) => r.taskId === id);
						if (taskResult?.success) {
							successMessages.push(`#${id}`);
						} else {
							errorMessages.push(`#${id}: ${taskResult?.message}`);
						}
					}

					if (errorMessages.length > 0) {
						return createErrorResponse(
							`Failed to remove some tasks: ${errorMessages.join(', ')}`,
							404
						);
					}
					return {
						success: true,
						stdout:
							`Successfully removed tasks: ${successMessages.join(', ')}`
					};
				} else {
					const errorMessages =
						result.error?.details || 'Unknown error during task removal';
					wrappedLogger.error(`Failed to remove task(s): ${errorMessages}`);
				}

				return handleApiResult(
					apiResultToCommandResult(result),
					log,
					'Error removing task'
				);
			} catch (error) {
				wrappedLogger.error(`Error in remove-task tool: ${(error as Error).message}`);
				return createErrorResponse((error as Error).message);
			}
		})
	};

	server.addTool(tool);
}
