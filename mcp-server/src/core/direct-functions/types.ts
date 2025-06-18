/**
 * types.ts
 * Shared type definitions for direct functions
 */
import { AnyLogger, UnifiedLogger } from '../../core/logger.js';

// Re-export logger types for use in direct functions
export type { AnyLogger, UnifiedLogger };

// Session interface
export interface Session {
	[key: string]: any;
}

// Context passed to direct functions
export interface DirectFunctionContext {
	session?: Session;
	[key: string]: any;
}

// Standard API error format
export interface ApiError {
	code: string;
	message: string;
}

// Standard API result format for direct functions
export interface ApiResult<T = any> {
	success: boolean;
	data?: T;
	error?: ApiError;
} 