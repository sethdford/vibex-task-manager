/**
 * logger.ts
 *
 * This file defines a consistent, unified logger interface to be used across the entire
 * vibex-task-manager project. It aims to resolve the multiple, incompatible logger
 * interfaces that have caused TypeScript compilation errors.
 *
 * The `UnifiedLogger` interface includes all methods required by different parts of the
 * application, including the MCP server, direct functions, and core task manager scripts.
 * Optional properties are used to accommodate loggers that may not implement every
 * method (e.g., `debug` or `success`).
 *
 * The `createLogger` function acts as a factory to wrap any incoming logger
 * (from FastMCP or other sources) and ensure it conforms to the `UnifiedLogger`
 * interface, providing safe fallbacks for missing methods.
 */

/**
 * The single, unified logger interface for the entire application.
 * All logger instances should conform to this interface.
 */
export interface UnifiedLogger {
	info: (message: string, ...args: any[]) => void;
	warn: (message: string, ...args: any[]) => void;
	error: (message: string, ...args: any[]) => void;
	debug: (message: string, ...args: any[]) => void;
	success: (message: string, ...args: any[]) => void;
}

/**
 * A type for any logger-like object that can be passed to the wrapper.
 * This is intentionally flexible to handle various logger implementations.
 */
export type AnyLogger = {
	info: (...args: any[]) => void;
	warn: (...args: any[]) => void;
	error: (...args: any[]) => void;
	debug?: (...args: any[]) => void;
	success?: (...args: any[]) => void;
	[key: string]: any; // Allow other properties
};

/**
 * Creates a new logger that conforms to the UnifiedLogger interface,
 * wrapping an existing logger and providing fallbacks for optional methods.
 *
 * @param {AnyLogger} logger - The original logger object to wrap.
 * @returns {UnifiedLogger} A new, safe, and consistent logger object.
 */
export function createLogger(logger: AnyLogger): UnifiedLogger {
	return {
		info: (message: string, ...args: any[]) =>
			logger.info(message, ...args),
		warn: (message: string, ...args: any[]) =>
			logger.warn(message, ...args),
		error: (message: string, ...args: any[]) =>
			logger.error(message, ...args),
		debug: (message: string, ...args: any[]) => {
			if (typeof logger.debug === 'function') {
				logger.debug(message, ...args);
			} else {
				// Fallback for loggers without a `debug` method
				logger.info(`[DEBUG] ${message}`, ...args);
			}
		},
		success: (message: string, ...args: any[]) => {
			if (typeof logger.success === 'function') {
				logger.success(message, ...args);
			} else {
				// Fallback for loggers without a `success` method
				logger.info(`✓ ${message}`, ...args);
			}
		}
	};
} 