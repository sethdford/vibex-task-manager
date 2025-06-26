#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
	CallToolRequestSchema,
	ListToolsRequestSchema,
	Tool
} from '@modelcontextprotocol/sdk/types.js';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import fs from 'fs';
import logger from './logger.js';
import { registerVibexTaskManagerTools } from './tools/index.js';

// Load environment variables
dotenv.config();

// Constants
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface PackageJson {
	version: string;
	[key: string]: any;
}

/**
 * Main MCP server class that integrates with Vibex Task Manager
 */
class VibexTaskManagerMCPServer {
	private server: Server;
	private version: string;
	private initialized: boolean;
	private logger: typeof logger;

	constructor() {
		// Get version from package.json using synchronous fs
		// Try multiple possible paths for package.json
		const possiblePaths = [
			path.join(__dirname, '../../package.json'), // Development
			path.join(__dirname, '../../../package.json'), // Installed via npm
			path.join(__dirname, '../../../../package.json') // Alternative npm structure
		];

		let packageJson: PackageJson;
		let packagePath: string | null = null;

		for (const possiblePath of possiblePaths) {
			try {
				if (fs.existsSync(possiblePath)) {
					packageJson = JSON.parse(fs.readFileSync(possiblePath, 'utf8'));
					packagePath = possiblePath;
					break;
				}
			} catch (error) {
				// Continue to next path
			}
		}

		if (!packagePath) {
			// Fallback to a default version
			packageJson = { version: '1.0.0' };
		}

		this.version = packageJson.version;

		// Initialize the MCP server
		this.server = new Server(
			{
				name: 'Vibex Task Manager MCP Server',
				version: this.version
			},
			{
				capabilities: {
					tools: {}
				}
			}
		);

		this.initialized = false;

		// Bind methods
		this.init = this.init.bind(this);
		this.start = this.start.bind(this);
		this.stop = this.stop.bind(this);

		// Setup logging
		this.logger = logger;
	}

	/**
	 * Initialize the MCP server with necessary tools and routes
	 */
	async init(): Promise<VibexTaskManagerMCPServer> {
		if (this.initialized) return this;

		// Set up request handlers
		this.server.setRequestHandler(ListToolsRequestSchema, async () => {
			const tools = await this.getAvailableTools();
			return { tools };
		});

		this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
			const { name, arguments: args } = request.params;
			return await this.callTool(name, args || {});
		});

		// Register all Vibex Task Manager tools
		await registerVibexTaskManagerTools(this);

		this.initialized = true;

		return this;
	}

	/**
	 * Get list of available tools
	 */
	private async getAvailableTools(): Promise<Tool[]> {
		// This will be populated by registerVibexTaskManagerTools
		return this.tools;
	}

	/**
	 * Call a specific tool
	 */
	private async callTool(
		name: string,
		args: Record<string, any>
	): Promise<any> {
		const tool = this.toolHandlers.get(name);
		if (!tool) {
			throw new Error(`Unknown tool: ${name}`);
		}

		try {
			return await tool(args);
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			this.logger.error(`Tool ${name} failed: ${errorMessage}`);
			throw error;
		}
	}

	// Tool registration system
	private tools: Tool[] = [];
	private toolHandlers = new Map<
		string,
		(args: Record<string, any>) => Promise<any>
	>();

	/**
	 * Register a tool with the server
	 */
	registerTool(
		tool: Tool,
		handler: (args: Record<string, any>) => Promise<any>
	): void {
		this.tools.push(tool);
		this.toolHandlers.set(tool.name, handler);
	}

	/**
	 * Add a tool using the FastMCP-style interface for backward compatibility
	 */
	addTool(tool: any): void {
		// Convert the FastMCP tool format to the official MCP format
		const mcpTool: Tool = {
			name: tool.name,
			description: tool.description,
			inputSchema: tool.parameters
				? {
						type: 'object',
						properties: tool.parameters._def?.shape
							? Object.fromEntries(
									Object.entries(tool.parameters._def.shape).map(
										([key, value]: [string, any]) => [
											key,
											{
												type: this.getZodType(value),
												description: value._def?.description || '',
												...(value._def?.defaultValue !== undefined && {
													default: value._def.defaultValue
												})
											}
										]
									)
								)
							: {},
						required: tool.parameters._def?.shape
							? Object.entries(tool.parameters._def.shape)
									.filter(([_, value]: [string, any]) => !value.isOptional())
									.map(([key]) => key)
							: []
					}
				: {
						type: 'object',
						properties: {},
						required: []
					}
		};

		// Create handler that wraps the tool's execute function
		const handler = async (args: Record<string, any>) => {
			try {
				const result = await tool.execute(args);
				return {
					content: [
						{
							type: 'text',
							text:
								typeof result === 'string'
									? result
									: JSON.stringify(result, null, 2)
						}
					]
				};
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : String(error);
				return {
					content: [
						{
							type: 'text',
							text: `Error: ${errorMessage}`
						}
					],
					isError: true
				};
			}
		};

		this.registerTool(mcpTool, handler);
	}

	/**
	 * Helper method to convert Zod types to JSON Schema types
	 */
	private getZodType(zodType: any): string {
		if (!zodType._def) return 'string';

		switch (zodType._def.typeName) {
			case 'ZodString':
				return 'string';
			case 'ZodNumber':
				return 'number';
			case 'ZodBoolean':
				return 'boolean';
			case 'ZodArray':
				return 'array';
			case 'ZodObject':
				return 'object';
			default:
				return 'string';
		}
	}

	/**
	 * Start the MCP server
	 */
	async start(): Promise<VibexTaskManagerMCPServer> {
		if (!this.initialized) {
			await this.init();
		}

		// Create stdio transport
		const transport = new StdioServerTransport();

		// Connect the server to the transport
		await this.server.connect(transport);

		this.logger.info('Vibex Task Manager MCP Server started successfully');

		return this;
	}

	/**
	 * Stop the MCP server
	 */
	async stop(): Promise<void> {
		if (this.server) {
			await this.server.close();
			this.logger.info('Vibex Task Manager MCP Server stopped');
		}
	}

	/**
	 * Get the underlying server instance for advanced usage
	 */
	getServer(): Server {
		return this.server;
	}
}

export default VibexTaskManagerMCPServer;
