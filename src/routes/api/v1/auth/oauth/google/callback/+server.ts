import { json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { getSupabaseClient } from '$lib/database/supabase.js';
import { userSyncService } from '$lib/services/auth/index.js';

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
		const isLinking = url.searchParams.get('linking') === 'true';
		
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
			
			// Handle specific error cases
			if (error.message?.includes('already linked')) {
				return handleOAuthError(
					'This Google account is already linked to another Flux account', 
					redirectTo,
					url.origin,
					'ACCOUNT_ALREADY_LINKED'
				);
			}
			
			return handleOAuthError(
				error.message || 'Google OAuth authentication failed', 
				redirectTo,
				url.origin
			);
		}

		if (!data.session || !data.user) {
			return handleOAuthError(
				'Google OAuth authentication failed - no session created', 
				redirectTo,
				url.origin
			);
		}

		// Log successful authentication
		console.log(`[Flux Auth] Google OAuth successful for user: ${data.user.email}`);

		// Sync user data to Railway PostgreSQL
		try {
			await userSyncService.syncUserFromSupabase(data.user);
		} catch (syncError) {
			console.error('[Flux Auth] Error syncing user after Google OAuth:', syncError);
			// Continue despite sync error
		}

		// For API usage, return JSON with session data
		if (url.searchParams.get('format') === 'json') {
			return json({
				success: true,
				message: isLinking ? 'Google account linked successfully' : 'Google OAuth authentication successful',
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
		
		// Add success message for linking flow
		if (isLinking) {
			redirectUrl.searchParams.set('message', 'Google account linked successfully');
			redirectUrl.searchParams.set('status', 'success');
		}

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

/**
 * Handle OAuth error with appropriate response
 */
function handleOAuthError(
	message: string, 
	redirectTo: string, 
	origin: string,
	code = 'OAUTH_ERROR'
): Response {
	// For API usage
	if (redirectTo.includes('format=json')) {
		return json({
			success: false,
			error: message,
			code
		}, { status: 400 });
	}
	
	// For web usage, redirect with error
	const errorUrl = new URL(redirectTo, origin);
	errorUrl.searchParams.set('error', message);
	errorUrl.searchParams.set('code', code);
	
	return redirect(302, errorUrl.toString());
} 