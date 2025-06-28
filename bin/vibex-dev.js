#!/usr/bin/env node

// Import and run the compiled TypeScript version
import path from 'path';
import { spawn } from 'child_process';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the compiled TypeScript file
const compiledScript = path.join(__dirname, '../dist/src/cli/vibex-dev.js');

// Check if compiled version exists
if (fs.existsSync(compiledScript)) {
  // Run the compiled TypeScript version
  const child = spawn('node', [compiledScript, ...process.argv.slice(2)], {
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  child.on('exit', (code) => {
    process.exit(code || 0);
  });
} else {
  // Fallback to development preview
  console.log(`
🚀 Vibex Dev - Agentic Development Assistant (Enhanced)

✨ NEW: Claude Code Integration Available!

⚠️  Development Mode: TypeScript not compiled yet.
   Run 'npm run build' to enable full functionality.

Usage:
  vibex-dev "Create a REST API for user management"
  vibex-dev --claude-code "Implement authentication with JWT tokens"
  vibex-dev --claude-code --with-tasks "Build dashboard and track progress"
  vibex-dev examples

🔧 Integration Options:
  --claude-code          Use Claude Code as backend engine
  --model-strategy       Choose routing strategy (smart|claude-code|bedrock)
  --with-tasks          Enable task management integration
  --verbose             Enable detailed logging

📚 Documentation:
  • Integration Guide: docs/integration/claude-code-integration.md
  • Evolution Roadmap: docs/roadmap/claude-code-evolution.md
  • Examples Script: ./examples/claude-code-integration.sh

To enable full functionality:
  npm run build
  ./bin/vibex-dev.js examples
`);
  
  process.exit(0);
} 