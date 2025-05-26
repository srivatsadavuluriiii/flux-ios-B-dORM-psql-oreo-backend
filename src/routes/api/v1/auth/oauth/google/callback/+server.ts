import { json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { getSupabaseClient } from '$lib/database/supabase.js';

/**
 * Google OAuth callback handler
 * GET /api/v1/auth/oauth/google/callback
 */
export const GET: RequestHandler = async ({ url }) => {
	try {
		const supabase = getSupabaseClient();
		
		// Extract authorization code and state from Google
		const code = url.searchParams.get('code');
		const state = url.searchParams.get('state');
		const redirectTo = url.searchParams.get('redirectTo') || '/dashboard';
		
		if (!code) {
			console.error('[Flux Auth] Google OAuth callback: Missing authorization code');
			return json({
				success: false,
				error: 'Missing authorization code from Google'
			}, { status: 400 });
		}

		// Exchange code for session
		const { data, error } = await supabase.auth.exchangeCodeForSession(code);

		if (error) {
			console.error('[Flux Auth] Google OAuth callback error:', error);
			return json({
				success: false,
				error: error.message || 'Google OAuth authentication failed'
			}, { status: 400 });
		}

		if (!data.session || !data.user) {
			return json({
				success: false,
				error: 'Google OAuth authentication failed - no session created'
			}, { status: 400 });
		}

		// Log successful authentication
		console.log(`[Flux Auth] Google OAuth successful for user: ${data.user.email}`);

		// For API usage, return JSON with session data
		if (url.searchParams.get('format') === 'json') {
			return json({
				success: true,
				message: 'Google OAuth authentication successful',
				data: {
					user: {
						id: data.user.id,
						email: data.user.email,
						email_confirmed: data.user.email_confirmed_at ? true : false,
						full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || '',
						avatar_url: data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture || '',
						provider: 'google'
					},
					session: {
						access_token: data.session.access_token,
						refresh_token: data.session.refresh_token,
						expires_in: data.session.expires_in,
						token_type: data.session.token_type
					}
				}
			});
		}

		// For web usage, redirect to specified URL with token in query params
		const redirectUrl = new URL(redirectTo, url.origin);
		redirectUrl.searchParams.set('access_token', data.session.access_token);
		redirectUrl.searchParams.set('refresh_token', data.session.refresh_token);
		redirectUrl.searchParams.set('provider', 'google');

		throw redirect(302, redirectUrl.toString());

	} catch (error) {
		// Handle redirect errors
		if (error instanceof Response) {
			return error;
		}
		
		console.error('[Flux Auth] Google OAuth callback error:', error);
		return json({
			success: false,
			error: 'Internal server error'
		}, { status: 500 });
	}
}; 