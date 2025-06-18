# Integration Examples

Comprehensive examples for integrating Vibex Task Manager with various development environments, CI/CD pipelines, and applications.

## Table of Contents

- [AI Editor Integration](#ai-editor-integration)
- [Node.js Application Integration](#nodejs-application-integration)
- [React/Frontend Integration](#reactfrontend-integration)
- [CI/CD Pipeline Integration](#cicd-pipeline-integration)
- [Webhook and API Integration](#webhook-and-api-integration)
- [Custom Tool Development](#custom-tool-development)
- [Monitoring and Analytics](#monitoring-and-analytics)

---

## AI Editor Integration

### Claude Code Integration

#### Configuration Setup
Add to your `.claude/config.json`:

```json
{
  "mcpServers": {
    "vibex-task-manager": {
      "command": "npx",
      "args": ["vibex-task-manager", "mcp"],
      "env": {
        "VIBEX_PROJECT_PATH": "${workspaceFolder}",
        "DEBUG": "0"
      }
    }
  }
}
```

#### Usage Examples in Claude Code

**Initialize Project:**
```
I need to set up task management for my new project. 
Please initialize Vibex Task Manager with the name "E-commerce Platform" 
and description "Full-stack e-commerce solution with React and Node.js".
```

**Parse Requirements:**
```
I have a PRD document at ./requirements.md. 
Please parse it and generate tasks for the project.
```

**Task Management:**
```
Add a new task: "Implement user authentication with JWT tokens and OAuth integration"

Show me the next task I should work on.

Expand task #5 into detailed subtasks focused on security best practices.
```

### Cursor AI Integration

#### Setup in `cursor-settings.json`:
```json
{
  "mcp.servers": {
    "vibex-task-manager": {
      "command": "npx",
      "args": ["vibex-task-manager", "mcp"],
      "workingDirectory": "${workspaceFolder}"
    }
  }
}
```

#### Cursor AI Prompts:
```
@vibex-task-manager add a task for implementing Redis caching layer

@vibex-task-manager what's the complexity report for this project?

@vibex-task-manager expand all pending tasks and prioritize them
```

### Windsurf Integration

#### Windsurf Configuration:
```json
{
  "mcp": {
    "servers": {
      "vibex-task-manager": {
        "command": "npx vibex-task-manager mcp",
        "args": [],
        "env": {
          "NODE_ENV": "production"
        }
      }
    }
  }
}
```

---

## Node.js Application Integration

### Express.js API Server

```typescript
import express from 'express';
import { TaskService, ConfigManager } from 'vibex-task-manager';

const app = express();
app.use(express.json());

// Initialize Vibex Task Manager
const configManager = new ConfigManager();
const taskService = new TaskService();

// API Routes
app.get('/api/tasks', async (req, res) => {
  try {
    const { status, priority } = req.query;
    const tasks = await taskService.getTasks({
      status: status as TaskStatus,
      priority: priority as Priority
    });
    res.json({ tasks, count: tasks.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const { title, description, priority, dependencies } = req.body;
    
    const task = await taskService.addTask({
      title,
      description,
      priority: priority || 'medium',
      dependencies: dependencies || [],
      status: 'pending'
    });
    
    res.status(201).json({ task });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/tasks/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const task = await taskService.setTaskStatus(
      parseInt(id), 
      status as TaskStatus
    );
    
    res.json({ task });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/tasks/next', async (req, res) => {
  try {
    const nextTask = await taskService.getNextTask({
      priorityWeight: 0.7,
      dependencyWeight: 0.3
    });
    
    if (nextTask) {
      res.json({ task: nextTask });
    } else {
      res.json({ message: 'No available tasks' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tasks/:id/expand', async (req, res) => {
  try {
    const { id } = req.params;
    const { maxSubtasks, detailLevel } = req.body;
    
    const subtasks = await taskService.expandTask(parseInt(id), {
      maxSubtasks: maxSubtasks || 5,
      detailLevel: detailLevel || 'detailed'
    });
    
    res.json({ subtasks });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Task Manager API server running on port 3000');
});
```

### Background Job Processing

```typescript
import { Queue, Worker } from 'bullmq';
import { TaskService } from 'vibex-task-manager';

const taskService = new TaskService();

// Create a queue for task processing
const taskQueue = new Queue('task-processing', {
  connection: { host: 'localhost', port: 6379 }
});

// Worker for processing task updates
const taskWorker = new Worker('task-processing', async (job) => {
  const { taskId, action, data } = job.data;
  
  switch (action) {
    case 'analyze-complexity':
      const analysis = await taskService.analyzeComplexity(taskId);
      await taskService.updateTask(taskId, {
        details: `Complexity: ${analysis.complexity}/10\n${analysis.reasoning}`
      });
      break;
      
    case 'expand-task':
      await taskService.expandTask(taskId, {
        maxSubtasks: data.maxSubtasks,
        detailLevel: data.detailLevel
      });
      break;
      
    case 'validate-dependencies':
      const validation = await taskService.validateDependencies();
      if (!validation.isValid) {
        console.log('Dependency issues found:', validation.errors);
      }
      break;
  }
}, { connection: { host: 'localhost', port: 6379 } });

// Schedule periodic task analysis
setInterval(async () => {
  const tasks = await taskService.getTasks({ status: 'pending' });
  
  for (const task of tasks) {
    if (!task.complexity) {
      await taskQueue.add('analyze-complexity', {
        taskId: task.id,
        action: 'analyze-complexity'
      });
    }
  }
}, 60000); // Every minute

export { taskQueue, taskWorker };
```

---

## React/Frontend Integration

### React Task Dashboard

```tsx
import React, { useState, useEffect } from 'react';
import { Task, TaskStatus, Priority } from 'vibex-task-manager/types';

interface TaskDashboardProps {
  apiBaseUrl: string;
}

const TaskDashboard: React.FC<TaskDashboardProps> = ({ apiBaseUrl }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<{
    status?: TaskStatus;
    priority?: Priority;
  }>({});

  useEffect(() => {
    loadTasks();
  }, [filter]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.status) params.append('status', filter.status);
      if (filter.priority) params.append('priority', filter.priority);
      
      const response = await fetch(`${apiBaseUrl}/api/tasks?${params}`);
      const data = await response.json();
      setTasks(data.tasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (id: number, status: TaskStatus) => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/tasks/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      
      if (response.ok) {
        await loadTasks();
      }
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const expandTask = async (id: number) => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/tasks/${id}/expand`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxSubtasks: 6, detailLevel: 'detailed' })
      });
      
      if (response.ok) {
        await loadTasks();
      }
    } catch (error) {
      console.error('Failed to expand task:', error);
    }
  };

  const getStatusColor = (status: TaskStatus): string => {
    const colors = {
      'pending': 'bg-gray-200 text-gray-800',
      'in-progress': 'bg-blue-200 text-blue-800',
      'done': 'bg-green-200 text-green-800',
      'review': 'bg-yellow-200 text-yellow-800',
      'deferred': 'bg-purple-200 text-purple-800',
      'cancelled': 'bg-red-200 text-red-800'
    };
    return colors[status] || 'bg-gray-200 text-gray-800';
  };

  const getPriorityColor = (priority: Priority): string => {
    const colors = {
      'low': 'border-l-green-500',
      'medium': 'border-l-yellow-500',
      'high': 'border-l-red-500'
    };
    return colors[priority];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Task Dashboard</h1>
        
        {/* Filters */}
        <div className="mt-4 flex gap-4">
          <select
            value={filter.status || ''}
            onChange={(e) => setFilter({...filter, status: e.target.value as TaskStatus || undefined})}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
            <option value="review">Review</option>
            <option value="deferred">Deferred</option>
            <option value="cancelled">Cancelled</option>
          </select>
          
          <select
            value={filter.priority || ''}
            onChange={(e) => setFilter({...filter, priority: e.target.value as Priority || undefined})}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          
          <button
            onClick={() => setFilter({})}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Task Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`bg-white rounded-lg shadow-md border-l-4 ${getPriorityColor(task.priority)} p-6`}
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                {task.title}
              </h3>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                {task.status}
              </span>
            </div>
            
            <p className="text-gray-600 text-sm mb-4 line-clamp-3">
              {task.description}
            </p>
            
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-gray-500">
                Priority: <span className="font-medium">{task.priority}</span>
              </span>
              {task.subtasks && task.subtasks.length > 0 && (
                <span className="text-sm text-gray-500">
                  {task.subtasks.filter(st => st.status === 'done').length}/{task.subtasks.length} subtasks
                </span>
              )}
            </div>
            
            {task.dependencies.length > 0 && (
              <div className="mb-4">
                <span className="text-xs text-gray-500">
                  Depends on: {task.dependencies.join(', ')}
                </span>
              </div>
            )}
            
            <div className="flex gap-2">
              <select
                value={task.status}
                onChange={(e) => updateTaskStatus(task.id, e.target.value as TaskStatus)}
                className="flex-1 text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
                <option value="review">Review</option>
                <option value="deferred">Deferred</option>
                <option value="cancelled">Cancelled</option>
              </select>
              
              <button
                onClick={() => expandTask(task.id)}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                title="Expand into subtasks"
              >
                Expand
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {tasks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No tasks found matching your filters.</p>
        </div>
      )}
    </div>
  );
};

export default TaskDashboard;
```

### Vue.js Integration

```vue
<template>
  <div class="task-manager">
    <h2>Task Manager</h2>
    
    <div class="filters">
      <select v-model="statusFilter" @change="loadTasks">
        <option value="">All Statuses</option>
        <option value="pending">Pending</option>
        <option value="in-progress">In Progress</option>
        <option value="done">Done</option>
      </select>
    </div>
    
    <div class="task-list">
      <div v-for="task in tasks" :key="task.id" class="task-card">
        <h3>{{ task.title }}</h3>
        <p>{{ task.description }}</p>
        <div class="task-meta">
          <span :class="`status-${task.status}`">{{ task.status }}</span>
          <span :class="`priority-${task.priority}`">{{ task.priority }}</span>
        </div>
        <button @click="updateStatus(task.id, 'in-progress')" 
                v-if="task.status === 'pending'">
          Start Task
        </button>
        <button @click="updateStatus(task.id, 'done')" 
                v-if="task.status === 'in-progress'">
          Complete Task
        </button>
      </div>
    </div>
    
    <div class="add-task">
      <input v-model="newTaskTitle" placeholder="Task title" />
      <input v-model="newTaskDescription" placeholder="Task description" />
      <button @click="addTask">Add Task</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { Task, TaskStatus } from 'vibex-task-manager/types';

const tasks = ref<Task[]>([]);
const statusFilter = ref('');
const newTaskTitle = ref('');
const newTaskDescription = ref('');

const loadTasks = async () => {
  try {
    const params = statusFilter.value ? `?status=${statusFilter.value}` : '';
    const response = await fetch(`/api/tasks${params}`);
    const data = await response.json();
    tasks.value = data.tasks;
  } catch (error) {
    console.error('Failed to load tasks:', error);
  }
};

const updateStatus = async (id: number, status: TaskStatus) => {
  try {
    await fetch(`/api/tasks/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    await loadTasks();
  } catch (error) {
    console.error('Failed to update task:', error);
  }
};

const addTask = async () => {
  if (!newTaskTitle.value.trim()) return;
  
  try {
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newTaskTitle.value,
        description: newTaskDescription.value,
        priority: 'medium'
      })
    });
    
    newTaskTitle.value = '';
    newTaskDescription.value = '';
    await loadTasks();
  } catch (error) {
    console.error('Failed to add task:', error);
  }
};

onMounted(() => {
  loadTasks();
});
</script>

<style scoped>
.task-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  margin: 8px 0;
}

.status-pending { color: #orange; }
.status-in-progress { color: #blue; }
.status-done { color: #green; }

.priority-low { color: #gray; }
.priority-medium { color: #orange; }
.priority-high { color: #red; }
</style>
```

---

## CI/CD Pipeline Integration

### GitHub Actions

```yaml
name: Task Management Integration

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  sync-tasks:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Install Vibex Task Manager
      run: npm install -g vibex-task-manager
    
    - name: Initialize project if needed
      run: |
        if [ ! -f tasks.json ]; then
          vibex-task-manager init -n "${{ github.repository }}" -y
        fi
    
    - name: Parse PRD if changed
      run: |
        if git diff --name-only ${{ github.event.before }}..${{ github.sha }} | grep -q "requirements.md\|prd.md"; then
          echo "PRD changed, regenerating tasks..."
          vibex-task-manager parse-prd requirements.md -f
        fi
    
    - name: Analyze task complexity
      run: vibex-task-manager analyze-complexity
    
    - name: Generate task files
      run: vibex-task-manager generate -o docs/tasks
    
    - name: Validate dependencies
      run: vibex-task-manager validate-dependencies
    
    - name: Update README with task status
      run: vibex-task-manager sync-readme
    
    - name: Commit updated tasks
      if: github.event_name == 'push'
      run: |
        git config --local user.email "action@github.com"
        git config --local user.name "GitHub Action"
        git add -A
        if ! git diff --cached --quiet; then
          git commit -m "Update tasks and documentation [skip ci]"
          git push
        fi

  task-completion:
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request' && github.event.action == 'closed' && github.event.pull_request.merged == true
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install Vibex Task Manager
      run: npm install -g vibex-task-manager
    
    - name: Mark tasks as completed
      run: |
        # Extract task IDs from PR title or description
        TASK_IDS=$(echo "${{ github.event.pull_request.title }}" | grep -oE '#[0-9]+' | sed 's/#//')
        
        for TASK_ID in $TASK_IDS; do
          echo "Marking task $TASK_ID as completed"
          vibex-task-manager set-status -i $TASK_ID -s completed || echo "Task $TASK_ID not found"
        done
    
    - name: Generate completion report
      run: |
        echo "## Tasks Completed in PR #${{ github.event.pull_request.number }}" >> completion-report.md
        echo "" >> completion-report.md
        vibex-task-manager list -s completed >> completion-report.md
    
    - name: Comment on PR
      uses: actions/github-script@v6
      with:
        script: |
          const fs = require('fs');
          const report = fs.readFileSync('completion-report.md', 'utf8');
          
          github.rest.issues.createComment({
            issue_number: ${{ github.event.pull_request.number }},
            owner: context.repo.owner,
            repo: context.repo.repo,
            body: report
          });
```

### GitLab CI

```yaml
stages:
  - setup
  - analyze
  - deploy
  - report

variables:
  NODE_VERSION: "18"

setup-tasks:
  stage: setup
  image: node:${NODE_VERSION}
  script:
    - npm install -g vibex-task-manager
    - vibex-task-manager init -n "$CI_PROJECT_NAME" -y || true
    - vibex-task-manager parse-prd requirements.md || echo "No PRD found"
  artifacts:
    paths:
      - tasks.json
      - .taskmanager/config.json
    expire_in: 1 hour

analyze-complexity:
  stage: analyze
  image: node:${NODE_VERSION}
  dependencies:
    - setup-tasks
  script:
    - npm install -g vibex-task-manager
    - vibex-task-manager analyze-complexity -o complexity-report.json
    - vibex-task-manager complexity-report
  artifacts:
    paths:
      - complexity-report.json
    reports:
      junit: complexity-report.json

update-tasks:
  stage: deploy
  image: node:${NODE_VERSION}
  dependencies:
    - setup-tasks
    - analyze-complexity
  script:
    - npm install -g vibex-task-manager
    - vibex-task-manager validate-dependencies
    - vibex-task-manager sync-readme
    - vibex-task-manager generate -o docs/tasks
  artifacts:
    paths:
      - README.md
      - docs/tasks/
  only:
    - main

task-metrics:
  stage: report
  image: node:${NODE_VERSION}
  dependencies:
    - analyze-complexity
  script:
    - npm install -g vibex-task-manager
    - echo "Generating task metrics..."
    - |
      cat > task-metrics.json << EOF
      {
        "total_tasks": $(vibex-task-manager list --format json | jq '. | length'),
        "completed_tasks": $(vibex-task-manager list -s completed --format json | jq '. | length'),
        "pending_tasks": $(vibex-task-manager list -s pending --format json | jq '. | length'),
        "high_priority_tasks": $(vibex-task-manager list --priority high --format json | jq '. | length')
      }
      EOF
    - cat task-metrics.json
  artifacts:
    reports:
      metrics: task-metrics.json
```

### Jenkins Pipeline

```groovy
pipeline {
    agent any
    
    environment {
        NODE_VERSION = '18'
    }
    
    stages {
        stage('Setup') {
            steps {
                sh 'nvm use $NODE_VERSION'
                sh 'npm install -g vibex-task-manager'
                
                script {
                    if (!fileExists('tasks.json')) {
                        sh 'vibex-task-manager init -n "${JOB_NAME}" -y'
                    }
                }
            }
        }
        
        stage('Task Analysis') {
            parallel {
                stage('Parse Requirements') {
                    when {
                        changeset "requirements.md"
                    }
                    steps {
                        sh 'vibex-task-manager parse-prd requirements.md -f'
                    }
                }
                
                stage('Complexity Analysis') {
                    steps {
                        sh 'vibex-task-manager analyze-complexity'
                        
                        publishHTML([
                            allowMissing: false,
                            alwaysLinkToLastBuild: true,
                            keepAll: true,
                            reportDir: '.',
                            reportFiles: 'task-complexity-report.json',
                            reportName: 'Task Complexity Report'
                        ])
                    }
                }
            }
        }
        
        stage('Validate & Generate') {
            steps {
                sh 'vibex-task-manager validate-dependencies'
                sh 'vibex-task-manager fix-dependencies'
                sh 'vibex-task-manager generate -o docs/tasks'
                
                archiveArtifacts artifacts: 'docs/tasks/**/*', fingerprint: true
            }
        }
        
        stage('Update Documentation') {
            when {
                branch 'main'
            }
            steps {
                sh 'vibex-task-manager sync-readme'
                
                script {
                    if (sh(script: 'git diff --quiet', returnStatus: true) != 0) {
                        sh '''
                            git config user.email "jenkins@company.com"
                            git config user.name "Jenkins CI"
                            git add -A
                            git commit -m "Update task documentation [skip ci]"
                            git push origin main
                        '''
                    }
                }
            }
        }
    }
    
    post {
        always {
            script {
                def taskMetrics = sh(
                    script: 'vibex-task-manager list --format json | jq "length"',
                    returnStdout: true
                ).trim()
                
                currentBuild.description = "Total Tasks: ${taskMetrics}"
            }
        }
        
        success {
            emailext (
                subject: "Task Analysis Complete - ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body: """
                    Task analysis completed successfully.
                    
                    Build: ${env.BUILD_URL}
                    Complexity Report: ${env.BUILD_URL}Task_Complexity_Report/
                    
                    Next recommended task: 
                    ${sh(script: 'vibex-task-manager next', returnStdout: true)}
                """,
                to: "${env.CHANGE_AUTHOR_EMAIL}"
            )
        }
    }
}
```

---

## Webhook and API Integration

### Discord Bot Integration

```typescript
import { Client, GatewayIntentBits, SlashCommandBuilder } from 'discord.js';
import { TaskService } from 'vibex-task-manager';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

const taskService = new TaskService();

// Slash Commands
const commands = [
  new SlashCommandBuilder()
    .setName('task-list')
    .setDescription('List all tasks')
    .addStringOption(option =>
      option.setName('status')
        .setDescription('Filter by status')
        .addChoices(
          { name: 'Pending', value: 'pending' },
          { name: 'In Progress', value: 'in-progress' },
          { name: 'Done', value: 'done' }
        )
    ),
    
  new SlashCommandBuilder()
    .setName('task-add')
    .setDescription('Add a new task')
    .addStringOption(option =>
      option.setName('title')
        .setDescription('Task title')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('description')
        .setDescription('Task description')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('priority')
        .setDescription('Task priority')
        .addChoices(
          { name: 'Low', value: 'low' },
          { name: 'Medium', value: 'medium' },
          { name: 'High', value: 'high' }
        )
    ),
    
  new SlashCommandBuilder()
    .setName('task-next')
    .setDescription('Get the next task to work on'),
    
  new SlashCommandBuilder()
    .setName('task-status')
    .setDescription('Update task status')
    .addIntegerOption(option =>
      option.setName('id')
        .setDescription('Task ID')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('status')
        .setDescription('New status')
        .setRequired(true)
        .addChoices(
          { name: 'Pending', value: 'pending' },
          { name: 'In Progress', value: 'in-progress' },
          { name: 'Done', value: 'done' },
          { name: 'Review', value: 'review' }
        )
    )
];

client.on('ready', async () => {
  console.log(`Logged in as ${client.user?.tag}!`);
  
  // Register slash commands
  if (client.application) {
    await client.application.commands.set(commands);
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  try {
    switch (interaction.commandName) {
      case 'task-list':
        const status = interaction.options.getString('status') as TaskStatus;
        const tasks = await taskService.getTasks(status ? { status } : {});
        
        const taskList = tasks.slice(0, 10).map(task => 
          `**${task.id}**: ${task.title} [${task.status}] (${task.priority})`
        ).join('\n');
        
        await interaction.reply({
          content: taskList || 'No tasks found.',
          ephemeral: true
        });
        break;
        
      case 'task-add':
        const title = interaction.options.getString('title', true);
        const description = interaction.options.getString('description', true);
        const priority = interaction.options.getString('priority') as Priority || 'medium';
        
        const newTask = await taskService.addTask({
          title,
          description,
          priority,
          status: 'pending',
          dependencies: []
        });
        
        await interaction.reply(`✅ Created task #${newTask.id}: ${newTask.title}`);
        break;
        
      case 'task-next':
        const nextTask = await taskService.getNextTask();
        
        if (nextTask) {
          await interaction.reply(
            `🎯 **Next Task**: #${nextTask.id}\n` +
            `**Title**: ${nextTask.title}\n` +
            `**Priority**: ${nextTask.priority}\n` +
            `**Description**: ${nextTask.description}`
          );
        } else {
          await interaction.reply('🎉 No pending tasks! All caught up.');
        }
        break;
        
      case 'task-status':
        const taskId = interaction.options.getInteger('id', true);
        const newStatus = interaction.options.getString('status', true) as TaskStatus;
        
        const updatedTask = await taskService.setTaskStatus(taskId, newStatus);
        await interaction.reply(
          `✅ Updated task #${taskId} status to: ${newStatus}`
        );
        break;
    }
  } catch (error) {
    console.error('Command error:', error);
    await interaction.reply('❌ An error occurred while processing your request.');
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
```

### Slack Bot Integration

```typescript
import { App } from '@slack/bolt';
import { TaskService } from 'vibex-task-manager';

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

const taskService = new TaskService();

// Slash command: /tasks
app.command('/tasks', async ({ command, ack, respond }) => {
  await ack();
  
  try {
    const tasks = await taskService.getTasks();
    const taskBlocks = tasks.slice(0, 5).map(task => ({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${task.id}: ${task.title}*\n${task.description}\n_Status: ${task.status} | Priority: ${task.priority}_`
      },
      accessory: {
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'View Details'
        },
        action_id: 'view_task',
        value: task.id.toString()
      }
    }));
    
    await respond({
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '📋 Current Tasks'
          }
        },
        ...taskBlocks
      ]
    });
  } catch (error) {
    await respond('❌ Failed to fetch tasks.');
  }
});

// Slash command: /task-add
app.command('/task-add', async ({ command, ack, client, respond }) => {
  await ack();
  
  // Open modal for task creation
  try {
    await client.views.open({
      trigger_id: command.trigger_id,
      view: {
        type: 'modal',
        callback_id: 'task_creation_modal',
        title: {
          type: 'plain_text',
          text: 'Create New Task'
        },
        blocks: [
          {
            type: 'input',
            block_id: 'task_title',
            element: {
              type: 'plain_text_input',
              action_id: 'title_input',
              placeholder: {
                type: 'plain_text',
                text: 'Enter task title'
              }
            },
            label: {
              type: 'plain_text',
              text: 'Task Title'
            }
          },
          {
            type: 'input',
            block_id: 'task_description',
            element: {
              type: 'plain_text_input',
              action_id: 'description_input',
              multiline: true,
              placeholder: {
                type: 'plain_text',
                text: 'Enter task description'
              }
            },
            label: {
              type: 'plain_text',
              text: 'Description'
            }
          },
          {
            type: 'input',
            block_id: 'task_priority',
            element: {
              type: 'static_select',
              action_id: 'priority_select',
              options: [
                { text: { type: 'plain_text', text: 'Low' }, value: 'low' },
                { text: { type: 'plain_text', text: 'Medium' }, value: 'medium' },
                { text: { type: 'plain_text', text: 'High' }, value: 'high' }
              ]
            },
            label: {
              type: 'plain_text',
              text: 'Priority'
            }
          }
        ],
        submit: {
          type: 'plain_text',
          text: 'Create Task'
        }
      }
    });
  } catch (error) {
    await respond('❌ Failed to open task creation modal.');
  }
});

// Handle modal submission
app.view('task_creation_modal', async ({ ack, body, client }) => {
  await ack();
  
  try {
    const values = body.view.state.values;
    const title = values.task_title.title_input.value;
    const description = values.task_description.description_input.value;
    const priority = values.task_priority.priority_select.selected_option?.value as Priority;
    
    const task = await taskService.addTask({
      title,
      description,
      priority,
      status: 'pending',
      dependencies: []
    });
    
    // Send success message to user
    await client.chat.postMessage({
      channel: body.user.id,
      text: `✅ Created task #${task.id}: ${task.title}`
    });
  } catch (error) {
    console.error('Task creation error:', error);
  }
});

// Button interactions
app.action('view_task', async ({ body, ack, client }) => {
  await ack();
  
  try {
    const taskId = parseInt(body.actions[0].value);
    const task = await taskService.getTask(taskId);
    
    if (task) {
      await client.views.open({
        trigger_id: body.trigger_id,
        view: {
          type: 'modal',
          title: {
            type: 'plain_text',
            text: `Task #${task.id}`
          },
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*${task.title}*\n\n${task.description}\n\n*Status:* ${task.status}\n*Priority:* ${task.priority}`
              }
            },
            {
              type: 'actions',
              elements: [
                {
                  type: 'button',
                  text: { type: 'plain_text', text: 'Start Task' },
                  action_id: 'start_task',
                  value: task.id.toString(),
                  style: 'primary'
                },
                {
                  type: 'button',
                  text: { type: 'plain_text', text: 'Complete Task' },
                  action_id: 'complete_task',
                  value: task.id.toString(),
                  style: 'primary'
                }
              ]
            }
          ]
        }
      });
    }
  } catch (error) {
    console.error('View task error:', error);
  }
});

(async () => {
  await app.start(process.env.PORT || 3000);
  console.log('⚡️ Slack app is running!');
})();
```

---

## Custom Tool Development

### Custom MCP Tool

```typescript
import { FastMCP } from '@fastmcp/core';
import { z } from 'zod';
import { TaskService } from 'vibex-task-manager';

const taskService = new TaskService();

// Custom tool for generating time estimates
const timeEstimationTool = {
  name: 'estimate_task_time',
  description: 'Estimate time required for a task using AI analysis',
  inputSchema: z.object({
    projectRoot: z.string().describe('Project root directory'),
    taskId: z.number().describe('Task ID to estimate'),
    includeSubtasks: z.boolean().optional().default(true)
      .describe('Include subtask time estimates'),
    complexity: z.enum(['simple', 'moderate', 'complex']).optional()
      .describe('Override complexity assessment'),
    teamSize: z.number().optional().default(1)
      .describe('Number of team members working on task')
  })
};

async function handleTimeEstimation(args: z.infer<typeof timeEstimationTool.inputSchema>) {
  try {
    const task = await taskService.getTask(args.taskId);
    if (!task) {
      return {
        type: 'text',
        text: `Error: Task ${args.taskId} not found`
      };
    }
    
    // AI-powered time estimation logic
    const baseEstimate = calculateBaseEstimate(task, args.complexity);
    const subtaskEstimate = args.includeSubtasks 
      ? await calculateSubtaskEstimates(task.subtasks || [])
      : 0;
    
    const totalEstimate = baseEstimate + subtaskEstimate;
    const adjustedEstimate = totalEstimate / args.teamSize;
    
    const result = {
      taskId: args.taskId,
      taskTitle: task.title,
      estimates: {
        baseTask: baseEstimate,
        subtasks: subtaskEstimate,
        total: totalEstimate,
        adjustedForTeam: adjustedEstimate
      },
      breakdown: {
        complexity: args.complexity || assessComplexity(task),
        factorsConsidered: [
          'Task scope and requirements',
          'Dependencies and blockers',
          'Technical complexity',
          'Testing requirements',
          'Documentation needs'
        ]
      },
      recommendations: generateRecommendations(task, adjustedEstimate)
    };
    
    return {
      type: 'text',
      text: JSON.stringify(result, null, 2)
    };
    
  } catch (error) {
    return {
      type: 'text',
      text: `Error estimating task time: ${error.message}`
    };
  }
}

function calculateBaseEstimate(task: Task, complexityOverride?: string): number {
  const complexity = complexityOverride || assessComplexity(task);
  const baseHours = {
    simple: 2,
    moderate: 8,
    complex: 24
  };
  
  return baseHours[complexity] || 8;
}

async function calculateSubtaskEstimates(subtasks: Subtask[]): Promise<number> {
  return subtasks.reduce((total, subtask) => {
    const estimate = calculateBaseEstimate(subtask as any);
    return total + estimate;
  }, 0);
}

function assessComplexity(task: Task): string {
  const indicators = {
    complex: ['integration', 'security', 'performance', 'database', 'api'],
    moderate: ['component', 'service', 'validation', 'testing'],
    simple: ['fix', 'update', 'style', 'documentation']
  };
  
  const text = (task.title + ' ' + task.description).toLowerCase();
  
  for (const [level, keywords] of Object.entries(indicators)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return level;
    }
  }
  
  return 'moderate';
}

function generateRecommendations(task: Task, estimate: number): string[] {
  const recommendations = [];
  
  if (estimate > 16) {
    recommendations.push('Consider breaking this task into smaller subtasks');
  }
  
  if (task.dependencies.length > 3) {
    recommendations.push('Review dependencies to identify potential blockers');
  }
  
  if (estimate < 1) {
    recommendations.push('This task might be too small - consider combining with related work');
  }
  
  return recommendations;
}

// Register the custom tool
const server = new FastMCP('custom-task-tools', '1.0.0');
server.addTool(timeEstimationTool, handleTimeEstimation);

export { server as customTaskToolsServer };
```

### Plugin Architecture

```typescript
// Plugin interface
interface VibexPlugin {
  name: string;
  version: string;
  description: string;
  
  // Lifecycle hooks
  onInit?(context: PluginContext): Promise<void>;
  onTaskAdded?(task: Task): Promise<void>;
  onTaskUpdated?(task: Task, changes: Partial<Task>): Promise<void>;
  onTaskCompleted?(task: Task): Promise<void>;
  
  // Custom tools
  tools?: CustomTool[];
  
  // Configuration schema
  configSchema?: z.ZodSchema;
}

interface PluginContext {
  taskService: TaskService;
  configManager: ConfigManager;
  logger: Logger;
}

interface CustomTool {
  name: string;
  description: string;
  inputSchema: z.ZodSchema;
  handler: (args: any, context: PluginContext) => Promise<any>;
}

// Example plugin: Jira integration
class JiraIntegrationPlugin implements VibexPlugin {
  name = 'jira-integration';
  version = '1.0.0';
  description = 'Sync tasks with Jira';
  
  configSchema = z.object({
    jiraUrl: z.string().url(),
    username: z.string(),
    apiToken: z.string(),
    projectKey: z.string()
  });
  
  private jiraClient: any;
  
  async onInit(context: PluginContext) {
    const config = context.configManager.getPluginConfig(this.name);
    this.jiraClient = new JiraClient(config);
  }
  
  async onTaskAdded(task: Task) {
    // Create corresponding Jira issue
    const jiraIssue = await this.jiraClient.createIssue({
      summary: task.title,
      description: task.description,
      issuetype: { name: 'Task' },
      priority: { name: this.mapPriority(task.priority) }
    });
    
    // Store Jira ID in task metadata
    await this.updateTaskWithJiraId(task.id, jiraIssue.key);
  }
  
  async onTaskUpdated(task: Task, changes: Partial<Task>) {
    const jiraId = await this.getJiraId(task.id);
    if (jiraId && changes.status) {
      await this.jiraClient.updateIssue(jiraId, {
        transition: this.mapStatus(changes.status)
      });
    }
  }
  
  tools = [
    {
      name: 'sync_with_jira',
      description: 'Sync all tasks with Jira',
      inputSchema: z.object({
        projectRoot: z.string(),
        force: z.boolean().optional().default(false)
      }),
      handler: async (args: any, context: PluginContext) => {
        const tasks = await context.taskService.getTasks();
        let syncedCount = 0;
        
        for (const task of tasks) {
          const jiraId = await this.getJiraId(task.id);
          if (!jiraId || args.force) {
            await this.onTaskAdded(task);
            syncedCount++;
          }
        }
        
        return {
          type: 'text',
          text: `Synced ${syncedCount} tasks with Jira`
        };
      }
    }
  ];
  
  private mapPriority(priority: Priority): string {
    const mapping = { low: 'Low', medium: 'Medium', high: 'High' };
    return mapping[priority];
  }
  
  private mapStatus(status: TaskStatus): string {
    const mapping = {
      'pending': 'To Do',
      'in-progress': 'In Progress', 
      'done': 'Done',
      'review': 'Review',
      'cancelled': 'Cancelled'
    };
    return mapping[status] || 'To Do';
  }
  
  private async getJiraId(taskId: number): Promise<string | null> {
    // Implementation to retrieve Jira ID from task metadata
    return null;
  }
  
  private async updateTaskWithJiraId(taskId: number, jiraId: string): Promise<void> {
    // Implementation to store Jira ID in task metadata
  }
}

// Plugin manager
class PluginManager {
  private plugins: Map<string, VibexPlugin> = new Map();
  private context: PluginContext;
  
  constructor(context: PluginContext) {
    this.context = context;
  }
  
  async loadPlugin(plugin: VibexPlugin) {
    this.plugins.set(plugin.name, plugin);
    
    if (plugin.onInit) {
      await plugin.onInit(this.context);
    }
    
    // Register custom tools
    if (plugin.tools) {
      for (const tool of plugin.tools) {
        this.registerCustomTool(tool);
      }
    }
  }
  
  async notifyTaskAdded(task: Task) {
    for (const plugin of this.plugins.values()) {
      if (plugin.onTaskAdded) {
        await plugin.onTaskAdded(task);
      }
    }
  }
  
  async notifyTaskUpdated(task: Task, changes: Partial<Task>) {
    for (const plugin of this.plugins.values()) {
      if (plugin.onTaskUpdated) {
        await plugin.onTaskUpdated(task, changes);
      }
    }
  }
  
  private registerCustomTool(tool: CustomTool) {
    // Register tool with MCP server
    console.log(`Registered custom tool: ${tool.name}`);
  }
}

// Usage
const pluginManager = new PluginManager(context);
await pluginManager.loadPlugin(new JiraIntegrationPlugin());
```

---

## Monitoring and Analytics

### Prometheus Metrics

```typescript
import client from 'prom-client';
import { TaskService } from 'vibex-task-manager';

// Create metrics
const taskCounter = new client.Counter({
  name: 'vibex_tasks_total',
  help: 'Total number of tasks',
  labelNames: ['status', 'priority']
});

const taskDuration = new client.Histogram({
  name: 'vibex_task_completion_duration_hours',
  help: 'Time taken to complete tasks in hours',
  labelNames: ['priority', 'complexity'],
  buckets: [1, 4, 8, 16, 24, 48, 96, 168] // 1h to 1 week
});

const complexityGauge = new client.Gauge({
  name: 'vibex_project_complexity_score',
  help: 'Current project complexity score',
  labelNames: ['project']
});

const dependencyDepth = new client.Histogram({
  name: 'vibex_dependency_depth',
  help: 'Dependency chain depth distribution',
  buckets: [0, 1, 2, 3, 4, 5, 10]
});

class TaskMetricsCollector {
  private taskService: TaskService;
  
  constructor(taskService: TaskService) {
    this.taskService = taskService;
    
    // Collect metrics every 5 minutes
    setInterval(() => this.collectMetrics(), 5 * 60 * 1000);
  }
  
  async collectMetrics() {
    const tasks = await this.taskService.getTasks();
    
    // Reset counters
    taskCounter.reset();
    
    // Count tasks by status and priority
    for (const task of tasks) {
      taskCounter.inc({ 
        status: task.status, 
        priority: task.priority 
      });
    }
    
    // Calculate project complexity
    const totalComplexity = tasks.reduce((sum, task) => 
      sum + (task.complexity || 5), 0
    );
    const avgComplexity = totalComplexity / tasks.length;
    complexityGauge.set({ project: 'main' }, avgComplexity);
    
    // Analyze dependency depths
    for (const task of tasks) {
      const depth = await this.calculateDependencyDepth(task);
      dependencyDepth.observe(depth);
    }
  }
  
  onTaskCompleted(task: Task, startTime: Date, endTime: Date) {
    const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    
    taskDuration.observe(
      { 
        priority: task.priority, 
        complexity: this.getComplexityCategory(task.complexity || 5)
      },
      durationHours
    );
  }
  
  private async calculateDependencyDepth(task: Task): Promise<number> {
    // Implementation to calculate max dependency chain depth
    return 0;
  }
  
  private getComplexityCategory(score: number): string {
    if (score <= 3) return 'low';
    if (score <= 7) return 'medium';
    return 'high';
  }
}

// Express endpoint for metrics
import express from 'express';

const app = express();

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

app.listen(9090, () => {
  console.log('Metrics server listening on port 9090');
});
```

### Grafana Dashboard Configuration

```json
{
  "dashboard": {
    "title": "Vibex Task Manager Dashboard",
    "panels": [
      {
        "title": "Task Status Distribution",
        "type": "piechart",
        "targets": [
          {
            "expr": "sum(vibex_tasks_total) by (status)",
            "legendFormat": "{{status}}"
          }
        ]
      },
      {
        "title": "Task Completion Rate",
        "type": "stat",
        "targets": [
          {
            "expr": "sum(vibex_tasks_total{status=\"done\"}) / sum(vibex_tasks_total) * 100",
            "legendFormat": "Completion %"
          }
        ]
      },
      {
        "title": "Average Task Completion Time",
        "type": "stat",
        "targets": [
          {
            "expr": "histogram_quantile(0.5, vibex_task_completion_duration_hours_bucket)",
            "legendFormat": "Median Hours"
          }
        ]
      },
      {
        "title": "Project Complexity Trend",
        "type": "graph",
        "targets": [
          {
            "expr": "vibex_project_complexity_score",
            "legendFormat": "Complexity Score"
          }
        ]
      },
      {
        "title": "Tasks by Priority",
        "type": "bargauge",
        "targets": [
          {
            "expr": "sum(vibex_tasks_total) by (priority)",
            "legendFormat": "{{priority}}"
          }
        ]
      }
    ]
  }
}
```

### Analytics Dashboard

```typescript
import React, { useState, useEffect } from 'react';
import { Line, Pie, Bar } from 'react-chartjs-2';

interface AnalyticsData {
  taskMetrics: {
    total: number;
    completed: number;
    pending: number;
    inProgress: number;
  };
  completionTrend: Array<{
    date: string;
    completed: number;
    added: number;
  }>;
  complexityDistribution: {
    low: number;
    medium: number;
    high: number;
  };
  averageCompletionTime: {
    low: number;
    medium: number;
    high: number;
  };
}

const AnalyticsDashboard: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState('30d');
  
  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);
  
  const loadAnalytics = async () => {
    try {
      const response = await fetch(`/api/analytics?range=${timeRange}`);
      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };
  
  if (!data) {
    return <div>Loading analytics...</div>;
  }
  
  const taskStatusData = {
    labels: ['Completed', 'In Progress', 'Pending'],
    datasets: [{
      data: [data.taskMetrics.completed, data.taskMetrics.inProgress, data.taskMetrics.pending],
      backgroundColor: ['#10B981', '#3B82F6', '#6B7280']
    }]
  };
  
  const completionTrendData = {
    labels: data.completionTrend.map(d => d.date),
    datasets: [
      {
        label: 'Tasks Completed',
        data: data.completionTrend.map(d => d.completed),
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)'
      },
      {
        label: 'Tasks Added',
        data: data.completionTrend.map(d => d.added),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)'
      }
    ]
  };
  
  const complexityData = {
    labels: ['Low', 'Medium', 'High'],
    datasets: [{
      label: 'Task Count',
      data: [
        data.complexityDistribution.low,
        data.complexityDistribution.medium,
        data.complexityDistribution.high
      ],
      backgroundColor: ['#10B981', '#F59E0B', '#EF4444']
    }]
  };
  
  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Task Analytics</h1>
          
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
        
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Tasks</h3>
            <p className="text-2xl font-bold text-gray-900">{data.taskMetrics.total}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Completion Rate</h3>
            <p className="text-2xl font-bold text-green-600">
              {Math.round((data.taskMetrics.completed / data.taskMetrics.total) * 100)}%
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">In Progress</h3>
            <p className="text-2xl font-bold text-blue-600">{data.taskMetrics.inProgress}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Pending</h3>
            <p className="text-2xl font-bold text-gray-600">{data.taskMetrics.pending}</p>
          </div>
        </div>
        
        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Task Status Distribution</h3>
            <Pie data={taskStatusData} />
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Completion Trend</h3>
            <Line data={completionTrendData} />
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Complexity Distribution</h3>
            <Bar data={complexityData} />
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Average Completion Time (Hours)</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Low Complexity:</span>
                <span className="font-semibold">{data.averageCompletionTime.low}h</span>
              </div>
              <div className="flex justify-between">
                <span>Medium Complexity:</span>
                <span className="font-semibold">{data.averageCompletionTime.medium}h</span>
              </div>
              <div className="flex justify-between">
                <span>High Complexity:</span>
                <span className="font-semibold">{data.averageCompletionTime.high}h</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
```

---

This comprehensive integration guide covers the most common scenarios for integrating Vibex Task Manager into your development workflow. Each example provides production-ready code that can be adapted to your specific requirements and environment.