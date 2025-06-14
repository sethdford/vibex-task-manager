/**
 * add-task.ts
 * Direct function implementation for adding a new task
 */

import { addTask } from '../../../../scripts/modules/task-manager.js';
import {
	enableSilentMode,
	disableSilentMode
} from '../../../../scripts/modules/utils.js';
import { createLogWrapper } from '../../tools/utils.js';

// Type definitions for direct function interfaces
interface Logger {
	info(message: string, ...args: any[]): void;
	warn(message: string, ...args: any[]): void;
	error(message: string, ...args: any[]): void;
	debug?(message: string, ...args: any[]): void;
}

interface ApiError {
	code: string;
	message: string;
}

interface ApiResult<T = any> {
	success: boolean;
	data?: T;
	error?: ApiError;
}

interface Session {
	[key: string]: any;
}

interface Context {
	session?: Session;
	[key: string]: any;
}

interface AddTaskArgs {
	tasksJsonPath: string;
	prompt?: string;
	title?: string;
	description?: string;
	details?: string;
	testStrategy?: string;
	dependencies?: string | number[];
	priority?: 'high' | 'medium' | 'low';
	research?: boolean;
	projectRoot?: string;
}

interface ManualTaskData {
	title: string;
	description: string;
	details: string;
	testStrategy: string;
}

interface AddTaskResult {
	taskId: number;
	message: string;
	telemetryData?: any;
}

interface CoreAddTaskResult {
	newTaskId: number;
	telemetryData?: any;
}

/**
 * Direct function wrapper for adding a new task with error handling.
 */
export async function addTaskDirect(
	args: AddTaskArgs,
	log: Logger,
	context: Context = {}
): Promise<ApiResult<AddTaskResult>> {
	// Destructure expected args (including research and projectRoot)
	const {
		tasksJsonPath,
		prompt,
		dependencies,
		priority,
		research,
		projectRoot
	} = args;
	const { session } = context; // Destructure session from context

	// Enable silent mode to prevent console logs from interfering with JSON response
	enableSilentMode();

	// Create logger wrapper using the utility
	const mcpLog = createLogWrapper(log);

	try {
		// Check if tasksJsonPath was provided
		if (!tasksJsonPath) {
			log.error('addTaskDirect called without tasksJsonPath');
			disableSilentMode(); // Disable before returning
			return {
				success: false,
				error: {
					code: 'MISSING_ARGUMENT',
					message: 'tasksJsonPath is required'
				}
			};
		}

		// Use provided path
		const tasksPath = tasksJsonPath;

		// Check if this is manual task creation or AI-driven task creation
		const isManualCreation = args.title && args.description;

		// Check required parameters
		if (!args.prompt && !isManualCreation) {
			const errorMessage = 'Missing required parameters: either prompt or title+description must be provided';
			log.error(errorMessage);
			disableSilentMode();
			return {
				success: false,
				error: {
					code: 'MISSING_PARAMETER',
					message: 'Either the prompt parameter or both title and description parameters are required for adding a task'
				}
			};
		}

		// Extract and prepare parameters
		const taskDependencies = Array.isArray(dependencies)
			? dependencies // Already an array if passed directly
			: dependencies // Check if dependencies exist and are a string
				? String(dependencies)
						.split(',')
						.map((id) => parseInt(id.trim(), 10)) // Split, trim, and parse
				: []; // Default to empty array if null/undefined
		const taskPriority = priority || 'medium'; // Default priority

		let manualTaskData: ManualTaskData | null = null;
		let newTaskId: number;
		let telemetryData: any;

		if (isManualCreation) {
			// Create manual task data object
			manualTaskData = {
				title: args.title!,
				description: args.description!,
				details: args.details || '',
				testStrategy: args.testStrategy || ''
			};

			log.info(
				`Adding new task manually with title: "${args.title}", dependencies: [${taskDependencies.join(', ')}], priority: ${priority}`
			);

			// Call the addTask function with manual task data
			const result: CoreAddTaskResult = await addTask(
				tasksPath,
				null, // prompt is null for manual creation
				taskDependencies,
				taskPriority,
				{
					session,
					mcpLog,
					projectRoot,
					commandName: 'add-task',
					outputType: 'mcp'
				},
				'json', // outputFormat
				manualTaskData, // Pass the manual task data
				false, // research flag is false for manual creation
				projectRoot // Pass projectRoot
			);
			newTaskId = result.newTaskId;
			telemetryData = result.telemetryData;
		} else {
			// AI-driven task creation
			log.info(
				`Adding new task with prompt: "${prompt}", dependencies: [${taskDependencies.join(', ')}], priority: ${taskPriority}, research: ${research}`
			);

			// Call the addTask function, passing the research flag
			const result: CoreAddTaskResult = await addTask(
				tasksPath,
				prompt!, // Use the prompt for AI creation
				taskDependencies,
				taskPriority,
				{
					session,
					mcpLog,
					projectRoot,
					commandName: 'add-task',
					outputType: 'mcp'
				},
				'json', // outputFormat
				null, // manualTaskData is null for AI creation
				research || false // Pass the research flag
			);
			newTaskId = result.newTaskId;
			telemetryData = result.telemetryData;
		}

		// Restore normal logging
		disableSilentMode();

		return {
			success: true,
			data: {
				taskId: newTaskId,
				message: `Successfully added new task #${newTaskId}`,
				telemetryData: telemetryData
			}
		};
	} catch (error) {
		// Make sure to restore normal logging even if there's an error
		disableSilentMode();

		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		log.error(`Error in addTaskDirect: ${errorMessage}`);
		
		// Check if error has a code property
		const errorCode = (error as any)?.code || 'ADD_TASK_ERROR';
		
		return {
			success: false,
			error: {
				code: errorCode,
				message: errorMessage
			}
		};
	}
}