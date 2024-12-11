/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, jest } from '@jest/globals'

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
				/The following environment variables are required but not set: \["MISSING_KEY"\]/,
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
			const result = builder.environment({ OPTIONAL_KEY: 'optionalValue', REQUIRED_KEY: 'value' })
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

describe('EnvironmentBuilder with Prefix', () => {
	describe('withPrefix', () => {
		it('should use the prefix for environment variable lookup', () => {
			process.env.MYAPP_REQUIRED_KEY = 'prefixedValue'
			const builder = EnvironmentBuilder.create('REQUIRED_KEY').withPrefix('MYAPP_')
			const result = builder.environment(process.env)
			expect(result.REQUIRED_KEY).toBe('prefixedValue')
			delete process.env.MYAPP_REQUIRED_KEY
		})

		it('should fallback to default values if prefixed environment variables are missing', () => {
			const builder = EnvironmentBuilder.create('REQUIRED_KEY')
				.withPrefix('MYAPP_')
				.defaults({ REQUIRED_KEY: 'defaultValue' })
			const result = builder.environment({})
			expect(result.REQUIRED_KEY).toBe('defaultValue')
		})

		it('should throw an error if prefixed required variables are missing and no default is provided', () => {
			const builder = EnvironmentBuilder.create('MISSING_KEY').withPrefix('MYAPP_')
			expect(() => builder.environment({})).toThrowError(
				/The following environment variables are required but not set: \["MISSING_KEY"\]/,
			)
		})

		it('should handle optional prefixed environment variables', () => {
			process.env.MYAPP_REQUIRED_KEY = 'requiredValue'
			process.env.MYAPP_OPTIONAL_KEY = 'optionalValue'
			const result = EnvironmentBuilder.create('REQUIRED_KEY')
				.withPrefix('MYAPP_')
				.optionals('OPTIONAL_KEY')
				.environment()

			expect(result.REQUIRED_KEY).toBe('requiredValue')
			expect(result.OPTIONAL_KEY).toBe('optionalValue')
			delete process.env.MYAPP_REQUIRED_KEY
			delete process.env.MYAPP_OPTIONAL_KEY
		})

		it('should allow missing optional prefixed environment variables without error', () => {
			const builder = EnvironmentBuilder.create('REQUIRED_KEY').withPrefix('MYAPP_').optionals('OPTIONAL_KEY')
			const result = builder.environment({ MYAPP_REQUIRED_KEY: 'requiredValue' })
			expect(result.REQUIRED_KEY).toBe('requiredValue')
			expect(result.OPTIONAL_KEY).toBeUndefined()
		})

		it('should apply transformations to prefixed environment variables', () => {
			process.env.MYAPP_REQUIRED_KEY = 'lowercase'
			const transformFunction = (value: string) => value.toUpperCase()
			const builder = EnvironmentBuilder.create('REQUIRED_KEY')
				.withPrefix('MYAPP_')
				.transform(transformFunction, 'REQUIRED_KEY')
			const result = builder.environment(process.env)
			expect(result.REQUIRED_KEY).toBe('LOWERCASE')
			delete process.env.MYAPP_REQUIRED_KEY
		})
	})

	describe('environment', () => {
		it('should not use the prefix if it is not set', () => {
			process.env.REQUIRED_KEY = 'noPrefixValue'
			const builder = EnvironmentBuilder.create('REQUIRED_KEY')
			const result = builder.environment(process.env)
			expect(result.REQUIRED_KEY).toBe('noPrefixValue')
			delete process.env.REQUIRED_KEY
		})

		it('should properly switch between prefixed and unprefixed logic', () => {
			process.env.MYAPP_REQUIRED_KEY = 'prefixedValue'
			const builderWithPrefix = EnvironmentBuilder.create('REQUIRED_KEY').withPrefix('MYAPP_')
			const resultWithPrefix = builderWithPrefix.environment(process.env)
			expect(resultWithPrefix.REQUIRED_KEY).toBe('prefixedValue')

			process.env.REQUIRED_KEY = 'unprefixedValue'
			const builderWithoutPrefix = EnvironmentBuilder.create('REQUIRED_KEY')
			const resultWithoutPrefix = builderWithoutPrefix.environment(process.env)
			expect(resultWithoutPrefix.REQUIRED_KEY).toBe('unprefixedValue')

			delete process.env.MYAPP_REQUIRED_KEY
			delete process.env.REQUIRED_KEY
		})
	})
})
