/**
 * tools/next-task.js
 * Tool to find the next task to work on based on dependencies and status
 */
import {
	MCPTool } from './utils.js';

import {
	z } from 'zod';
import {
	apiResultToCommandResult,
	createErrorResponse,
	handleApiResult,
	withNormalizedProjectRoot
} from './utils.js';
import { nextTaskDirect } from '../core/vibex-task-manager-core.js';
import {
	resolveTasksPath,
	resolveComplexityReportPath
} from '../core/utils/path-utils.js';

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
			try {
				log.info(`Finding next task with args: ${JSON.stringify(args)}`);

				// Resolve the path to tasks.json using new path utilities
				let tasksJsonPath;
				try {
					tasksJsonPath = resolveTasksPath(args, session);
				} catch (error) {
					log.error(`Error finding tasks.json: ${(error as Error).message}`);
					return createErrorResponse(
						`Failed to find tasks.json: ${(error as Error).message}`
					);
				}

				// Resolve the path to complexity report (optional)
				let complexityReportPath;
				try {
					complexityReportPath = resolveComplexityReportPath(args, session);
				} catch (error) {
					log.error(`Error finding complexity report: ${(error as Error).message}`);
					// This is optional, so we don't fail the operation
					complexityReportPath = null;
				}

				const result = await nextTaskDirect(
					{
						tasksJsonPath: tasksJsonPath,
						reportPath: complexityReportPath
					},
					log
				);

				log.info(`Next task result: ${result.success ? 'found' : 'none'}`);
				return handleApiResult(apiResultToCommandResult(result), log, 'Error finding next task');
			} catch (error) {
				log.error(`Error finding next task: ${(error as Error).message}`);
				return createErrorResponse((error as Error).message);
			}
		})
	};

	server.addTool(tool);
}
