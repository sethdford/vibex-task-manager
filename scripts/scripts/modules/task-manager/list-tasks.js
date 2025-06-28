import chalk from 'chalk';
import boxen from 'boxen';
import Table from 'cli-table3';
import { log, readJSON, truncate, readComplexityReport as readComplexityReportUtil, addComplexityToTask as addComplexityToTaskUtil } from '../utils.js';
import findNextTask from './find-next-task.js';
import { displayBanner, getStatusWithColor, formatDependenciesWithStatus, getComplexityWithColor, createProgressBar } from '../ui.js';
// Wrapper for readComplexityReport to handle potential null return
const readComplexityReport = (reportPath) => {
    if (!reportPath)
        return null;
    try {
        return readComplexityReportUtil(reportPath);
    }
    catch (error) {
        // Silently fail if report not found, as it's optional
        return null;
    }
};
// Wrapper for addComplexityToTask
const addComplexityToTask = (task, complexityReport) => {
    addComplexityToTaskUtil(task, {
        ...complexityReport,
        complexityAnalysis: complexityReport.complexityAnalysis.map((a) => ({
            taskId: parseInt(a.taskId),
            complexityScore: a.complexity
        }))
    });
};
/**
 * List all tasks
 */
function listTasks(tasksPath, statusFilter, reportPath = null, withSubtasks = false, outputFormat = 'text') {
    try {
        const data = readJSON(tasksPath);
        if (!data || !data.tasks) {
            throw new Error(`No valid tasks found in ${tasksPath}`);
        }
        const complexityReport = readComplexityReport(reportPath);
        if (complexityReport) {
            data.tasks.forEach((task) => addComplexityToTask(task, complexityReport));
        }
        const filteredTasks = statusFilter && statusFilter.toLowerCase() !== 'all'
            ? data.tasks.filter((task) => task.status &&
                task.status.toLowerCase() === statusFilter.toLowerCase())
            : data.tasks;
        const totalTasks = data.tasks.length;
        const completedTasks = data.tasks.filter((task) => task.status === 'done').length;
        const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        const taskStatusBreakdown = {
            done: completedTasks,
            inProgress: data.tasks.filter((t) => t.status === 'in-progress').length,
            pending: data.tasks.filter((t) => t.status === 'pending').length,
            blocked: data.tasks.filter((t) => t.status === 'blocked').length,
            deferred: data.tasks.filter((t) => t.status === 'deferred').length,
            cancelled: data.tasks.filter((t) => t.status === 'cancelled').length
        };
        let totalSubtasks = 0;
        const subtaskStatusBreakdown = {
            done: 0,
            inProgress: 0,
            pending: 0,
            blocked: 0,
            deferred: 0,
            cancelled: 0
        };
        data.tasks.forEach((task) => {
            if (task.subtasks) {
                totalSubtasks += task.subtasks.length;
                task.subtasks.forEach((st) => {
                    if (st.status === 'done')
                        subtaskStatusBreakdown.done++;
                    else if (st.status === 'in-progress')
                        subtaskStatusBreakdown.inProgress++;
                    else if (st.status === 'pending')
                        subtaskStatusBreakdown.pending++;
                    else if (st.status === 'blocked')
                        subtaskStatusBreakdown.blocked++;
                    else if (st.status === 'deferred')
                        subtaskStatusBreakdown.deferred++;
                    else if (st.status === 'cancelled')
                        subtaskStatusBreakdown.cancelled++;
                });
            }
        });
        const subtaskCompletionPercentage = totalSubtasks > 0
            ? (subtaskStatusBreakdown.done / totalSubtasks) * 100
            : 0;
        const completedTaskIds = new Set(data.tasks.filter((t) => t.status === 'done').map((t) => t.id));
        const tasksReadyToWork = data.tasks.filter((t) => t.status !== 'done' &&
            (!t.dependencies ||
                t.dependencies.length === 0 ||
                t.dependencies.every((depId) => completedTaskIds.has(Number(depId))))).length;
        const tasksWithUnsatisfiedDeps = totalTasks - completedTasks - tasksReadyToWork;
        const dependencyCount = {};
        let totalDependencies = 0;
        data.tasks.forEach((task) => {
            if (task.dependencies) {
                totalDependencies += task.dependencies.length;
                task.dependencies.forEach((depId) => {
                    dependencyCount[String(depId)] =
                        (dependencyCount[String(depId)] || 0) + 1;
                });
            }
        });
        let mostDependedOnTaskDetails = null;
        if (Object.keys(dependencyCount).length > 0) {
            const mostDependedOnId = Object.keys(dependencyCount).reduce((a, b) => dependencyCount[a] > dependencyCount[b] ? a : b);
            const task = data.tasks.find((t) => t.id === Number(mostDependedOnId));
            if (task) {
                mostDependedOnTaskDetails = {
                    ...task,
                    dependents: dependencyCount[mostDependedOnId]
                };
            }
        }
        const nextItem = findNextTask(data.tasks, null);
        if (outputFormat === 'json') {
            return {
                success: true,
                tasks: filteredTasks,
                stats: {
                    taskStats: {
                        totalTasks,
                        completionPercentage,
                        statusBreakdown: taskStatusBreakdown
                    },
                    subtaskStats: {
                        totalSubtasks,
                        completionPercentage: subtaskCompletionPercentage,
                        statusBreakdown: subtaskStatusBreakdown
                    },
                    dependencyStats: {
                        tasksWithNoDeps: totalTasks - totalDependencies,
                        tasksWithAllDepsSatisfied: tasksReadyToWork,
                        tasksWithUnsatisfiedDeps: tasksWithUnsatisfiedDeps,
                        tasksReadyToWork,
                        mostDependedOnTask: mostDependedOnTaskDetails,
                        avgDependenciesPerTask: totalTasks > 0 ? totalDependencies / totalTasks : 0
                    }
                },
                nextTask: nextItem
            };
        }
        if (outputFormat === 'text') {
            displayBanner();
            // Display Summary
            const summaryTable = new Table({
                head: [
                    chalk.cyan('Total Tasks'),
                    chalk.cyan('Completed'),
                    chalk.cyan('Progress')
                ],
                colWidths: [15, 15, 40]
            });
            summaryTable.push([
                totalTasks,
                completedTasks,
                createProgressBar(completionPercentage, 20, null)
            ]);
            console.log(summaryTable.toString());
            if (totalSubtasks > 0) {
                const subtaskSummaryTable = new Table({
                    head: [
                        chalk.cyan('Total Subtasks'),
                        chalk.cyan('Completed'),
                        chalk.cyan('Progress')
                    ],
                    colWidths: [15, 15, 40]
                });
                subtaskSummaryTable.push([
                    totalSubtasks,
                    subtaskStatusBreakdown.done,
                    createProgressBar(subtaskCompletionPercentage, 20, null)
                ]);
                console.log(subtaskSummaryTable.toString());
            }
            // Display Tasks
            const table = new Table({
                head: [
                    chalk.blueBright('ID'),
                    chalk.blueBright('Title'),
                    chalk.blueBright('Status'),
                    chalk.blueBright('Priority'),
                    chalk.blueBright('Dependencies'),
                    chalk.blueBright('Complexity')
                ],
                colWidths: [5, 40, 15, 10, 20, 12]
            });
            filteredTasks.forEach((task) => {
                const deps = formatDependenciesWithStatus(task.dependencies || [], data.tasks, false);
                table.push([
                    task.id,
                    truncate(task.title, 38),
                    getStatusWithColor(task.status),
                    task.priority,
                    deps,
                    getComplexityWithColor(task.complexity)
                ]);
                if (withSubtasks && task.subtasks && task.subtasks.length > 0) {
                    task.subtasks.forEach((st) => {
                        const subtaskDeps = formatDependenciesWithStatus(st.dependencies || [], task.subtasks || [], true, null);
                        table.push([
                            `  ${task.id}.${st.id}`,
                            `  ${truncate(st.title, 36)}`,
                            `  ${getStatusWithColor(st.status)}`,
                            `  ${st.priority}`,
                            `  ${subtaskDeps}`,
                            `  ${getComplexityWithColor(st.complexity)}`
                        ]);
                    });
                }
            });
            console.log(table.toString());
            if (nextItem) {
                const nextTaskBox = boxen(`${chalk.green('Next Task:')} #${nextItem.id} - ${nextItem.title}`, {
                    padding: 1,
                    margin: { top: 1 },
                    borderColor: 'green',
                    borderStyle: 'round'
                });
                console.log(nextTaskBox);
            }
            return {
                success: true,
                message: 'Tasks listed successfully'
            };
        }
        return { success: false, error: 'Invalid output format specified.' };
    }
    catch (error) {
        const err = error;
        log('error', `Error listing tasks: ${err.message}`);
        return { success: false, error: err.message };
    }
}
export default listTasks;
//# sourceMappingURL=list-tasks.js.map