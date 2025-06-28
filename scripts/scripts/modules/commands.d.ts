/**
 * Configure and register CLI commands
 * @param {Object} program - Commander program instance
 */
export function registerCommands(programInstance: any): any;
/**
 * Setup the CLI application
 * @returns {Object} Configured Commander program
 */
export function setupCLI(): any;
/**
 * Parse arguments and run the CLI
 * @param {Array} argv - Command-line arguments
 */
export function runCLI(argv?: any[]): Promise<void>;
/**
 * Check for newer version of vibex-task-manager-ai
 * @returns {Promise<{currentVersion: string, latestVersion: string, needsUpdate: boolean}>}
 */
export function checkForUpdate(): Promise<{
    currentVersion: string;
    latestVersion: string;
    needsUpdate: boolean;
}>;
/**
 * Compare semantic versions
 * @param {string} v1 - First version
 * @param {string} v2 - Second version
 * @returns {number} -1 if v1 < v2, 0 if v1 = v2, 1 if v1 > v2
 */
export function compareVersions(v1: string, v2: string): number;
/**
 * Display upgrade notification message
 * @param {string} currentVersion - Current version
 * @param {string} latestVersion - Latest version
 */
export function displayUpgradeNotification(currentVersion: string, latestVersion: string): void;
//# sourceMappingURL=commands.d.ts.map