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
	redirectTo?: string,
	baseUrl?: string
): Promise<{ url: string | null; error: string | null }> {
	try {
		if (!isProviderSupported(provider)) {
			return { url: null, error: `Provider ${provider} is not supported or enabled` };
		}

		const supabase = getSupabaseClient();
		const providerConfig = OAUTH_PROVIDERS[provider];
		
		// Set up linking-specific callback
		const options: any = {
			redirectTo: `${baseUrl || 'http://localhost:3000'}/api/v1/auth/oauth/${provider}/callback?linking=true`
		};

		// Add redirect destination after linking
		if (redirectTo) {
			options.redirectTo += `&redirectTo=${encodeURIComponent(redirectTo)}`;
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
			console.error(`[Flux Auth] Failed to link ${provider} provider:`, error);
			return { url: null, error: error.message };
		}

		console.log(`[Flux Auth] Started OAuth flow to link ${provider} provider`);
		return { url: data.url, error: null };

	} catch (error) {
		console.error(`[Flux Auth] Link provider error:`, error);
		return { 
			url: null, 
			error: error instanceof Error ? error.message : 'Unknown link provider error' 
		};
	}
}

/**
 * Unlink OAuth provider from user account
 */
export async function unlinkOAuthProvider(
	provider: Provider
): Promise<{ success: boolean; error: string | null }> {
	try {
		const supabase = getSupabaseClient();
		
		// First get the user's current identities
		const { data: userData, error: userError } = await supabase.auth.getUser();
		
		if (userError || !userData.user) {
			console.error(`[Flux Auth] Failed to get user for unlinking:`, userError);
			return { success: false, error: userError?.message || 'User not found' };
		}
		
		// Find the identity for the specified provider
		const identities = userData.user.identities || [];
		const identity = identities.find(i => i.provider === provider);
		
		if (!identity) {
			return { success: false, error: `User does not have ${provider} linked` };
		}
		
		// Check if this is the user's only identity (can't unlink the last one)
		if (identities.length <= 1) {
			return { 
				success: false, 
				error: 'Cannot unlink the only authentication method. Add another login method first.' 
			};
		}
		
		// Unlink the provider
		const { error } = await supabase.auth.unlinkIdentity(identity);

		if (error) {
			console.error(`[Flux Auth] Failed to unlink ${provider} provider:`, error);
			return { success: false, error: error.message };
		}

		console.log(`[Flux Auth] Successfully unlinked ${provider} provider`);
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