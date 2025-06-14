/**
 * task-manager.ts
 * Task management functions for the Task Manager CLI
 */

import { findTaskById } from '../utils/utils.js';
import parsePRD from '../../scripts/modules/task-manager/parse-prd.js';
import updateTasks from '../../scripts/modules/task-manager/update-tasks.js';
import updateTaskById from '../../scripts/modules/task-manager/update-task-by-id.js';
import generateTaskFiles from '../../scripts/modules/task-manager/generate-task-files.js';
import setTaskStatus from '../../scripts/modules/task-manager/set-task-status.js';
import updateSingleTaskStatus from '../../scripts/modules/task-manager/update-single-task-status.js';
import listTasks from '../../scripts/modules/task-manager/list-tasks.js';
import expandTask from '../../scripts/modules/task-manager/expand-task.js';
import expandAllTasks from '../../scripts/modules/task-manager/expand-all-tasks.js';
import clearSubtasks from '../../scripts/modules/task-manager/clear-subtasks.js';
import addTask from '../../scripts/modules/task-manager/add-task.js';
import analyzeTaskComplexity from '../../scripts/modules/task-manager/analyze-task-complexity.js';
import findNextTask from '../../scripts/modules/task-manager/find-next-task.js';
import addSubtask from '../../scripts/modules/task-manager/add-subtask.js';
import removeSubtask from '../../scripts/modules/task-manager/remove-subtask.js';
import updateSubtaskById from '../../scripts/modules/task-manager/update-subtask-by-id.js';
import removeTask from '../../scripts/modules/task-manager/remove-task.js';
import taskExists from '../../scripts/modules/task-manager/task-exists.js';
import isTaskDependentOn from '../../scripts/modules/task-manager/is-task-dependent.js';
import moveTask from '../../scripts/modules/task-manager/move-task.js';
import { migrateProject } from '../../scripts/modules/task-manager/migrate.js';
import { readComplexityReport } from '../utils/utils.js';

// Export task manager functions
export {
  parsePRD,
  updateTasks,
  updateTaskById,
  updateSubtaskById,
  generateTaskFiles,
  setTaskStatus,
  updateSingleTaskStatus,
  listTasks,
  expandTask,
  expandAllTasks,
  clearSubtasks,
  addTask,
  addSubtask,
  removeSubtask,
  findNextTask,
  analyzeTaskComplexity,
  removeTask,
  findTaskById,
  taskExists,
  isTaskDependentOn,
  moveTask,
  migrateProject,
  readComplexityReport
};