/**
 * DEBUG ONLY: User Profile Operations API for testing
 * This endpoint should be disabled in production
 * POST: Manually test user profile operations
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { userSyncService } from '../../../../lib/services/auth/index.js';
import { fluxPostgreSQL } from '../../../../lib/database/postgres.js';
import { randomUUID } from 'crypto';

/**
 * POST /api/debug/profile-operations
 * Test user profile operations
 */
export const POST: RequestHandler = async ({ request }) => {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
        return json({
            success: false,
            error: 'Debug endpoints are disabled in production'
        }, { status: 403 });
    }

    try {
        // Parse request body
        const body = await request.json();
        const operation = body.operation || 'list_profiles';
        const userId = body.user_id; // Optional user ID parameter
        
        // Log operation
        console.log(`[DEBUG] Testing profile operation: ${operation}`);
        
        let result = null;
        
        // Perform requested operation
        switch (operation) {
            case 'create_profile':
                // Check if user ID is provided
                if (!userId) {
                    return json({
                        success: false,
                        error: 'User ID is required for create_profile operation'
                    }, { status: 400 });
                }
                
                try {
                    // Check if user exists
                    const userResult = await fluxPostgreSQL.query('SELECT * FROM users WHERE id = $1', [userId]);
                    
                    if (userResult.rowCount === 0) {
                        return json({
                            success: false,
                            error: `User with ID ${userId} not found`
                        }, { status: 404 });
                    }
                    
                    // Create user profile
                    const profile = await userSyncService.createUserProfile(userId);
                    result = profile;
                    
                } catch (error) {
                    console.error('[DEBUG] Error creating profile:', error);
                    return json({
                        success: false,
                        error: 'Failed to create user profile',
                        details: error instanceof Error ? error.message : 'Unknown error'
                    }, { status: 500 });
                }
                break;
                
            case 'list_profiles':
                // List all profiles in the database
                const profilesResult = await fluxPostgreSQL.query(
                    'SELECT * FROM user_profiles LIMIT 10'
                );
                
                result = {
                    count: profilesResult.rowCount,
                    profiles: profilesResult.rows
                };
                break;
                
            case 'direct_insert_profile':
                // Check if user ID is provided
                if (!userId) {
                    return json({
                        success: false,
                        error: 'User ID is required for direct_insert_profile operation'
                    }, { status: 400 });
                }
                
                try {
                    // Check if user exists
                    const userResult = await fluxPostgreSQL.query('SELECT * FROM users WHERE id = $1', [userId]);
                    
                    if (userResult.rowCount === 0) {
                        return json({
                            success: false,
                            error: `User with ID ${userId} not found`
                        }, { status: 404 });
                    }
                    
                    // Insert profile directly
                    const insertResult = await fluxPostgreSQL.query(`
                        INSERT INTO user_profiles (
                            user_id, bio, website_url, country, city, state
                        ) VALUES (
                            $1, $2, $3, $4, $5, $6
                        ) RETURNING *
                    `, [
                        userId, 
                        'Test profile bio', 
                        'https://example.com',
                        'IN',
                        'Mumbai',
                        'Maharashtra'
                    ]);
                    
                    result = insertResult.rows[0];
                    
                } catch (error) {
                    console.error('[DEBUG] Error inserting profile:', error);
                    return json({
                        success: false,
                        error: 'Failed to insert user profile',
                        details: error instanceof Error ? error.message : 'Unknown error'
                    }, { status: 500 });
                }
                break;
                
            case 'list_users_without_profiles':
                // List users that don't have profiles
                const usersWithoutProfilesResult = await fluxPostgreSQL.query(`
                    SELECT u.id, u.supabase_user_id, u.email, u.full_name, u.created_at 
                    FROM users u
                    LEFT JOIN user_profiles p ON u.id = p.user_id
                    WHERE p.id IS NULL
                    LIMIT 10
                `);
                
                result = {
                    count: usersWithoutProfilesResult.rowCount,
                    users: usersWithoutProfilesResult.rows
                };
                break;
                
            default:
                return json({
                    success: false,
                    error: `Unknown operation: ${operation}`
                }, { status: 400 });
        }
        
        return json({
            success: true,
            operation,
            result,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('[DEBUG] Error testing profile operations:', error);
        return json({
            success: false,
            error: 'Failed to test profile operations',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}; 