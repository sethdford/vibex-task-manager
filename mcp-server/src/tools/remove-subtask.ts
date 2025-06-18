/**
 * tools/remove-subtask.js
 * Tool for removing subtasks from parent tasks
 */
import {
	MCPTool } from './utils.js';

import {
	z } from 'zod';
import {
	apiResultToCommandResult,
	handleApiResult,
	createErrorResponse,
	withNormalizedProjectRoot,
	createSuccessResponse
} from './utils.js';
import {
	removeSubtaskDirect } from '../core/vibex-task-manager-core.js';
import {
	findTasksPath } from '../core/utils/path-utils.js';
import { createLogger } from '../core/logger.js';

/**
 * Register the removeSubtask tool with the MCP server
 * @param {Object} server - FastMCP server instance
 */
export function registerRemoveSubtaskTool(server: any): void {
		const tool: MCPTool = {
		
		name: 'remove_subtask',
		description: 'Remove a subtask from its parent task',
		parameters: z.object({
			id: z
				.string()
				.describe(
					"Subtask ID to remove in format 'parentId.subtaskId' (required)"
				),
			convert: z
				.boolean()
				.optional()
				.describe(
					'Convert the subtask to a standalone task instead of deleting it'
				),
			file: z
				.string()
				.optional()
				.describe(
					'Absolute path to the tasks file (default: tasks/tasks.json)'
				),
			skipGenerate: z
				.boolean()
				.optional()
				.describe('Skip regenerating task files'),
			projectRoot: z
				.string()
				.describe('The directory of the project. Must be an absolute path.')
		}),
		execute: withNormalizedProjectRoot(async (args, { log, session }) => {
			const wrappedLogger = createLogger(log);
			try {
				wrappedLogger.info(`Removing subtask with args: ${JSON.stringify(args)}`);

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

				const result = await removeSubtaskDirect(
					{
						...args,
						tasksJsonPath
					},
					log
				);

				if (result.success) {
					const message = result.data?.message || 'Subtask operation successful';
					wrappedLogger.info(message);
					return createSuccessResponse(message);
				} else {
					const errorMessage =
						result.error?.message || 'Unknown error removing subtask';
					wrappedLogger.error(
						`Failed to remove subtask: ${errorMessage}`
					);
					return createErrorResponse(errorMessage);
				}
			} catch (error) {
				wrappedLogger.error(`Error in remove-subtask tool: ${(error as Error).message}`);
				return createErrorResponse((error as Error).message);
			}
		})
	};

	server.addTool(tool);
}
