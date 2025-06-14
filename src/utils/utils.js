/**
 * utils.ts
 * Utility functions for the Task Manager CLI
 */
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import dotenv from 'dotenv';
import { COMPLEXITY_REPORT_FILE, LEGACY_COMPLEXITY_REPORT_FILE, LEGACY_CONFIG_FILE } from '../constants/paths.js';
// Global silent mode flag
let silentMode = false;
// --- Environment Variable Resolution Utility ---
/**
 * Resolves an environment variable's value.
 * Precedence:
 * 1. session.env (if session provided)
 * 2. process.env
 * 3. .env file at projectRoot (if projectRoot provided)
 */
export function resolveEnvVariable(key, session = null, projectRoot = null) {
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
                const parsedEnv = dotenv.parse(envFileContent);
                if (parsedEnv && parsedEnv[key]) {
                    return parsedEnv[key];
                }
            }
            catch (error) {
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
 */
export function findProjectRoot(startDir = process.cwd(), markers = ['package.json', '.git', LEGACY_CONFIG_FILE]) {
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
// --- Logging and Utility Functions ---
// Set up logging based on log level
export const LOG_LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    success: 1 // Treat success like info level
};
/**
 * Returns the task manager module
 */
export async function getTaskManager() {
    // TODO: Convert task-manager module to TypeScript
    return import('../../scripts/modules/task-manager.js');
}
/**
 * Enable silent logging mode
 */
export function enableSilentMode() {
    silentMode = true;
}
/**
 * Disable silent logging mode
 */
export function disableSilentMode() {
    silentMode = false;
}
/**
 * Check if silent mode is enabled
 */
export function isSilentMode() {
    return silentMode;
}
/**
 * Logs a message at the specified level
 */
export function log(level, ...args) {
    // Immediately return if silentMode is enabled
    if (isSilentMode()) {
        return;
    }
    // Use environment variable for log level if available, otherwise default to 'info'
    const configLevel = (process.env.LOG_LEVEL || 'info').toLowerCase();
    // Use text prefixes instead of emojis
    const prefixes = {
        debug: chalk.gray('[DEBUG]'),
        info: chalk.blue('[INFO]'),
        warn: chalk.yellow('[WARN]'),
        error: chalk.red('[ERROR]'),
        success: chalk.green('[SUCCESS]')
    };
    // Ensure level exists, default to info if not
    const currentLevel = level in LOG_LEVELS ? level : 'info';
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
 */
export function readJSON(filepath) {
    // Use environment variable for debug flag if available
    const isDebug = process.env.DEBUG === 'true';
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
 */
export function writeJSON(filepath, data) {
    // Use environment variable for debug flag if available
    const isDebug = process.env.DEBUG === 'true';
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
 */
export function sanitizePrompt(prompt) {
    // Replace double quotes with escaped double quotes
    return prompt.replace(/"/g, '\\"');
}
/**
 * Reads the complexity report from file
 */
export function readComplexityReport(customPath = null) {
    // Use environment variable for debug flag if available
    const isDebug = process.env.DEBUG === 'true';
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
 */
export function findTaskInComplexityReport(report, taskId) {
    if (!report ||
        !report.complexityAnalysis) {
        return null;
    }
    return report.complexityAnalysis.find((task) => task.taskId === taskId);
}
export function addComplexityToTask(task, complexityReport) {
    let taskId;
    if ('isSubtask' in task && task.isSubtask && 'parentTask' in task) {
        const parentTask = task;
        taskId = parentTask.parentTask?.id || task.id;
    }
    else if (task.parentId) {
        taskId = task.parentId;
    }
    else {
        taskId = task.id;
    }
    const taskAnalysis = findTaskInComplexityReport(complexityReport, taskId);
    if (taskAnalysis) {
        task.complexityScore = taskAnalysis.score;
    }
}
/**
 * Checks if a task exists in the tasks array
 */
export function taskExists(tasks, taskId) {
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
    const id = parseInt(taskId.toString(), 10);
    return tasks.some((t) => t.id === id);
}
/**
 * Formats a task ID as a string
 */
export function formatTaskId(id) {
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
 */
export function findTaskById(tasks, taskId, complexityReport = null, statusFilter = null) {
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
            const subtaskWithParent = {
                ...subtask,
                parentTask: {
                    id: parentTask.id,
                    title: parentTask.title,
                    status: parentTask.status
                },
                isSubtask: true
            };
            // If we found a task, check for complexity data
            if (complexityReport) {
                addComplexityToTask(subtaskWithParent, complexityReport);
            }
            return { task: subtaskWithParent, originalSubtaskCount: null };
        }
        return { task: null, originalSubtaskCount: null };
    }
    let taskResult = null;
    let originalSubtaskCount = null;
    // Find the main task
    const id = parseInt(taskId.toString(), 10);
    const task = tasks.find((t) => t.id === id) || null;
    // If task not found, return nulls
    if (!task) {
        return { task: null, originalSubtaskCount: null };
    }
    taskResult = task;
    // If task found and statusFilter provided, filter its subtasks
    if (statusFilter && task.subtasks && Array.isArray(task.subtasks)) {
        originalSubtaskCount = task.subtasks.length;
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
 */
export function truncate(text, maxLength) {
    if (!text || text.length <= maxLength) {
        return text;
    }
    return `${text.slice(0, maxLength - 3)}...`;
}
/**
 * Find cycles in a dependency graph using DFS
 */
export function findCycles(subtaskId, dependencyMap, visited = new Set(), recursionStack = new Set(), path = []) {
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
            // The last edge in the cycle is what we want to remove
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
 */
export const toKebabCase = (str) => {
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
 */
export function detectCamelCaseFlags(args) {
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
 */
export function aggregateTelemetry(telemetryArray, overallCommandName) {
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
        aggregated.modelUsed = [...uniqueModels][0];
    }
    if (uniqueProviders.size === 1) {
        aggregated.providerName = [...uniqueProviders][0];
    }
    if (uniqueCurrencies.size > 1) {
        aggregated.currency = 'Multiple'; // Mark if currencies actually differ
    }
    else if (uniqueCurrencies.size === 1) {
        aggregated.currency = [...uniqueCurrencies][0];
    }
    return aggregated;
}
