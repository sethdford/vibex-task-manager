/**
 * tools/utils.ts
 * Utility functions for Task Manager CLI integration
 */

import { spawnSync, SpawnSyncReturns } from 'child_process';
import path from 'path';
import fs from 'fs';
import { contextManager } from '../core/context-manager.js';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import { UnifiedLogger, AnyLogger, createLogger } from '../core/logger.js';

// Import path utilities to ensure consistent path resolution
import {
	lastFoundProjectRoot,
	PROJECT_MARKERS
} from '../core/utils/path-utils.js';

const __filename = fileURLToPath(import.meta.url);

// Re-exporting the unified logger types for consistent use across tools.
// 'Logger' is the canonical, safe logger.
// 'InputLogger' is the flexible type for any logger-like object passed into the tools.
export type { UnifiedLogger as Logger, AnyLogger as InputLogger };

export interface MCPContext {
	log: AnyLogger; // MCP context provides a raw logger that needs to be wrapped.
	session?: any;
}

export interface MCPToolResult {
	success: boolean;
	data?: any;
	error?: string;
	status?: string;
}

export interface MCPTool<T = any> {
	name: string;
	description: string;
	parameters: z.ZodSchema<T>;
	execute: MCPToolHandler<T>;
}

export type MCPToolHandler<T = any> = (
	args: T,
	context: MCPContext
) => Promise<MCPToolResult | any>;

interface VersionInfo {
	version: string;
	name: string;
}

interface CommandResult {
	success: boolean;
	stdout?: string;
	stderr?: string;
	error?: string;
	data?: any;
}

// Cache for version info to avoid repeated file reads
let cachedVersionInfo: VersionInfo | null = null;

/**
 * Get version information from package.json
 */
function getVersionInfo(): VersionInfo {
	if (cachedVersionInfo) return cachedVersionInfo;
	try {
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
	} catch (error) {
		// Fallback if reading fails
	}
	cachedVersionInfo = { version: 'unknown', name: 'vibex-task-manager-ai' };
	return cachedVersionInfo;
}

/**
 * Get normalized project root path
 */
function getProjectRoot(
	projectRootRaw: string | undefined,
	log: UnifiedLogger
): string {
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
export function normalizeProjectRoot<T extends { projectRoot?: string }>(
	args: T,
	log: UnifiedLogger
): T & { projectRoot: string } {
	const projectRoot = getProjectRoot(args.projectRoot, log);
	contextManager.updateProjectRoot(projectRoot); // Update context
	return { ...args, projectRoot };
}

/**
 * Higher-order function to wrap MCP tool handlers with project root normalization
 */
export function withNormalizedProjectRoot<T extends { projectRoot?: string }>(
	handler: MCPToolHandler<T & { projectRoot: string }>
): MCPToolHandler<T> {
	return async (args: T, context: MCPContext) => {
		const wrappedLogger = createLogger(context.log);
		const normalizedArgs = normalizeProjectRoot(args, wrappedLogger);
		// The handler receives the original context with the raw logger.
		// It is the responsibility of the tool's `execute` implementation to create a wrapped logger if needed.
		return handler(normalizedArgs, context);
	};
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
	message: string,
	details?: any
): MCPToolResult {
	return {
		success: false,
		error: message,
		...(details && { data: details })
	};
}

/**
 * Create a standardized success response
 */
export function createSuccessResponse(
	data: any,
	message?: string
): MCPToolResult {
	return {
		success: true,
		data,
		...(message && { status: message })
	};
}

/**
 * Handle API result and convert to MCP response
 */
export function handleApiResult(
	result: CommandResult,
	log: AnyLogger,
	errorPrefix: string = 'Error'
): MCPToolResult {
	const wrappedLogger = createLogger(log);
	if (result.success) {
		return createSuccessResponse(result.data || result.stdout);
	} else {
		const errorMessage =
			result.error || result.stderr || 'Unknown error occurred';
		wrappedLogger.error(`${errorPrefix}: ${errorMessage}`);
		return createErrorResponse(`${errorPrefix}: ${errorMessage}`);
	}
}

/**
 * Execute a CLI command and return the result
 */
export function executeCLICommand(
	command: string,
	args: string[],
	options: { cwd?: string; env?: NodeJS.ProcessEnv } = {}
): CommandResult {
	try {
		const result = spawnSync(command, args, {
			...options,
			shell: true,
			encoding: 'utf8'
		}) as SpawnSyncReturns<string>;

		if (result.error) {
			return {
				success: false,
				error: result.error.message
			};
		}

		if (result.status !== 0) {
			return {
				success: false,
				stderr: result.stderr || `Process exited with code ${result.status}`
			};
		}

		return {
			success: true,
			stdout: result.stdout || ''
		};
	} catch (error) {
		return {
			success: false,
			error: (error as Error).message
		};
	}
}

/**
 * Parse JSON safely with error handling
 */
export function safeParseJSON<T = any>(json: string): T | null {
	try {
		return JSON.parse(json);
	} catch {
		return null;
	}
}

/**
 * Create a wrapper for logger that preserves the logger interface
 */
export function createLogWrapper(logger: AnyLogger): UnifiedLogger {
	return createLogger(logger);
}

/**
 * Convert ApiResult to CommandResult format
 */
export function apiResultToCommandResult<T = any>(apiResult: {
	success: boolean;
	data?: T;
	error?: { code: string; message: string } | string;
}): CommandResult {
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
