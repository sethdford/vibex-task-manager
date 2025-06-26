export interface Subtask {
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

export interface Task {
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

export interface TasksData {
	tasks: Task[];
}
