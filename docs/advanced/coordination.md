# Agent Coordination Guide

This guide covers how AI agents can effectively coordinate when working with Vibex Task Manager in complex development environments.

## Overview

When multiple AI agents work on the same project, coordination becomes crucial to avoid conflicts, duplicate work, and ensure consistent progress. Vibex Task Manager provides several mechanisms to support multi-agent coordination.

## Coordination Strategies

### 1. Task Status Management

Use task statuses to communicate work allocation:

```bash
# Agent A claims a task
vibex-task-manager set-status --id 5 --status in-progress

# Agent B checks what's available
vibex-task-manager list --status pending

# Agent A updates progress
vibex-task-manager update-task --id 5 --prompt "Implemented authentication middleware"

# Agent A completes the task
vibex-task-manager set-status --id 5 --status done
```

### 2. Dependency-Based Coordination

Leverage task dependencies to ensure proper sequencing:

```bash
# Set up dependencies so agents work in correct order
vibex-task-manager add-dependency --id 7 --depends-on 5

# Agent B waits for Agent A to complete task 5 before starting 7
vibex-task-manager next  # Will not return task 7 until 5 is done
```

### 3. Subtask Distribution

Break down complex tasks into subtasks for parallel work:

```bash
# Agent A expands a complex task
vibex-task-manager expand --id 3 --num 5

# Agents can work on different subtasks simultaneously
# Agent A: subtask 3.1
# Agent B: subtask 3.2
# Agent C: subtask 3.3
```

## Communication Patterns

### Progress Updates

Agents should regularly update task progress:

```bash
# Update with specific progress information
vibex-task-manager update-task --id 5 --append --prompt "
Progress Update $(date):
- Completed user registration endpoint
- Added input validation
- Next: Implement password hashing
"
```

### Handoff Procedures

When one agent completes work that another needs to continue:

```bash
# Agent A completes foundation work
vibex-task-manager update-task --id 5 --prompt "
Handoff to next agent:
- Database schema created in migrations/001_users.sql
- User model implemented in models/user.js
- Ready for authentication implementation
"

vibex-task-manager set-status --id 5 --status done

# Agent B can now start dependent work
vibex-task-manager next  # Will return the next logical task
```

### Conflict Resolution

When agents need to coordinate on overlapping work:

```bash
# Agent discovers potential conflict
vibex-task-manager update-task --id 8 --append --prompt "
COORDINATION NOTE:
This task may overlap with task 6 (API endpoints).
Recommend reviewing both tasks before proceeding.
See: vibex-task-manager show 6
"
```

## Best Practices

### 1. Atomic Task Updates

Make updates atomic and descriptive:

```bash
# Good: Specific, actionable update
vibex-task-manager update-task --id 5 --prompt "
Implemented OAuth2 integration:
- Added passport.js dependency
- Created OAuth strategies for Google, GitHub
- Updated login routes in routes/auth.js
- Tests passing: npm test auth
"

# Avoid: Vague updates
vibex-task-manager update-task --id 5 --prompt "Working on auth"
```

### 2. Status Discipline

Maintain consistent status usage:

- **pending**: Ready to start, no dependencies blocking
- **in-progress**: Agent actively working on it
- **review**: Completed, needs review by another agent
- **done**: Fully completed and verified
- **deferred**: Temporarily postponed
- **cancelled**: No longer needed

### 3. Dependency Hygiene

Keep dependencies accurate and up-to-date:

```bash
# Regularly validate dependencies
vibex-task-manager validate-dependencies

# Fix any issues found
vibex-task-manager fix-dependencies
```

### 4. Context Preservation

Maintain rich context for future agents:

```bash
# Include relevant context in task updates
vibex-task-manager update-task --id 5 --prompt "
Implementation Details:
- Used bcrypt for password hashing (rounds: 12)
- JWT tokens expire after 24 hours
- Refresh tokens stored in Redis
- Rate limiting: 5 login attempts per minute

Dependencies:
- Requires Redis server running
- Environment variables: JWT_SECRET, REDIS_URL

Testing:
- Unit tests: npm test auth
- Integration tests: npm run test:integration
- Manual testing: npm run dev, visit /login

Next Steps:
- Add password reset functionality
- Implement 2FA support
- Add session management UI
"
```

## Multi-Agent Workflows

### Parallel Development

For independent features:

```bash
# Agent A: Frontend components
vibex-task-manager set-status --id 10 --status in-progress

# Agent B: Backend API
vibex-task-manager set-status --id 11 --status in-progress

# Agent C: Database optimization
vibex-task-manager set-status --id 12 --status in-progress
```

### Sequential Development

For dependent features:

```bash
# Agent A: Database schema
vibex-task-manager set-status --id 1 --status in-progress
# ... complete work ...
vibex-task-manager set-status --id 1 --status done

# Agent B: API layer (depends on schema)
vibex-task-manager next  # Returns task 2 (API layer)
vibex-task-manager set-status --id 2 --status in-progress
```

### Review Workflows

For quality assurance:

```bash
# Agent A completes implementation
vibex-task-manager set-status --id 5 --status review
vibex-task-manager update-task --id 5 --append --prompt "
Ready for review:
- Code committed to feature/auth branch
- All tests passing
- Documentation updated in docs/auth.md
- Demo available at /demo/auth
"

# Agent B reviews
vibex-task-manager update-task --id 5 --append --prompt "
Code Review Complete:
✅ Code quality good
✅ Tests comprehensive
✅ Documentation clear
⚠️  Minor suggestion: Add rate limiting to /login endpoint
"

# Agent A addresses feedback
vibex-task-manager update-task --id 5 --append --prompt "
Addressed review feedback:
- Added rate limiting middleware
- Updated tests to verify rate limiting
- Ready for final approval
"

vibex-task-manager set-status --id 5 --status done
```

## Coordination Tools

### Task Queries

Find coordination opportunities:

```bash
# Find tasks ready for review
vibex-task-manager list --status review

# Find blocked tasks
vibex-task-manager list --status deferred

# Find tasks with dependencies
vibex-task-manager list --format json | jq '.[] | select(.dependencies | length > 0)'
```

### Progress Monitoring

Track overall progress:

```bash
# Get project overview
vibex-task-manager list --format table

# Find next recommended work
vibex-task-manager next

# Check for dependency issues
vibex-task-manager validate-dependencies
```

### Research Coordination

Share research findings:

```bash
# Agent A does research
vibex-task-manager research --query "Best practices for API rate limiting" --save-to 5.2

# Agent B can access the research
vibex-task-manager show 5.2  # Includes research findings
```

## Troubleshooting Coordination Issues

### Conflicting Work

When agents accidentally work on the same thing:

```bash
# Identify the conflict
vibex-task-manager list --status in-progress

# Coordinate resolution
vibex-task-manager update-task --id 5 --append --prompt "
COORDINATION CONFLICT DETECTED:
Agent A and Agent B both working on authentication.
Proposed resolution:
- Agent A: Focus on backend API (task 5)
- Agent B: Focus on frontend components (task 6)
Agreed? Please confirm in task updates.
"
```

### Stuck Dependencies

When dependencies block progress:

```bash
# Find what's blocking progress
vibex-task-manager validate-dependencies

# Update dependency status if needed
vibex-task-manager set-status --id 3 --status done  # Unblock dependent tasks

# Or remove invalid dependencies
vibex-task-manager remove-dependency --id 7 --depends-on 3
```

### Communication Gaps

When context is unclear:

```bash
# Request clarification
vibex-task-manager update-task --id 5 --append --prompt "
CLARIFICATION NEEDED:
The current implementation approach is unclear.
Could the previous agent provide:
1. Architecture decisions made
2. Key files modified
3. Testing approach used
4. Any known limitations

This will help ensure continuity.
"
```

## Advanced Coordination

### Agent Roles

Define specialized roles:

- **Lead Agent**: Manages task breakdown and dependencies
- **Implementation Agents**: Focus on specific development tasks
- **Review Agent**: Handles code review and quality assurance
- **Integration Agent**: Manages deployment and integration tasks

### Coordination Protocols

Establish team protocols:

1. **Daily Sync**: Each agent reports status via task updates
2. **Handoff Protocol**: Specific format for task handoffs
3. **Review Gates**: Mandatory review for critical tasks
4. **Conflict Resolution**: Escalation process for conflicts

### Automated Coordination

Use task automation for coordination:

```bash
# Auto-expand complex tasks for parallel work
vibex-task-manager expand --all --research

# Auto-generate task files for better visibility
vibex-task-manager generate

# Regular dependency validation
vibex-task-manager validate-dependencies
```

## Summary

Effective agent coordination with Vibex Task Manager requires:

1. **Clear Communication**: Detailed task updates and status management
2. **Dependency Management**: Proper task sequencing and blocking
3. **Context Preservation**: Rich documentation of decisions and progress
4. **Conflict Prevention**: Proactive coordination and clear handoffs
5. **Regular Synchronization**: Consistent status updates and progress sharing

By following these patterns, multiple AI agents can work together effectively on complex development projects while maintaining code quality and avoiding conflicts. 