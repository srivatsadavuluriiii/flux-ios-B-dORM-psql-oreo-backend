import { getSupabaseClient, type FluxUser } from '$lib/database/supabase.js';
import type { Provider } from '@supabase/supabase-js';

export interface OAuthProvider {
	name: string;
	id: Provider;
	displayName: string;
	icon: string;
	scopes?: string;
	enabled: boolean;
}

export interface OAuthSession {
	user: FluxUser;
	access_token: string;
	refresh_token: string;
	expires_in: number;
	provider: string;
}

/**
 * Available OAuth providers for Flux
 */
export const OAUTH_PROVIDERS: Record<string, OAuthProvider> = {
	github: {
		name: 'github',
		id: 'github',
		displayName: 'GitHub',
		icon: 'github',
		enabled: true
	},
	google: {
		name: 'google',
		id: 'google',
		displayName: 'Google',
		icon: 'google',
		scopes: 'openid email profile',
		enabled: true
	}
};

/**
 * Get enabled OAuth providers
 */
export function getEnabledProviders(): OAuthProvider[] {
	return Object.values(OAUTH_PROVIDERS).filter(provider => provider.enabled);
}

/**
 * Check if OAuth provider is supported
 */
export function isProviderSupported(provider: string): boolean {
	return provider in OAUTH_PROVIDERS && OAUTH_PROVIDERS[provider].enabled;
}

/**
 * Initiate OAuth flow for specified provider
 */
export async function initiateOAuthFlow(
	provider: Provider,
	redirectTo?: string,
	baseUrl?: string
): Promise<{ url: string | null; error: string | null }> {
	try {
		if (!isProviderSupported(provider)) {
			return { url: null, error: `Provider ${provider} is not supported or enabled` };
		}

		const supabase = getSupabaseClient();
		const providerConfig = OAUTH_PROVIDERS[provider];
		
		const options: any = {
			redirectTo: `${baseUrl || 'http://localhost:3000'}/api/v1/auth/oauth/${provider}/callback`
		};

		// Add redirect destination
		if (redirectTo) {
			options.redirectTo += `?redirectTo=${encodeURIComponent(redirectTo)}`;
		}

		// Add provider-specific scopes
		if (providerConfig.scopes) {
			options.scopes = providerConfig.scopes;
		}

		const { data, error } = await supabase.auth.signInWithOAuth({
			provider,
			options
		});

		if (error) {
			console.error(`[Flux Auth] ${provider} OAuth initiation error:`, error);
			return { url: null, error: error.message };
		}

		return { url: data.url, error: null };

	} catch (error) {
		console.error(`[Flux Auth] ${provider} OAuth error:`, error);
		return { 
			url: null, 
			error: error instanceof Error ? error.message : 'Unknown OAuth error' 
		};
	}
}

/**
 * Handle OAuth callback and exchange code for session
 */
export async function handleOAuthCallback(
	code: string,
	provider: string
): Promise<{ session: OAuthSession | null; error: string | null }> {
	try {
		if (!isProviderSupported(provider)) {
			return { session: null, error: `Provider ${provider} is not supported` };
		}

		const supabase = getSupabaseClient();
		
		// Exchange authorization code for session
		const { data, error } = await supabase.auth.exchangeCodeForSession(code);

		if (error) {
			console.error(`[Flux Auth] ${provider} OAuth callback error:`, error);
			return { session: null, error: error.message };
		}

		if (!data.session || !data.user) {
			return { session: null, error: 'No session created from OAuth callback' };
		}

		// Create OAuth session object
		const session: OAuthSession = {
			user: data.user as FluxUser,
			access_token: data.session.access_token,
			refresh_token: data.session.refresh_token,
			expires_in: data.session.expires_in,
			provider
		};

		console.log(`[Flux Auth] ${provider} OAuth successful for user: ${data.user.email}`);
		
		return { session, error: null };

	} catch (error) {
		console.error(`[Flux Auth] ${provider} OAuth callback error:`, error);
		return { 
			session: null, 
			error: error instanceof Error ? error.message : 'Unknown OAuth callback error' 
		};
	}
}

/**
 * Link OAuth provider to existing user account
 */
export async function linkOAuthProvider(
	provider: Provider,
	userId: string
): Promise<{ success: boolean; error: string | null }> {
	try {
		const supabase = getSupabaseClient();
		
		// Note: linkIdentity API might need different implementation
		// For now, we'll use signInWithOAuth to link accounts
		const { error } = await supabase.auth.signInWithOAuth({
			provider,
			options: {
				skipBrowserRedirect: true
			}
		});

		if (error) {
			console.error(`[Flux Auth] Failed to link ${provider} provider:`, error);
			return { success: false, error: error.message };
		}

		console.log(`[Flux Auth] Successfully linked ${provider} provider for user: ${userId}`);
		return { success: true, error: null };

	} catch (error) {
		console.error(`[Flux Auth] Link provider error:`, error);
		return { 
			success: false, 
			error: error instanceof Error ? error.message : 'Unknown link provider error' 
		};
	}
}

/**
 * Unlink OAuth provider from user account
 */
export async function unlinkOAuthProvider(
	provider: Provider,
	userId: string
): Promise<{ success: boolean; error: string | null }> {
	try {
		const supabase = getSupabaseClient();
		
		// Note: unlinkIdentity requires identity object, not just provider
		// This would need to be implemented with proper identity management
		const { error } = await supabase.rpc('unlink_provider', { 
			provider_name: provider 
		});

		if (error) {
			console.error(`[Flux Auth] Failed to unlink ${provider} provider:`, error);
			return { success: false, error: error.message };
		}

		console.log(`[Flux Auth] Successfully unlinked ${provider} provider for user: ${userId}`);
		return { success: true, error: null };

	} catch (error) {
		console.error(`[Flux Auth] Unlink provider error:`, error);
		return { 
			success: false, 
			error: error instanceof Error ? error.message : 'Unknown unlink provider error' 
		};
	}
}

/**
 * Get user's linked OAuth providers
 */
export async function getUserLinkedProviders(userId: string): Promise<string[]> {
	try {
		const supabase = getSupabaseClient();
		
		const { data: user, error } = await supabase.auth.getUser();
		
		if (error || !user.user) {
			console.error('[Flux Auth] Failed to get user providers:', error);
			return [];
		}

		// Extract providers from user identities
		const providers = user.user.identities?.map(identity => identity.provider) || [];
		
		return providers;

	} catch (error) {
		console.error('[Flux Auth] Get user providers error:', error);
		return [];
	}
} 