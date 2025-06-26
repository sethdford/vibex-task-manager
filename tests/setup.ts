// Global test setup
import { jest } from '@jest/globals';

// Set test timeout
jest.setTimeout(30000);

// Mock console methods to reduce noise during tests
global.console = {
	...console,
	log: jest.fn(),
	info: jest.fn(),
	warn: jest.fn(),
	// Keep error for debugging
	error: console.error
};
