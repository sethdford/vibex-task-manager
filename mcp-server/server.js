#!/usr/bin/env node
import VibexTaskManagerMCPServer from './src/index.js';

// Create and start the server
const server = new VibexTaskManagerMCPServer();

// Handle shutdown gracefully
process.on('SIGINT', async () => {
	await server.stop();
	process.exit(0);
});

process.on('SIGTERM', async () => {
	await server.stop();
	process.exit(0);
});

// Start the server
server.start().catch((error) => {
	console.error('Failed to start MCP server:', error);
	process.exit(1);
});