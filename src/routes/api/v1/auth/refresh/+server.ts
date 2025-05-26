import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { getSupabaseClient } from '$lib/database/supabase.js';
import { z } from 'zod';

// Validation schema for refresh token
const refreshSchema = z.object({
	refresh_token: z.string().min(1, 'Refresh token is required')
});

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		
		// Validate request body
		const validation = refreshSchema.safeParse(body);
		if (!validation.success) {
			return json({
				success: false,
				error: 'Validation failed',
				details: validation.error.flatten().fieldErrors
			}, { status: 400 });
		}

		const { refresh_token } = validation.data;
		const supabase = getSupabaseClient();

		// Refresh the session
		const { data, error } = await supabase.auth.refreshSession({
			refresh_token
		});

		if (error) {
			console.error('[Flux Auth] Session refresh error:', error);
			return json({
				success: false,
				error: error.message || 'Session refresh failed'
			}, { status: 401 });
		}

		if (!data.session || !data.user) {
			return json({
				success: false,
				error: 'Session refresh failed'
			}, { status: 401 });
		}

		// Return refreshed session
		return json({
			success: true,
			message: 'Session refreshed successfully',
			data: {
				user: {
					id: data.user.id,
					email: data.user.email,
					email_confirmed: data.user.email_confirmed_at ? true : false,
					full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || ''
				},
				session: {
					access_token: data.session.access_token,
					refresh_token: data.session.refresh_token,
					expires_in: data.session.expires_in,
					token_type: data.session.token_type,
					expires_at: data.session.expires_at
				}
			}
		});

	} catch (error) {
		console.error('[Flux Auth] Session refresh error:', error);
		return json({
			success: false,
			error: 'Internal server error'
		}, { status: 500 });
	}
};