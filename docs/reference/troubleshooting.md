# Troubleshooting Guide

Comprehensive troubleshooting guide for common issues with Vibex Task Manager APIs, MCP server, and CLI operations.

## Table of Contents

- [Installation Issues](#installation-issues)
- [MCP Server Issues](#mcp-server-issues)
- [CLI Command Issues](#cli-command-issues)
- [AI Provider Issues](#ai-provider-issues)
- [Task Management Issues](#task-management-issues)
- [Performance Issues](#performance-issues)
- [Integration Issues](#integration-issues)
- [Debugging and Logging](#debugging-and-logging)

---

## Installation Issues

### npm Installation Failures

**Issue:** Package installation fails with permission errors
```bash
Error: EACCES: permission denied, access '/usr/local/lib/node_modules'
```

**Solutions:**
```bash
# Option 1: Use npx (recommended)
npx vibex-task-manager --help

# Option 2: Use npm with user directory
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
npm install -g vibex-task-manager

# Option 3: Use sudo (not recommended)
sudo npm install -g vibex-task-manager
```

### Node.js Version Compatibility

**Issue:** Package requires newer Node.js version
```bash
Error: This package requires Node.js >= 18.0.0
```

**Solutions:**
```bash
# Check current version
node --version

# Install Node.js 18+ using nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# Verify installation
node --version
npm --version
```

### Package Dependencies

**Issue:** Missing or conflicting dependencies
```bash
Error: Cannot find module '@fastmcp/core'
```

**Solutions:**
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Use specific package manager
npm install -g vibex-task-manager --prefer-online
```

---

## MCP Server Issues

### MCP Server Won't Start

**Issue:** MCP server fails to initialize
```bash
Error: MCP server failed to start
```

**Diagnostic Steps:**
```bash
# Test MCP server directly
npx vibex-task-manager mcp

# Check with debug mode
DEBUG=1 npx vibex-task-manager mcp

# Verify project initialization
ls -la .vibex/
cat .vibex/config.json
```

**Solutions:**
```bash
# Initialize project if not done
vibex-task-manager init

# Fix configuration
vibex-task-manager models --setup

# Check file permissions
chmod 755 .vibex/
chmod 644 .vibex/*.json
```

### Claude Code Integration Issues

**Issue:** Claude Code can't connect to MCP server

**Check Configuration:**
```json
// .claude/config.json
{
  "mcpServers": {
    "vibex-task-manager": {
      "command": "npx",
      "args": ["vibex-task-manager", "mcp"],
      "env": {
        "VIBEX_PROJECT_PATH": "${workspaceFolder}"
      }
    }
  }
}
```

**Diagnostic Commands:**
```bash
# Test MCP server manually
npx vibex-task-manager mcp --stdio

# Check if command exists
which npx
npx vibex-task-manager --version

# Verify project structure
ls -la ${PWD}/.vibex/
```

**Common Fixes:**
1. Ensure project is initialized in workspace root
2. Check Node.js and npm are available in PATH
3. Verify npx can access global packages
4. Restart Claude Code after configuration changes

### MCP Tool Execution Errors

**Issue:** MCP tools return errors or unexpected results

**Debug MCP Tool Calls:**
```bash
# Enable debug logging
export DEBUG=1

# Test specific tool
echo '{"tool": "get_tasks", "arguments": {"projectRoot": "/path/to/project"}}' | npx vibex-task-manager mcp
```

**Common Error Patterns:**

#### Project Not Initialized
```json
{
  "error": "PROJECT_NOT_INITIALIZED",
  "message": "No Vibex project found in the specified directory"
}
```
**Solution:** Run `vibex-task-manager init` in the project root

#### Invalid Project Root
```json
{
  "error": "INVALID_PROJECT_ROOT",
  "message": "Project root does not exist or is not accessible"
}
```
**Solution:** Check path permissions and verify directory exists

#### Task Not Found
```json
{
  "error": "TASK_NOT_FOUND",
  "message": "Task with ID 123 not found"
}
```
**Solution:** Verify task ID with `vibex-task-manager list`

---

## CLI Command Issues

### Command Not Found

**Issue:** `vibex-task-manager: command not found`

**Solutions:**
```bash
# Check if installed globally
npm list -g vibex-task-manager

# Use npx if not globally installed
npx vibex-task-manager --version

# Add to PATH if using local installation
export PATH="./node_modules/.bin:$PATH"

# Reinstall globally
npm install -g vibex-task-manager --force
```

### Command Execution Failures

**Issue:** Commands fail with cryptic errors

**Debug Steps:**
```bash
# Enable debug mode
DEBUG=1 vibex-task-manager list

# Test mode (preview without execution)
TEST_MODE=1 vibex-task-manager add-task -p "test task"

# Check configuration
vibex-task-manager models

# Verify files
ls -la .vibex/
cat .vibex/config.json
```

### Flag and Option Issues

**Issue:** Command-line flags not recognized

**Common Problems:**
```bash
# Wrong: camelCase flags
vibex-task-manager add-task --numTasks=5

# Correct: kebab-case flags
vibex-task-manager add-task --num-tasks=5

# Wrong: missing required flags
vibex-task-manager set-status -s pending

# Correct: include required ID
vibex-task-manager set-status -i 5 -s pending
```

**Get Help:**
```bash
# General help
vibex-task-manager --help

# Command-specific help
vibex-task-manager add-task --help
vibex-task-manager list --help
```

### File Access Issues

**Issue:** Permission denied when accessing task files

**Solutions:**
```bash
# Check file permissions
ls -la .vibex/tasks.json

# Fix permissions
chmod 644 .vibex/tasks.json
chmod 755 .vibex/

# Check ownership
chown $USER:$USER .vibex/tasks.json

# Use custom file location
vibex-task-manager list -f /path/to/custom/tasks.json
```

---

## AI Provider Issues

### API Key Configuration

**Issue:** AI provider authentication fails

**AWS Bedrock Setup:**
```bash
# Configure AWS credentials
aws configure

# Or use environment variables
export AWS_ACCESS_KEY_ID=your_key
export AWS_SECRET_ACCESS_KEY=your_secret
export AWS_DEFAULT_REGION=us-east-1

# Test AWS connection
aws bedrock list-foundation-models --region us-east-1
```

**Anthropic API Setup:**
```bash
# Set API key
export ANTHROPIC_API_KEY=your_api_key

# Test connection
curl -H "x-api-key: $ANTHROPIC_API_KEY" \
     -H "anthropic-version: 2023-06-01" \
     -H "content-type: application/json" \
     https://api.anthropic.com/v1/models
```

**Configuration Validation:**
```bash
# Check current model configuration
vibex-task-manager models

# Reset and reconfigure
vibex-task-manager models --setup

# Test with specific model
vibex-task-manager models --set-main claude-3-5-sonnet-20241022
```

### Model Response Issues

**Issue:** AI models return errors or poor-quality responses

**Common Causes and Solutions:**

#### Rate Limiting
```bash
Error: Rate limit exceeded for model claude-3-5-sonnet-20241022
```
**Solution:** Wait and retry, or switch to different model
```bash
vibex-task-manager models --set-fallback claude-3-haiku-20240307
```

#### Invalid Model ID
```bash
Error: Model 'invalid-model' not found
```
**Solution:** Check available models
```bash
vibex-task-manager models --bedrock
vibex-task-manager models --set-main anthropic.claude-3-sonnet-20240229-v1:0
```

#### Context Length Exceeded
```bash
Error: Input too long for model
```
**Solution:** Use models with larger context windows
```bash
vibex-task-manager models --set-main claude-3-opus-20240229
```

### Provider-Specific Issues

#### AWS Bedrock Issues
```bash
# Check region availability
aws bedrock list-foundation-models --region us-west-2

# Verify model access
aws bedrock get-foundation-model --model-identifier anthropic.claude-3-sonnet-20240229-v1:0

# Check service quotas
aws service-quotas list-service-quotas --service-code bedrock
```

#### Anthropic API Issues
```bash
# Test API connectivity
curl -H "x-api-key: $ANTHROPIC_API_KEY" \
     -H "anthropic-version: 2023-06-01" \
     https://api.anthropic.com/v1/messages \
     -d '{"model": "claude-3-5-sonnet-20241022", "max_tokens": 10, "messages": [{"role": "user", "content": "Hi"}]}'
```

---

## Task Management Issues

### Task Creation Failures

**Issue:** Tasks fail to create or generate incorrectly

**Debug Task Creation:**
```bash
# Test basic task creation
vibex-task-manager add-task -t "Test Task" -d "Simple test"

# Test AI-powered creation with debug
DEBUG=1 vibex-task-manager add-task -p "Implement user authentication"

# Check task file integrity
cat .vibex/tasks.json | jq '.'
```

**Common Issues:**

#### JSON Corruption
```bash
Error: Unexpected token in JSON at position 1234
```
**Solution:**
```bash
# Backup and fix JSON
cp .vibex/tasks.json .vibex/tasks.json.backup
echo '{"tasks": []}' > .vibex/tasks.json

# Restore from backup if possible
jq '.' .vibex/tasks.json.backup > .vibex/tasks.json
```

#### Task ID Conflicts
```bash
Error: Task with ID 5 already exists
```
**Solution:**
```bash
# Check existing IDs
vibex-task-manager list | grep "ID:"

# Use specific ID range
vibex-task-manager add-task -t "New Task" --id-start 100
```

### Dependency Management Issues

**Issue:** Circular dependencies or invalid references

**Validate Dependencies:**
```bash
# Check for circular dependencies
vibex-task-manager validate-dependencies

# Auto-fix dependency issues
vibex-task-manager fix-dependencies

# Manual dependency review
vibex-task-manager list --format json | jq '.[] | {id, dependencies}'
```

**Debug Dependency Chains:**
```bash
# Visualize dependencies (if graphviz installed)
vibex-task-manager dependencies --graph | dot -Tpng > dependencies.png

# Check specific task dependencies
vibex-task-manager show 5 | grep -A 10 "Dependencies"
```

### Subtask Issues

**Issue:** Subtasks not creating or updating correctly

**Debug Subtasks:**
```bash
# List task with subtasks
vibex-task-manager show 5 --with-subtasks

# Test subtask creation
vibex-task-manager add-subtask -p 5 -t "Test Subtask"

# Check subtask structure
cat .vibex/tasks.json | jq '.tasks[] | select(.id == 5) | .subtasks'
```

**Fix Subtask Issues:**
```bash
# Clear and regenerate subtasks
vibex-task-manager clear-subtasks -i 5
vibex-task-manager expand -i 5 -n 5

# Manual subtask fix
vibex-task-manager update-task -i 5 --clear-subtasks
```

---

## Performance Issues

### Slow Task Operations

**Issue:** Commands take too long to execute

**Performance Diagnosis:**
```bash
# Time command execution
time vibex-task-manager list

# Profile with debug output
DEBUG=1 vibex-task-manager analyze-complexity

# Check file sizes
du -h .vibex/
ls -lah .vibex/tasks.json
```

**Optimization Strategies:**
```bash
# Use filters to reduce data processing
vibex-task-manager list -s pending

# Disable research mode for faster responses
vibex-task-manager add-task -p "simple task" # without -r flag

# Use lighter models
vibex-task-manager models --set-main claude-3-haiku-20240307
```

### Memory Issues

**Issue:** High memory usage or out-of-memory errors

**Memory Optimization:**
```bash
# Check Node.js memory usage
node --max-old-space-size=4096 $(which vibex-task-manager) list

# Split large task files
vibex-task-manager export --chunk-size 100

# Clean up old data
vibex-task-manager cleanup --remove-completed --older-than 30d
```

### AI Processing Delays

**Issue:** AI operations are very slow

**Optimization Tips:**
```bash
# Use faster models for simple operations
vibex-task-manager models --set-main claude-3-haiku-20240307

# Reduce AI calls
vibex-task-manager add-task -t "Manual task" -d "No AI processing"

# Cache AI responses
export VIBEX_CACHE_TTL=3600 # 1 hour cache
```

---

## Integration Issues

### GitHub Actions Integration

**Issue:** CI/CD pipeline failures

**Debug GitHub Actions:**
```yaml
- name: Debug Vibex Setup
  run: |
    echo "Node version: $(node --version)"
    echo "NPM version: $(npm --version)"
    which npx
    npx vibex-task-manager --version || echo "Command failed"
    ls -la .vibex/ || echo "No .vibex directory"
```

**Common Fixes:**
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v3
  with:
    node-version: '18'
    cache: 'npm'

- name: Install Vibex
  run: |
    npm install -g vibex-task-manager
    vibex-task-manager init -y || echo "Already initialized"
```

### Docker Integration

**Issue:** Vibex Task Manager not working in containers

**Dockerfile Optimization:**
```dockerfile
FROM node:18-alpine

# Install dependencies
RUN npm install -g vibex-task-manager

# Set working directory
WORKDIR /app

# Copy project files
COPY . .

# Initialize if needed
RUN vibex-task-manager init -y || true

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD npx vibex-task-manager list > /dev/null || exit 1

CMD ["npx", "vibex-task-manager", "mcp"]
```

### IDE Extension Issues

**Issue:** MCP server not working with IDE extensions

**Cursor AI Debug:**
```json
{
  "mcp.servers": {
    "vibex-task-manager": {
      "command": "npx",
      "args": ["vibex-task-manager", "mcp"],
      "cwd": "${workspaceFolder}",
      "env": {
        "DEBUG": "1",
        "VIBEX_PROJECT_PATH": "${workspaceFolder}"
      }
    }
  }
}
```

**Windsurf Debug:**
```json
{
  "mcp": {
    "servers": {
      "vibex-task-manager": {
        "command": "npx vibex-task-manager mcp",
        "args": [],
        "cwd": "${workspaceRoot}",
        "env": {
          "NODE_ENV": "development",
          "DEBUG": "1"
        }
      }
    }
  }
}
```

---

## Debugging and Logging

### Enable Debug Mode

**Environment Variables:**
```bash
# Enable all debug output
export DEBUG=1

# Enable specific debug categories
export DEBUG=vibex:mcp,vibex:tasks,vibex:ai

# Enable test mode (dry run)
export TEST_MODE=1
```

**Command-Line Debug:**
```bash
# Debug specific commands
DEBUG=1 vibex-task-manager add-task -p "test"
DEBUG=1 vibex-task-manager mcp

# Verbose output
vibex-task-manager --verbose list
vibex-task-manager --debug analyze-complexity
```

### Log Analysis

**Log Locations:**
```bash
# Default log directory
ls -la ~/.vibex/logs/

# Project-specific logs
ls -la .vibex/logs/

# System logs (if using systemd)
journalctl -u vibex-task-manager
```

**Log Analysis Commands:**
```bash
# Recent errors
grep -i error ~/.vibex/logs/latest.log

# AI provider issues
grep -i "anthropic\|bedrock" ~/.vibex/logs/latest.log

# MCP server issues
grep -i "mcp\|server" ~/.vibex/logs/latest.log

# Performance issues
grep -i "timeout\|slow\|memory" ~/.vibex/logs/latest.log
```

### Network Debugging

**Check Network Connectivity:**
```bash
# Test Anthropic API
curl -I https://api.anthropic.com/v1/models

# Test AWS Bedrock
aws bedrock list-foundation-models --region us-east-1

# Check DNS resolution
nslookup api.anthropic.com
nslookup bedrock.us-east-1.amazonaws.com
```

**Proxy Configuration:**
```bash
# Set proxy for npm
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080

# Set proxy for AWS CLI
export https_proxy=http://proxy.company.com:8080
export http_proxy=http://proxy.company.com:8080

# Set proxy for Node.js
export NODE_TLS_REJECT_UNAUTHORIZED=0  # Only for testing!
```

### Configuration Validation

**Validate Configuration Files:**
```bash
# Check JSON syntax
jq '.' .vibex/config.json
jq '.' .vibex/tasks.json

# Validate configuration schema
vibex-task-manager config --validate

# Reset configuration
vibex-task-manager config --reset
vibex-task-manager models --setup
```

**Health Check Script:**
```bash
#!/bin/bash
# vibex-health-check.sh

echo "Vibex Task Manager Health Check"
echo "==============================="

# Check installation
echo "1. Checking installation..."
if command -v vibex-task-manager &> /dev/null; then
    echo "✓ vibex-task-manager command found"
    vibex-task-manager --version
else
    echo "✗ vibex-task-manager command not found"
    exit 1
fi

# Check project initialization
echo "2. Checking project initialization..."
if [ -f ".vibex/config.json" ]; then
    echo "✓ Project initialized"
else
    echo "✗ Project not initialized - run: vibex-task-manager init"
fi

# Check configuration
echo "3. Checking configuration..."
if vibex-task-manager models &> /dev/null; then
    echo "✓ Configuration valid"
else
    echo "✗ Configuration invalid - run: vibex-task-manager models --setup"
fi

# Check AI connectivity
echo "4. Checking AI connectivity..."
if DEBUG=1 vibex-task-manager add-task -p "health check test" --dry-run &> /dev/null; then
    echo "✓ AI provider accessible"
else
    echo "✗ AI provider connection failed"
fi

# Check MCP server
echo "5. Checking MCP server..."
if timeout 5s npx vibex-task-manager mcp < /dev/null &> /dev/null; then
    echo "✓ MCP server starts successfully"
else
    echo "✗ MCP server failed to start"
fi

echo "Health check complete!"
```

**Run Health Check:**
```bash
chmod +x vibex-health-check.sh
./vibex-health-check.sh
```

---

## Getting Help

### Official Support Channels

- **Documentation**: [docs/](.)
- **GitHub Issues**: [Report bugs and request features](https://github.com/ruvnet/vibex-task-manager/issues)
- **GitHub Discussions**: [Community support and questions](https://github.com/ruvnet/vibex-task-manager/discussions)

### Community Resources

- **Stack Overflow**: Tag questions with `vibex-task-manager`
- **Discord**: Join the community server for real-time help
- **Reddit**: r/TaskManagement and r/ProductivityTools

### Bug Reports

When reporting bugs, include:

1. **Environment Information:**
   ```bash
   node --version
   npm --version
   vibex-task-manager --version
   echo $OS
   ```

2. **Debug Output:**
   ```bash
   DEBUG=1 vibex-task-manager [command] 2>&1 | tee debug.log
   ```

3. **Configuration (sanitized):**
   ```bash
   cat .vibex/config.json | jq 'del(.models.main.apiKey, .models.research.apiKey)'
   ```

4. **Steps to Reproduce:**
   - Clear sequence of commands
   - Expected vs actual behavior
   - Any error messages

### Feature Requests

Use the GitHub Issues template for feature requests:
- Use case and motivation
- Proposed solution
- Alternative solutions considered
- Additional context

This troubleshooting guide covers the most common issues encountered when using Vibex Task Manager. For issues not covered here, check the GitHub repository or open a new issue with detailed information about your problem.