/**
 * tools/update-task.js
 * Tool to update a single task by ID with new information
 */
import { MCPTool } from './utils.js';

import { z } from 'zod';
import {
	handleApiResult,
	createErrorResponse,
	withNormalizedProjectRoot,
	apiResultToCommandResult
} from './utils.js';
import { updateTaskByIdDirect } from '../core/vibex-task-manager-core.js';
import { findTasksPath } from '../core/utils/path-utils.js';
import { createLogger } from '../core/logger.js';

/**
 * Register the update-task tool with the MCP server
 * @param {Object} server - FastMCP server instance
 */
export function registerUpdateTaskTool(server: any): void {
		const tool: MCPTool = {
		
		name: 'update_task',
		description:
			'Updates a single task by ID with new information or context provided in the prompt.',
		parameters: z.object({
			id: z
				.string() // ID can be number or string like "1.2"
				.describe(
					"ID of the task (e.g., '15') to update. Subtasks are supported using the update-subtask tool."
				),
			prompt: z
				.string()
				.describe('New information or context to incorporate into the task'),
			research: z
				.boolean()
				.optional()
				.describe('Use Perplexity AI for research-backed updates'),
			file: z.string().optional().describe('Absolute path to the tasks file'),
			projectRoot: z
				.string()
				.describe('The directory of the project. Must be an absolute path.')
		}),
		execute: withNormalizedProjectRoot(async (args, { log, session }) => {
			const wrappedLogger = createLogger(log);
			const toolName = 'update_task';
			try {
				wrappedLogger.info(`Updating task with args: ${JSON.stringify(args)}`);

				let tasksJsonPath;
				try {
					tasksJsonPath = findTasksPath(
						{ projectRoot: args.projectRoot, file: args.file },
						wrappedLogger
					);
					wrappedLogger.info(`${toolName}: Resolved tasks path: ${tasksJsonPath}`);
				} catch (error) {
					wrappedLogger.error(`${toolName}: Error finding tasks.json: ${(error as Error).message}`);
					return createErrorResponse(
						`Failed to find tasks.json: ${(error as Error).message}`
					);
				}

				// 3. Call Direct Function - Include projectRoot
				const result = await updateTaskByIdDirect(
					{
						...args,
						tasksJsonPath
					},
					log,
					{ session }
				);

				// 4. Handle Result
				wrappedLogger.info(
					`${toolName}: Direct function result: success=${result.success}`
				);
				return handleApiResult(apiResultToCommandResult(result), log, 'Error updating task');
			} catch (error) {
				wrappedLogger.error(`Critical error in ${toolName} tool execute: ${(error as Error).message}`);
				return createErrorResponse(
					`Internal tool error (${toolName}): ${(error as Error).message}`
				);
			}
		})
	};

	server.addTool(tool);
}
