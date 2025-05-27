/**
 * User Sync API for Flux
 * POST: Manually sync user data from Supabase Auth to Railway PostgreSQL
 * This is used when user data needs to be synced manually or during login
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { userSyncService } from '../../../../../lib/services/auth/index.js';
import { getSupabaseAdmin } from '../../../../../lib/database/supabase.js';

/**
 * POST /api/v1/auth/sync-user
 * Manually sync user data from Supabase Auth to Railway PostgreSQL
 */
export const POST: RequestHandler = async ({ locals }) => {
    try {
        // Check authentication
        if (!locals.user) {
            return json(
                { 
                    success: false, 
                    error: 'Authentication required',
                    code: 'AUTH_REQUIRED'
                },
                { status: 401 }
            );
        }

        console.log('[Flux UserSync API] Syncing user:', locals.user.id);

        // Get full user data from Supabase
        const supabaseAdmin = getSupabaseAdmin();
        const { data: supabaseUser, error } = await supabaseAdmin.auth.admin.getUserById(locals.user.id);

        if (error || !supabaseUser?.user) {
            console.error('[Flux UserSync API] Failed to get user from Supabase:', error);
            return json(
                { 
                    success: false, 
                    error: 'Failed to retrieve user from Supabase',
                    code: 'SUPABASE_USER_ERROR'
                },
                { status: 500 }
            );
        }

        // Sync user to Railway PostgreSQL
        const fluxUser = await userSyncService.syncUserFromSupabase(supabaseUser.user);

        // Get user profile
        const profile = await userSyncService.getUserProfile(fluxUser.id);

        // Return synced user data
        return json({
            success: true,
            data: {
                user: {
                    id: fluxUser.id,
                    supabase_user_id: fluxUser.supabase_user_id,
                    email: fluxUser.email,
                    full_name: fluxUser.full_name,
                    display_name: fluxUser.display_name,
                    avatar_url: fluxUser.avatar_url,
                    phone: fluxUser.phone,
                    timezone: fluxUser.timezone,
                    language: fluxUser.language,
                    currency: fluxUser.currency,
                    oauth_providers: fluxUser.oauth_providers,
                    github_username: fluxUser.github_username,
                    google_profile_id: fluxUser.google_profile_id,
                    email_verified: fluxUser.email_verified,
                    account_status: fluxUser.account_status,
                    last_active_at: fluxUser.last_active_at,
                    total_expenses_count: fluxUser.total_expenses_count,
                    total_groups_count: fluxUser.total_groups_count,
                    created_at: fluxUser.created_at,
                    updated_at: fluxUser.updated_at
                },
                profile: profile ? {
                    id: profile.id,
                    bio: profile.bio,
                    website_url: profile.website_url,
                    social_links: profile.social_links,
                    country: profile.country,
                    city: profile.city,
                    state: profile.state,
                    expense_categories: profile.expense_categories,
                    default_split_method: profile.default_split_method,
                    auto_categorize_expenses: profile.auto_categorize_expenses,
                    smart_notifications: profile.smart_notifications,
                    expense_reminders: profile.expense_reminders,
                    iot_devices_connected: profile.iot_devices_connected,
                    automation_rules: profile.automation_rules
                } : null
            },
            message: 'User synced successfully'
        });

    } catch (error) {
        console.error('[Flux UserSync API] Error syncing user:', error);
        return json(
            { 
                success: false, 
                error: 'Failed to sync user data',
                code: 'USER_SYNC_ERROR',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}; 