/**
 * add-dependency.ts
 *
 * Direcy function for add-dependency
 */
import { addDependency } from '../../../../scripts/modules/dependency-manager.js';
import { AnyLogger, createLogger } from '../logger.js';

interface AddDependencyArgs {
	tasksJsonPath: string;
	id: string;
	dependsOn: string;
}

export async function addDependencyDirect(
	args: AddDependencyArgs,
	log: AnyLogger
) {
	const { tasksJsonPath, id, dependsOn } = args;
	const wrappedLogger = createLogger(log);

	try {
		// addDependency performs a side effect and throws on error
		await addDependency(tasksJsonPath, id, dependsOn);

		return {
			success: true,
			data: {
				message: `Successfully added dependency from task ${id} to ${dependsOn}.`
			}
		};
	} catch (error) {
		wrappedLogger.error(
			`Error in addDependencyDirect: ${(error as Error).message}`
		);
		return {
			success: false,
			error: {
				code: 'UNEXPECTED_ERROR',
				message: (error as Error).message
			}
		};
	}
}
