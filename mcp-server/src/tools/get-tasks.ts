/**
 * tools/get-tasks.ts
 * Tool to get all tasks from Task Manager
 */

import { z } from 'zod';
import {
	apiResultToCommandResult,
	createErrorResponse,
	handleApiResult,
	withNormalizedProjectRoot,
	MCPToolHandler,
	MCPTool
} from './utils.js';
import { listTasksDirect } from '../core/vibex-task-manager-core.js';
import {
	resolveTasksPath,
	resolveComplexityReportPath
} from '../core/utils/path-utils.js';
import { createLogger } from '../core/logger.js';

// Define the input schema
const getTasksSchema = z.object({
	status: z
		.string()
		.optional()
		.describe("Filter tasks by status (e.g., 'pending', 'done')"),
	withSubtasks: z
		.boolean()
		.optional()
		.describe(
			'Include subtasks nested within their parent tasks in the response'
		),
	file: z
		.string()
		.optional()
		.describe('Path to the tasks file (relative to project root or absolute)'),
	complexityReport: z
		.string()
		.optional()
		.describe(
			'Path to the complexity report file (relative to project root or absolute)'
		),
	projectRoot: z
		.string()
		.describe('The directory of the project. Must be an absolute path.')
});

type GetTasksInput = z.infer<typeof getTasksSchema>;

/**
 * Register the getTasks tool with the MCP server
 */
export function registerListTasksTool(server: any): void {
	const tool: MCPTool<GetTasksInput> = {
		name: 'get_tasks',
		description:
			'Get all tasks from Task Manager, optionally filtering by status and including subtasks.',
		parameters: getTasksSchema,
		execute: withNormalizedProjectRoot(
			async (args: GetTasksInput, { log, session }) => {
				const wrappedLogger = createLogger(log);
				try {
					wrappedLogger.info(
						`Getting all tasks with args: ${JSON.stringify(args)}`
					);

					let tasksJsonPath: string;
					try {
						const resolvedPath = resolveTasksPath(args, wrappedLogger);
						if (!resolvedPath) {
							return createErrorResponse('Could not find tasks.json');
						}
						tasksJsonPath = resolvedPath;
					} catch (error) {
						wrappedLogger.error(
							`Error finding tasks.json: ${(error as Error).message}`
						);
						return createErrorResponse(
							`Failed to find tasks.json: ${(error as Error).message}`
						);
					}

					// Resolve the path to complexity report
					let complexityReportPath: string | null;
					try {
						complexityReportPath = resolveComplexityReportPath(args, session);
					} catch (error) {
						wrappedLogger.error(
							`Error finding complexity report: ${(error as Error).message}`
						);
						// This is optional, so we don't fail the operation
						complexityReportPath = null;
					}

					const result = await listTasksDirect(
						{
							...args,
							tasksJsonPath,
							reportPath: complexityReportPath || undefined
						},
						log
					);

					if (result.success) {
						wrappedLogger.info(
							`Retrieved ${result.data?.tasks?.length || 0} tasks`
						);
					}
					return handleApiResult(
						apiResultToCommandResult(result),
						log,
						'Error getting tasks'
					);
				} catch (error) {
					wrappedLogger.error(
						`Error in get-tasks tool: ${(error as Error).message}`
					);
					return createErrorResponse((error as Error).message);
				}
			}
		)
	};

	server.addTool(tool);
}
