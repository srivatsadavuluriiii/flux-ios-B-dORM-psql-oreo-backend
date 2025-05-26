import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { getEnabledProviders } from '$lib/services/auth/oauth-providers.js';

/**
 * Get available OAuth providers
 * GET /api/v1/auth/oauth
 */
export const GET: RequestHandler = async () => {
	try {
		const providers = getEnabledProviders();
		
		return json({
			success: true,
			message: 'Available OAuth providers for Flux authentication',
			data: {
				providers: providers.map(provider => ({
					name: provider.name,
					displayName: provider.displayName,
					icon: provider.icon,
					enabled: provider.enabled,
					initiate_url: `/api/v1/auth/oauth/${provider.name}`,
					callback_url: `/api/v1/auth/oauth/${provider.name}/callback`
				})),
				total: providers.length
			}
		});

	} catch (error) {
		console.error('[Flux Auth] OAuth providers error:', error);
		return json({
			success: false,
			error: 'Failed to get OAuth providers'
		}, { status: 500 });
	}
}; 