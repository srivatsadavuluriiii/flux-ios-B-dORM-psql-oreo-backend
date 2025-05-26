// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
import type { FluxUser } from './lib/database/supabase';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: FluxUser | null;
			isAuthenticated: boolean;
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