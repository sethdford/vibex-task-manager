/**
 * remove-task.ts
 * Direct function implementation for removing a task
 */

import {
	removeTask,
	taskExists
} from '../../../../scripts/modules/task-manager.js';
import {
	enableSilentMode,
	disableSilentMode,
	readJSON
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
	details?: string;
}

interface ApiResult<T = any> {
	success: boolean;
	data?: T;
	error?: ApiError;
}

interface RemoveTaskArgs {
	tasksJsonPath: string;
	id: string;
}

interface TaskRemovalResult {
	taskId: string;
	success: boolean;
	message?: string;
	removedTask?: any;
	error?: string;
}

interface RemoveTaskDirectResult {
	totalTasks: number;
	successful: number;
	failed: number;
	results: TaskRemovalResult[];
	tasksPath: string;
}

interface TasksData {
	tasks: any[];
	[key: string]: any;
}

interface RemoveTaskCoreResult {
	success: boolean;
	message: string;
	error: string | null;
	removedTasks: any[];
}

/**
 * Direct function wrapper for removeTask with error handling.
 * Supports removing multiple tasks at once with comma-separated IDs.
 *
 * @param args - Command arguments
 * @param args.tasksJsonPath - Explicit path to the tasks.json file.
 * @param args.id - The ID(s) of the task(s) or subtask(s) to remove (comma-separated for multiple).
 * @param log - Logger object
 * @returns Remove task result { success: boolean, data?: any, error?: { code: string, message: string } }
 */
export async function removeTaskDirect(
	args: RemoveTaskArgs,
	log: Logger
): Promise<ApiResult<RemoveTaskDirectResult>> {
	// Destructure expected args
	const { tasksJsonPath, id } = args;
	
	try {
		// Check if tasksJsonPath was provided
		if (!tasksJsonPath) {
			log.error('removeTaskDirect called without tasksJsonPath');
			return {
				success: false,
				error: {
					code: 'MISSING_ARGUMENT',
					message: 'tasksJsonPath is required'
				}
			};
		}

		// Validate task ID parameter
		if (!id) {
			log.error('Task ID is required');
			return {
				success: false,
				error: {
					code: 'INPUT_VALIDATION_ERROR',
					message: 'Task ID is required'
				}
			};
		}

		// Split task IDs if comma-separated
		const taskIdArray = id.split(',').map((taskId) => taskId.trim());

		log.info(
			`Removing ${taskIdArray.length} task(s) with ID(s): ${taskIdArray.join(', ')} from ${tasksJsonPath}`
		);

		// Validate all task IDs exist before proceeding
		const data: TasksData = readJSON(tasksJsonPath);
		if (!data || !data.tasks) {
			return {
				success: false,
				error: {
					code: 'INVALID_TASKS_FILE',
					message: `No valid tasks found in ${tasksJsonPath}`
				}
			};
		}

		const invalidTasks = taskIdArray.filter(
			(taskId) => !taskExists(data.tasks, taskId)
		);

		if (invalidTasks.length > 0) {
			return {
				success: false,
				error: {
					code: 'INVALID_TASK_ID',
					message: `The following tasks were not found: ${invalidTasks.join(', ')}`
				}
			};
		}

		// Remove tasks one by one
		const results: TaskRemovalResult[] = [];

		// Enable silent mode to prevent console logs from interfering with JSON response
		enableSilentMode();

		try {
			for (const taskId of taskIdArray) {
				try {
					const result: any = await removeTask(tasksJsonPath, taskId);
					if (result.success && result.removedTasks && result.removedTasks.length > 0) {
						// Handle the consolidated result format (with message field)
						const message = result.message || (result.messages && result.messages.join('; ')) || 'Task removed successfully';
						results.push({
							taskId,
							success: true,
							message: message,
							removedTask: result.removedTasks[0] // Take the first removed task
						});
						log.info(`Successfully removed task: ${taskId}`);
					} else {
						// Handle error case
						const error = result.error || (result.errors && result.errors.join('; ')) || 'Unknown error';
						results.push({
							taskId,
							success: false,
							error: error
						});
						log.error(`Error removing task ${taskId}: ${error}`);
					}
				} catch (error: any) {
					results.push({
						taskId,
						success: false,
						error: error.message
					});
					log.error(`Error removing task ${taskId}: ${error.message}`);
				}
			}
		} finally {
			// Restore normal logging
			disableSilentMode();
		}

		// Check if all tasks were successfully removed
		const successfulRemovals = results.filter((r) => r.success);
		const failedRemovals = results.filter((r) => !r.success);

		if (successfulRemovals.length === 0) {
			// All removals failed
			return {
				success: false,
				error: {
					code: 'REMOVE_TASK_ERROR',
					message: 'Failed to remove any tasks',
					details: failedRemovals
						.map((r) => `${r.taskId}: ${r.error}`)
						.join('; ')
				}
			};
		}

		// At least some tasks were removed successfully
		return {
			success: true,
			data: {
				totalTasks: taskIdArray.length,
				successful: successfulRemovals.length,
				failed: failedRemovals.length,
				results: results,
				tasksPath: tasksJsonPath
			}
		};
	} catch (error: any) {
		// Ensure silent mode is disabled even if an outer error occurs
		disableSilentMode();

		// Catch any unexpected errors
		log.error(`Unexpected error in removeTaskDirect: ${error.message}`);
		return {
			success: false,
			error: {
				code: 'UNEXPECTED_ERROR',
				message: error.message
			}
		};
	}
}