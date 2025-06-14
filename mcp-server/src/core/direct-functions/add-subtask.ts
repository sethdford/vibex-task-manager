/**
 * add-subtask.ts
 * Direct function wrapper for addSubtask
 */

import { addSubtask } from '../../../../scripts/modules/task-manager.js';
import {
	enableSilentMode,
	disableSilentMode
} from '../../../../scripts/modules/utils.js';

// Type definitions for direct function interfaces
interface Logger {
	info(message: string, ...args: any[]): void;
	warn(message: string, ...args: any[]): void;
	error(message: string, ...args: any[]): void;
	success?(message: string, ...args: any[]): void;
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

interface AddSubtaskArgs {
	tasksJsonPath: string;
	id: string;
	taskId?: string;
	title?: string;
	description?: string;
	details?: string;
	status?: string;
	dependencies?: string;
	skipGenerate?: boolean;
}

interface SubtaskData {
	title: string;
	description: string;
	details: string;
	status: string;
	dependencies: (number | string)[];
}

interface AddSubtaskResult {
	message: string;
	subtask: any;
}

/**
 * Add a subtask to an existing task
 * @param args - Function arguments
 * @param args.tasksJsonPath - Explicit path to the tasks.json file.
 * @param args.id - Parent task ID
 * @param args.taskId - Existing task ID to convert to subtask (optional)
 * @param args.title - Title for new subtask (when creating a new subtask)
 * @param args.description - Description for new subtask
 * @param args.details - Implementation details for new subtask
 * @param args.status - Status for new subtask (default: 'pending')
 * @param args.dependencies - Comma-separated list of dependency IDs
 * @param args.skipGenerate - Skip regenerating task files
 * @param log - Logger object
 * @returns Result object with success status and data/error information
 */
export async function addSubtaskDirect(
	args: AddSubtaskArgs,
	log: Logger
): Promise<ApiResult<AddSubtaskResult>> {
	// Destructure expected args
	const {
		tasksJsonPath,
		id,
		taskId,
		title,
		description,
		details,
		status,
		dependencies: dependenciesStr,
		skipGenerate
	} = args;
	
	try {
		log.info(`Adding subtask with args: ${JSON.stringify(args)}`);

		// Check if tasksJsonPath was provided
		if (!tasksJsonPath) {
			log.error('addSubtaskDirect called without tasksJsonPath');
			return {
				success: false,
				error: {
					code: 'MISSING_ARGUMENT',
					message: 'tasksJsonPath is required'
				}
			};
		}

		if (!id) {
			return {
				success: false,
				error: {
					code: 'INPUT_VALIDATION_ERROR',
					message: 'Parent task ID is required'
				}
			};
		}

		// Either taskId or title must be provided
		if (!taskId && !title) {
			return {
				success: false,
				error: {
					code: 'INPUT_VALIDATION_ERROR',
					message: 'Either taskId or title must be provided'
				}
			};
		}

		// Use provided path
		const tasksPath = tasksJsonPath;

		// Parse dependencies if provided
		let dependencies: (number | string)[] = [];
		if (dependenciesStr) {
			dependencies = dependenciesStr.split(',').map((depId) => {
				// Handle both regular IDs and dot notation
				return depId.includes('.') ? depId.trim() : parseInt(depId.trim(), 10);
			});
		}

		// Convert existingTaskId to a number if provided
		const existingTaskId = taskId ? parseInt(taskId, 10) : null;

		// Convert parent ID to a number
		const parentId = parseInt(id, 10);

		// Determine if we should generate files
		const generateFiles = !skipGenerate;

		// Enable silent mode to prevent console logs from interfering with JSON response
		enableSilentMode();

		// Case 1: Convert existing task to subtask
		if (existingTaskId) {
			log.info(`Converting task ${existingTaskId} to a subtask of ${parentId}`);
			const result = await addSubtask(
				tasksPath,
				parentId,
				existingTaskId,
				null,
				generateFiles
			);

			// Restore normal logging
			disableSilentMode();

			return {
				success: true,
				data: {
					message: `Task ${existingTaskId} successfully converted to a subtask of task ${parentId}`,
					subtask: result
				}
			};
		}
		// Case 2: Create new subtask
		else {
			log.info(`Creating new subtask for parent task ${parentId}`);

			const newSubtaskData: SubtaskData = {
				title: title!,
				description: description || '',
				details: details || '',
				status: status || 'pending',
				dependencies: dependencies
			};

			const result = await addSubtask(
				tasksPath,
				parentId,
				null,
				newSubtaskData,
				generateFiles
			);

			// Restore normal logging
			disableSilentMode();

			return {
				success: true,
				data: {
					message: `New subtask ${parentId}.${result.id} successfully created`,
					subtask: result
				}
			};
		}
	} catch (error: any) {
		// Make sure to restore normal logging even if there's an error
		disableSilentMode();

		log.error(`Error in addSubtaskDirect: ${error.message}`);
		return {
			success: false,
			error: {
				code: 'CORE_FUNCTION_ERROR',
				message: error.message
			}
		};
	}
}