/**
 * show-task.ts
 * Direct function implementation for showing task details
 */

import {
	findTaskById,
	readComplexityReport,
	readJSON
} from '../../../../scripts/modules/utils.js';
import { findTasksPath } from '../utils/path-utils.js';
import { createLogger, AnyLogger } from '../../core/logger.js';

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

interface ShowTaskArgs {
	id: string;
	file?: string;
	reportPath: string;
	status?: string;
	projectRoot: string;
}

interface TasksData {
	tasks: any[];
	[key: string]: any;
}

interface TaskResult {
	task: any;
	originalSubtaskCount: number | null;
}

interface TaskDetails {
	[key: string]: any;
	_originalSubtaskCount?: number;
	_subtaskFilter?: string;
}

/**
 * Direct function wrapper for getting task details.
 */
export async function showTaskDirect(
	args: ShowTaskArgs,
	log: AnyLogger
): Promise<ApiResult<TaskDetails>> {
	// Destructure projectRoot and other args. projectRoot is assumed normalized.
	const { id, file, reportPath, status, projectRoot } = args;

	const mcpLog = createLogger(log);
	mcpLog.info(
		`Showing task direct function. ID: ${id}, File: ${file}, Status Filter: ${status}, ProjectRoot: ${projectRoot}`
	);

	// --- Path Resolution using the passed (already normalized) projectRoot ---
	let tasksJsonPath: string | null;
	try {
		// Use the projectRoot passed directly from args
		tasksJsonPath = findTasksPath(
			{ projectRoot: projectRoot, file: file },
			mcpLog
		);
		if (!tasksJsonPath) {
			throw new Error('Could not find tasks.json path.');
		}
		mcpLog.info(`Resolved tasks path: ${tasksJsonPath}`);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		mcpLog.error(`Error finding tasks.json: ${errorMessage}`);
		return {
			success: false,
			error: {
				code: 'TASKS_FILE_NOT_FOUND',
				message: `Failed to find tasks.json: ${errorMessage}`
			}
		};
	}
	// --- End Path Resolution ---

	// --- Rest of the function remains the same, using tasksJsonPath ---
	try {
		const tasksData: TasksData = readJSON(tasksJsonPath);
		if (!tasksData || !tasksData.tasks) {
			return {
				success: false,
				error: { code: 'INVALID_TASKS_DATA', message: 'Invalid tasks data' }
			};
		}

		const complexityReport = readComplexityReport(reportPath);

		const result: TaskResult = findTaskById(
			tasksData.tasks,
			id,
			complexityReport,
			status
		);

		const { task, originalSubtaskCount } = result;

		if (!task) {
			return {
				success: false,
				error: {
					code: 'TASK_NOT_FOUND',
					message: `Task or subtask with ID ${id} not found`
				}
			};
		}

		mcpLog.info(`Successfully retrieved task ${id}.`);

		const returnData: TaskDetails = { ...task };
		if (originalSubtaskCount !== null) {
			returnData._originalSubtaskCount = originalSubtaskCount;
			returnData._subtaskFilter = status;
		}

		return { success: true, data: returnData };
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		mcpLog.error(`Error showing task ${id}: ${errorMessage}`);
		return {
			success: false,
			error: {
				code: 'TASK_OPERATION_ERROR',
				message: errorMessage
			}
		};
	}
}