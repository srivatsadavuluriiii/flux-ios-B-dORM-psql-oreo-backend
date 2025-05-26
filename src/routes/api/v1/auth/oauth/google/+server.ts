import { json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { getSupabaseClient } from '$lib/database/supabase.js';

/**
 * Google OAuth initiation endpoint
 * GET /api/v1/auth/oauth/google
 */
export const GET: RequestHandler = async ({ url }) => {
	try {
		// Check if Google OAuth is properly configured
		const googleClientId = process.env.GOOGLE_CLIENT_ID;
		const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
		
		if (!googleClientId || !googleClientSecret || 
			googleClientId === 'placeholder_google_client_id' || 
			googleClientSecret === 'placeholder_google_secret') {
			return json({
				success: false,
				error: 'Google OAuth not configured for this environment',
				code: 'OAUTH_NOT_CONFIGURED'
			}, { status: 501 }); // Not Implemented
		}
		
		const supabase = getSupabaseClient();
		
		// Get redirect URL from query params or use default
		const redirectTo = url.searchParams.get('redirectTo') || '/dashboard';
		
		// Initiate Google OAuth flow
		const { data, error } = await supabase.auth.signInWithOAuth({
			provider: 'google',
			options: {
				redirectTo: `${url.origin}/api/v1/auth/oauth/google/callback?redirectTo=${encodeURIComponent(redirectTo)}`,
				scopes: 'openid email profile'
			}
		});

		if (error) {
			console.error('[Flux Auth] Google OAuth initiation error:', error);
			return json({
				success: false,
				error: error.message || 'Google OAuth initiation failed'
			}, { status: 400 });
		}

		if (data.url) {
			// Return redirect response to Google OAuth
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
			error: 'Google OAuth URL not generated'
		}, { status: 400 });

	} catch (error) {
		console.error('[Flux Auth] ❌ Google OAuth error:', error);
		return json({
			success: false,
			error: 'Internal server error'
		}, { status: 500 });
	}
}; 