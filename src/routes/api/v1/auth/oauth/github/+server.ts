import { json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { getSupabaseClient } from '$lib/database/supabase.js';

/**
 * GitHub OAuth initiation endpoint
 * GET /api/v1/auth/oauth/github
 */
export const GET: RequestHandler = async ({ url }) => {
	try {
		// Check if GitHub OAuth is properly configured
		const githubClientId = process.env.GITHUB_CLIENT_ID;
		const githubClientSecret = process.env.GITHUB_CLIENT_SECRET;
		
		if (!githubClientId || !githubClientSecret || 
			githubClientId === 'placeholder_github_client_id' || 
			githubClientSecret === 'placeholder_github_secret') {
			return json({
				success: false,
				error: 'GitHub OAuth not configured for this environment',
				code: 'OAUTH_NOT_CONFIGURED'
			}, { status: 501 }); // Not Implemented
		}
		
		const supabase = getSupabaseClient();
		
		// Get redirect URL from query params or use default
		const redirectTo = url.searchParams.get('redirectTo') || '/dashboard';
		
		// Initiate GitHub OAuth flow
		const { data, error } = await supabase.auth.signInWithOAuth({
			provider: 'github',
			options: {
				redirectTo: `${url.origin}/api/v1/auth/oauth/github/callback?redirectTo=${encodeURIComponent(redirectTo)}`
			}
		});

		if (error) {
			console.error('[Flux Auth] GitHub OAuth initiation error:', error);
			return json({
				success: false,
				error: error.message || 'GitHub OAuth initiation failed'
			}, { status: 400 });
		}

		if (data.url) {
			// Return redirect response to GitHub OAuth
			return new Response(null, {
				status: 302,
				headers: {
					'Location': data.url,
					'Cache-Control': 'no-cache'
				}
			});
		}

		return json({
			success: false,
			error: 'GitHub OAuth URL not generated'
		}, { status: 400 });

	} catch (error) {
		console.error('[Flux Auth] ❌ GitHub OAuth error:', error);
		return json({
			success: false,
			error: 'Internal server error'
		}, { status: 500 });
	}
}; 