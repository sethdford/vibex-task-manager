import { jest } from '@jest/globals';
import { TaskService } from '../task-service';
import fs from 'fs-extra';
import path from 'path';
import type { Task, TasksData } from '../../types';

jest.mock('fs-extra');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('TaskService', () => {
  let taskService: TaskService;
  const testProjectPath = '/test/project';
  const tasksPath = path.join(testProjectPath, '.taskmaster', 'tasks', 'tasks.json');

  const mockTasks: Task[] = [
    {
      id: 1,
      title: 'Task 1',
      description: 'First task',
      status: 'done',
      dependencies: [],
      priority: 'high',
      details: 'Task 1 details',
      subtasks: []
    },
    {
      id: 2,
      title: 'Task 2',
      description: 'Second task',
      status: 'pending',
      dependencies: [1],
      priority: 'medium',
      details: 'Task 2 details',
      subtasks: []
    },
    {
      id: 3,
      title: 'Task 3',
      description: 'Third task',
      status: 'pending',
      dependencies: [],
      priority: 'low',
      details: 'Task 3 details',
      subtasks: []
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    taskService = new TaskService(testProjectPath);
  });

  describe('getTasks', () => {
    it('should return empty array when tasks file does not exist', async () => {
      mockFs.pathExists.mockResolvedValue(false);
      
      const tasks = await taskService.getTasks();
      
      expect(tasks).toEqual([]);
      expect(mockFs.pathExists).toHaveBeenCalledWith(tasksPath);
    });

    it('should return tasks when file exists', async () => {
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readJson.mockResolvedValue({ tasks: mockTasks });
      
      const tasks = await taskService.getTasks();
      
      expect(tasks).toEqual(mockTasks);
      expect(mockFs.readJson).toHaveBeenCalledWith(tasksPath);
    });

    it('should handle read errors', async () => {
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readJson.mockRejectedValue(new Error('Read error'));
      
      await expect(taskService.getTasks()).rejects.toThrow('Read error');
    });
  });

  describe('getTask', () => {
    it('should return task by ID', async () => {
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readJson.mockResolvedValue({ tasks: mockTasks });
      
      const task = await taskService.getTask(2);
      
      expect(task).toEqual(mockTasks[1]);
    });

    it('should return undefined for non-existent task', async () => {
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readJson.mockResolvedValue({ tasks: mockTasks });
      
      const task = await taskService.getTask(999);
      
      expect(task).toBeUndefined();
    });
  });

  describe('saveTasks', () => {
    it('should save tasks to file', async () => {
      await taskService.saveTasks(mockTasks);
      
      expect(mockFs.ensureDir).toHaveBeenCalledWith(path.dirname(tasksPath));
      expect(mockFs.writeJson).toHaveBeenCalledWith(
        tasksPath,
        { tasks: mockTasks },
        { spaces: 2 }
      );
    });

    it('should handle save errors', async () => {
      mockFs.writeJson.mockRejectedValue(new Error('Write error'));
      
      await expect(taskService.saveTasks(mockTasks)).rejects.toThrow('Write error');
    });
  });

  describe('addTask', () => {
    it('should add new task with generated ID', async () => {
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readJson.mockResolvedValue({ tasks: mockTasks });
      
      const newTaskData = {
        title: 'New Task',
        description: 'New task description',
        status: 'pending' as const,
        dependencies: [1, 2],
        priority: 'high' as const
      };
      
      const newTask = await taskService.addTask(newTaskData);
      
      expect(newTask.id).toBe(4); // Next ID after existing tasks
      expect(newTask.title).toBe('New Task');
      expect(mockFs.writeJson).toHaveBeenCalled();
    });
  });

  describe('updateTask', () => {
    it('should update existing task', async () => {
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readJson.mockResolvedValue({ tasks: [...mockTasks] });
      
      const updatedTask = await taskService.updateTask(2, {
        status: 'in-progress',
        priority: 'high'
      });
      
      expect(updatedTask?.status).toBe('in-progress');
      expect(updatedTask?.priority).toBe('high');
      expect(mockFs.writeJson).toHaveBeenCalled();
    });

    it('should return undefined for non-existent task', async () => {
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readJson.mockResolvedValue({ tasks: mockTasks });
      
      const result = await taskService.updateTask(999, { status: 'done' });
      
      expect(result).toBeUndefined();
    });
  });

  describe('getNextTask', () => {
    it('should return highest priority pending task with completed dependencies', async () => {
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readJson.mockResolvedValue({ tasks: mockTasks });
      
      const nextTask = await taskService.getNextTask();
      
      // Task 3 has no dependencies and is pending with low priority
      // Task 2 has dependencies on task 1 (done) and is pending with medium priority
      // Should return task 2 because it has higher priority
      expect(nextTask?.id).toBe(2);
    });

    it('should return undefined when no tasks are available', async () => {
      const allDoneTasks = mockTasks.map(t => ({ ...t, status: 'done' as const }));
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readJson.mockResolvedValue({ tasks: allDoneTasks });
      
      const nextTask = await taskService.getNextTask();
      
      expect(nextTask).toBeUndefined();
    });
  });

  describe('validateDependencies', () => {
    it('should return valid when all dependencies exist', async () => {
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readJson.mockResolvedValue({ tasks: mockTasks });
      
      const result = await taskService.validateDependencies();
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect non-existent dependencies', async () => {
      const tasksWithBadDep = [
        ...mockTasks,
        {
          id: 4,
          title: 'Task 4',
          description: 'Fourth task',
          status: 'pending' as const,
          dependencies: [999], // Non-existent dependency
          priority: 'medium' as const
        }
      ];
      
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readJson.mockResolvedValue({ tasks: tasksWithBadDep });
      
      const result = await taskService.validateDependencies();
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Task #4 depends on non-existent task #999');
    });

    it('should detect circular dependencies', async () => {
      const tasksWithCircular = [
        {
          id: 1,
          title: 'Task 1',
          description: 'First task',
          status: 'pending' as const,
          dependencies: [2], // Circular: 1 -> 2
          priority: 'high' as const
        },
        {
          id: 2,
          title: 'Task 2',
          description: 'Second task',
          status: 'pending' as const,
          dependencies: [1], // Circular: 2 -> 1
          priority: 'medium' as const
        }
      ];
      
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readJson.mockResolvedValue({ tasks: tasksWithCircular });
      
      const result = await taskService.validateDependencies();
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('circular dependencies'))).toBe(true);
    });
  });
});