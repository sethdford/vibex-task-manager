/**
 * Task Manager
 * Copyright (c) 2025 Vibex Task Manager Contributors
 *
 * This software is licensed under the MIT License.
 *
 * 1. You may not sell this software or offer it as a service.
 * 2. The origin of this software must not be misrepresented.
 * 3. Altered source versions must be plainly marked as such.
 *
 * For the full license text, see the LICENSE file in the root directory.
 */
interface InitOptions {
    name?: string;
    description?: string;
    version?: string;
    author?: string;
    dryRun?: boolean;
    aliases?: boolean;
    yes?: boolean;
    skipSetup?: boolean;
}
type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'success';
declare function log(level: LogLevel, ...args: any[]): void;
declare function initializeProject(options?: InitOptions): Promise<{
    dryRun?: boolean;
} | void>;
export { initializeProject, log };
//# sourceMappingURL=init.d.ts.map