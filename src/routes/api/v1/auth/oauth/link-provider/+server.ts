import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { linkOAuthProvider, isProviderSupported } from '$lib/services/auth/oauth-providers.js';
import { getSupabaseSession } from '$lib/database/supabase.js';

/**
 * Link OAuth provider to existing user account
 * POST /api/v1/auth/oauth/link-provider
 */
export const POST: RequestHandler = async ({ request, url }) => {
	try {
		// Verify user is authenticated
		const session = await getSupabaseSession(request);
		if (!session) {
			return json({
				success: false,
				error: 'Authentication required to link OAuth provider',
				code: 'UNAUTHORIZED'
			}, { status: 401 });
		}

		// Parse request body
		const body = await request.json();
		const { provider, redirectTo } = body;

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

		// Generate OAuth linking URL
		const { url: authUrl, error } = await linkOAuthProvider(
			provider,
			redirectTo || '/account/settings',
			url.origin
		);

		if (error || !authUrl) {
			console.error('[Flux Auth] Failed to generate OAuth linking URL:', error);
			return json({
				success: false,
				error: error || 'Failed to generate OAuth linking URL',
				code: 'OAUTH_LINK_FAILED'
			}, { status: 500 });
		}

		return json({
			success: true,
			message: 'OAuth linking URL generated',
			data: {
				url: authUrl
			}
		});

	} catch (error) {
		console.error('[Flux Auth] OAuth provider linking error:', error);
		return json({
			success: false,
			error: 'Failed to process OAuth provider linking',
			code: 'INTERNAL_ERROR'
		}, { status: 500 });
	}
}; 