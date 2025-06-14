/**
 * tools/expand-task.js
 * Tool to expand a task into subtasks
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
	expandTaskDirect } from '../core/vibex-task-manager-core.js';
import {
	findTasksPath } from '../core/utils/path-utils.js';

/**
 * Register the expand-task tool with the MCP server
 * @param {Object} server - FastMCP server instance
 */
export function registerExpandTaskTool(server: any): void {
		const tool: MCPTool = {
		
		name: 'expand_task',
		description: 'Expand a task into subtasks for detailed implementation',
		parameters: z.object({
			id: z.string().describe('ID of task to expand'),
			num: z.string().optional().describe('Number of subtasks to generate'),
			research: z
				.boolean()
				.optional()
				.default(false)
				.describe('Use research role for generation'),
			prompt: z
				.string()
				.optional()
				.describe('Additional context for subtask generation'),
			file: z
				.string()
				.optional()
				.describe(
					'Path to the tasks file relative to project root (e.g., tasks/tasks.json)'
				),
			projectRoot: z
				.string()
				.describe('The directory of the project. Must be an absolute path.'),
			force: z
				.boolean()
				.optional()
				.default(false)
				.describe('Force expansion even if subtasks exist')
		}),
		execute: withNormalizedProjectRoot(async (args, { log, session }) => {
			try {
				log.info(`Starting expand-task with args: ${JSON.stringify(args)}`);

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

				const result = await expandTaskDirect(
					{
						tasksJsonPath: tasksJsonPath,
						id: args.id,
						num: args.num,
						research: args.research,
						prompt: args.prompt,
						force: args.force,
						projectRoot: args.projectRoot
					},
					log,
					{ session }
				);

				return handleApiResult(apiResultToCommandResult(result), log, 'Error expanding task');
			} catch (error) {
				log.error(`Error in expand-task tool: ${(error as Error).message}`);
				return createErrorResponse((error as Error).message);
			}
		})
	};

	server.addTool(tool);
}
