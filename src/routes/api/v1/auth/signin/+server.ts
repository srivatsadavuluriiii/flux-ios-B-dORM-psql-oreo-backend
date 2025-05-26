import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { getSupabaseClient } from '$lib/database/supabase.js';
import { z } from 'zod';

// Validation schema for signin
const signinSchema = z.object({
	email: z.string().email('Invalid email address'),
	password: z.string().min(1, 'Password is required')
});

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		
		// Validate request body
		const validation = signinSchema.safeParse(body);
		if (!validation.success) {
			return json({
				success: false,
				error: 'Validation failed',
				details: validation.error.flatten().fieldErrors
			}, { status: 400 });
		}

		const { email, password } = validation.data;
		const supabase = getSupabaseClient();

		// Sign in with Supabase Auth
		const { data, error } = await supabase.auth.signInWithPassword({
			email,
			password
		});

		if (error) {
			console.error('[Flux Auth] Signin error:', error);
			return json({
				success: false,
				error: error.message || 'Authentication failed'
			}, { status: 401 });
		}

		if (!data.session || !data.user) {
			return json({
				success: false,
				error: 'Authentication failed'
			}, { status: 401 });
		}

		// Return successful authentication
		return json({
			success: true,
			message: 'Authentication successful',
			data: {
				user: {
					id: data.user.id,
					email: data.user.email,
					email_confirmed: data.user.email_confirmed_at ? true : false,
					full_name: data.user.user_metadata?.full_name || ''
				},
				session: {
					access_token: data.session.access_token,
					refresh_token: data.session.refresh_token,
					expires_in: data.session.expires_in,
					token_type: data.session.token_type
				}
			}
		});

	} catch (error) {
		console.error('[Flux Auth] Signin error:', error);
		return json({
			success: false,
			error: 'Internal server error'
		}, { status: 500 });
	}
}; 