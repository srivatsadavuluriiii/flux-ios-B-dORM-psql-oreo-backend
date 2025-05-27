import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { unlinkOAuthProvider, isProviderSupported } from '$lib/services/auth/oauth-providers.js';
import { getSupabaseClient, getSupabaseSession } from '$lib/database/supabase.js';
import { userSyncService } from '$lib/services/auth/index.js';

/**
 * Unlink OAuth provider from user account
 * POST /api/v1/auth/oauth/unlink-provider
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		// Verify user is authenticated
		const session = await getSupabaseSession(request);
		if (!session) {
			return json({
				success: false,
				error: 'Authentication required to unlink OAuth provider',
				code: 'UNAUTHORIZED'
			}, { status: 401 });
		}

		// Parse request body
		const body = await request.json();
		const { provider } = body;

		if (!provider) {
			return json({
				success: false,
				error: 'OAuth provider is required',
				code: 'MISSING_PROVIDER'
			}, { status: 400 });
		}

		if (!isProviderSupported(provider)) {
			return json({
				success: false,
				error: `Provider ${provider} is not supported or enabled`,
				code: 'PROVIDER_NOT_SUPPORTED'
			}, { status: 400 });
		}

		// Unlink OAuth provider
		const { success, error } = await unlinkOAuthProvider(provider);

		if (!success) {
			console.error('[Flux Auth] Failed to unlink OAuth provider:', error);
			return json({
				success: false,
				error: error || 'Failed to unlink OAuth provider',
				code: 'OAUTH_UNLINK_FAILED'
			}, { status: 400 });
		}

		// Update user in Railway DB to reflect unlinked provider
		try {
			const user = await userSyncService.getUserBySupabaseId(session.user.id);
			if (user) {
				// Get current linked providers and remove the unlinked one
				const providers = await getUserLinkedProviders();
				
				await userSyncService.updateUser(user.id, {
					oauth_providers: providers,
					// Reset provider-specific fields if relevant
					...(provider === 'github' ? { github_username: undefined } : {}),
					...(provider === 'google' ? { google_profile_id: undefined } : {})
				});
			}
		} catch (syncError) {
			console.error('[Flux Auth] Error syncing unlinked provider to Railway DB:', syncError);
			// Don't fail the request if only the sync fails
		}

		return json({
			success: true,
			message: `Successfully unlinked ${provider} from your account`
		});

	} catch (error) {
		console.error('[Flux Auth] OAuth provider unlinking error:', error);
		return json({
			success: false,
			error: 'Failed to process OAuth provider unlinking',
			code: 'INTERNAL_ERROR'
		}, { status: 500 });
	}
};

/**
 * Get current user's linked providers
 */
async function getUserLinkedProviders(): Promise<string[]> {
	try {
		const supabase = getSupabaseClient();
		
		const { data, error } = await supabase.auth.getUser();
		if (error || !data.user) {
			return [];
		}
		
		// Extract providers from identities
		return (data.user.identities || []).map(identity => identity.provider as string);
		
	} catch (error) {
		console.error('[Flux Auth] Error getting user providers:', error);
		return [];
	}
} 