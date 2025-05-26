import type { Handle, RequestEvent } from '@sveltejs/kit';
import { getSupabaseSession, type FluxUser } from '../database/supabase.js';

export interface AuthLocals {
	user: FluxUser | null;
	isAuthenticated: boolean;
}

/**
 * Authentication middleware for Flux
 * Extracts user data from Supabase JWT tokens
 */
export const authMiddleware: Handle = async ({ event, resolve }) => {
	// Initialize auth locals
	event.locals.user = null;
	event.locals.isAuthenticated = false;

	try {
		// Get session from Supabase
		const session = await getSupabaseSession(event.request);
		
		if (session?.user) {
			event.locals.user = session.user;
			event.locals.isAuthenticated = true;
			
			// Log successful authentication
			console.log(`[Flux Auth] User authenticated: ${session.user.email}`);
		}
	} catch (error) {
		console.error('[Flux Auth] Authentication error:', error);
	}

	return resolve(event);
};

/**
 * Require authentication for protected routes
 */
export function requireAuth(event: RequestEvent): FluxUser {
	if (!event.locals.isAuthenticated || !event.locals.user) {
		throw new Response('Unauthorized', { 
			status: 401,
			headers: {
				'Content-Type': 'application/json'
			}
		});
	}

	return event.locals.user;
}

/**
 * Optional authentication - returns user if available
 */
export function optionalAuth(event: RequestEvent): FluxUser | null {
	return event.locals.user || null;
}

/**
 * Check if request is from authenticated user
 */
export function isAuthenticated(event: RequestEvent): boolean {
	return event.locals.isAuthenticated === true;
}

/**
 * Extract user ID from authenticated request
 */
export function getUserId(event: RequestEvent): string {
	const user = requireAuth(event);
	return user.id;
}

/**
 * Extract user email from authenticated request
 */
export function getUserEmail(event: RequestEvent): string {
	const user = requireAuth(event);
	return user.email || '';
}

/**
 * Check if user has specific role (for future role-based access)
 */
export function hasRole(event: RequestEvent, role: string): boolean {
	const user = optionalAuth(event);
	if (!user?.app_metadata?.roles) return false;
	
	return Array.isArray(user.app_metadata.roles) 
		? user.app_metadata.roles.includes(role)
		: false;
}

/**
 * Get user metadata
 */
export function getUserMetadata(event: RequestEvent): Record<string, any> {
	const user = optionalAuth(event);
	return user?.user_metadata || {};
}

/**
 * Validate API key for webhook endpoints
 */
export function validateApiKey(event: RequestEvent, expectedKey: string): boolean {
	const apiKey = event.request.headers.get('X-API-Key') || 
	             event.url.searchParams.get('api_key');
	
	return apiKey === expectedKey;
}

export default authMiddleware; 