import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import { FLUX_CONFIG } from '../config/environment.js';

// Types for Flux user data (extend Supabase User type)
export interface FluxUser extends User {
	email_verified?: boolean;
}

export interface FluxSession {
	access_token: string;
	refresh_token: string;
	expires_in: number;
	token_type: 'bearer';
	user: FluxUser;
}

// Lazy initialization of Supabase clients
let supabase: SupabaseClient | null = null;
let supabaseAdmin: SupabaseClient | null = null;

function initializeSupabaseClient(): SupabaseClient {
	if (supabase) return supabase;
	
	const SUPABASE_URL = FLUX_CONFIG.supabaseUrl;
	const SUPABASE_ANON_KEY = FLUX_CONFIG.supabaseAnonKey;
	
	if (!SUPABASE_ANON_KEY) {
		console.warn('[Flux Supabase] SUPABASE_ANON_KEY not found, using placeholder');
		return createClient(SUPABASE_URL, 'placeholder-key');
	}
	
	try {
		supabase = createClient(
			SUPABASE_URL,
			SUPABASE_ANON_KEY,
			{
				auth: {
					autoRefreshToken: true,
					persistSession: true,
					detectSessionInUrl: true,
					flowType: 'pkce'
				}
			}
		);
		return supabase;
	} catch (error) {
		console.error('[Flux Supabase] Failed to initialize client:', error);
		throw new Error('Supabase client initialization failed');
	}
}

function initializeSupabaseAdmin(): SupabaseClient {
	if (supabaseAdmin) return supabaseAdmin;
	
	const SUPABASE_URL = FLUX_CONFIG.supabaseUrl;
	const SUPABASE_SERVICE_ROLE_KEY = FLUX_CONFIG.supabaseServiceRoleKey;
	
	if (!SUPABASE_SERVICE_ROLE_KEY) {
		console.warn('[Flux Supabase] SUPABASE_SERVICE_ROLE_KEY not found, using placeholder');
		return createClient(SUPABASE_URL, 'placeholder-key');
	}
	
	try {
		supabaseAdmin = createClient(
			SUPABASE_URL,
			SUPABASE_SERVICE_ROLE_KEY,
			{
				auth: {
					autoRefreshToken: false,
					persistSession: false
				}
			}
		);
		return supabaseAdmin;
	} catch (error) {
		console.error('[Flux Supabase] Failed to initialize admin client:', error);
		throw new Error('Supabase admin client initialization failed');
	}
}

/**
 * Get public Supabase client for authentication operations
 */
export function getSupabaseClient(): SupabaseClient {
	return initializeSupabaseClient();
}

/**
 * Get admin Supabase client for server-side operations
 */
export function getSupabaseAdmin(): SupabaseClient {
	return initializeSupabaseAdmin();
}

/**
 * Verify JWT token and return user data
 */
export async function verifySupabaseToken(token: string): Promise<FluxUser | null> {
	try {
		const admin = initializeSupabaseAdmin();
		const { data: { user }, error } = await admin.auth.getUser(token);
		
		if (error || !user) {
			console.error('[Flux Supabase] Token verification failed:', error);
			return null;
		}

		return user as FluxUser;
	} catch (error) {
		console.error('[Flux Supabase] Token verification error:', error);
		return null;
	}
}

/**
 * Get user session from Supabase
 */
export async function getSupabaseSession(request: Request): Promise<FluxSession | null> {
	try {
		const authHeader = request.headers.get('Authorization');
		if (!authHeader?.startsWith('Bearer ')) {
			return null;
		}

		const token = authHeader.substring(7);
		const admin = initializeSupabaseAdmin();
		const { data: { user }, error } = await admin.auth.getUser(token);

		if (error || !user) {
			return null;
		}

		// Create session object
		const session: FluxSession = {
			access_token: token,
			refresh_token: '', // Not available in server context
			expires_in: 3600, // Default 1 hour
			token_type: 'bearer',
			user: user as FluxUser
		};

		return session;
	} catch (error) {
		console.error('[Flux Supabase] Session retrieval error:', error);
		return null;
	}
}

/**
 * Check if Supabase is available
 */
export function isSupabaseAvailable(): boolean {
	try {
		return !!(supabase && supabaseAdmin);
	} catch {
		return false;
	}
}

/**
 * Health check for Supabase connection
 */
export async function checkSupabaseHealth(): Promise<{ status: string; details?: any }> {
	try {
		// Test basic connection by checking auth endpoint
		const client = initializeSupabaseClient();
		const { data, error } = await client.auth.getSession();
		
		const SUPABASE_URL = FLUX_CONFIG.supabaseUrl;
		
		return {
			status: 'healthy',
			details: {
				connected: true,
				auth_available: !error,
				url: SUPABASE_URL
			}
		};
	} catch (error) {
		return {
			status: 'unhealthy',
			details: {
				connected: false,
				error: error instanceof Error ? error.message : 'Unknown error'
			}
		};
	}
}

export default getSupabaseClient; 