import path from 'path';
import {
	findTasksPath as coreFindTasksPath,
	findPRDPath as coreFindPrdPath,
	findComplexityReportPath as coreFindComplexityReportPath,
	findProjectRoot as coreFindProjectRoot,
	normalizeProjectRoot
} from '../../../../src/utils/path-utils.js';
import { PROJECT_MARKERS } from '../../../../src/constants/paths.js';
/**
 * Silent logger for MCP context to prevent console output
 */
const silentLogger = {
	info: () => {},
	warn: () => {},
	error: () => {},
	debug: () => {},
	success: () => {}
};
/**
 * Cache for last found project root to improve performance
 */
export const lastFoundProjectRoot = null;
/**
 * Find PRD file with MCP support
 * @param explicitPath - Explicit path to PRD file (highest priority)
 * @param args - Arguments object for context
 * @param log - Logger object to prevent console logging
 * @returns Resolved path to PRD file or null if not found
 */
export function findPrdPath(explicitPath, args = null, log = silentLogger) {
	return coreFindPrdPath(explicitPath, args, log);
}
/**
 * Resolve tasks.json path from arguments
 * Prioritizes explicit path parameter, then uses fallback logic
 * @param args - Arguments object containing projectRoot and optional file path
 * @param log - Logger object to prevent console logging
 * @returns Resolved path to tasks.json or null if not found
 */
export function resolveTasksPath(args, log = silentLogger) {
	// Get explicit path from args.file if provided
	const explicitPath = args?.file;
	const rawProjectRoot = args?.projectRoot;
	// If explicit path is provided and absolute, use it directly
	if (explicitPath && path.isAbsolute(explicitPath)) {
		return explicitPath;
	}
	// Normalize project root if provided
	const projectRoot = rawProjectRoot
		? normalizeProjectRoot(rawProjectRoot)
		: null;
	// If explicit path is relative, resolve it relative to normalized projectRoot
	if (explicitPath && projectRoot) {
		return path.resolve(projectRoot, explicitPath);
	}
	// Use core findTasksPath with explicit path and normalized projectRoot context
	if (projectRoot) {
		return coreFindTasksPath(explicitPath, { projectRoot }, log);
	}
	// Fallback to core function without projectRoot context
	return coreFindTasksPath(explicitPath, null, log);
}
/**
 * Resolve PRD path from arguments
 * @param args - Arguments object containing projectRoot and optional input path
 * @param log - Logger object to prevent console logging
 * @returns Resolved path to PRD file or null if not found
 */
export function resolvePrdPath(args, log = silentLogger) {
	// Get explicit path from args.input if provided
	const explicitPath = args?.input;
	const rawProjectRoot = args?.projectRoot;
	// If explicit path is provided and absolute, use it directly
	if (explicitPath && path.isAbsolute(explicitPath)) {
		return explicitPath;
	}
	// Normalize project root if provided
	const projectRoot = rawProjectRoot
		? normalizeProjectRoot(rawProjectRoot)
		: null;
	// If explicit path is relative, resolve it relative to normalized projectRoot
	if (explicitPath && projectRoot) {
		return path.resolve(projectRoot, explicitPath);
	}
	// Use core findPRDPath with explicit path and normalized projectRoot context
	if (projectRoot) {
		return coreFindPrdPath(explicitPath, { projectRoot }, log);
	}
	// Fallback to core function without projectRoot context
	return coreFindPrdPath(explicitPath, null, log);
}
/**
 * Resolve complexity report path from arguments
 * @param args - Arguments object containing projectRoot and optional complexityReport path
 * @param log - Logger object to prevent console logging
 * @returns Resolved path to complexity report or null if not found
 */
export function resolveComplexityReportPath(args, log = silentLogger) {
	// Get explicit path from args.complexityReport if provided
	const explicitPath = args?.complexityReport;
	const rawProjectRoot = args?.projectRoot;
	// If explicit path is provided and absolute, use it directly
	if (explicitPath && path.isAbsolute(explicitPath)) {
		return explicitPath;
	}
	// Normalize project root if provided
	const projectRoot = rawProjectRoot
		? normalizeProjectRoot(rawProjectRoot)
		: null;
	// If explicit path is relative, resolve it relative to normalized projectRoot
	if (explicitPath && projectRoot) {
		return path.resolve(projectRoot, explicitPath);
	}
	// Use core findComplexityReportPath with explicit path and normalized projectRoot context
	if (projectRoot) {
		return coreFindComplexityReportPath(explicitPath, { projectRoot }, log);
	}
	// Fallback to core function without projectRoot context
	return coreFindComplexityReportPath(explicitPath, null, log);
}
/**
 * Resolve any project-relative path from arguments
 * @param relativePath - Relative path to resolve
 * @param args - Arguments object containing projectRoot
 * @returns Resolved absolute path
 */
export function resolveProjectPath(relativePath, args) {
	// Ensure we have a projectRoot from args
	if (!args?.projectRoot) {
		throw new Error('projectRoot is required in args to resolve project paths');
	}
	// Normalize the project root to prevent double .taskmaster paths
	const projectRoot = normalizeProjectRoot(args.projectRoot);
	// If already absolute, return as-is
	if (path.isAbsolute(relativePath)) {
		return relativePath;
	}
	// Resolve relative to normalized projectRoot
	return path.resolve(projectRoot, relativePath);
}
/**
 * Find project root using core utility
 * @param startDir - Directory to start searching from
 * @returns Project root path or null if not found
 */
export function findProjectRoot(startDir) {
	return coreFindProjectRoot(startDir);
}
// MAIN EXPORTS FOR MCP TOOLS - these are the functions MCP tools should use
/**
 * Find tasks.json path from arguments - primary MCP function
 * @param args - Arguments object containing projectRoot and optional file path
 * @param log - Log function to prevent console logging
 * @returns Resolved path to tasks.json or null if not found
 */
export function findTasksPath(args, log = silentLogger) {
	return resolveTasksPath(args, log);
}
/**
 * Find complexity report path from arguments - primary MCP function
 * @param args - Arguments object containing projectRoot and optional complexityReport path
 * @param log - Log function to prevent console logging
 * @returns Resolved path to complexity report or null if not found
 */
export function findComplexityReportPath(args, log = silentLogger) {
	return resolveComplexityReportPath(args, log);
}
/**
 * Find PRD path - primary MCP function
 * @param explicitPath - Explicit path to PRD file
 * @param args - Arguments object for context (not used in current implementation)
 * @param log - Logger object to prevent console logging
 * @returns Resolved path to PRD file or null if not found
 */
export function findPRDPath(explicitPath, args = null, log = silentLogger) {
	return findPrdPath(explicitPath, args, log);
}
// Legacy aliases for backward compatibility - DEPRECATED
export const findTasksJsonPath = findTasksPath;
export const findComplexityReportJsonPath = findComplexityReportPath;
// Re-export PROJECT_MARKERS for MCP tools that import it from this module
export { PROJECT_MARKERS };
