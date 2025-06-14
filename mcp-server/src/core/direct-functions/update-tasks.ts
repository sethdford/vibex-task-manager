/**
 * update-tasks.ts
 * Direct function implementation for updating tasks based on new context
 */

import * as path from 'path';
import { updateTasks } from '../../../../scripts/modules/task-manager.js';
import { createLogWrapper } from '../../tools/utils.js';
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

interface UpdateTasksArgs {
	projectRoot: string;
	from: string;
	prompt: string;
	research?: boolean;
	tasksJsonPath?: string;
}

interface UpdateTasksResult {
	message: string;
	tasksPath?: string;
	updatedCount: number;
	telemetryData?: any;
}

interface SessionContext {
	session?: any;
}

interface UpdateTasksCoreResult {
	success: boolean;
	updatedTasks?: any[];
	telemetryData?: any;
	message?: string;
}

/**
 * Direct function wrapper for updating tasks based on new context.
 *
 * @param args - Command arguments containing projectRoot, from, prompt, research options.
 * @param log - Logger object.
 * @param context - Context object containing session data.
 * @returns Result object with success status and data/error information.
 */
export async function updateTasksDirect(
	args: UpdateTasksArgs,
	log: Logger,
	context: SessionContext = {}
): Promise<ApiResult<UpdateTasksResult>> {
	const { session } = context;
	const { from, prompt, research, tasksJsonPath, projectRoot } = args;

	// Create the standard logger wrapper
	const logWrapper = createLogWrapper(log);

	// --- Input Validation ---
	if (!projectRoot) {
		logWrapper.error('updateTasksDirect requires a projectRoot argument.');
		return {
			success: false,
			error: {
				code: 'MISSING_ARGUMENT',
				message: 'projectRoot is required.'
			}
		};
	}

	if (!from) {
		logWrapper.error('updateTasksDirect called without from ID');
		return {
			success: false,
			error: {
				code: 'MISSING_ARGUMENT',
				message: 'Starting task ID (from) is required'
			}
		};
	}

	if (!prompt) {
		logWrapper.error('updateTasksDirect called without prompt');
		return {
			success: false,
			error: {
				code: 'MISSING_ARGUMENT',
				message: 'Update prompt is required'
			}
		};
	}

	logWrapper.info(
		`Updating tasks via direct function. From: ${from}, Research: ${research}, File: ${tasksJsonPath}, ProjectRoot: ${projectRoot}`
	);

	enableSilentMode(); // Enable silent mode
	try {
		// Call the core updateTasks function
		const result: UpdateTasksCoreResult = await updateTasks(
			tasksJsonPath,
			from,
			prompt,
			research,
			{
				session,
				mcpLog: logWrapper,
				projectRoot
			},
			'json'
		);

		if (result && result.success && Array.isArray(result.updatedTasks)) {
			logWrapper.success!(
				`Successfully updated ${result.updatedTasks.length} tasks.`
			);
			return {
				success: true,
				data: {
					message: `Successfully updated ${result.updatedTasks.length} tasks.`,
					tasksPath: tasksJsonPath,
					updatedCount: result.updatedTasks.length,
					telemetryData: result.telemetryData
				}
			};
		} else {
			// Handle case where core function didn't return expected success structure
			logWrapper.error(
				'Core updateTasks function did not return a successful structure.'
			);
			return {
				success: false,
				error: {
					code: 'CORE_FUNCTION_ERROR',
					message:
						result?.message ||
						'Core function failed to update tasks or returned unexpected result.'
				}
			};
		}
	} catch (error: any) {
		logWrapper.error(`Error executing core updateTasks: ${error.message}`);
		return {
			success: false,
			error: {
				code: 'UPDATE_TASKS_CORE_ERROR',
				message: error.message || 'Unknown error updating tasks'
			}
		};
	} finally {
		disableSilentMode(); // Ensure silent mode is disabled
	}
}