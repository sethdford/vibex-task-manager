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
	withNormalizedProjectRoot
} from './utils.js';
import {
	removeSubtaskDirect } from '../core/vibex-task-manager-core.js';
import {
	findTasksPath } from '../core/utils/path-utils.js';

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
		execute: withNormalizedProjectRoot(async (args, { log }) => {
			try {
				log.info(`Removing subtask with args: ${JSON.stringify(args)}`);

				// Use args.projectRoot directly (guaranteed by withNormalizedProjectRoot)
				let tasksJsonPath;
				try {
					tasksJsonPath = findTasksPath(
						{ projectRoot: args.projectRoot, file: args.file },
						log
					);
				} catch (error) {
					log.error(`Error finding tasks.json: ${(error as Error).message}`);
					return createErrorResponse(
						`Failed to find tasks.json: ${(error as Error).message}`
					);
				}

				const result = await removeSubtaskDirect(
					{
						tasksJsonPath: tasksJsonPath,
						id: args.id,
						convert: args.convert,
						skipGenerate: args.skipGenerate
					},
					log
				);

				if (result.success) {
					log.info(`Subtask removed successfully: ${result.data.message}`);
				} else {
					log.error(`Failed to remove subtask: ${result.error}`);
				}

				return handleApiResult(apiResultToCommandResult(result), log, 'Error removing subtask');
			} catch (error) {
				log.error(`Error in removeSubtask tool: ${(error as Error).message}`);
				return createErrorResponse((error as Error).message);
			}
		})
	};

	server.addTool(tool);
}
