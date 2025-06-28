#!/usr/bin/env node

// Unified Vibex entry point
// Routes between CLI and MCP server based on arguments and environment

const args = process.argv.slice(2);

// Check if we should start MCP server
const shouldStartMCPServer = 
  // Explicit mcp command
  args.includes('mcp') ||
  // MCP environment variables present
  process.env.MCP_SERVER === 'true' ||
  // Called via stdio (typical MCP setup)
  process.stdin.isTTY === false;

// Handle smart task creation - if first arg doesn't match known commands and looks like natural language
const knownCommands = ['init', 'config', 'list', 'ls', 'show', 'add', 'update', 'remove', 'rm', 'status', 'analyze', 'expand', 'next', 'parse-prd', 'deps', 'mcp', 'export', 'sparc', 'help', '--help', '-h', '--version', '-V'];
const firstArg = args[0];
const isNaturalLanguage = firstArg && 
  !knownCommands.includes(firstArg) && 
  !firstArg.startsWith('-') &&
  args.join(' ').length > 10; // Reasonable length for natural language

if (args.length === 0) {
  // No arguments - start interactive mode
  import('../dist/src/cli/vibex-dev.js');
} else if (shouldStartMCPServer) {
  // Handle 'vibex mcp' command or MCP environment
  process.argv = process.argv.filter(arg => arg !== 'mcp');
  import('../dist/mcp-server/server.js');
} else if (isNaturalLanguage) {
  // Convert natural language to smart add command
  const naturalText = args.join(' ');
  process.argv = ['node', process.argv[1], 'add', '--ai-prompt', naturalText];
  import('../dist/src/cli/index.js');
} else {
  // Route to CLI
  import('../dist/src/cli/index.js');
} 