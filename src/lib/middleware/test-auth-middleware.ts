import type { Handle, RequestEvent } from '@sveltejs/kit';
import jsonwebtoken from 'jsonwebtoken';
import type { FluxUser } from '../database/supabase.js';
import fs from 'fs';
import path from 'path';

export interface TestAuthLocals {
	user: FluxUser | null;
	isAuthenticated: boolean;
}

// Function to get JWT secret from .env file
function getJwtSecret(): string {
	try {
		// Try to read from environment variable first
		if (process.env.JWT_SECRET) {
			return process.env.JWT_SECRET;
		}
		
		// Fallback to reading from .env file
		const envPath = path.resolve(process.cwd(), '.env');
		const envContent = fs.readFileSync(envPath, 'utf8');
		const jwtSecretMatch = envContent.match(/JWT_SECRET=(.+)$/m);
		
		if (jwtSecretMatch && jwtSecretMatch[1]) {
			return jwtSecretMatch[1].trim();
		}
		
		// Final fallback
		console.warn('[Flux Test Auth] JWT_SECRET not found in .env file, using default test secret');
		return 'flux_development_secret';
	} catch (error) {
		console.warn('[Flux Test Auth] Error reading JWT_SECRET:', error);
		// Fallback to a default secret for testing
		return 'flux_development_secret';
	}
}

/**
 * Authentication middleware for testing
 * Verifies JWT tokens using a known secret
 */
export const testAuthMiddleware: Handle = async ({ event, resolve }) => {
	// Initialize auth locals
	event.locals.user = null;
	event.locals.isAuthenticated = false;

	try {
		const authHeader = event.request.headers.get('Authorization');
		console.log('[Flux Test Auth] Auth header:', authHeader);
		
		if (authHeader?.startsWith('Bearer ')) {
			const token = authHeader.substring(7);
			console.log('[Flux Test Auth] Token found, verifying...');
			
			// Verify token with secret from .env
			const secretKey = getJwtSecret();
			try {
				const payload = jsonwebtoken.verify(token, secretKey);
				console.log('[Flux Test Auth] Token verified, payload:', payload);
				
				if (payload && typeof payload === 'object' && payload.sub) {
					// Create user object (ensure it matches FluxUser interface)
					const testUser = {
						id: payload.sub,
						aud: 'authenticated',
						role: payload.role || 'authenticated',
						email: payload.email || 'test@flux.dev',
						email_confirmed_at: new Date().toISOString(),
						app_metadata: {
							providers: ['test']
						},
						user_metadata: {
							full_name: payload.name || 'Test User'
						},
						created_at: new Date().toISOString(),
						updated_at: new Date().toISOString(),
						phone: '',
						confirmed_at: new Date().toISOString(),
						last_sign_in_at: new Date().toISOString(),
						recovery_sent_at: undefined
					};
					
					event.locals.user = testUser as unknown as FluxUser;
					event.locals.isAuthenticated = true;
					
					// Log successful authentication
					console.log(`[Flux Test Auth] User authenticated: ${payload.sub}`);
				} else {
					console.log('[Flux Test Auth] Invalid payload structure:', payload);
				}
			} catch (verifyError) {
				console.error('[Flux Test Auth] Token verification failed:', verifyError);
			}
		} else {
			console.log('[Flux Test Auth] No Bearer token found');
		}
	} catch (error) {
		console.error('[Flux Test Auth] Authentication error:', error);
	}

	return resolve(event);
};

/**
 * Require authentication for protected routes
 */
export function requireTestAuth(event: RequestEvent): any {
	console.log('[Flux Test Auth] requireTestAuth called');
	
	const authHeader = event.request.headers.get('Authorization');
	console.log('[Flux Test Auth] Auth header in requireTestAuth:', authHeader);
	
	if (!authHeader?.startsWith('Bearer ')) {
		console.log('[Flux Test Auth] No Bearer token found in requireTestAuth');
		throw new Response('Unauthorized', { 
			status: 401,
			headers: {
				'Content-Type': 'application/json'
			}
		});
	}

	const token = authHeader.substring(7);
	console.log('[Flux Test Auth] Token in requireTestAuth:', token.substring(0, 20) + '...');
	
	try {
		// Verify token with secret from .env
		const secretKey = getJwtSecret();
		console.log('[Flux Test Auth] Verifying token with secret');
		
		const payload = jsonwebtoken.verify(token, secretKey);
		console.log('[Flux Test Auth] Token verified in requireTestAuth, payload:', payload);
		
		if (payload && typeof payload === 'object' && payload.sub) {
			// Create user object (must match FluxUser interface)
			const testUser = {
				id: payload.sub,
				aud: 'authenticated',
				role: payload.role || 'authenticated',
				email: payload.email || 'test@flux.dev',
				email_confirmed_at: new Date().toISOString(),
				app_metadata: {
					providers: ['test']
				},
				user_metadata: {
					full_name: payload.name || 'Test User'
				},
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
				phone: '',
				confirmed_at: new Date().toISOString(),
				last_sign_in_at: new Date().toISOString(),
				recovery_sent_at: undefined
			};
			
			console.log('[Flux Test Auth] User created in requireTestAuth:', testUser.id);
			return testUser as unknown as FluxUser;
		} else {
			console.log('[Flux Test Auth] Invalid payload structure in requireTestAuth:', payload);
		}
	} catch (error) {
		console.error('[Flux Test Auth] Authentication error in requireTestAuth:', error);
	}

	console.log('[Flux Test Auth] Authentication failed in requireTestAuth');
	throw new Response('Unauthorized', { 
		status: 401,
		headers: {
			'Content-Type': 'application/json'
		}
	});
}

export default testAuthMiddleware; 