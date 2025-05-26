/**
 * User Sync Service for Flux
 * Handles synchronization between Supabase Auth and Railway PostgreSQL
 */

import { fluxPostgreSQL } from '../../database/postgres.js';
import { getSupabaseAdmin } from '../../database/supabase.js';
import type { User } from '@supabase/supabase-js';

export interface FluxUser {
    id: string;
    supabase_user_id: string;
    email: string;
    full_name?: string;
    display_name?: string;
    avatar_url?: string;
    phone?: string;
    date_of_birth?: Date;
    timezone: string;
    language: string;
    currency: string;
    notification_preferences?: Record<string, boolean>;
    privacy_settings?: Record<string, string>;
    oauth_providers: string[];
    github_username?: string;
    google_profile_id?: string;
    last_active_at?: Date;
    total_expenses_count: number;
    total_groups_count: number;
    email_verified: boolean;
    phone_verified: boolean;
    account_status: 'active' | 'suspended' | 'deleted';
    gdpr_consent: boolean;
    dpdp_consent: boolean;
    terms_accepted_at?: Date;
    privacy_policy_accepted_at?: Date;
    created_at: Date;
    updated_at: Date;
    deleted_at?: Date;
    is_deleted: boolean;
}

export interface UserProfile {
    id: string;
    user_id: string;
    bio?: string;
    website_url?: string;
    social_links: Record<string, string>;
    country?: string;
    city?: string;
    state?: string;
    expense_categories: string[];
    default_split_method: 'equal' | 'percentage' | 'exact';
    auto_categorize_expenses: boolean;
    smart_notifications: boolean;
    expense_reminders: boolean;
    iot_devices_connected: any[];
    automation_rules: Record<string, any>;
}

export class UserSyncService {
    /**
     * Sync user from Supabase Auth to Railway PostgreSQL
     */
    async syncUserFromSupabase(supabaseUser: User): Promise<FluxUser> {
        try {
            console.log('[Flux UserSync] Syncing user from Supabase:', supabaseUser.id);

            // Extract OAuth provider information
            const oauthProviders: string[] = [];
            let githubUsername: string | undefined;
            let googleProfileId: string | undefined;

            if (supabaseUser.app_metadata?.providers) {
                oauthProviders.push(...supabaseUser.app_metadata.providers);
            }

            // Extract provider-specific data
            if (supabaseUser.user_metadata?.provider_id) {
                if (supabaseUser.user_metadata.provider_id === 'github') {
                    githubUsername = supabaseUser.user_metadata.user_name;
                } else if (supabaseUser.user_metadata.provider_id === 'google') {
                    googleProfileId = supabaseUser.user_metadata.sub;
                }
            }

            // Check if user already exists
            const existingUser = await this.getUserBySupabaseId(supabaseUser.id);

            if (existingUser) {
                // Update existing user
                return await this.updateUser(existingUser.id, {
                    email: supabaseUser.email!,
                    full_name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name,
                    display_name: supabaseUser.user_metadata?.display_name || supabaseUser.user_metadata?.preferred_username,
                    avatar_url: supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.picture,
                    phone: supabaseUser.phone,
                    oauth_providers: oauthProviders,
                    github_username: githubUsername,
                    google_profile_id: googleProfileId,
                    email_verified: supabaseUser.email_confirmed_at !== null,
                    updated_at: new Date()
                });
            } else {
                // Create new user
                return await this.createUser({
                    supabase_user_id: supabaseUser.id,
                    email: supabaseUser.email!,
                    full_name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name,
                    display_name: supabaseUser.user_metadata?.display_name || supabaseUser.user_metadata?.preferred_username,
                    avatar_url: supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.picture,
                    phone: supabaseUser.phone,
                    timezone: 'Asia/Kolkata',
                    language: 'en',
                    currency: 'INR',
                    oauth_providers: oauthProviders,
                    github_username: githubUsername,
                    google_profile_id: googleProfileId,
                    email_verified: supabaseUser.email_confirmed_at !== null,
                    account_status: 'active'
                });
            }
        } catch (error) {
            console.error('[Flux UserSync] Error syncing user from Supabase:', error);
            throw error;
        }
    }

    /**
     * Create a new user in Railway PostgreSQL
     */
    async createUser(userData: Partial<FluxUser>): Promise<FluxUser> {
        try {
            const query = `
                INSERT INTO users (
                    supabase_user_id, email, full_name, display_name, avatar_url,
                    phone, timezone, language, currency, oauth_providers,
                    github_username, google_profile_id, email_verified, account_status
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                RETURNING *
            `;

            const values = [
                userData.supabase_user_id,
                userData.email,
                userData.full_name,
                userData.display_name,
                userData.avatar_url,
                userData.phone,
                userData.timezone || 'Asia/Kolkata',
                userData.language || 'en',
                userData.currency || 'INR',
                userData.oauth_providers || [],
                userData.github_username,
                userData.google_profile_id,
                userData.email_verified || false,
                userData.account_status || 'active'
            ];

            const result = await fluxPostgreSQL.query<FluxUser>(query, values);
            const user = result.rows[0];

            console.log('[Flux UserSync] Created user:', user.id);

            // Create default user profile
            await this.createUserProfile(user.id);

            return user;
        } catch (error) {
            console.error('[Flux UserSync] Error creating user:', error);
            throw error;
        }
    }

    /**
     * Update an existing user in Railway PostgreSQL
     */
    async updateUser(userId: string, userData: Partial<FluxUser>): Promise<FluxUser> {
        try {
            const setClause = [];
            const values = [];
            let paramIndex = 1;

            if (userData.email !== undefined) {
                setClause.push(`email = $${paramIndex++}`);
                values.push(userData.email);
            }
            if (userData.full_name !== undefined) {
                setClause.push(`full_name = $${paramIndex++}`);
                values.push(userData.full_name);
            }
            if (userData.display_name !== undefined) {
                setClause.push(`display_name = $${paramIndex++}`);
                values.push(userData.display_name);
            }
            if (userData.avatar_url !== undefined) {
                setClause.push(`avatar_url = $${paramIndex++}`);
                values.push(userData.avatar_url);
            }
            if (userData.phone !== undefined) {
                setClause.push(`phone = $${paramIndex++}`);
                values.push(userData.phone);
            }
            if (userData.oauth_providers !== undefined) {
                setClause.push(`oauth_providers = $${paramIndex++}`);
                values.push(userData.oauth_providers);
            }
            if (userData.github_username !== undefined) {
                setClause.push(`github_username = $${paramIndex++}`);
                values.push(userData.github_username);
            }
            if (userData.google_profile_id !== undefined) {
                setClause.push(`google_profile_id = $${paramIndex++}`);
                values.push(userData.google_profile_id);
            }
            if (userData.email_verified !== undefined) {
                setClause.push(`email_verified = $${paramIndex++}`);
                values.push(userData.email_verified);
            }

            // Always update the updated_at timestamp
            setClause.push(`updated_at = NOW()`);
            values.push(userId);

            const query = `
                UPDATE users 
                SET ${setClause.join(', ')}
                WHERE id = $${paramIndex}
                RETURNING *
            `;

            const result = await fluxPostgreSQL.query<FluxUser>(query, values);
            const user = result.rows[0];

            console.log('[Flux UserSync] Updated user:', user.id);
            return user;
        } catch (error) {
            console.error('[Flux UserSync] Error updating user:', error);
            throw error;
        }
    }

    /**
     * Get user by Supabase user ID
     */
    async getUserBySupabaseId(supabaseUserId: string): Promise<FluxUser | null> {
        try {
            const query = 'SELECT * FROM users WHERE supabase_user_id = $1 AND is_deleted = false';
            const result = await fluxPostgreSQL.query<FluxUser>(query, [supabaseUserId]);
            return result.rows[0] || null;
        } catch (error) {
            console.error('[Flux UserSync] Error getting user by Supabase ID:', error);
            throw error;
        }
    }

    /**
     * Get user by email
     */
    async getUserByEmail(email: string): Promise<FluxUser | null> {
        try {
            const query = 'SELECT * FROM users WHERE email = $1 AND is_deleted = false';
            const result = await fluxPostgreSQL.query<FluxUser>(query, [email]);
            return result.rows[0] || null;
        } catch (error) {
            console.error('[Flux UserSync] Error getting user by email:', error);
            throw error;
        }
    }

    /**
     * Get user by ID
     */
    async getUserById(userId: string): Promise<FluxUser | null> {
        try {
            const query = 'SELECT * FROM users WHERE id = $1 AND is_deleted = false';
            const result = await fluxPostgreSQL.query<FluxUser>(query, [userId]);
            return result.rows[0] || null;
        } catch (error) {
            console.error('[Flux UserSync] Error getting user by ID:', error);
            throw error;
        }
    }

    /**
     * Create default user profile
     */
    async createUserProfile(userId: string): Promise<UserProfile> {
        try {
            const query = `
                INSERT INTO user_profiles (
                    user_id, expense_categories, default_split_method,
                    auto_categorize_expenses, smart_notifications, expense_reminders,
                    iot_devices_connected, automation_rules, social_links
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *
            `;

            const values = [
                userId,
                JSON.stringify([]), // expense_categories
                'equal', // default_split_method
                true, // auto_categorize_expenses
                true, // smart_notifications
                true, // expense_reminders
                JSON.stringify([]), // iot_devices_connected
                JSON.stringify({}), // automation_rules
                JSON.stringify({}) // social_links
            ];

            const result = await fluxPostgreSQL.query<UserProfile>(query, values);
            const profile = result.rows[0];

            console.log('[Flux UserSync] Created user profile:', profile.id);
            return profile;
        } catch (error) {
            console.error('[Flux UserSync] Error creating user profile:', error);
            throw error;
        }
    }

    /**
     * Get user profile
     */
    async getUserProfile(userId: string): Promise<UserProfile | null> {
        try {
            const query = 'SELECT * FROM user_profiles WHERE user_id = $1';
            const result = await fluxPostgreSQL.query<UserProfile>(query, [userId]);
            return result.rows[0] || null;
        } catch (error) {
            console.error('[Flux UserSync] Error getting user profile:', error);
            throw error;
        }
    }

    /**
     * Update user profile
     */
    async updateUserProfile(userId: string, profileData: Partial<UserProfile>): Promise<UserProfile> {
        try {
            const setClause = [];
            const values = [];
            let paramIndex = 1;

            if (profileData.bio !== undefined) {
                setClause.push(`bio = $${paramIndex++}`);
                values.push(profileData.bio);
            }
            if (profileData.website_url !== undefined) {
                setClause.push(`website_url = $${paramIndex++}`);
                values.push(profileData.website_url);
            }
            if (profileData.social_links !== undefined) {
                setClause.push(`social_links = $${paramIndex++}`);
                values.push(JSON.stringify(profileData.social_links));
            }
            if (profileData.country !== undefined) {
                setClause.push(`country = $${paramIndex++}`);
                values.push(profileData.country);
            }
            if (profileData.city !== undefined) {
                setClause.push(`city = $${paramIndex++}`);
                values.push(profileData.city);
            }
            if (profileData.state !== undefined) {
                setClause.push(`state = $${paramIndex++}`);
                values.push(profileData.state);
            }
            if (profileData.expense_categories !== undefined) {
                setClause.push(`expense_categories = $${paramIndex++}`);
                values.push(JSON.stringify(profileData.expense_categories));
            }
            if (profileData.default_split_method !== undefined) {
                setClause.push(`default_split_method = $${paramIndex++}`);
                values.push(profileData.default_split_method);
            }
            if (profileData.auto_categorize_expenses !== undefined) {
                setClause.push(`auto_categorize_expenses = $${paramIndex++}`);
                values.push(profileData.auto_categorize_expenses);
            }
            if (profileData.smart_notifications !== undefined) {
                setClause.push(`smart_notifications = $${paramIndex++}`);
                values.push(profileData.smart_notifications);
            }
            if (profileData.expense_reminders !== undefined) {
                setClause.push(`expense_reminders = $${paramIndex++}`);
                values.push(profileData.expense_reminders);
            }

            // Always update the updated_at timestamp
            setClause.push(`updated_at = NOW()`);
            values.push(userId);

            const query = `
                UPDATE user_profiles 
                SET ${setClause.join(', ')}
                WHERE user_id = $${paramIndex}
                RETURNING *
            `;

            const result = await fluxPostgreSQL.query<UserProfile>(query, values);
            const profile = result.rows[0];

            console.log('[Flux UserSync] Updated user profile:', profile.id);
            return profile;
        } catch (error) {
            console.error('[Flux UserSync] Error updating user profile:', error);
            throw error;
        }
    }

    /**
     * Update user's last active timestamp
     */
    async updateLastActive(userId: string): Promise<void> {
        try {
            const query = 'UPDATE users SET last_active_at = NOW() WHERE id = $1';
            await fluxPostgreSQL.query(query, [userId]);
        } catch (error) {
            console.error('[Flux UserSync] Error updating last active:', error);
            // Don't throw error for last active updates
        }
    }

    /**
     * Soft delete user
     */
    async deleteUser(userId: string): Promise<void> {
        try {
            const query = `
                UPDATE users 
                SET is_deleted = true, deleted_at = NOW(), account_status = 'deleted'
                WHERE id = $1
            `;
            await fluxPostgreSQL.query(query, [userId]);
            console.log('[Flux UserSync] Soft deleted user:', userId);
        } catch (error) {
            console.error('[Flux UserSync] Error deleting user:', error);
            throw error;
        }
    }
}

// Export singleton instance
export const userSyncService = new UserSyncService(); 