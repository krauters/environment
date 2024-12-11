export function debug(message: string, ...args: unknown[]) {
	if (process.env.KRAUTERS_ENVIRONMENT_DEBUG) {
		console.debug('[@krauters/environment]', message, ...args)
	}
}
