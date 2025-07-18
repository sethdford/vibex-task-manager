/**
 * Task status options list
 * @description Defines possible task statuses:
 * - pending: Task waiting to start
 * - done: Task completed
 * - in-progress: Task in progress
 * - review: Task completed and waiting for review
 * - deferred: Task postponed or paused
 * - cancelled: Task cancelled and will not be completed
 */
export const TASK_STATUS_OPTIONS = [
	'pending',
	'done',
	'in-progress',
	'review',
	'deferred',
	'cancelled'
];
/**
 * Check if a given status is a valid task status
 * @param status - The status to check
 * @returns True if the status is valid, false otherwise
 */
export function isValidTaskStatus(status) {
	return TASK_STATUS_OPTIONS.includes(status);
}
