/**
 * tools/add-task.ts
 * Tool to add a new task using AI
 */

import { z } from 'zod';
import {
	createErrorResponse,
	handleApiResult,
	withNormalizedProjectRoot,
	MCPTool
} from './utils.js';
import { addTaskDirect } from '../core/vibex-task-manager-core.js';
import { findTasksPath } from '../core/utils/path-utils.js';

// Define the input schema
const addTaskSchema = z.object({
	prompt: z
		.string()
		.optional()
		.describe(
			'Description of the task to add (required if not using manual fields)'
		),
	title: z
		.string()
		.optional()
		.describe('Task title (for manual task creation)'),
	description: z
		.string()
		.optional()
		.describe('Task description (for manual task creation)'),
	details: z
		.string()
		.optional()
		.describe('Implementation details (for manual task creation)'),
	testStrategy: z
		.string()
		.optional()
		.describe('Test strategy (for manual task creation)'),
	dependencies: z
		.string()
		.optional()
		.describe('Comma-separated list of task IDs this task depends on'),
	priority: z
		.string()
		.optional()
		.describe('Task priority (high, medium, low)'),
	file: z
		.string()
		.optional()
		.describe('Path to the tasks file (default: tasks/tasks.json)'),
	projectRoot: z
		.string()
		.describe('The directory of the project. Must be an absolute path.'),
	research: z
		.boolean()
		.optional()
		.describe('Whether to use research capabilities for task creation')
});

type AddTaskInput = z.infer<typeof addTaskSchema>;

/**
 * Register the addTask tool with the MCP server
 */
export function registerAddTaskTool(server: any): void {
	const tool: MCPTool<AddTaskInput> = {
		name: 'add_task',
		description: 'Add a new task using AI',
		parameters: addTaskSchema,
		execute: withNormalizedProjectRoot(async (args: AddTaskInput & { projectRoot: string }, { log, session }) => {
			try {
				log.info(`Starting add-task with args: ${JSON.stringify(args)}`);

				// Use args.projectRoot directly (guaranteed by withNormalizedProjectRoot)
				let tasksJsonPath: string;
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

				// Process dependencies if provided
				const dependencies = args.dependencies
					? args.dependencies.split(',').map(id => parseInt(id.trim(), 10))
					: [];

				const result = await addTaskDirect(
					{
						prompt: args.prompt,
						title: args.title,
						description: args.description,
						details: args.details,
						testStrategy: args.testStrategy,
						dependencies,
						priority: args.priority as 'high' | 'medium' | 'low' | undefined,
						tasksJsonPath,
						research: args.research
					},
					log,
					session
				);

				log.info(
					`Task creation ${result.success ? 'succeeded' : 'failed'}: ${
						result.success ? result.data?.id : result.error
					}`
				);
				return handleApiResult(result, log, 'Error adding task');
			} catch (error) {
				log.error(`Error adding task: ${(error as Error).message}`);
				return createErrorResponse((error as Error).message);
			}
		})
	};

	server.addTool(tool);
}