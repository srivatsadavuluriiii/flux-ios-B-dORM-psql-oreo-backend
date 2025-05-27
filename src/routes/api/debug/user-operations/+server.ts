/**
 * DEBUG ONLY: User Operations API for testing
 * This endpoint should be disabled in production
 * POST: Manually test user operations
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { userSyncService } from '../../../../lib/services/auth/index.js';
import { fluxPostgreSQL } from '../../../../lib/database/postgres.js';
import type { User } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

/**
 * POST /api/debug/user-operations
 * Test user operations
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
        const operation = body.operation || 'test_create';
        // Create a proper UUID for testing
        const timestamp = Date.now();
        const testUserId = randomUUID();
        
        // Log operation
        console.log(`[DEBUG] Testing user operation: ${operation} with ID: ${testUserId}`);
        
        let result = null;
        
        // Perform requested operation
        switch (operation) {
            case 'test_create':
                // Test creating a new user
                const testUser = {
                    id: testUserId,
                    email: `test-${timestamp}@example.com`,
                    aud: 'authenticated',
                    created_at: new Date().toISOString(),
                    confirmed_at: new Date().toISOString(),
                    last_sign_in_at: new Date().toISOString(),
                    role: 'authenticated',
                    user_metadata: {
                        full_name: 'Test User',
                        avatar_url: 'https://example.com/avatar.jpg'
                    },
                    app_metadata: {
                        providers: ['test']
                    }
                } as User;
                
                result = await userSyncService.syncUserFromSupabase(testUser);
                break;
                
            case 'test_direct_insert':
                // Test directly inserting a user with fluxPostgreSQL
                const insertQuery = `
                    INSERT INTO users (
                        supabase_user_id, email, full_name, oauth_providers
                    ) VALUES (
                        $1, $2, $3, $4
                    ) RETURNING *
                `;
                
                const insertResult = await fluxPostgreSQL.query(insertQuery, [
                    testUserId,
                    `direct-${timestamp}@example.com`,
                    'Direct Insert User',
                    ['direct_test']
                ]);
                
                result = insertResult.rows[0];
                break;
                
            case 'list_users':
                // List all users in the database
                const usersResult = await fluxPostgreSQL.query(
                    'SELECT id, supabase_user_id, email, full_name, created_at FROM users LIMIT 10'
                );
                
                result = {
                    count: usersResult.rowCount,
                    users: usersResult.rows
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
        console.error('[DEBUG] Error testing user operations:', error);
        return json({
            success: false,
            error: 'Failed to test user operations',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}; 