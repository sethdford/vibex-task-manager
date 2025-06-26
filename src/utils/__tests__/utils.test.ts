import { describe, expect, test } from '@jest/globals';
import { formatTaskId, truncate, toKebabCase } from '../utils.js';

describe('Utils', () => {
	describe('formatTaskId', () => {
		test('should format number ID as string', () => {
			expect(formatTaskId(123)).toBe('123');
		});

		test('should return string ID as is', () => {
			expect(formatTaskId('123')).toBe('123');
		});

		test('should keep dotted IDs unchanged', () => {
			expect(formatTaskId('1.2')).toBe('1.2');
		});
	});

	describe('truncate', () => {
		test('should not truncate short text', () => {
			expect(truncate('Hello', 10)).toBe('Hello');
		});

		test('should truncate long text with ellipsis', () => {
			expect(truncate('Hello World!', 8)).toBe('Hello...');
		});

		test('should handle empty string', () => {
			expect(truncate('', 10)).toBe('');
		});

		test('should handle null/undefined', () => {
			expect(truncate(null as any, 10)).toBe(null);
			expect(truncate(undefined as any, 10)).toBe(undefined);
		});
	});

	describe('toKebabCase', () => {
		test('should convert camelCase to kebab-case', () => {
			expect(toKebabCase('camelCase')).toBe('camel-case');
		});

		test('should convert PascalCase to kebab-case', () => {
			expect(toKebabCase('PascalCase')).toBe('pascal-case');
		});

		test('should handle acronyms', () => {
			expect(toKebabCase('XMLHttpRequest')).toBe('xml-http-request');
			expect(toKebabCase('getUserID')).toBe('get-user-id');
		});

		test('should handle already kebab-case', () => {
			expect(toKebabCase('already-kebab-case')).toBe('already-kebab-case');
		});
	});
});
