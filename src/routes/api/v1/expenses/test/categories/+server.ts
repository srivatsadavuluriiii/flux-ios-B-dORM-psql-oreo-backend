/**
 * Flux Expense Categories Test API
 * GET: List expense categories without authentication (for testing only)
 * NOT FOR PRODUCTION USE
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { fluxPostgreSQL } from '../../../../../../lib/database/postgres.js';

/**
 * GET /api/v1/expenses/test/categories
 * Test endpoint to list expense categories without authentication
 */
export const GET: RequestHandler = async ({ url }) => {
    try {
        console.log('[Flux Test API] Getting test expense categories...');
        
        // Get the first user in the database
        const userResult = await fluxPostgreSQL.query('SELECT id FROM users LIMIT 1');
        
        if (userResult.rows.length === 0) {
            return json({
                success: false,
                error: 'No users found in database'
            }, { status: 500 });
        }
        
        const userId = userResult.rows[0].id;
        console.log('[Flux Test API] Using user ID:', userId);
        
        // Get all categories including system ones
        const query = `
            SELECT 
                id, name, description, icon_name, color_hex, 
                parent_category_id, is_system_category, is_public,
                created_at, updated_at
            FROM expense_categories
            WHERE is_system_category = true OR created_by_user_id = $1 OR is_public = true
            ORDER BY is_system_category DESC, name ASC
            LIMIT 100
        `;
        
        const result = await fluxPostgreSQL.query(query, [userId]);
        const categories = result.rows;
        
        return json({
            success: true,
            data: {
                categories,
                total: categories.length,
                test_user_id: userId
            }
        });

    } catch (error) {
        console.error('[Flux Test API] ❌ Failed to get test expense categories:', error);
        return json({
            success: false,
            error: 'Failed to get test expense categories',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}; 