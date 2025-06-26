/**
 * tools/utils.ts
 * Utility functions for Task Manager CLI integration
 */
import { spawnSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { contextManager } from '../core/context-manager.js';
import { fileURLToPath } from 'url';
// Import path utilities to ensure consistent path resolution
import {
	lastFoundProjectRoot,
	PROJECT_MARKERS
} from '../core/utils/path-utils.js';
const __filename = fileURLToPath(import.meta.url);
// Cache for version info to avoid repeated file reads
let cachedVersionInfo = null;
/**
 * Get version information from package.json
 */
function getVersionInfo() {
	// Return cached version if available
	if (cachedVersionInfo) {
		return cachedVersionInfo;
	}
	try {
		// Navigate to the project root from the tools directory
		const packageJsonPath = path.join(
			path.dirname(__filename),
			'../../../package.json'
		);
		if (fs.existsSync(packageJsonPath)) {
			const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
			cachedVersionInfo = {
				version: packageJson.version,
				name: packageJson.name
			};
			return cachedVersionInfo;
		}
		cachedVersionInfo = {
			version: 'unknown',
			name: 'vibex-task-manager-ai'
		};
		return cachedVersionInfo;
	} catch (error) {
		// Fallback version info if package.json can't be read
		cachedVersionInfo = {
			version: 'unknown',
			name: 'vibex-task-manager-ai'
		};
		return cachedVersionInfo;
	}
}
/**
 * Get normalized project root path
 */
function getProjectRoot(projectRootRaw, log) {
	// PRECEDENCE ORDER:
	// 1. Environment variable override (VIBEX_TASK_MANAGER_PROJECT_ROOT)
	// 2. Explicitly provided projectRoot in args
	// 3. Previously found/cached project root
	// 4. Current directory if it has project markers
	// 5. Current directory with warning
	// 1. Check for environment variable override
	if (process.env.VIBEX_TASK_MANAGER_PROJECT_ROOT) {
		const envRoot = process.env.VIBEX_TASK_MANAGER_PROJECT_ROOT;
		const absolutePath = path.isAbsolute(envRoot)
			? envRoot
			: path.resolve(process.cwd(), envRoot);
		log.info(
			`Using project root from VIBEX_TASK_MANAGER_PROJECT_ROOT environment variable: ${absolutePath}`
		);
		return absolutePath;
	}
	// 2. If project root is explicitly provided, use it
	if (projectRootRaw) {
		const absolutePath = path.isAbsolute(projectRootRaw)
			? projectRootRaw
			: path.resolve(process.cwd(), projectRootRaw);
		log.info(`Using explicitly provided project root: ${absolutePath}`);
		return absolutePath;
	}
	// 3. If we have a last found project root from a tasks.json search, use that for consistency
	if (lastFoundProjectRoot) {
		log.info(
			`Using last found project root from tasks.json search: ${lastFoundProjectRoot}`
		);
		return lastFoundProjectRoot;
	}
	// 4. Check if current directory has any project markers
	const cwd = process.cwd();
	const hasMarkers = PROJECT_MARKERS.some((marker) =>
		fs.existsSync(path.join(cwd, marker))
	);
	if (hasMarkers) {
		log.info(
			`Using current directory as project root (has project markers): ${cwd}`
		);
		return cwd;
	}
	// 5. Fall back to current directory but warn
	log.warn(
		`No project root specified and no project markers found in current directory: ${cwd}`
	);
	log.warn(
		`Using current directory as project root. Consider using --project-root or setting VIBEX_TASK_MANAGER_PROJECT_ROOT`
	);
	return cwd;
}
/**
 * Extract projectRoot from args and normalize it
 */
export function normalizeProjectRoot(args, log) {
	const projectRoot = getProjectRoot(args.projectRoot, log);
	contextManager.updateProjectRoot(projectRoot); // Update context
	return { ...args, projectRoot };
}
/**
 * Higher-order function to wrap MCP tool handlers with project root normalization
 */
export function withNormalizedProjectRoot(handler) {
	return async (args, context) => {
		const normalizedArgs = normalizeProjectRoot(args, context.log);
		return handler(normalizedArgs, context);
	};
}
/**
 * Create a standardized error response
 */
export function createErrorResponse(message, details) {
	return {
		success: false,
		error: message,
		...(details && { data: details })
	};
}
/**
 * Create a standardized success response
 */
export function createSuccessResponse(data, message) {
	return {
		success: true,
		data,
		...(message && { status: message })
	};
}
/**
 * Handle API result and convert to MCP response
 */
export function handleApiResult(result, log, errorPrefix = 'Error') {
	if (result.success) {
		return createSuccessResponse(result.data || result.stdout);
	} else {
		const errorMessage =
			result.error || result.stderr || 'Unknown error occurred';
		log.error(`${errorPrefix}: ${errorMessage}`);
		return createErrorResponse(`${errorPrefix}: ${errorMessage}`);
	}
}
/**
 * Execute a CLI command and return the result
 */
export function executeCLICommand(command, args, options = {}) {
	try {
		const result = spawnSync(command, args, {
			...options,
			shell: true,
			encoding: 'utf8' // Type workaround
		});
		if (result.error) {
			return {
				success: false,
				error: result.error.message
			};
		}
		if (result.status !== 0) {
			return {
				success: false,
				stderr:
					result.stderr?.toString() ||
					`Process exited with code ${result.status}`
			};
		}
		return {
			success: true,
			stdout: result.stdout?.toString() || ''
		};
	} catch (error) {
		return {
			success: false,
			error: error.message
		};
	}
}
/**
 * Parse JSON safely with error handling
 */
export function safeParseJSON(json) {
	try {
		return JSON.parse(json);
	} catch {
		return null;
	}
}
/**
 * Create a wrapper for logger that preserves the logger interface
 */
export function createLogWrapper(logger) {
	return {
		info: (message, ...args) => logger.info(message, ...args),
		warn: (message, ...args) => logger.warn(message, ...args),
		error: (message, ...args) => logger.error(message, ...args),
		debug: (message, ...args) =>
			logger.debug
				? logger.debug(message, ...args)
				: logger.info(`[DEBUG] ${message}`, ...args)
	};
}
/**
 * Convert ApiResult to CommandResult format
 */
export function apiResultToCommandResult(apiResult) {
	if (apiResult.success) {
		return {
			success: true,
			data: apiResult.data
		};
	} else {
		// Handle both string and object error types
		const errorMessage =
			typeof apiResult.error === 'string'
				? apiResult.error
				: apiResult.error?.message || 'Unknown error occurred';
		return {
			success: false,
			error: errorMessage
		};
	}
}
// Export the version info getter
export { getVersionInfo };
