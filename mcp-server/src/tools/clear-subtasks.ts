/**
 * tools/clear-subtasks.js
 * Tool for clearing subtasks from parent tasks
 */
import { MCPTool } from './utils.js';

import { z } from 'zod';
import {
	handleApiResult,
	createErrorResponse,
	withNormalizedProjectRoot
} from './utils.js';
import { clearSubtasksDirect } from '../core/vibex-task-manager-core.js';
import { findTasksPath } from '../core/utils/path-utils.js';

/**
 * Register the clearSubtasks tool with the MCP server
 * @param {Object} server - FastMCP server instance
 */
export function registerClearSubtasksTool(server: any): void {
		const tool: MCPTool = {
		
		name: 'clear_subtasks',
		description: 'Clear subtasks from specified tasks',
		parameters: z
			.object({
				id: z
					.string()
					.optional()
					.describe('Task IDs (comma-separated) to clear subtasks from'),
				all: z.boolean().optional().describe('Clear subtasks from all tasks'),
				file: z
					.string()
					.optional()
					.describe(
						'Absolute path to the tasks file (default: tasks/tasks.json)'
					),
				projectRoot: z
					.string()
					.describe('The directory of the project. Must be an absolute path.')
			})
			.refine((data) => data.id || data.all, {
				message: "Either 'id' or 'all' parameter must be provided",
				path: ['id', 'all']
			}),
		execute: withNormalizedProjectRoot(async (args, { log, session }) => {
			try {
				log.info(`Clearing subtasks with args: ${JSON.stringify(args)}`);

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

				const result = await clearSubtasksDirect(
					{
						tasksJsonPath: tasksJsonPath,
						id: args.id,
						all: args.all
					},
					log
				);

				if (result.success) {
					log.info(`Subtasks cleared successfully: ${result.data.message}`);
				} else {
					log.error(`Failed to clear subtasks: ${result.error}`);
				}

				return handleApiResult(result, log, 'Error clearing subtasks');
			} catch (error) {
				log.error(`Error in clearSubtasks tool: ${(error as Error).message}`);
				return createErrorResponse((error as Error).message);
			}
		})
	};

	server.addTool(tool);
}
}
