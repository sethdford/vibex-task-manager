/**
 * Sample task data for testing
 */

import { Task, TaskStatus, Priority } from '../../src/types/index.js';

interface SampleTaskData {
	meta: {
		projectName: string;
		projectVersion: string;
		createdAt: string;
		updatedAt: string;
	};
	tasks: Array<Task & { details?: string }>;
}

export const sampleTasks: SampleTaskData = {
	meta: {
		projectName: 'Test Project',
		projectVersion: '1.0.0',
		createdAt: '2023-01-01T00:00:00.000Z',
		updatedAt: '2023-01-01T00:00:00.000Z'
	},
	tasks: [
		{
			id: 1,
			title: 'Initialize Project',
			description: 'Set up the project structure and dependencies',
			status: 'done' as TaskStatus,
			dependencies: [],
			priority: 'high' as Priority,
			details:
				'Create package.json, install dependencies, set up folder structure'
		},
		{
			id: 2,
			title: 'Create API Endpoints',
			description: 'Implement RESTful API endpoints',
			status: 'in-progress' as TaskStatus,
			dependencies: [1],
			priority: 'high' as Priority,
			details: 'Implement CRUD operations for users and tasks'
		},
		{
			id: 3,
			title: 'Add Authentication',
			description: 'Implement JWT authentication',
			status: 'pending' as TaskStatus,
			dependencies: [2],
			priority: 'medium' as Priority,
			details: 'Add login, logout, and token refresh endpoints'
		},
		{
			id: 4,
			title: 'Write Tests',
			description: 'Create unit and integration tests',
			status: 'pending' as TaskStatus,
			dependencies: [2, 3],
			priority: 'medium' as Priority,
			details: 'Achieve 80% code coverage'
		},
		{
			id: 5,
			title: 'Documentation',
			description: 'Write API documentation',
			status: 'pending' as TaskStatus,
			dependencies: [2],
			priority: 'low' as Priority,
			details: 'Use Swagger/OpenAPI for documentation'
		}
	]
};

export const emptySampleTasks: SampleTaskData = {
	meta: {
		projectName: 'Empty Project',
		projectVersion: '1.0.0',
		createdAt: '2023-01-01T00:00:00.000Z',
		updatedAt: '2023-01-01T00:00:00.000Z'
	},
	tasks: []
};
