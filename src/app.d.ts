// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			validatedBody?: any;
			validatedQuery?: any;
			userId?: string;
			cacheKey?: string;
			cacheTtl?: number;
			requestId?: string;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {}; 