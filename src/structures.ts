export type MapNamesToKeys<T extends readonly string[]> = { [K in T[number]]: string }

export interface EnvironmentInfo<E = unknown> {
	defaultValues: Partial<E>
	optionalKeys: string[]
	requiredKeys: string[]
	transforms: Record<string, (value: string) => unknown>
}
