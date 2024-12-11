/* eslint-disable @typescript-eslint/no-unsafe-return */
import { configDotenv } from 'dotenv'

import type { EnvironmentInfo, MapNamesToKeys } from './structures'

import { debug } from './utils'

configDotenv()

export class EnvironmentBuilder<E = unknown, O = unknown> {
	private constructor(private readonly info: EnvironmentInfo<E>) {}

	static create<S extends string[]>(
		...requiredKeys: S
		// eslint-disable-next-line @typescript-eslint/no-empty-object-type
	): EnvironmentBuilder<{ [K in keyof MapNamesToKeys<S>]: MapNamesToKeys<S>[K] }, {}> {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const initialInfo: EnvironmentInfo<any> = {
			defaultValues: {},
			optionalKeys: [],
			prefix: '',
			requiredKeys,
			transforms: {},
		}

		return new EnvironmentBuilder(initialInfo)
	}

	defaults(defaultValues: Partial<E> = {}): EnvironmentBuilder<E, O> {
		const updatedInfo: EnvironmentInfo<E> = { ...this.info, defaultValues }

		return new EnvironmentBuilder(updatedInfo)
	}

	environment(keys: Record<string, string | undefined> = process.env): { [K in keyof (E & O)]: (E & O)[K] } {
		const optionalEnvs = this.processOptionalKeys(keys)
		const requiredEnvs = this.processRequiredKeys(keys)
		const allEnvs = { ...optionalEnvs, ...requiredEnvs.requiredValues }
		const errors = requiredEnvs.errors

		if (errors.length > 0) {
			const message = `The following environment variables are required but not set: ${JSON.stringify(errors)}`
			throw new Error(message)
		}

		return allEnvs as { [K in keyof (E & O)]: (E & O)[K] }
	}

	optionals<S extends string[]>(
		...vars: S
	): EnvironmentBuilder<E, { [K in keyof MapNamesToKeys<S>]?: MapNamesToKeys<S>[K] } & O> {
		const updatedInfo: EnvironmentInfo<E> = { ...this.info, optionalKeys: [...this.info.optionalKeys, ...vars] }

		return new EnvironmentBuilder(updatedInfo)
	}

	transform<S extends (keyof (E & O))[], R>(
		transform: (value: string) => R,
		...vars: S
	): EnvironmentBuilder<
		{ [K in keyof Pick<E, Exclude<S[number], keyof O>>]: R } & Omit<E, S[number]>,
		{ [K in keyof Pick<O, Exclude<S[number], keyof E>>]: R } & Omit<O, S[number]>
	> {
		const updatedTransforms = vars.reduce(
			(acc, key) => ({
				...acc,
				[key]: transform,
			}),
			this.info.transforms,
		)

		return new EnvironmentBuilder({
			...this.info,
			transforms: updatedTransforms,
		}) as EnvironmentBuilder<
			{ [K in keyof Pick<E, Exclude<S[number], keyof O>>]: R } & Omit<E, S[number]>,
			{ [K in keyof Pick<O, Exclude<S[number], keyof E>>]: R } & Omit<O, S[number]>
		>
	}

	withPrefix(prefix: string): EnvironmentBuilder<E, O> {
		debug(`Using environment variable prefix [${prefix}]`)

		const exampleKeys = [...this.info.requiredKeys, ...this.info.optionalKeys]
		const examples = exampleKeys.map((key) => `${prefix}${key.toUpperCase()}=example_value`)

		if (examples.length > 0) {
			debug(`Example usage: [${examples.join(', ')}]`)
		} else {
			debug(`Example usage: ${prefix}VARIABLE_NAME=example_value`)
		}

		const updatedInfo: EnvironmentInfo<E> = { ...this.info, prefix }

		return new EnvironmentBuilder(updatedInfo)
	}

	// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
	private applyTransform<T>(key: string, value: string | undefined): T | undefined {
		const transformFunction = this.info.transforms[key]

		if (typeof transformFunction === 'function' && value !== undefined) {
			return transformFunction(value) as T
		}

		return value as unknown as T | undefined
	}

	private prefixedKey(key: string): string {
		const prefixed = this.info.prefix ? `${this.info.prefix}${key}` : key

		return prefixed
	}

	private processOptionalKeys(environment: Record<string, string | undefined>): Partial<E> {
		debug('Processing optional keys')
		const optionalValues: Partial<E> = {}

		for (const key of this.info.optionalKeys) {
			const envKey = this.prefixedKey(key)
			const envValue = environment[envKey]
			const transformedValue = this.applyTransform(key, envValue)
			optionalValues[key as keyof E] = transformedValue as E[keyof E]

			debug('Resolved optional key', [key], 'value', [envValue], 'transformed', [transformedValue])
		}

		debug('Final optional values', [optionalValues])

		return optionalValues
	}

	private processRequiredKeys(environment: Record<string, string | undefined>): {
		errors: string[]
		requiredValues: Partial<E>
	} {
		debug('Processing required keys')
		const result = { errors: [] as string[], requiredValues: {} as Partial<E> }

		for (const key of this.info.requiredKeys) {
			const envKey = this.prefixedKey(key)
			const envValue = environment[envKey]
			const defaultValue = this.info.defaultValues[key as keyof E]
			const finalValue = envValue ?? defaultValue

			if (finalValue !== undefined) {
				result.requiredValues[key as keyof E] = this.applyTransform(key, finalValue as string)
				debug('Resolved required key', [key], 'value', [finalValue])
			} else {
				result.errors.push(key)
				debug('Missing required key', [key])
			}
		}

		debug('Final required values', [result.requiredValues], 'errors', [result.errors])

		return result
	}
}
