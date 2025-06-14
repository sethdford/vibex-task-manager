/**
 * list-tasks.ts
 * Direct function implementation for listing tasks
 */

import { listTasks } from '../../../../scripts/modules/task-manager.js';
import {
	enableSilentMode,
	disableSilentMode
} from '../../../../scripts/modules/utils.js';

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

interface ListTasksArgs {
	tasksJsonPath: string;
	reportPath?: string;
	status?: string;
	withSubtasks?: boolean;
}

interface TaskData {
	tasks: any[];
	[key: string]: any;
}

/**
 * Direct function wrapper for listTasks with error handling and caching.
 *
 * @param args - Command arguments (now expecting tasksJsonPath explicitly).
 * @param log - Logger object.
 * @returns Task list result { success: boolean, data?: any, error?: { code: string, message: string } }.
 */
export async function listTasksDirect(
	args: ListTasksArgs,
	log: Logger
): Promise<ApiResult<TaskData>> {
	// Destructure the explicit tasksJsonPath from args
	const { tasksJsonPath, reportPath, status, withSubtasks } = args;

	if (!tasksJsonPath) {
		log.error('listTasksDirect called without tasksJsonPath');
		return {
			success: false,
			error: {
				code: 'MISSING_ARGUMENT',
				message: 'tasksJsonPath is required'
			}
		};
	}

	// Use the explicit tasksJsonPath for cache key
	const statusFilter = status || 'all';
	const withSubtasksFilter = withSubtasks || false;

	// Define the action function to be executed on cache miss
	const coreListTasksAction = async (): Promise<ApiResult<TaskData>> => {
		try {
			// Enable silent mode to prevent console logs from interfering with JSON response
			enableSilentMode();

			log.info(
				`Executing core listTasks function for path: ${tasksJsonPath}, filter: ${statusFilter}, subtasks: ${withSubtasksFilter}`
			);
			// Pass the explicit tasksJsonPath to the core function
			const resultData = listTasks(
				tasksJsonPath,
				statusFilter,
				reportPath,
				withSubtasksFilter,
				'json'
			);

			// Check if resultData is a string (error case) or object (success case)
			if (typeof resultData === 'string' || !resultData || !resultData.tasks) {
				log.error('Invalid or empty response from listTasks core function');
				return {
					success: false,
					error: {
						code: 'INVALID_CORE_RESPONSE',
						message: typeof resultData === 'string' ? resultData : 'Invalid or empty response from listTasks core function'
					}
				};
			}

			log.info(
				`Core listTasks function retrieved ${resultData.tasks.length} tasks`
			);

			// Restore normal logging
			disableSilentMode();

			return { success: true, data: resultData as TaskData };
		} catch (error) {
			// Make sure to restore normal logging even if there's an error
			disableSilentMode();

			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			log.error(`Core listTasks function failed: ${errorMessage}`);
			return {
				success: false,
				error: {
					code: 'LIST_TASKS_CORE_ERROR',
					message: errorMessage || 'Failed to list tasks'
				}
			};
		}
	};

	try {
		const result = await coreListTasksAction();
		log.info('listTasksDirect completed');
		return result;
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		log.error(`Unexpected error during listTasks: ${errorMessage}`);
		if (error instanceof Error && error.stack) {
			console.error(error.stack);
		}
		return {
			success: false,
			error: {
				code: 'UNEXPECTED_ERROR',
				message: errorMessage
			}
		};
	}
}