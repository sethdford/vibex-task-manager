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
	version: string;
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
	private asyncManager: any;

	constructor() {
		// Get version from package.json using synchronous fs
		const packagePath = path.join(__dirname, '../../package.json');
		const packageJson: PackageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

		this.options = {
			name: 'Vibex Task Manager MCP Server',
			version: packageJson.version
		};

		this.server = new FastMCP(this.options);
		this.initialized = false;

		this.server.addResource({});

		this.server.addResourceTemplate({});

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

		// Pass the manager instance to the tool registration function
		registerVibexTaskManagerTools(this.server, this.asyncManager);

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

		// Start the FastMCP server with increased timeout
		await this.server.start({
			transportType: 'stdio',
			timeout: 120000 // 2 minutes timeout (in milliseconds)
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
