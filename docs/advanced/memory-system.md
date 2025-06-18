# Memory System Guide

This guide covers Vibex Task Manager's memory and persistence capabilities for maintaining context across sessions and enabling intelligent task management.

## Overview

Vibex Task Manager includes a sophisticated memory system that:

- **Preserves Context**: Maintains task history and decisions across sessions
- **Learns Patterns**: Recognizes recurring task patterns and preferences
- **Enables Research**: Stores and indexes research findings for reuse
- **Supports Coordination**: Maintains shared context for multi-agent workflows

## Memory Architecture

### Storage Components

1. **Task Database** (`.vibex/tasks/tasks.json`)
   - Primary task data storage
   - Task relationships and dependencies
   - Status history and progress tracking

2. **Configuration Memory** (`.vibex/config.json`)
   - Project settings and preferences
   - Model configurations and API settings
   - User-specific customizations

3. **Research Cache** (`.vibex/docs/research/`)
   - AI research findings and insights
   - Cached external knowledge
   - Context-specific documentation

4. **Session History** (`.vibex/history/`)
   - Command history and patterns
   - Agent interaction logs
   - Decision rationale and context

5. **Complexity Reports** (`.vibex/reports/`)
   - Task complexity analysis
   - Performance metrics
   - Pattern recognition data

### Memory Organization

#### Namespaces
- **tasks**: Core task management data
- **research**: AI research and knowledge base
- **config**: System and user preferences
- **history**: Session and command history
- **reports**: Analysis and metrics data

#### Retention Policies
- **Task Data**: Permanent (until explicitly removed)
- **Research Cache**: 90 days (configurable)
- **Session History**: 30 days (configurable)
- **Temporary Files**: 7 days (auto-cleanup)

## Memory Operations

### Automatic Memory

Vibex Task Manager automatically captures:

```bash
# Task state changes
vibex-task-manager set-status --id 5 --status done
# → Stored: Task 5 completion time, duration, context

# AI interactions
vibex-task-manager update-task --id 3 --prompt "Add security features"
# → Stored: AI response, reasoning, patterns used

# Research queries
vibex-task-manager research --query "API security best practices"
# → Stored: Research results, sources, relevance scores
```

### Manual Memory Management

#### Query Stored Information
```bash
# Search across all memory
vibex-task-manager memory query "authentication patterns"

# Search specific namespace
vibex-task-manager memory query "OAuth implementation" --namespace research

# Search by time range
vibex-task-manager memory query "database" --since "2024-01-01"
```

#### Memory Statistics
```bash
# Show memory usage overview
vibex-task-manager memory stats

# Detailed breakdown by namespace
vibex-task-manager memory stats --detailed

# Check memory health
vibex-task-manager memory validate
```

#### Export and Backup
```bash
# Export all memory
vibex-task-manager memory export backup.json

# Export specific namespace
vibex-task-manager memory export research-backup.json --namespace research

# Export with compression
vibex-task-manager memory export backup.tar.gz --compress
```

#### Import and Restore
```bash
# Import memory from backup
vibex-task-manager memory import backup.json

# Import with merge strategy
vibex-task-manager memory import backup.json --merge

# Import specific namespace only
vibex-task-manager memory import backup.json --namespace research
```

## Research Memory System

### Automatic Research Storage

When using research features, findings are automatically stored:

```bash
# Research with auto-storage
vibex-task-manager research --query "Node.js security patterns" --save-to-file

# Research with task integration
vibex-task-manager research --query "Database optimization" --save-to 5.2
```

### Research Retrieval

Access stored research:

```bash
# List all research topics
vibex-task-manager memory list-research

# Search research by topic
vibex-task-manager memory search-research "security"

# Get research by ID
vibex-task-manager memory get-research "nodejs-security-001"
```

### Research Organization

Research is organized by:

- **Topic Categories**: Security, Performance, Architecture, etc.
- **Relevance Scores**: Based on project context
- **Recency**: Recent research prioritized
- **Usage Frequency**: Frequently accessed research highlighted

## Pattern Recognition

### Task Patterns

The memory system learns from your task management patterns:

```bash
# Analyze task patterns
vibex-task-manager memory analyze-patterns

# Get task recommendations based on history
vibex-task-manager memory recommend-tasks

# View pattern insights
vibex-task-manager memory pattern-report
```

### Common Patterns Recognized

1. **Task Sequencing**: Typical order of task completion
2. **Complexity Estimation**: Historical accuracy of complexity scores
3. **Time Estimation**: Actual vs. estimated task duration
4. **Dependency Patterns**: Common task dependency structures
5. **Research Needs**: When research is typically needed

### Pattern-Based Assistance

```bash
# Get next task recommendation based on patterns
vibex-task-manager next --use-patterns

# Expand task using learned patterns
vibex-task-manager expand --id 5 --use-patterns

# Generate tasks with pattern awareness
vibex-task-manager parse-prd requirements.md --use-patterns
```

## Context Preservation

### Session Context

Maintain context across sessions:

```bash
# Resume previous session context
vibex-task-manager session resume

# Save current context
vibex-task-manager session save "feature-development"

# List saved sessions
vibex-task-manager session list

# Load specific session
vibex-task-manager session load "feature-development"
```

### Agent Context

For multi-agent coordination:

```bash
# Share context between agents
vibex-task-manager context share --agent "agent-b"

# Sync context with team
vibex-task-manager context sync

# View shared context
vibex-task-manager context show --shared
```

## Memory Configuration

### Basic Configuration

Configure memory settings in `.vibex/config.json`:

```json
{
  "memory": {
    "enabled": true,
    "backend": "json",
    "cacheSize": 1000,
    "indexing": true,
    "retentionPolicy": {
      "history": "30d",
      "research": "90d", 
      "reports": "180d",
      "temp": "7d"
    },
    "compression": {
      "enabled": true,
      "threshold": "10MB",
      "algorithm": "gzip"
    }
  }
}
```

### Advanced Configuration

```json
{
  "memory": {
    "indexing": {
      "enabled": true,
      "strategy": "semantic",
      "rebuildInterval": "24h"
    },
    "search": {
      "algorithm": "hybrid",
      "semanticWeight": 0.7,
      "keywordWeight": 0.3
    },
    "backup": {
      "autoBackup": true,
      "interval": "daily",
      "retention": 7,
      "location": ".vibex/backups/"
    }
  }
}
```

## Memory Optimization

### Performance Tuning

```bash
# Rebuild search index
vibex-task-manager memory reindex

# Optimize database
vibex-task-manager memory optimize

# Clean up old data
vibex-task-manager memory cleanup --older-than 30d

# Compress memory files
vibex-task-manager memory compress
```

### Memory Health

```bash
# Check memory integrity
vibex-task-manager memory check

# Repair corrupted data
vibex-task-manager memory repair

# Validate references
vibex-task-manager memory validate-refs
```

## Privacy and Security

### Data Privacy

- **Local Storage**: All memory data stored locally
- **No External Sync**: Data never sent to external services
- **Encryption**: Optional encryption for sensitive data
- **Access Control**: File-system level permissions

### Security Features

```bash
# Enable memory encryption
vibex-task-manager memory encrypt --password

# Decrypt memory
vibex-task-manager memory decrypt --password

# Secure delete
vibex-task-manager memory secure-delete --namespace temp
```

## Integration with AI Models

### Context Enhancement

Memory system enhances AI interactions:

1. **Historical Context**: Previous decisions and rationale
2. **Pattern Awareness**: Learned preferences and patterns
3. **Research Integration**: Relevant cached knowledge
4. **Consistency**: Maintains consistent approach across sessions

### Memory-Enhanced Commands

```bash
# Task update with memory context
vibex-task-manager update-task --id 5 --prompt "Implement auth" --use-memory

# Research with memory integration
vibex-task-manager research --query "security" --include-memory

# Pattern-aware task expansion
vibex-task-manager expand --id 3 --use-memory-patterns
```

## Troubleshooting

### Common Issues

#### Memory Corruption
```bash
# Check for corruption
vibex-task-manager memory check

# Restore from backup
vibex-task-manager memory restore --backup latest

# Rebuild from scratch
vibex-task-manager memory rebuild
```

#### Performance Issues
```bash
# Check memory usage
vibex-task-manager memory stats --detailed

# Clean up old data
vibex-task-manager memory cleanup

# Optimize indexes
vibex-task-manager memory optimize --full
```

#### Search Problems
```bash
# Rebuild search index
vibex-task-manager memory reindex

# Verify search configuration
vibex-task-manager memory config --search

# Test search functionality
vibex-task-manager memory test-search "test query"
```

## Best Practices

### Memory Hygiene

1. **Regular Cleanup**: Remove old, irrelevant data
2. **Backup Strategy**: Regular backups before major changes
3. **Index Maintenance**: Periodic index rebuilding
4. **Monitoring**: Regular memory health checks

### Effective Usage

1. **Descriptive Updates**: Provide rich context in task updates
2. **Research Documentation**: Tag and categorize research findings
3. **Pattern Awareness**: Review and learn from pattern reports
4. **Context Preservation**: Save important session contexts

### Performance Optimization

1. **Cache Management**: Monitor and optimize cache usage
2. **Compression**: Use compression for large datasets
3. **Selective Indexing**: Index only necessary data
4. **Regular Maintenance**: Schedule regular optimization tasks

## Advanced Features

### Custom Memory Hooks

Create custom memory integration:

```javascript
// .vibex/hooks/memory.js
module.exports = {
  onTaskUpdate: (task, context) => {
    // Custom memory logic
  },
  onResearch: (query, results) => {
    // Custom research storage
  }
};
```

### Memory Analytics

```bash
# Generate memory analytics report
vibex-task-manager memory analytics

# Track memory usage over time
vibex-task-manager memory usage-report --period 30d

# Analyze search patterns
vibex-task-manager memory search-analytics
```

### Integration APIs

For custom tools and integrations:

```javascript
const { MemoryManager } = require('vibex-task-manager');

const memory = new MemoryManager('.vibex');

// Store custom data
await memory.store('custom-namespace', 'key', data);

// Retrieve data
const data = await memory.retrieve('custom-namespace', 'key');

// Search across namespaces
const results = await memory.search('query', { namespaces: ['tasks', 'research'] });
```

## Summary

The Vibex Task Manager memory system provides:

- **Persistent Context**: Maintains project knowledge across sessions
- **Intelligent Search**: Semantic and keyword-based search capabilities
- **Pattern Learning**: Recognizes and applies learned patterns
- **Research Integration**: Stores and organizes AI research findings
- **Multi-Agent Support**: Shared context for team coordination
- **Privacy-First**: Local storage with optional encryption

By leveraging the memory system effectively, you can build up a rich knowledge base that makes your task management more intelligent and efficient over time. 