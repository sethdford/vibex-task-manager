/**
 * Logger utility functions for Task Manager
 * Provides standardized logging patterns for both CLI and utility contexts
 */

import { log as utilLog } from './utils.js';

export interface StandardLogger {
	info: (msg: string, ...args: any[]) => void;
	warn: (msg: string, ...args: any[]) => void;
	error: (msg: string, ...args: any[]) => void;
	debug: (msg: string, ...args: any[]) => void;
	success: (msg: string, ...args: any[]) => void;
}

/**
 * Creates a standard logger object that wraps the utility log function
 * This provides a consistent logger interface across different parts of the application
 */
export function createStandardLogger(): StandardLogger {
	return {
		info: (msg: string, ...args: any[]) => utilLog('info', msg, ...args),
		warn: (msg: string, ...args: any[]) => utilLog('warn', msg, ...args),
		error: (msg: string, ...args: any[]) => utilLog('error', msg, ...args),
		debug: (msg: string, ...args: any[]) => utilLog('debug', msg, ...args),
		success: (msg: string, ...args: any[]) => utilLog('success', msg, ...args)
	};
}

/**
 * Creates a logger using either the provided logger or a default standard logger
 * This is the recommended pattern for functions that accept an optional logger parameter
 */
export function getLoggerOrDefault<T extends Partial<StandardLogger>>(
	providedLogger: T | null = null
): T | StandardLogger {
	return providedLogger || createStandardLogger();
}
