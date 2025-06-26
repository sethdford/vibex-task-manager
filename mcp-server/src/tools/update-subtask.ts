/**
 * tools/update-subtask.js
 * Tool to append additional information to a specific subtask
 */
import { MCPTool } from './utils.js';

import { z } from 'zod';
import {
	apiResultToCommandResult,
	handleApiResult,
	createErrorResponse,
	withNormalizedProjectRoot
} from './utils.js';
import { updateSubtaskByIdDirect } from '../core/vibex-task-manager-core.js';
import { findTasksPath } from '../core/utils/path-utils.js';
import { createLogger } from '../core/logger.js';

/**
 * Register the update-subtask tool with the MCP server
 * @param {Object} server - FastMCP server instance
 */
export function registerUpdateSubtaskTool(server: any): void {
	const tool: MCPTool = {
		name: 'update_subtask',
		description:
			'Appends timestamped information to a specific subtask without replacing existing content. If you just want to update the subtask status, use set_task_status instead.',
		parameters: z.object({
			id: z
				.string()
				.describe(
					'ID of the subtask to update in format "parentId.subtaskId" (e.g., "5.2"). Parent ID is the ID of the task that contains the subtask.'
				),
			prompt: z.string().describe('Information to add to the subtask'),
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
			const toolName = 'update_subtask';
			try {
				wrappedLogger.info(
					`Updating subtask with args: ${JSON.stringify(args)}`
				);

				let tasksJsonPath;
				try {
					tasksJsonPath = findTasksPath(
						{ projectRoot: args.projectRoot, file: args.file },
						wrappedLogger
					);
				} catch (error) {
					wrappedLogger.error(
						`${toolName}: Error finding tasks.json: ${(error as Error).message}`
					);
					return createErrorResponse(
						`Failed to find tasks.json: ${(error as Error).message}`
					);
				}

				const result = await updateSubtaskByIdDirect(
					{
						...args,
						tasksJsonPath
					},
					log
				);

				if (result.success) {
					wrappedLogger.info(`Successfully updated subtask with ID ${args.id}`);
				} else {
					wrappedLogger.error(
						`Failed to update subtask: ${result.error?.message || 'Unknown error'}`
					);
				}

				return handleApiResult(
					apiResultToCommandResult(result),
					log,
					'Error updating subtask'
				);
			} catch (error) {
				wrappedLogger.error(
					`Critical error in ${toolName} tool execute: ${(error as Error).message}`
				);
				return createErrorResponse(
					`Internal tool error (${toolName}): ${(error as Error).message}`
				);
			}
		})
	};

	server.addTool(tool);
}
