/**
 * Temporarily sets environment variables from session.env, executes an action,
 * and restores the original environment variables.
 * @param sessionEnv - The environment object from the session.
 * @param actionFn - An async function to execute with the temporary environment.
 * @returns The result of the actionFn.
 */
export async function withSessionEnv<T>(
	sessionEnv: Record<string, string> | undefined,
	actionFn: () => Promise<T>
): Promise<T> {
	if (
		!sessionEnv ||
		typeof sessionEnv !== 'object' ||
		Object.keys(sessionEnv).length === 0
	) {
		// If no sessionEnv is provided, just run the action directly
		return await actionFn();
	}

	const originalEnv: Record<string, string | undefined> = {};
	const keysToRestore: string[] = [];

	// Set environment variables from sessionEnv
	for (const key in sessionEnv) {
		if (Object.prototype.hasOwnProperty.call(sessionEnv, key)) {
			// Store original value if it exists, otherwise mark for deletion
			if (process.env[key] !== undefined) {
				originalEnv[key] = process.env[key];
			}
			keysToRestore.push(key);
			process.env[key] = sessionEnv[key];
		}
	}

	try {
		// Execute the provided action function
		return await actionFn();
	} finally {
		// Restore original environment variables
		for (const key of keysToRestore) {
			if (Object.prototype.hasOwnProperty.call(originalEnv, key)) {
				process.env[key] = originalEnv[key];
			} else {
				// If the key didn't exist originally, delete it
				delete process.env[key];
			}
		}
	}
}
