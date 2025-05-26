import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { getSupabaseClient } from '$lib/database/supabase.js';
import { z } from 'zod';

// Validation schema for signup
const signupSchema = z.object({
	email: z.string().email('Invalid email address'),
	password: z.string().min(6, 'Password must be at least 6 characters'),
	full_name: z.string().optional(),
	confirm_password: z.string().optional()
}).refine((data) => {
	if (data.confirm_password && data.password !== data.confirm_password) {
		return false;
	}
	return true;
}, {
	message: "Passwords don't match",
	path: ["confirm_password"]
});

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		
		// Validate request body
		const validation = signupSchema.safeParse(body);
		if (!validation.success) {
			return json({
				success: false,
				error: 'Validation failed',
				details: validation.error.flatten().fieldErrors
			}, { status: 400 });
		}

		const { email, password, full_name } = validation.data;
		const supabase = getSupabaseClient();

		// Create user with Supabase Auth
		const { data, error } = await supabase.auth.signUp({
			email,
			password,
			options: {
				data: {
					full_name: full_name || ''
				}
			}
		});

		if (error) {
			console.error('[Flux Auth] Signup error:', error);
			return json({
				success: false,
				error: error.message || 'Signup failed'
			}, { status: 400 });
		}

		// Check if user needs email confirmation
		if (data.user && !data.session) {
			return json({
				success: true,
				message: 'Please check your email to confirm your account',
				data: {
					user: {
						id: data.user.id,
						email: data.user.email,
						email_confirmed: false
					}
				}
			});
		}

		// User is automatically signed in
		return json({
			success: true,
			message: 'Account created successfully',
			data: {
				user: {
					id: data.user?.id,
					email: data.user?.email,
					email_confirmed: data.user?.email_confirmed_at ? true : false
				},
				session: data.session ? {
					access_token: data.session.access_token,
					refresh_token: data.session.refresh_token,
					expires_in: data.session.expires_in,
					token_type: data.session.token_type
				} : null
			}
		});

	} catch (error) {
		console.error('[Flux Auth] Signup error:', error);
		return json({
			success: false,
			error: 'Internal server error'
		}, { status: 500 });
	}
}; 