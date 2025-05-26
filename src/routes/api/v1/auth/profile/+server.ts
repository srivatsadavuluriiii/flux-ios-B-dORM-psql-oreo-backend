/**
 * User Profile Management API for Flux
 * GET: Retrieve user profile and Railway user data
 * PUT: Update user profile and Railway user data
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { userSyncService } from '../../../../../lib/services/auth/user-sync.js';
import { z } from 'zod';

// Validation schemas
const updateProfileSchema = z.object({
    // Basic user information
    full_name: z.string().max(100).optional(),
    display_name: z.string().max(50).optional(),
    phone: z.string().max(20).optional(),
    timezone: z.string().max(50).optional(),
    language: z.string().max(10).optional(),
    currency: z.string().length(3).optional(),
    
    // Profile information
    bio: z.string().max(500).optional(),
    website_url: z.string().url().optional(),
    social_links: z.record(z.string()).optional(),
    country: z.string().length(2).optional(),
    city: z.string().max(100).optional(),
    state: z.string().max(100).optional(),
    
    // App preferences
    expense_categories: z.array(z.string()).optional(),
    default_split_method: z.enum(['equal', 'percentage', 'exact']).optional(),
    auto_categorize_expenses: z.boolean().optional(),
    smart_notifications: z.boolean().optional(),
    expense_reminders: z.boolean().optional(),
    
    // Privacy and notification settings
    notification_preferences: z.object({
        email: z.boolean(),
        push: z.boolean(),
        sms: z.boolean()
    }).optional(),
    privacy_settings: z.object({
        profile_visibility: z.enum(['public', 'friends', 'private']),
        expense_sharing: z.enum(['public', 'groups', 'private'])
    }).optional()
});

/**
 * GET /api/v1/auth/profile
 * Retrieve user profile and Railway user data
 */
export const GET: RequestHandler = async ({ locals }) => {
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

        // Get user from Railway database
        const user = await userSyncService.getUserBySupabaseId(locals.user.id);
        
        if (!user) {
            return json(
                { 
                    success: false, 
                    error: 'User not found in Railway database',
                    code: 'USER_NOT_FOUND'
                },
                { status: 404 }
            );
        }

        // Get user profile
        const profile = await userSyncService.getUserProfile(user.id);

        // Update last active
        await userSyncService.updateLastActive(user.id);

        // Return combined user and profile data
        return json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    supabase_user_id: user.supabase_user_id,
                    email: user.email,
                    full_name: user.full_name,
                    display_name: user.display_name,
                    avatar_url: user.avatar_url,
                    phone: user.phone,
                    timezone: user.timezone,
                    language: user.language,
                    currency: user.currency,
                    oauth_providers: user.oauth_providers,
                    github_username: user.github_username,
                    google_profile_id: user.google_profile_id,
                    email_verified: user.email_verified,
                    account_status: user.account_status,
                    last_active_at: user.last_active_at,
                    total_expenses_count: user.total_expenses_count,
                    total_groups_count: user.total_groups_count,
                    created_at: user.created_at,
                    updated_at: user.updated_at
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
            }
        });

    } catch (error) {
        console.error('[Flux Profile API] Error getting profile:', error);
        return json(
            { 
                success: false, 
                error: 'Failed to retrieve user profile',
                code: 'PROFILE_RETRIEVAL_ERROR'
            },
            { status: 500 }
        );
    }
};

/**
 * PUT /api/v1/auth/profile
 * Update user profile and Railway user data
 */
export const PUT: RequestHandler = async ({ request, locals }) => {
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

        // Parse and validate request body
        const body = await request.json();
        const validationResult = updateProfileSchema.safeParse(body);

        if (!validationResult.success) {
            return json(
                {
                    success: false,
                    error: 'Invalid request data',
                    code: 'VALIDATION_ERROR',
                    details: validationResult.error.issues
                },
                { status: 400 }
            );
        }

        const updateData = validationResult.data;

        // Get user from Railway database
        const user = await userSyncService.getUserBySupabaseId(locals.user.id);
        
        if (!user) {
            return json(
                { 
                    success: false, 
                    error: 'User not found in Railway database',
                    code: 'USER_NOT_FOUND'
                },
                { status: 404 }
            );
        }

        // Separate user table updates from profile table updates
        const userUpdates: any = {};
        const profileUpdates: any = {};

        // User table fields
        if (updateData.full_name !== undefined) userUpdates.full_name = updateData.full_name;
        if (updateData.display_name !== undefined) userUpdates.display_name = updateData.display_name;
        if (updateData.phone !== undefined) userUpdates.phone = updateData.phone;
        if (updateData.timezone !== undefined) userUpdates.timezone = updateData.timezone;
        if (updateData.language !== undefined) userUpdates.language = updateData.language;
        if (updateData.currency !== undefined) userUpdates.currency = updateData.currency;
        if (updateData.notification_preferences !== undefined) {
            userUpdates.notification_preferences = updateData.notification_preferences;
        }
        if (updateData.privacy_settings !== undefined) {
            userUpdates.privacy_settings = updateData.privacy_settings;
        }

        // Profile table fields
        if (updateData.bio !== undefined) profileUpdates.bio = updateData.bio;
        if (updateData.website_url !== undefined) profileUpdates.website_url = updateData.website_url;
        if (updateData.social_links !== undefined) profileUpdates.social_links = updateData.social_links;
        if (updateData.country !== undefined) profileUpdates.country = updateData.country;
        if (updateData.city !== undefined) profileUpdates.city = updateData.city;
        if (updateData.state !== undefined) profileUpdates.state = updateData.state;
        if (updateData.expense_categories !== undefined) profileUpdates.expense_categories = updateData.expense_categories;
        if (updateData.default_split_method !== undefined) profileUpdates.default_split_method = updateData.default_split_method;
        if (updateData.auto_categorize_expenses !== undefined) profileUpdates.auto_categorize_expenses = updateData.auto_categorize_expenses;
        if (updateData.smart_notifications !== undefined) profileUpdates.smart_notifications = updateData.smart_notifications;
        if (updateData.expense_reminders !== undefined) profileUpdates.expense_reminders = updateData.expense_reminders;

        let updatedUser = user;
        let updatedProfile = null;

        // Update user table if there are user updates
        if (Object.keys(userUpdates).length > 0) {
            updatedUser = await userSyncService.updateUser(user.id, userUpdates);
        }

        // Update profile table if there are profile updates
        if (Object.keys(profileUpdates).length > 0) {
            updatedProfile = await userSyncService.updateUserProfile(user.id, profileUpdates);
        } else {
            // Get current profile if no updates
            updatedProfile = await userSyncService.getUserProfile(user.id);
        }

        // Update last active
        await userSyncService.updateLastActive(user.id);

        // Return updated data
        return json({
            success: true,
            data: {
                user: {
                    id: updatedUser.id,
                    supabase_user_id: updatedUser.supabase_user_id,
                    email: updatedUser.email,
                    full_name: updatedUser.full_name,
                    display_name: updatedUser.display_name,
                    avatar_url: updatedUser.avatar_url,
                    phone: updatedUser.phone,
                    timezone: updatedUser.timezone,
                    language: updatedUser.language,
                    currency: updatedUser.currency,
                    oauth_providers: updatedUser.oauth_providers,
                    github_username: updatedUser.github_username,
                    google_profile_id: updatedUser.google_profile_id,
                    email_verified: updatedUser.email_verified,
                    account_status: updatedUser.account_status,
                    last_active_at: updatedUser.last_active_at,
                    total_expenses_count: updatedUser.total_expenses_count,
                    total_groups_count: updatedUser.total_groups_count,
                    created_at: updatedUser.created_at,
                    updated_at: updatedUser.updated_at
                },
                profile: updatedProfile ? {
                    id: updatedProfile.id,
                    bio: updatedProfile.bio,
                    website_url: updatedProfile.website_url,
                    social_links: updatedProfile.social_links,
                    country: updatedProfile.country,
                    city: updatedProfile.city,
                    state: updatedProfile.state,
                    expense_categories: updatedProfile.expense_categories,
                    default_split_method: updatedProfile.default_split_method,
                    auto_categorize_expenses: updatedProfile.auto_categorize_expenses,
                    smart_notifications: updatedProfile.smart_notifications,
                    expense_reminders: updatedProfile.expense_reminders,
                    iot_devices_connected: updatedProfile.iot_devices_connected,
                    automation_rules: updatedProfile.automation_rules
                } : null
            },
            message: 'Profile updated successfully'
        });

    } catch (error) {
        console.error('[Flux Profile API] Error updating profile:', error);
        return json(
            { 
                success: false, 
                error: 'Failed to update user profile',
                code: 'PROFILE_UPDATE_ERROR'
            },
            { status: 500 }
        );
    }
}; 