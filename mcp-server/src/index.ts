import { FastMCP } from 'fastmcp';
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

interface ServerOptions {
	name: string;
	version: `${number}.${number}.${number}`;
}

interface PackageJson {
	version: string;
	[key: string]: any;
}

/**
 * Main MCP server class that integrates with Vibex Task Manager
 */
class VibexTaskManagerMCPServer {
	private options: ServerOptions;
	private server: FastMCP;
	private initialized: boolean;
	private logger: typeof logger;

	constructor() {
		// Get version from package.json using synchronous fs
		// Try multiple possible paths for package.json
		const possiblePaths = [
			path.join(__dirname, '../../package.json'), // Development
			path.join(__dirname, '../../../package.json'), // Installed via npm
			path.join(__dirname, '../../../../package.json'), // Alternative npm structure
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

		this.options = {
			name: 'Vibex Task Manager MCP Server',
			version: packageJson.version as `${number}.${number}.${number}`
		};

		this.server = new FastMCP(this.options);
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

		// Pass the server instance to the tool registration function
		registerVibexTaskManagerTools(this.server);

		this.initialized = true;

		return this;
	}

	/**
	 * Start the MCP server
	 */
	async start(): Promise<VibexTaskManagerMCPServer> {
		if (!this.initialized) {
			await this.init();
		}

		// Start the FastMCP server
		await this.server.start({
			transportType: 'stdio'
		});

		return this;
	}

	/**
	 * Stop the MCP server
	 */
	async stop(): Promise<void> {
		if (this.server) {
			await this.server.stop();
		}
	}
}

export default VibexTaskManagerMCPServer;
