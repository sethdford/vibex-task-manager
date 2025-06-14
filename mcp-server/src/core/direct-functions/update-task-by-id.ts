/**
 * update-task-by-id.ts
 * Direct function implementation for updating a single task by ID with new information
 */

import { updateTaskById } from '../../../../scripts/modules/task-manager.js';
import {
	enableSilentMode,
	disableSilentMode,
	isSilentMode
} from '../../../../scripts/modules/utils.js';
import { createLogWrapper } from '../../tools/utils.js';

// Type definitions for direct function interfaces
interface Logger {
	info(message: string, ...args: any[]): void;
	warn(message: string, ...args: any[]): void;
	error(message: string, ...args: any[]): void;
	debug?(message: string, ...args: any[]): void;
	success?(message: string, ...args: any[]): void;
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

interface UpdateTaskByIdArgs {
	tasksJsonPath: string;
	id: string | number;
	prompt: string;
	research?: boolean;
	projectRoot?: string;
}

interface UpdateTaskByIdResult {
	message: string;
	taskId: string | number;
	tasksPath?: string;
	useResearch?: boolean;
	updated: boolean;
	updatedTask?: any;
	telemetryData?: any;
}

interface CoreUpdateTaskResult {
	updatedTask: any | null;
	telemetryData?: any;
}

/**
 * Direct function wrapper for updateTaskById with error handling.
 */
export async function updateTaskByIdDirect(
	args: UpdateTaskByIdArgs,
	log: Logger,
	context: Context = {}
): Promise<ApiResult<UpdateTaskByIdResult>> {
	const { session } = context;
	// Destructure expected args, including projectRoot
	const { tasksJsonPath, id, prompt, research, projectRoot } = args;

	const logWrapper = createLogWrapper(log);

	try {
		logWrapper.info(
			`Updating task by ID via direct function. ID: ${id}, ProjectRoot: ${projectRoot}`
		);

		// Check if tasksJsonPath was provided
		if (!tasksJsonPath) {
			const errorMessage = 'tasksJsonPath is required but was not provided.';
			logWrapper.error(errorMessage);
			return {
				success: false,
				error: { code: 'MISSING_ARGUMENT', message: errorMessage }
			};
		}

		// Check required parameters (id and prompt)
		if (!id) {
			const errorMessage = 'No task ID specified. Please provide a task ID to update.';
			logWrapper.error(errorMessage);
			return {
				success: false,
				error: { code: 'MISSING_TASK_ID', message: errorMessage }
			};
		}

		if (!prompt) {
			const errorMessage = 'No prompt specified. Please provide a prompt with new information for the task update.';
			logWrapper.error(errorMessage);
			return {
				success: false,
				error: { code: 'MISSING_PROMPT', message: errorMessage }
			};
		}

		// Parse taskId - handle both string and number values
		let taskId: string | number;
		if (typeof id === 'string') {
			// Handle subtask IDs (e.g., "5.2")
			if (id.includes('.')) {
				taskId = id; // Keep as string for subtask IDs
			} else {
				// Parse as integer for main task IDs
				const parsedId = parseInt(id, 10);
				if (isNaN(parsedId)) {
					const errorMessage = `Invalid task ID: ${id}. Task ID must be a positive integer or subtask ID (e.g., "5.2").`;
					logWrapper.error(errorMessage);
					return {
						success: false,
						error: { code: 'INVALID_TASK_ID', message: errorMessage }
					};
				}
				taskId = parsedId;
			}
		} else {
			taskId = id;
		}

		// Use the provided path
		const tasksPath = tasksJsonPath;

		// Get research flag
		const useResearch = research === true;

		logWrapper.info(
			`Updating task with ID ${taskId} with prompt "${prompt}" and research: ${useResearch}`
		);

		const wasSilent = isSilentMode();
		if (!wasSilent) {
			enableSilentMode();
		}

		try {
			// Execute core updateTaskById function with proper parameters
			const coreResult: CoreUpdateTaskResult = await updateTaskById(
				tasksPath,
				taskId,
				prompt,
				useResearch,
				{
					mcpLog: logWrapper,
					session,
					projectRoot,
					commandName: 'update-task',
					outputType: 'mcp'
				},
				'json'
			);

			// Check if the core function returned null or an object without success
			if (!coreResult || coreResult.updatedTask === null) {
				// Core function logs the reason, just return success with info
				const message = `Task ${taskId} was not updated (likely already completed).`;
				logWrapper.info(message);
				return {
					success: true,
					data: {
						message: message,
						taskId: taskId,
						updated: false,
						telemetryData: coreResult?.telemetryData
					}
				};
			}

			// Task was updated successfully
			const successMessage = `Successfully updated task with ID ${taskId} based on the prompt`;
			logWrapper.success?.(successMessage);
			return {
				success: true,
				data: {
					message: successMessage,
					taskId: taskId,
					tasksPath: tasksPath,
					useResearch: useResearch,
					updated: true,
					updatedTask: coreResult.updatedTask,
					telemetryData: coreResult.telemetryData
				}
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			logWrapper.error(`Error updating task by ID: ${errorMessage}`);
			return {
				success: false,
				error: {
					code: 'UPDATE_TASK_CORE_ERROR',
					message: errorMessage || 'Unknown error updating task'
				}
			};
		} finally {
			if (!wasSilent && isSilentMode()) {
				disableSilentMode();
			}
		}
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		logWrapper.error(`Setup error in updateTaskByIdDirect: ${errorMessage}`);
		if (isSilentMode()) disableSilentMode();
		return {
			success: false,
			error: {
				code: 'DIRECT_FUNCTION_SETUP_ERROR',
				message: errorMessage || 'Unknown setup error'
			}
		};
	}
}