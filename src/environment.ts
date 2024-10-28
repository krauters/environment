/* eslint-disable @typescript-eslint/no-unsafe-return */
// environment-builder.ts
import type { EnvironmentInfo, MapNamesToKeys } from './structures'

export class EnvironmentBuilder<E = unknown, O = unknown> {
	private constructor(private readonly info: EnvironmentInfo<E>) {}

	static create<S extends string[]>(
		...vars: S
		// eslint-disable-next-line @typescript-eslint/no-empty-object-type
	): EnvironmentBuilder<{ [K in keyof MapNamesToKeys<S>]: MapNamesToKeys<S>[K] }, {}> {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const initialInfo: EnvironmentInfo<any> = {
			defaultValues: {},
			optionalKeys: [],
			requiredKeys: vars,
			transforms: {},
		}

		return new EnvironmentBuilder(initialInfo)
	}

	private applyTransform(key: string, value: string | undefined): unknown {
		const transformFunction = this.info.transforms[key]

		return typeof transformFunction === 'function' && value ? transformFunction(value) : value
	}

	private processOptionalKeys(environment: Record<string, string | undefined>): Partial<E> {
		const optionalValues: Partial<E> = {}

		for (const key of this.info.optionalKeys) {
			const envValue = environment[key]
			optionalValues[key as keyof E] = this.applyTransform(key, envValue) as E[keyof E]
		}

		return optionalValues
	}

	private processRequiredKeys(environment: Record<string, string | undefined>): {
		errors: string[]
		requiredValues: Partial<E>
	} {
		const result = { errors: [] as string[], requiredValues: {} as Partial<E> }

		for (const key of this.info.requiredKeys) {
			const envValue = environment[key]
			const hasEnvValue = envValue !== undefined
			const defaultValue = this.info.defaultValues[key as keyof E]
			const finalValue = hasEnvValue ? envValue : defaultValue

			if (finalValue !== undefined) {
				result.requiredValues[key as keyof E] = this.applyTransform(key, finalValue as string) as E[keyof E]
			} else {
				result.errors.push(key)
			}
		}

		return result
	}

	defaults(defaultValues: Partial<E> = {}): EnvironmentBuilder<E, O> {
		const updatedInfo: EnvironmentInfo<E> = { ...this.info, defaultValues }

		return new EnvironmentBuilder(updatedInfo)
	}

	environment(variables: Record<string, string | undefined> = process.env): { [K in keyof (E & O)]: (E & O)[K] } {
		const optionalEnvs = this.processOptionalKeys(variables)
		const requiredEnvs = this.processRequiredKeys(variables)
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
}
