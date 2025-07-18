import chalk from 'chalk';
import { isSilentMode } from '../../scripts/modules/utils.js';
import { getLogLevel } from '../../scripts/modules/config-manager.js';

// Define log levels
interface LogLevels {
	debug: number;
	info: number;
	warn: number;
	error: number;
	success: number;
}

const LOG_LEVELS: LogLevels = {
	debug: 0,
	info: 1,
	warn: 2,
	error: 3,
	success: 4
};

type LogLevel = keyof LogLevels;

// Get log level from config manager or default to info
const LOG_LEVEL =
	LOG_LEVELS[getLogLevel().toLowerCase() as LogLevel] ?? LOG_LEVELS.info;

/**
 * Logs a message with the specified level
 * @param level - The log level (debug, info, warn, error, success)
 * @param args - Arguments to log
 */
function log(level: LogLevel, ...args: any[]): void {
	// Skip logging if silent mode is enabled
	if (isSilentMode()) {
		return;
	}

	// Use text prefixes instead of emojis
	const prefixes: Record<LogLevel, string> = {
		debug: chalk.gray('[DEBUG]'),
		info: chalk.blue('[INFO]'),
		warn: chalk.yellow('[WARN]'),
		error: chalk.red('[ERROR]'),
		success: chalk.green('[SUCCESS]')
	};

	if (LOG_LEVELS[level] !== undefined && LOG_LEVELS[level] >= LOG_LEVEL) {
		const prefix = prefixes[level] || '';
		let coloredArgs = args;

		try {
			switch (level) {
				case 'error':
					coloredArgs = args.map((arg) =>
						typeof arg === 'string' ? chalk.red(arg) : arg
					);
					break;
				case 'warn':
					coloredArgs = args.map((arg) =>
						typeof arg === 'string' ? chalk.yellow(arg) : arg
					);
					break;
				case 'success':
					coloredArgs = args.map((arg) =>
						typeof arg === 'string' ? chalk.green(arg) : arg
					);
					break;
				case 'info':
					coloredArgs = args.map((arg) =>
						typeof arg === 'string' ? chalk.blue(arg) : arg
					);
					break;
				case 'debug':
					coloredArgs = args.map((arg) =>
						typeof arg === 'string' ? chalk.gray(arg) : arg
					);
					break;
				// default: use original args (no color)
			}
		} catch (colorError) {
			// Fallback if chalk fails on an argument
			// Use console.error here for internal logger errors, separate from normal logging
			console.error('Internal Logger Error applying chalk color:', colorError);
			coloredArgs = args;
		}

		// Revert to console.log - FastMCP's context logger (context.log)
		// is responsible for directing logs correctly (e.g., to stderr)
		// during tool execution without upsetting the client connection.
		// Logs outside of tool execution (like startup) will go to stdout.
		console.log(prefix, ...coloredArgs);
	}
}

interface Logger {
	debug: (...args: any[]) => void;
	info: (...args: any[]) => void;
	warn: (...args: any[]) => void;
	error: (...args: any[]) => void;
	success: (...args: any[]) => void;
	log: typeof log;
}

/**
 * Create a logger object with methods for different log levels
 * @returns Logger object with info, error, debug, warn, and success methods
 */
export function createLogger(): Logger {
	const createLogMethod =
		(level: LogLevel) =>
		(...args: any[]) =>
			log(level, ...args);

	return {
		debug: createLogMethod('debug'),
		info: createLogMethod('info'),
		warn: createLogMethod('warn'),
		error: createLogMethod('error'),
		success: createLogMethod('success'),
		log: log // Also expose the raw log function
	};
}

// Export a default logger instance
const logger = createLogger();

export default logger;
export { log, LOG_LEVELS };
export type { LogLevel, LogLevels, Logger };
