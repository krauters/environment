export interface EnvironmentInfo<E = unknown> {
	defaultValues: Partial<E>
	optionalKeys: string[]
	requiredKeys: string[]
	transforms: Record<string, (value: string) => unknown>
}

export type MapNamesToKeys<T extends readonly string[]> = Record<T[number], string>
