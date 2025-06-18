/**
 * complexity-report.js
 * Direct function implementation for displaying complexity analysis report
 */
import { readComplexityReport } from '../../../../scripts/modules/utils.js';
import { AnyLogger, createLogger } from '../logger.js';

/**
 * Direct function wrapper for displaying the complexity report with error handling and caching.
 *
 * @param {Object} args - Command arguments containing reportPath.
 * @param {string} args.reportPath - Explicit path to the complexity report file.
 * @param {Object} log - Logger object
 * @returns {Promise<Object>} - Result object with success status and data/error information
 */
export async function complexityReportDirect(
	args: { reportPath: string },
	log: AnyLogger
): Promise<any> {
	const wrappedLogger = createLogger(log);
	try {
		wrappedLogger.info(`Reading complexity report from: ${args.reportPath}`);
		const reportData = readComplexityReport(args.reportPath);
		if (!reportData) {
			return { 
				success: false, 
				error: { code: 'REPORT_NOT_FOUND', message: `Complexity report not found at ${args.reportPath}` } 
			};
		}
		return { success: true, data: reportData };
	} catch (error) {
		wrappedLogger.error(`Error in complexityReportDirect: ${(error as Error).message}`);
		return { success: false, error: { code: 'REPORT_FAILED', message: (error as Error).message } };
	}
}
