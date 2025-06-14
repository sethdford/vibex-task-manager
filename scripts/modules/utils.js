/**
 * utils.ts
 * Utility functions for the Task Manager CLI
 */
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import dotenv from 'dotenv';
// Import specific config getters needed here
import { getLogLevel, getDebugFlag } from './config-manager.js';
import { COMPLEXITY_REPORT_FILE, LEGACY_COMPLEXITY_REPORT_FILE, LEGACY_CONFIG_FILE } from '../../src/constants/paths.js';
// Global silent mode flag
let silentMode = false;
// --- Environment Variable Resolution Utility ---
/**
 * Resolves an environment variable's value.
 * Precedence:
 * 1. session.env (if session provided)
 * 2. process.env
 * 3. .env file at projectRoot (if projectRoot provided)
 * @param key - The environment variable key.
 * @param session - The MCP session object.
 * @param projectRoot - The project root directory (for .env fallback).
 * @returns The value of the environment variable or undefined if not found.
 */
function resolveEnvVariable(key, session = null, projectRoot = null) {
    // 1. Check session.env
    if (session?.env?.[key]) {
        return session.env[key];
    }
    // 2. Read .env file at projectRoot
    if (projectRoot) {
        const envPath = path.join(projectRoot, '.env');
        if (fs.existsSync(envPath)) {
            try {
                const envFileContent = fs.readFileSync(envPath, 'utf-8');
                const parsedEnv = dotenv.parse(envFileContent); // Use dotenv to parse
                if (parsedEnv && parsedEnv[key]) {
                    // console.log(`DEBUG: Found key ${key} in ${envPath}`); // Optional debug log
                    return parsedEnv[key];
                }
            }
            catch (error) {
                // Log error but don't crash, just proceed as if key wasn't found in file
                log('warn', `Could not read or parse ${envPath}: ${error.message}`);
            }
        }
    }
    // 3. Fallback: Check process.env
    if (process.env[key]) {
        return process.env[key];
    }
    // Not found anywhere
    return undefined;
}
// --- Project Root Finding Utility ---
/**
 * Recursively searches upwards for project root starting from a given directory.
 * @param startDir - The directory to start searching from.
 * @param markers - Marker files/dirs to look for.
 * @returns The path to the project root, or null if not found.
 */
function findProjectRoot(startDir = process.cwd(), markers = ['package.json', '.git', LEGACY_CONFIG_FILE]) {
    let currentPath = path.resolve(startDir);
    const rootPath = path.parse(currentPath).root;
    while (currentPath !== rootPath) {
        // Check if any marker exists in the current directory
        const hasMarker = markers.some((marker) => {
            const markerPath = path.join(currentPath, marker);
            return fs.existsSync(markerPath);
        });
        if (hasMarker) {
            return currentPath;
        }
        // Move up one directory
        currentPath = path.dirname(currentPath);
    }
    // Check the root directory as well
    const hasMarkerInRoot = markers.some((marker) => {
        const markerPath = path.join(rootPath, marker);
        return fs.existsSync(markerPath);
    });
    return hasMarkerInRoot ? rootPath : null;
}
// --- Dynamic Configuration Function --- (REMOVED)
// --- Logging and Utility Functions ---
// Set up logging based on log level
const LOG_LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    success: 1 // Treat success like info level
};
/**
 * Returns the task manager module
 * @returns The task manager module object
 */
async function getTaskManager() {
    return import('./task-manager.js');
}
/**
 * Enable silent logging mode
 */
function enableSilentMode() {
    silentMode = true;
}
/**
 * Disable silent logging mode
 */
function disableSilentMode() {
    silentMode = false;
}
/**
 * Check if silent mode is enabled
 * @returns {boolean} True if silent mode is enabled
 */
function isSilentMode() {
    return silentMode;
}
/**
 * Logs a message at the specified level
 * @param level - The log level (debug, info, warn, error)
 * @param args - Arguments to log
 */
function log(level, ...args) {
    // Immediately return if silentMode is enabled
    if (isSilentMode()) {
        return;
    }
    // GUARD: Prevent circular dependency during config loading
    // Use a simple fallback log level instead of calling getLogLevel()
    let configLevel = 'info'; // Default fallback
    try {
        // Only try to get config level if we're not in the middle of config loading
        configLevel = getLogLevel() || 'info';
    }
    catch (error) {
        // If getLogLevel() fails (likely due to circular dependency),
        // use default 'info' level and continue
        configLevel = 'info';
    }
    // Use text prefixes instead of emojis
    const prefixes = {
        debug: chalk.gray('[DEBUG]'),
        info: chalk.blue('[INFO]'),
        warn: chalk.yellow('[WARN]'),
        error: chalk.red('[ERROR]'),
        success: chalk.green('[SUCCESS]')
    };
    // Ensure level exists, default to info if not
    const currentLevel = LOG_LEVELS.hasOwnProperty(level) ? level : 'info';
    // Check log level configuration
    if (LOG_LEVELS[currentLevel] >= (LOG_LEVELS[configLevel] ?? LOG_LEVELS.info)) {
        const prefix = prefixes[currentLevel] || '';
        // Use console.log for all levels, let chalk handle coloring
        // Construct the message properly
        const message = args
            .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : arg))
            .join(' ');
        console.log(`${prefix} ${message}`);
    }
}
/**
 * Reads and parses a JSON file
 * @param filepath - Path to the JSON file
 * @returns Parsed JSON data or null if error occurs
 */
function readJSON(filepath) {
    // GUARD: Prevent circular dependency during config loading
    let isDebug = false; // Default fallback
    try {
        // Only try to get debug flag if we're not in the middle of config loading
        isDebug = getDebugFlag();
    }
    catch (error) {
        // If getDebugFlag() fails (likely due to circular dependency),
        // use default false and continue
        isDebug = false;
    }
    try {
        const rawData = fs.readFileSync(filepath, 'utf8');
        return JSON.parse(rawData);
    }
    catch (error) {
        log('error', `Error reading JSON file ${filepath}:`, error.message);
        if (isDebug) {
            // Use dynamic debug flag
            // Use log utility for debug output too
            log('error', 'Full error details:', error);
        }
        return null;
    }
}
/**
 * Writes data to a JSON file
 * @param filepath - Path to the JSON file
 * @param data - Data to write
 */
function writeJSON(filepath, data) {
    // GUARD: Prevent circular dependency during config loading
    let isDebug = false; // Default fallback
    try {
        // Only try to get debug flag if we're not in the middle of config loading
        isDebug = getDebugFlag();
    }
    catch (error) {
        // If getDebugFlag() fails (likely due to circular dependency),
        // use default false and continue
        isDebug = false;
    }
    try {
        const dir = path.dirname(filepath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
    }
    catch (error) {
        log('error', `Error writing JSON file ${filepath}:`, error.message);
        if (isDebug) {
            // Use dynamic debug flag
            // Use log utility for debug output too
            log('error', 'Full error details:', error);
        }
    }
}
/**
 * Sanitizes a prompt string for use in a shell command
 * @param prompt The prompt to sanitize
 * @returns Sanitized prompt
 */
function sanitizePrompt(prompt) {
    // Replace double quotes with escaped double quotes
    return prompt.replace(/"/g, '\\"');
}
/**
 * Reads the complexity report from file
 * @param customPath - Optional custom path to the report
 * @returns The parsed complexity report or null if not found
 */
function readComplexityReport(customPath = null) {
    // GUARD: Prevent circular dependency during config loading
    let isDebug = false; // Default fallback
    try {
        // Only try to get debug flag if we're not in the middle of config loading
        isDebug = getDebugFlag();
    }
    catch (error) {
        // If getDebugFlag() fails (likely due to circular dependency),
        // use default false and continue
        isDebug = false;
    }
    try {
        let reportPath;
        if (customPath) {
            reportPath = customPath;
        }
        else {
            // Try new location first, then fall back to legacy
            const newPath = path.join(process.cwd(), COMPLEXITY_REPORT_FILE);
            const legacyPath = path.join(process.cwd(), LEGACY_COMPLEXITY_REPORT_FILE);
            reportPath = fs.existsSync(newPath) ? newPath : legacyPath;
        }
        if (!fs.existsSync(reportPath)) {
            if (isDebug) {
                log('debug', `Complexity report not found at ${reportPath}`);
            }
            return null;
        }
        const reportData = readJSON(reportPath);
        if (isDebug) {
            log('debug', `Successfully read complexity report from ${reportPath}`);
        }
        return reportData;
    }
    catch (error) {
        if (isDebug) {
            log('error', `Error reading complexity report: ${error.message}`);
        }
        return null;
    }
}
/**
 * Finds a task analysis in the complexity report
 * @param report - The complexity report
 * @param taskId - The task ID to find
 * @returns The task analysis or null if not found
 */
function findTaskInComplexityReport(report, taskId) {
    if (!report ||
        !report.complexityAnalysis ||
        !Array.isArray(report.complexityAnalysis)) {
        return null;
    }
    return report.complexityAnalysis.find((task) => task.taskId === taskId) || null;
}
function addComplexityToTask(task, complexityReport) {
    let taskId;
    if (task.isSubtask) {
        taskId = task.parentTask?.id;
    }
    else if (task.parentId) {
        taskId = task.parentId;
    }
    else {
        taskId = task.id;
    }
    const taskAnalysis = findTaskInComplexityReport(complexityReport, taskId);
    if (taskAnalysis) {
        task.complexityScore = taskAnalysis.complexityScore;
    }
}
/**
 * Checks if a task exists in the tasks array
 * @param tasks - The tasks array
 * @param taskId - The task ID to check
 * @returns True if the task exists, false otherwise
 */
function taskExists(tasks, taskId) {
    if (!taskId || !tasks || !Array.isArray(tasks)) {
        return false;
    }
    // Handle both regular task IDs and subtask IDs (e.g., "1.2")
    if (typeof taskId === 'string' && taskId.includes('.')) {
        const [parentId, subtaskId] = taskId
            .split('.')
            .map((id) => parseInt(id, 10));
        const parentTask = tasks.find((t) => t.id === parentId);
        if (!parentTask || !parentTask.subtasks) {
            return false;
        }
        return parentTask.subtasks.some((st) => st.id === subtaskId);
    }
    const id = parseInt(String(taskId), 10);
    return tasks.some((t) => t.id === id);
}
/**
 * Formats a task ID as a string
 * @param id - The task ID to format
 * @returns The formatted task ID
 */
function formatTaskId(id) {
    if (typeof id === 'string' && id.includes('.')) {
        return id; // Already formatted as a string with a dot (e.g., "1.2")
    }
    if (typeof id === 'number') {
        return id.toString();
    }
    return id;
}
/**
 * Finds a task by ID in the tasks array. Optionally filters subtasks by status.
 * @param tasks - The tasks array
 * @param taskId - The task ID to find
 * @param complexityReport - Optional pre-loaded complexity report
 * @param statusFilter - Optional status to filter subtasks by
 * @returns The task object (potentially with filtered subtasks) and the original subtask count if filtered, or nulls if not found.
 */
function findTaskById(tasks, taskId, complexityReport = null, statusFilter = null) {
    if (!taskId || !tasks || !Array.isArray(tasks)) {
        return { task: null, originalSubtaskCount: null };
    }
    // Check if it's a subtask ID (e.g., "1.2")
    if (typeof taskId === 'string' && taskId.includes('.')) {
        // If looking for a subtask, statusFilter doesn't apply directly here.
        const [parentId, subtaskId] = taskId
            .split('.')
            .map((id) => parseInt(id, 10));
        const parentTask = tasks.find((t) => t.id === parentId);
        if (!parentTask || !parentTask.subtasks) {
            return { task: null, originalSubtaskCount: null };
        }
        const subtask = parentTask.subtasks.find((st) => st.id === subtaskId);
        if (subtask) {
            // Add reference to parent task for context
            subtask.parentTask = {
                id: parentTask.id,
                title: parentTask.title,
                status: parentTask.status
            };
            subtask.isSubtask = true;
        }
        // If we found a task, check for complexity data
        if (subtask && complexityReport) {
            addComplexityToTask(subtask, complexityReport);
        }
        return { task: subtask || null, originalSubtaskCount: null };
    }
    let taskResult = null;
    const originalSubtaskCount = null;
    // Find the main task
    const id = parseInt(String(taskId), 10);
    const task = tasks.find((t) => t.id === id) || null;
    // If task not found, return nulls
    if (!task) {
        return { task: null, originalSubtaskCount: null };
    }
    taskResult = task;
    // If task found and statusFilter provided, filter its subtasks
    if (statusFilter && task.subtasks && Array.isArray(task.subtasks)) {
        // Clone the task to avoid modifying the original array
        const filteredTask = { ...task };
        filteredTask.subtasks = task.subtasks.filter((subtask) => subtask.status &&
            subtask.status.toLowerCase() === statusFilter.toLowerCase());
        taskResult = filteredTask;
    }
    // If task found and complexityReport provided, add complexity data
    if (taskResult && complexityReport) {
        addComplexityToTask(taskResult, complexityReport);
    }
    // Return the found task and original subtask count
    return { task: taskResult, originalSubtaskCount };
}
/**
 * Truncates text to a specified length
 * @param text - The text to truncate
 * @param maxLength - The maximum length
 * @returns The truncated text
 */
function truncate(text, maxLength) {
    if (!text || text.length <= maxLength) {
        return text;
    }
    return `${text.slice(0, maxLength - 3)}...`;
}
/**
 * Find cycles in a dependency graph using DFS
 * @param subtaskId - Current subtask ID
 * @param dependencyMap - Map of subtask IDs to their dependencies
 * @param visited - Set of visited nodes
 * @param recursionStack - Set of nodes in current recursion stack
 * @param path - Current path in the DFS
 * @returns List of dependency edges that need to be removed to break cycles
 */
function findCycles(subtaskId, dependencyMap, visited = new Set(), recursionStack = new Set(), path = []) {
    // Mark the current node as visited and part of recursion stack
    visited.add(subtaskId);
    recursionStack.add(subtaskId);
    path.push(subtaskId);
    const cyclesToBreak = [];
    // Get all dependencies of the current subtask
    const dependencies = dependencyMap.get(subtaskId) || [];
    // For each dependency
    for (const depId of dependencies) {
        // If not visited, recursively check for cycles
        if (!visited.has(depId)) {
            const cycles = findCycles(depId, dependencyMap, visited, recursionStack, [
                ...path
            ]);
            cyclesToBreak.push(...cycles);
        }
        // If the dependency is in the recursion stack, we found a cycle
        else if (recursionStack.has(depId)) {
            // Find the position of the dependency in the path
            const cycleStartIndex = path.indexOf(depId);
            // The last edge in the cycle is what we want to remove
            // const cycleEdges = path.slice(cycleStartIndex);
            // We'll remove the last edge in the cycle (the one that points back)
            cyclesToBreak.push(depId);
        }
    }
    // Remove the node from recursion stack before returning
    recursionStack.delete(subtaskId);
    return cyclesToBreak;
}
/**
 * Convert a string from camelCase to kebab-case
 * @param str - The string to convert
 * @returns The kebab-case version of the string
 */
const toKebabCase = (str) => {
    // Special handling for common acronyms
    const withReplacedAcronyms = str
        .replace(/ID/g, 'Id')
        .replace(/API/g, 'Api')
        .replace(/UI/g, 'Ui')
        .replace(/URL/g, 'Url')
        .replace(/URI/g, 'Uri')
        .replace(/JSON/g, 'Json')
        .replace(/XML/g, 'Xml')
        .replace(/HTML/g, 'Html')
        .replace(/CSS/g, 'Css');
    // Insert hyphens before capital letters and convert to lowercase
    return withReplacedAcronyms
        .replace(/([A-Z])/g, '-$1')
        .toLowerCase()
        .replace(/^-/, ''); // Remove leading hyphen if present
};
/**
 * Detect camelCase flags in command arguments
 * @param args - Command line arguments to check
 * @returns List of flags that should be converted
 */
function detectCamelCaseFlags(args) {
    const camelCaseFlags = [];
    for (const arg of args) {
        if (arg.startsWith('--')) {
            const flagName = arg.split('=')[0].slice(2); // Remove -- and anything after =
            // Skip single-word flags - they can't be camelCase
            if (!flagName.includes('-') && !/[A-Z]/.test(flagName)) {
                continue;
            }
            // Check for camelCase pattern (lowercase followed by uppercase)
            if (/[a-z][A-Z]/.test(flagName)) {
                const kebabVersion = toKebabCase(flagName);
                if (kebabVersion !== flagName) {
                    camelCaseFlags.push({
                        original: flagName,
                        kebabCase: kebabVersion
                    });
                }
            }
        }
    }
    return camelCaseFlags;
}
/**
 * Aggregates an array of telemetry objects into a single summary object.
 * @param telemetryArray - Array of telemetryData objects.
 * @param overallCommandName - The name for the aggregated command.
 * @returns Aggregated telemetry object or null if input is empty.
 */
function aggregateTelemetry(telemetryArray, overallCommandName) {
    if (!telemetryArray || telemetryArray.length === 0) {
        return null;
    }
    const aggregated = {
        timestamp: new Date().toISOString(), // Use current time for aggregation time
        userId: telemetryArray[0].userId, // Assume userId is consistent
        commandName: overallCommandName,
        modelUsed: 'Multiple', // Default if models vary
        providerName: 'Multiple', // Default if providers vary
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        totalCost: 0,
        currency: telemetryArray[0].currency || 'USD' // Assume consistent currency or default
    };
    const uniqueModels = new Set();
    const uniqueProviders = new Set();
    const uniqueCurrencies = new Set();
    telemetryArray.forEach((item) => {
        aggregated.inputTokens += item.inputTokens || 0;
        aggregated.outputTokens += item.outputTokens || 0;
        aggregated.totalCost += item.totalCost || 0;
        uniqueModels.add(item.modelUsed);
        uniqueProviders.add(item.providerName);
        uniqueCurrencies.add(item.currency || 'USD');
    });
    aggregated.totalTokens = aggregated.inputTokens + aggregated.outputTokens;
    aggregated.totalCost = parseFloat(aggregated.totalCost.toFixed(6)); // Fix precision
    if (uniqueModels.size === 1) {
        aggregated.modelUsed = String([...uniqueModels][0]);
    }
    if (uniqueProviders.size === 1) {
        aggregated.providerName = String([...uniqueProviders][0]);
    }
    if (uniqueCurrencies.size > 1) {
        aggregated.currency = 'Multiple'; // Mark if currencies actually differ
    }
    else if (uniqueCurrencies.size === 1) {
        aggregated.currency = String([...uniqueCurrencies][0]);
    }
    return aggregated;
}
// Export all utility functions and configuration
export { LOG_LEVELS, log, readJSON, writeJSON, sanitizePrompt, readComplexityReport, findTaskInComplexityReport, formatTaskId, findTaskById, truncate, findCycles, toKebabCase, detectCamelCaseFlags, disableSilentMode, enableSilentMode, getTaskManager, isSilentMode, addComplexityToTask, resolveEnvVariable, findProjectRoot, aggregateTelemetry };
