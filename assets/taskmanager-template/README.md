# Your Project Name

Welcome to your new project managed with Vibex Task Manager!

## Getting Started

1. **Configure your project**:
   ```bash
   vibex-task-manager models --setup
   ```

2. **View your initial tasks**:
   ```bash
   vibex-task-manager list
   ```

3. **Get started with the first task**:
   ```bash
   vibex-task-manager show 1
   ```

## Project Structure

```
.taskmanager/
├── tasks/           # Task definitions and data
├── docs/            # Project documentation
├── reports/         # Analysis and progress reports
├── templates/       # Task and project templates
└── config.json      # Project configuration
```

## Quick Commands

- `vibex-task-manager list` - View all tasks
- `vibex-task-manager next` - Get next recommended task
- `vibex-task-manager add-task` - Create a new task
- `vibex-task-manager show <id>` - View task details
- `vibex-task-manager set-status <id> <status>` - Update task status

## Documentation

- Edit `.taskmanager/docs/prd.txt` with your project requirements
- Run `vibex-task-manager parse-prd` to generate tasks from your PRD
- Use `.taskmanager/docs/notes/` for project notes
- Research findings go in `.taskmanager/docs/research/`

## AI Features

This project is configured to use AWS Bedrock Claude models for:
- Intelligent task generation
- Complexity analysis
- Research assistance
- Task recommendations

Make sure your AWS credentials are configured for the best experience.

## Need Help?

- Run `vibex-task-manager --help` for available commands
- Check the documentation in `.taskmanager/docs/`
- View task details with `vibex-task-manager show <task-id>`

Happy building! 🚀 