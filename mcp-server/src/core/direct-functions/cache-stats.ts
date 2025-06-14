/**
 * cache-stats.js
 * Direct function implementation for retrieving cache statistics
 */

import { Logger } from '../../../../src/types/index.js';
import { contextManager } from '../context-manager.js';

/**
 * Get cache statistics for monitoring
 * @param {Object} args - Command arguments
 * @param {Object} log - Logger object
 * @returns {Object} - Cache statistics
 */
export async function getCacheStatsDirect(args: any, log: Logger) {
	try {
		log.info('Retrieving cache statistics');
		const stats = contextManager.getStats();
		return {
			success: true,
			data: stats
		};
	} catch (error) {
		log.error(`Error getting cache stats: ${(error as Error).message}`);
		return {
			success: false,
			error: {
				code: 'CACHE_STATS_ERROR',
				message: (error as Error).message || 'Unknown error occurred'
			}
		};
	}
}
