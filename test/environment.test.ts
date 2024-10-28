import { describe, it, expect, jest } from '@jest/globals'
import { EnvironmentBuilder } from '../src/environment'

describe('EnvironmentBuilder', () => {
	describe('create', () => {
		it('should initialize with required keys', () => {
			const builder = EnvironmentBuilder.create('REQUIRED_KEY1', 'REQUIRED_KEY2')
			const envInfo = (builder as any).info
			expect(envInfo.requiredKeys).toEqual(['REQUIRED_KEY1', 'REQUIRED_KEY2'])
			expect(envInfo.optionalKeys).toEqual([])
			expect(envInfo.defaultValues).toEqual({})
			expect(envInfo.transforms).toEqual({})
		})
	})

	describe('defaults', () => {
		it('should set default values only for required environment variables', () => {
			const builder = EnvironmentBuilder.create('REQUIRED_KEY').defaults({ REQUIRED_KEY: 'defaultValue' })
			const envInfo = (builder as any).info
			expect(envInfo.defaultValues.REQUIRED_KEY).toBe('defaultValue')
		})

		it('should not set defaults for optional keys', () => {
			const builder = EnvironmentBuilder.create('REQUIRED_KEY').optionals('OPTIONAL_KEY')
			const envInfo = (builder as any).info
			expect(envInfo.defaultValues.OPTIONAL_KEY).toBeUndefined()
		})
	})

	describe('optionals', () => {
		it('should add optional keys without defaults', () => {
			const builder = EnvironmentBuilder.create('REQUIRED_KEY').optionals('OPTIONAL_KEY1', 'OPTIONAL_KEY2')
			const envInfo = (builder as any).info
			expect(envInfo.optionalKeys).toContain('OPTIONAL_KEY1')
			expect(envInfo.optionalKeys).toContain('OPTIONAL_KEY2')
			expect(envInfo.defaultValues).not.toHaveProperty('OPTIONAL_KEY1')
			expect(envInfo.defaultValues).not.toHaveProperty('OPTIONAL_KEY2')
		})
	})

	describe('transform', () => {
		it('should add transformation functions for specific keys', () => {
			const transformFunction = jest.fn((value: string) => value.toUpperCase())
			const builder = EnvironmentBuilder.create('REQUIRED_KEY').transform(transformFunction, 'REQUIRED_KEY')
			const envInfo = (builder as any).info
			expect(envInfo.transforms.REQUIRED_KEY).toBe(transformFunction)
		})
	})

	describe('environment', () => {
		it('should apply required environment variables from process.env', () => {
			process.env.REQUIRED_KEY = 'testValue'
			const builder = EnvironmentBuilder.create('REQUIRED_KEY')
			const result = builder.environment(process.env)
			expect(result.REQUIRED_KEY).toBe('testValue')
			delete process.env.REQUIRED_KEY
		})

		it('should throw an error if required keys are missing and no default is provided', () => {
			const builder = EnvironmentBuilder.create('MISSING_KEY')
			expect(() => builder.environment({})).toThrowError(
				/The following environment variables are required but not set: \["MISSING_KEY"\]/
			)
		})

		it('should use default values if required environment variables are missing', () => {
			const builder = EnvironmentBuilder.create('REQUIRED_KEY').defaults({ REQUIRED_KEY: 'defaultValue' })
			const result = builder.environment({})
			expect(result.REQUIRED_KEY).toBe('defaultValue')
		})

		it('should apply transformations to environment variables', () => {
			const transformFunction = (value: string) => value.toUpperCase()
			const builder = EnvironmentBuilder.create('REQUIRED_KEY').transform(transformFunction, 'REQUIRED_KEY')
			const result = builder.environment({ REQUIRED_KEY: 'lowercase' })
			expect(result.REQUIRED_KEY).toBe('LOWERCASE')
		})

		it('should handle optional environment variables without error', () => {
			const builder = EnvironmentBuilder.create('REQUIRED_KEY').optionals('OPTIONAL_KEY')
			const result = builder.environment({ REQUIRED_KEY: 'value', OPTIONAL_KEY: 'optionalValue' })
			expect(result.REQUIRED_KEY).toBe('value')
			expect(result.OPTIONAL_KEY).toBe('optionalValue')
		})

		it('should allow optional environment variables to be missing without error', () => {
			const builder = EnvironmentBuilder.create('REQUIRED_KEY').optionals('OPTIONAL_KEY')
			const result = builder.environment({ REQUIRED_KEY: 'value' })
			expect(result.REQUIRED_KEY).toBe('value')
			expect(result.OPTIONAL_KEY).toBeUndefined()
		})

		it('should use only required environment variables with defaults', () => {
			const builder = EnvironmentBuilder.create('REQUIRED_KEY')
				.optionals('OPTIONAL_KEY')
				.defaults({ REQUIRED_KEY: 'defaultValue' })
			const result = builder.environment({})
			expect(result.REQUIRED_KEY).toBe('defaultValue')
			expect(result.OPTIONAL_KEY).toBeUndefined()
		})
	})
})
