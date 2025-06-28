interface Subtask {
    id: number;
    title: string;
    description?: string;
    status: string;
    dependencies?: (number | string)[];
    details?: string;
    priority?: 'high' | 'medium' | 'low';
    complexity?: number;
    parentTaskId?: number;
}
interface Task {
    id: number;
    title: string;
    description?: string;
    status: string;
    dependencies?: (number | string)[];
    subtasks?: Subtask[];
    details?: string;
    priority?: 'high' | 'medium' | 'low';
    complexity?: number;
    dependents?: number;
}
interface StatusBreakdown {
    done: number;
    inProgress: number;
    pending: number;
    blocked: number;
    deferred: number;
    cancelled: number;
}
interface DependencyStats {
    tasksWithNoDeps: number;
    tasksWithAllDepsSatisfied: number;
    tasksWithUnsatisfiedDeps: number;
    tasksReadyToWork: number;
    mostDependedOnTask: Task | null;
    avgDependenciesPerTask: number;
}
interface TaskStats {
    totalTasks: number;
    completionPercentage: number;
    statusBreakdown: StatusBreakdown;
}
interface SubtaskStats {
    totalSubtasks: number;
    completionPercentage: number;
    statusBreakdown: StatusBreakdown;
}
interface ListTasksResult {
    success: boolean;
    message?: string;
    tasks?: Task[];
    stats?: {
        taskStats: TaskStats;
        subtaskStats: SubtaskStats;
        dependencyStats: DependencyStats;
    };
    nextTask?: Task | Subtask | null;
    error?: string;
    details?: string;
}
/**
 * List all tasks
 */
declare function listTasks(tasksPath: string, statusFilter: string, reportPath?: string | null, withSubtasks?: boolean, outputFormat?: string): ListTasksResult;
export default listTasks;
//# sourceMappingURL=list-tasks.d.ts.map